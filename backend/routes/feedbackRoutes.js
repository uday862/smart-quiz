const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
    try {
        const feedbackData = {
            ...req.body,
            student: req.user.id // Enforce that the feedback is logged from the authenticated student
        };
        const f = new Feedback(feedbackData);
        await f.save();
        res.json(f);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        const f = await Feedback.find().populate('student', 'name roll_no').sort({_id: -1});
        res.json(f);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/mark-read', requireAdmin, async (req, res) => {
    try {
        await Feedback.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
