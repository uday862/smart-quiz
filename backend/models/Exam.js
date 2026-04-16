const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day' },
    title: { type: String, required: true },
    status: { type: String, enum: ['not_started', 'running', 'stopped'], default: 'not_started' },
    time_limit: { type: Number, required: true }, // in minutes
    attempt_limit: { type: Number, default: 1 },
    questions: [{
        type: { type: String, enum: ['MCQ', 'Coding', 'Descriptive'], required: true },
        text: { type: String, required: true },
        options: [{ type: String }], // for MCQ
        correct_answer: { type: String }, // for MCQ
        marks: { type: Number, default: 1 }
    }],
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of student IDs, empty means all
    isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
