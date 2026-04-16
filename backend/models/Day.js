const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
    dayNumber: { type: Number, required: true, unique: true },
    date: { type: Date, default: Date.now },
    title: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Day', daySchema);
