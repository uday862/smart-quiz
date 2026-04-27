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
