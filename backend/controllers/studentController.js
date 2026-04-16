const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Admin only: create a student
exports.createStudent = async (req, res) => {
    try {
        const { name, roll_no, section, course, password } = req.body;
        // In a real app we'd verify admin token first
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'default_password', salt);
        
        const student = new User({ role: 'student', name, roll_no, section, course, password: hashedPassword });
        await student.save();
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

        const students = await User.find(filter).select('-password');
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
        }
        const student = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(student);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteStudent = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student removed' });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
