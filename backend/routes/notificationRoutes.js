const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications for a student
router.get('/:studentId', async (req, res) => {
    try {
        const notifications = await Notification.find({ student: req.params.studentId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread count
router.get('/:studentId/unread-count', async (req, res) => {
    try {
        const count = await Notification.countDocuments({ student: req.params.studentId, isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark one as read
router.put('/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all as read for a student
router.put('/student/:studentId/read-all', async (req, res) => {
    try {
        await Notification.updateMany({ student: req.params.studentId, isRead: false }, { isRead: true });
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a notification (internal use by other routes via helper)
router.post('/', async (req, res) => {
    try {
        const notif = new Notification(req.body);
        await notif.save();
        res.status(201).json(notif);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
