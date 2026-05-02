const mongoose = require('mongoose');
const FeedbackSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Feedback', FeedbackSchema);
