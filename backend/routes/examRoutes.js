const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// Admin create exam
router.post('/', async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();
        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Student get active exams only
router.get('/', async (req, res) => {
    try {
        const exams = await Exam.find({ 
            status: { $in: ['running', 'not_started'] },
            isDeleted: { $ne: true }
        });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start exam
router.post('/:id/start', async (req, res) => {
    try {
        const updated = await Exam.findByIdAndUpdate(req.params.id, { status: 'running' }, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Stop exam
router.post('/:id/stop', async (req, res) => {
    try {
        const updated = await Exam.findByIdAndUpdate(req.params.id, { status: 'stopped' }, { new: true });
        // Also mark active attempts as stopped!
        const Attempt = require('../models/Attempt');
        await Attempt.updateMany({ exam: req.params.id, status: 'attempting' }, { status: 'stopped' });
        
        req.io.emit('admin_dashboard_update', { refresh: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Update exam (Restart)
router.put('/:id', async (req, res) => {
    try {
        const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedExam);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Physical delete exam (Permanent removal)
router.delete('/:id', async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exam deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
