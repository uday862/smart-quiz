const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');

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

        const students = await User.find(filter).select('-password').sort({ createdAt: -1 });
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
