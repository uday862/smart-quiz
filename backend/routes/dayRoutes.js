const express = require('express');
const router = express.Router();
const Day = require('../models/Day');
const Exam = require('../models/Exam');

// Create a new day
router.post('/', async (req, res) => {
    try {
        const day = new Day(req.body);
        await day.save();
        res.status(201).json(day);
    } catch (err) {
        console.error('Day creation error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all days with their associated tasks
router.get('/', async (req, res) => {
    try {
        const days = await Day.find().sort({ dayNumber: 1 });
        const ex = await Exam.find({ isDeleted: { $ne: true } });
        
        console.log(`Mapping ${ex.length} active exams into ${days.length} days`);
        
        const mappedDays = days.map(day => {
            return {
                ...day._doc,
                tasks: ex.filter(e => String(e.dayId) === String(day._id))
            };
        });
        
        res.json(mappedDays);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Restart a full day
router.put('/:id/restart', async (req, res) => {
    try {
        // Restart all tasks under this day
        await Exam.updateMany(
            { dayId: req.params.id }, 
            { $set: { status: 'running', start_time: new Date(), end_time: new Date(Date.now() + 86400000) } }
        );
        res.json({ message: 'Day restarted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a day (edit module)
router.put('/:id', async (req, res) => {
    try {
        const day = await Day.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!day) return res.status(404).json({ message: 'Day not found' });
        res.json(day);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete a day (and all its tasks)
router.delete('/:id', async (req, res) => {
    try {
        await Day.findByIdAndDelete(req.params.id);
        await Exam.deleteMany({ dayId: req.params.id });
        res.json({ message: 'Module and tasks deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
