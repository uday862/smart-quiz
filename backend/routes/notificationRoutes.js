const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all notifications for a student (Keep only top 10, delete rest)
router.get('/:studentId', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        if (req.user.role !== 'admin' && String(studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const notifications = await Notification.find({ student: studentId })
            .sort({ createdAt: -1 });
            
        // Enforce max 10 notifications limit and delete the rest
        if (notifications.length > 10) {
            const idsToDelete = notifications.slice(10).map(n => n._id);
            await Notification.deleteMany({ _id: { $in: idsToDelete } });
        }
        
        res.json(notifications.slice(0, 10));
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread count
router.get('/:studentId/unread-count', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        if (req.user.role !== 'admin' && String(studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const count = await Notification.countDocuments({ student: studentId, isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark one as read
router.put('/:id/read', requireAuth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        if (req.user.role !== 'admin' && String(notification.student) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all as read for a student
router.put('/student/:studentId/read-all', requireAuth, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        if (req.user.role !== 'admin' && String(studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Notification.updateMany({ student: studentId, isRead: false }, { isRead: true });
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a notification
router.post('/', requireAdmin, async (req, res) => {
    try {
        const notif = new Notification(req.body);
        await notif.save();
        
        // Auto cleanup if exceeds 10
        if (req.body.student) {
            const studentNotifs = await Notification.find({ student: req.body.student }).sort({ createdAt: -1 });
            if (studentNotifs.length > 10) {
                const idsToDelete = studentNotifs.slice(10).map(n => n._id);
                await Notification.deleteMany({ _id: { $in: idsToDelete } });
            }
        }
        
        res.status(201).json(notif);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
