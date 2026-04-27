const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['admin', 'student'], required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    
    // Student profile fields
    roll_no: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true },
    phone: { type: String, default: '' },
    section: { type: String, default: '' },
    course: { type: String, default: '' },
    batch: { type: String, default: '' }, // e.g. "2024-28"
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    avatar_color: { type: String, default: '#3b82f6' }, // For avatar UI
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
