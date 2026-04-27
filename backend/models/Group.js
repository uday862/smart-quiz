const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // student IDs
    color: { type: String, default: '#3b82f6' } // UI badge color
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
