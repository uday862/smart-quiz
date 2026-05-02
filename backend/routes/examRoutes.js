const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Group = require('../models/Group');

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

// Student get active exams (filtered by allowedUsers / allowedGroups)
// Pass ?studentId=<id> to filter by access
router.get('/', async (req, res) => {
    try {
        const exams = await Exam.find({
            status: { $in: ['running', 'not_started'] },
            isDeleted: { $ne: true }
        });

        const studentId = req.query.studentId;
        if (!studentId) {
            return res.json(exams);
        }

        // Find all groups this student belongs to
        const studentGroups = await Group.find({ members: studentId });
        const groupIds = studentGroups.map(g => String(g._id));

        // Filter: accessible if allowedUsers and allowedGroups are both empty (all), 
        // or student is in allowedUsers, or student's group is in allowedGroups
        const accessible = exams.filter(exam => {
            const hasUserRestriction = (exam.allowedUsers || []).length > 0;
            const hasGroupRestriction = (exam.allowedGroups || []).length > 0;

            if (!hasUserRestriction && !hasGroupRestriction) return true; // open to all

            if (hasUserRestriction && (exam.allowedUsers || []).some(u => String(u) === String(studentId))) return true;

            if (hasGroupRestriction && (exam.allowedGroups || []).some(g => groupIds.includes(String(g)))) return true;

            return false;
        });

        res.json(accessible);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single exam by ID
router.get('/:id', async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start exam — notify only assigned students
router.post('/:id/start', async (req, res) => {
    try {
        const updated = await Exam.findByIdAndUpdate(req.params.id, { status: 'running' }, { new: true });
        
        // Send notifications to eligible students
        try {
            const Notification = require('../models/Notification');
            const User = require('../models/User');
            const Group = require('../models/Group');

            const hasUserRestriction = (updated.allowedUsers || []).length > 0;
            const hasGroupRestriction = (updated.allowedGroups || []).length > 0;

            let studentIds = [];

            if (!hasUserRestriction && !hasGroupRestriction) {
                // All students
                const all = await User.find({ role: 'student', status: 'Active' }).select('_id');
                studentIds = all.map(s => s._id);
            } else {
                if (hasUserRestriction) studentIds = [...updated.allowedUsers];
                if (hasGroupRestriction) {
                    const grps = await Group.find({ _id: { $in: updated.allowedGroups } });
                    grps.forEach(g => { g.members.forEach(m => { if (!studentIds.some(id => String(id) === String(m))) studentIds.push(m); }); });
                }
            }

            const notifs = studentIds.map(sId => ({
                student: sId,
                type: 'assignment_started',
                title: '📋 New Assignment Started!',
                message: `"${updated.title}" is now live. Open your dashboard to attempt it.`,
                examId: updated._id,
                isRead: false
            }));
            if (notifs.length > 0) await Notification.insertMany(notifs);
        } catch (notifErr) { console.error('Notification error:', notifErr.message); }

        res.json(updated);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Stop exam
router.post('/:id/stop', async (req, res) => {
    try {
        const updated = await Exam.findByIdAndUpdate(req.params.id, { status: 'stopped' }, { new: true });
        const Attempt = require('../models/Attempt');
        await Attempt.updateMany({ exam: req.params.id, status: 'attempting' }, { status: 'stopped' });
        req.io.emit('admin_dashboard_update', { refresh: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// Update exam
router.put('/:id', async (req, res) => {
    try {
        const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedExam);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Physical delete exam
router.delete('/:id', async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        const Attempt = require('../models/Attempt');
        await Attempt.deleteMany({ exam: req.params.id });
        res.json({ message: 'Exam and related attempts deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
