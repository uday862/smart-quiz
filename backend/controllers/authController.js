const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { roll_no, name, password, role } = req.body;

        let user;
        if (role === 'admin') {
            user = await User.findOne({ role: 'admin', name });
        } else {
            user = await User.findOne({ role: 'student', roll_no });
        }

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // If student: check if welcome notification already sent
        if (user.role === 'student') {
            const alreadyWelcomed = await Notification.findOne({ student: user._id, type: 'welcome' });
            if (!alreadyWelcomed) {
                await Notification.create({
                    student: user._id,
                    type: 'welcome',
                    title: '👋 Welcome to Smart Quiz!',
                    message: `Hello ${user.name}! Your account is ready. Complete your tasks and track your progress here.`,
                    isRead: false
                });
            }
        }

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                roll_no: user.roll_no,
                email: user.email,
                phone: user.phone,
                section: user.section,
                course: user.course,
                batch: user.batch,
                status: user.status,
                avatar_color: user.avatar_color,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.registerAdmin = async (req, res) => {
    try {
        const { name, password } = req.body;
        let user = await User.findOne({ role: 'admin', name });
        if (user) return res.status(400).json({ message: 'Admin already exists' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ role: 'admin', name, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (req.user.role !== 'admin' && String(userId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update student profile (email, phone, etc.)
exports.updateProfile = async (req, res) => {
    try {
        const { userId, email, phone, name } = req.body;
        if (req.user.role !== 'admin' && String(userId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (name !== undefined) updateData.name = name;

        const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        res.json({ message: 'Profile updated', user: updated });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account with that email address exists.' });
        }

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
        await user.save();

        console.log(`[PASSWORD RESET] OTP generated for ${email}: ${otp}`);

        // Try sending email via SMTP if configured
        const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        if (hasSMTP) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_PORT === '465',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.SMTP_FROM || `"Smart Quiz Admin" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: 'Smart Quiz Password Reset OTP',
                    text: `You requested a password reset for your Smart Quiz account.\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.`,
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                        <h2 style="color: #7c3aed;">Smart Quiz Password Recovery</h2>
                        <p>Hello <strong>${user.name}</strong>,</p>
                        <p>You requested a password reset. Please use the following One-Time Password (OTP) to reset your password:</p>
                        <div style="background-color: #f3f4f6; border: 1px dashed #7c3aed; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 12px; color: #6b7280;">This OTP will expire in 10 minutes. If you did not request this password reset, please ignore this email or contact the admin.</p>
                    </div>`
                };

                await transporter.sendMail(mailOptions);
                return res.json({ message: 'An OTP has been sent to your email address.' });
            } catch (smtpErr) {
                console.error('[SMTP ERROR] Failed to send email via SMTP:', smtpErr.message || smtpErr);
                return res.json({ 
                    message: 'An OTP has been sent to your email address (Development Mode Fallback: Check server terminal for OTP).' 
                });
            }
        } else {
            // SMTP fallback: return successfully but log to terminal.
            return res.json({ 
                message: 'An OTP has been sent to your email address (Development Mode: Check server terminal for OTP).' 
            });
        }

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error: Failed to process request' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash and save the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        res.json({ message: 'Your password has been successfully updated.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error: Failed to update password' });
    }
};
