const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

router.get('/', async (req, res) => {
    try {
        const a = await Announcement.findOne({ active: true }).sort({_id: -1});
        res.json(a || { message: '' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
    try {
        await Announcement.updateMany({}, { active: false });
        if (req.body.message) {
            const a = new Announcement({ message: req.body.message });
            await a.save();
            return res.json(a);
        }
        res.json({ message: '' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
