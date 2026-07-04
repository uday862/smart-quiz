const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

// Multer in-memory storage for Excel
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Admin only: create a single student
exports.createStudent = async (req, res) => {
    try {
        const { name, roll_no, section, course, password, phone, email } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'default_password', salt);
        
        const student = new User({ 
            role: 'student', 
            name, 
            roll_no, 
            section, 
            course: course || '',
            phone: phone || '',
            email: email || (roll_no ? `${roll_no}@student.com` : undefined),
            password: hashedPassword,
        });
        await student.save();

        // Send welcome notification
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                student: student._id,
                type: 'welcome',
                title: '👋 Welcome to Smart Quiz!',
                message: `Hello ${name}! Your account has been created. Login with Roll No: ${roll_no} to get started.`,
                isRead: false
            });
        } catch (e) { /* ignore */ }

        res.status(201).json({ message: 'Student created successfully', student });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const filter = { role: 'student' };
        if (req.query.section) filter.section = req.query.section;
        if (req.query.course) filter.course = req.query.course;
        if (req.query.status) filter.status = req.query.status;

        let students = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        
        if (!req.user || req.user.role !== 'admin') {
            students = students.map(s => ({
                _id: s._id,
                name: s.name,
                roll_no: s.roll_no,
                avatar_color: s.avatar_color
            }));
        }

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password;
        }
        const student = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
        res.json(student);
    } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteStudent = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student removed' });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// Excel bulk upload — POST /api/students/upload
exports.uploadStudentsExcel = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!rows || rows.length === 0) {
                return res.status(400).json({ message: 'Excel file is empty or unreadable' });
            }

            const results = { created: 0, skipped: 0, errors: [] };

            for (const row of rows) {
                // Support multiple header casing variants
                const roll_no = String(row['roll_no'] || row['Roll No'] || row['RollNo'] || row['roll no'] || '').trim();
                const name = String(row['name'] || row['Name'] || row['Student Name'] || '').trim();
                const section = String(row['section'] || row['Section'] || '').trim();
                const course = String(row['course'] || row['Course'] || '').trim();
                const phone = String(row['phone'] || row['Phone'] || '').trim();
                const email = String(row['email'] || row['Email'] || '').trim();
                const password = String(row['password'] || row['Password'] || roll_no || 'student123').trim();

                if (!roll_no || !name) {
                    results.errors.push(`Row skipped: missing roll_no or name (roll: "${roll_no}", name: "${name}")`);
                    results.skipped++;
                    continue;
                }

                // Check if student already exists
                const exists = await User.findOne({ roll_no });
                if (exists) {
                    results.errors.push(`Roll ${roll_no} already exists — skipped`);
                    results.skipped++;
                    continue;
                }

                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    await User.create({
                        role: 'student',
                        name,
                        roll_no,
                        section,
                        course,
                        phone,
                        email: email || `${roll_no}@student.com`,
                        password: hashedPassword,
                    });
                    results.created++;
                } catch (e) {
                    results.errors.push(`Roll ${roll_no}: ${e.message}`);
                    results.skipped++;
                }
            }

            res.json({
                message: `Import complete: ${results.created} created, ${results.skipped} skipped`,
                ...results
            });
        } catch (err) {
            res.status(500).json({ message: 'Server error during Excel parse', error: err.message });
        }
    }
];

// Send broadcast email to targeted students
exports.emailStudents = async (req, res) => {
    try {
        const { subject, message, targetMode, targetGroups, targetUsers } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const EmailBroadcast = require('../models/EmailBroadcast');
        const Group = require('../models/Group');

        let students = [];
        let targetNames = [];

        if (targetMode === 'groups') {
            if (!targetGroups || targetGroups.length === 0) {
                return res.status(400).json({ message: 'At least one group must be selected' });
            }
            // Fetch groups to get members and names
            const groupsList = await Group.find({ _id: { $in: targetGroups } }).populate('members');
            targetNames = groupsList.map(g => g.name);
            
            const memberIds = new Set();
            groupsList.forEach(g => {
                (g.members || []).forEach(m => {
                    memberIds.add(String(m._id || m));
                });
            });

            students = await User.find({
                _id: { $in: Array.from(memberIds) },
                role: 'student',
                email: { $exists: true, $ne: '' }
            });
        } else if (targetMode === 'students') {
            if (!targetUsers || targetUsers.length === 0) {
                return res.status(400).json({ message: 'At least one student must be selected' });
            }
            students = await User.find({
                _id: { $in: targetUsers },
                role: 'student',
                email: { $exists: true, $ne: '' }
            });
            targetNames = students.map(s => `${s.roll_no} (${s.name})`);
        } else {
            // targetMode === 'all'
            students = await User.find({
                role: 'student',
                email: { $exists: true, $ne: '' }
            });
            targetNames = ['All Students'];
        }

        if (students.length === 0) {
            return res.status(404).json({ message: 'No matching students with email addresses found' });
        }

        const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        if (!hasSMTP) {
            return res.status(400).json({ message: 'SMTP is not configured on the server. Cannot send email.' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        // Send to each student
        for (const student of students) {
            try {
                const mailOptions = {
                    from: process.env.SMTP_FROM || `"Smart Quiz Admin" <${process.env.SMTP_USER}>`,
                    to: student.email,
                    subject: subject,
                    text: message,
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                        <h2 style="color: #071125;">Message from Smart Quiz Admin</h2>
                        <p>Hello <strong>${student.name}</strong>,</p>
                        <div style="line-height: 1.6; color: #334155; margin: 20px 0; white-space: pre-wrap;">
                            ${message}
                        </div>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #94a3b8;">This is a broadcast message sent by your administrator.</p>
                    </div>`
                };

                await transporter.sendMail(mailOptions);
                successCount++;
            } catch (err) {
                console.error(`Failed to send email to ${student.email}:`, err.message);
                failCount++;
                errors.push(`${student.email}: ${err.message}`);
            }
        }

        // Save history record
        try {
            await EmailBroadcast.create({
                subject,
                message,
                sender: req.user ? req.user.id : null,
                targetMode: targetMode || 'all',
                targetNames,
                successCount,
                failCount,
                errors
            });
        } catch (dbErr) {
            console.error('Failed to log EmailBroadcast to database:', dbErr.message);
        }

        res.json({
            message: `Broadcasting complete: ${successCount} sent successfully, ${failCount} failed.`,
            successCount,
            failCount,
            errors
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during broadcast', error: err.message });
    }
};

// Fetch email sending history
exports.getEmailHistory = async (req, res) => {
    try {
        const EmailBroadcast = require('../models/EmailBroadcast');
        const history = await EmailBroadcast.find()
            .populate('sender', 'name')
            .sort({ createdAt: -1 })
            .lean();
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching history', error: err.message });
    }
};
