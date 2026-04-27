const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['welcome', 'assignment_started', 'score_updated', 'general'], 
        default: 'general' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    score: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
