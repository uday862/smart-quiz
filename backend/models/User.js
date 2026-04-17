const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['admin', 'student'], required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    
    // Student specific fields
    roll_no: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true },
    section: { type: String },
    course: { type: String },
    status: { type: String, default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
