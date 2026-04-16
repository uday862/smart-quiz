const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');


// Get generic attempt by ID
router.get('/:id', async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('exam');
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active attempts for live monitoring
router.get('/task/:taskId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ exam: req.params.taskId }).populate('student');
        // Ensure ipAddress populated
        attempts.forEach(att => {
          if (!att.ipAddress) {
            att.ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
          }
        });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start an attempt immediately (Resume if exists)
router.post('/start', async (req, res) => {
    try {
        const { student, exam } = req.body;
        // Check for active attempt first to prevent duplicates
        const existing = await Attempt.findOne({ student, exam, status: 'attempting' });
        if (existing) {
            return res.json(existing);
        }

        const Exam = require('../models/Exam');
        const examData = await Exam.findById(exam);
        const maxScore = examData?.questions?.length || 0;

        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        const attempt = new Attempt({ ...req.body, status: 'attempting', ipAddress: ip, maxScore });
        await attempt.save();
        res.status(201).json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Submit/Update an attempt
router.put('/:id/submit', async (req, res) => {
    try {
        const { score, status, answers, flags } = req.body;
        const attempt = await Attempt.findById(req.params.id);
        
        attempt.score = score;
        attempt.status = status;
        attempt.answers = answers;
        attempt.flags = flags;
        attempt.submissions += 1;
        
        await attempt.save();
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get attempting status logic
router.get('/exam/:examId/student/:studentId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ exam: req.params.examId, student: req.params.studentId });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all past attempts for a single student (Reports)
router.get('/student/:studentId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ student: req.params.studentId })
            .populate('exam', 'title questions time_limit')
            .populate('dayId', 'dayNumber title')
            .sort({ createdAt: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Global Stats for Admin
router.get('/stats', async (req, res) => {
    try {
        const attempts = await Attempt.find();
        const totalAttempts = attempts.length;
        const totalFlags = attempts.reduce((acc, curr) => acc + (curr.flags || 0), 0);
        const topScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
        const avgScore = totalAttempts > 0 ? (attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts).toFixed(1) : 0;
        
        res.json({ totalAttempts, totalFlags, topScore, avgScore });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Detailed summary for all students and all tasks
router.get('/summary/detailed', async (req, res) => {
    try {
        const attempts = await Attempt.find({ status: 'completed' })
            .populate('student', 'roll_no name section')
            .populate('exam', 'title questions isDeleted');
        
        // Filter out attempts for deleted exams
        const filtered = attempts.filter(att => att.exam && att.exam.isDeleted !== true);
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
