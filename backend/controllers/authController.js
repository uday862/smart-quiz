const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { roll_no, name, password, role } = req.body;
        
        // Admin login: matches role 'admin' and name/password, Student login: matches roll_no and password
        let user;
        if (role === 'admin') {
            user = await User.findOne({ role: 'admin', name });
        } else {
            user = await User.findOne({ role: 'student', roll_no });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, roll_no: user.roll_no } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.registerAdmin = async (req, res) => {
    try {
        const { name, password } = req.body;
        let user = await User.findOne({ role: 'admin', name });
        if (user) {
            return res.status(400).json({ message: 'Admin already exists' });
        }
        
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
