const mongoose = require('mongoose');

const emailBroadcastSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetMode: { type: String, enum: ['all', 'groups', 'students'], default: 'all' },
    targetNames: [{ type: String }], // Names of groups or student roll numbers
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    errors: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('EmailBroadcast', emailBroadcastSchema);
