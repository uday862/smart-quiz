const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    dayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Day' },
    title: { type: String, required: true },
    status: { type: String, enum: ['not_started', 'running', 'stopped'], default: 'not_started' },
    time_limit: { type: Number, required: true }, // in minutes
    attempt_limit: { type: Number, default: 1 },
    questions: [{
        type: { type: String, enum: ['MCQ', 'Coding', 'Descriptive', 'SQL', 'Jumble'], required: true },
        words: [{ type: String }], // for Jumble: shuffled parts to arrange
        text: { type: String, required: true },
        options: [{ type: String }], // for MCQ
        correct_answer: { type: String }, // for MCQ or SQL
        sql_init: { type: String }, // Database schema initiation for SQL (Legacy)
        sample_input: { type: String }, // Example table data shown to student
        sample_output: { type: String }, // Example expected result shown to student
        test_cases: [{
            input: { type: String },
            output: { type: String }
        }],
        marks: { type: Number, default: 1 }
    }],
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of student IDs, empty means all
    allowedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], // Array of group IDs
    isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
