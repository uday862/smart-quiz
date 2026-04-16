const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day' },
    attemptNumber: { type: Number, default: 1 },
    score: { type: Number, default: 0 },
    flags: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    ipAddress: { type: String },
    status: { type: String, enum: ['attempting', 'completed', 'stopped'], default: 'attempting' },
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date },
    maxScore: { type: Number, default: 0 },
    answers: [{
        question_id: { type: mongoose.Schema.Types.ObjectId },
        answer: { type: mongoose.Schema.Types.Mixed }, // String for MCQ, code, etc.
        marks_awarded: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
