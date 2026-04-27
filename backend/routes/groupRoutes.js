const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');

// Get all groups (with populated members)
router.get('/', async (req, res) => {
    try {
        const groups = await Group.find().populate('members', '-password').sort({ name: 1 });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Create a group
router.post('/', async (req, res) => {
    try {
        const { name, description, color, members } = req.body;
        const group = new Group({ name, description, color: color || '#3b82f6', members: members || [] });
        await group.save();
        const populated = await Group.findById(group._id).populate('members', '-password');
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ message: 'Group name already exists' });
        } else {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
});

// Update group (name, description, members)
router.put('/:id', async (req, res) => {
    try {
        const { name, description, color, members } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { name, description, color, members },
            { new: true, runValidators: true }
        ).populate('members', '-password');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Add student to group
router.post('/:id/add-member', async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { members: studentId } },
            { new: true }
        ).populate('members', '-password');
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Remove student from group
router.post('/:id/remove-member', async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: studentId } },
            { new: true }
        ).populate('members', '-password');
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete group
router.delete('/:id', async (req, res) => {
    try {
        await Group.findByIdAndDelete(req.params.id);
        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
