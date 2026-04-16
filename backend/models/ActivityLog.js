const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    ipAddress: { type: String },
    flags: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    copyPasteCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
