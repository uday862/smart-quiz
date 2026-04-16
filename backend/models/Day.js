const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
    dayNumber: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    title: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Day', daySchema);
