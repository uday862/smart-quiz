const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/', async (req, res) => {
    try {
        const f = new Feedback(req.body);
        await f.save();
        res.json(f);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
    try {
        const f = await Feedback.find().populate('student', 'name roll_no').sort({_id: -1});
        res.json(f);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/mark-read', async (req, res) => {
    try {
        await Feedback.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
