const express = require('express');
const router = express.Router();
const ResourceFolder = require('../models/ResourceFolder');
const Exam = require('../models/Exam');

// Get all folders
router.get('/', async (req, res) => {
    try {
        const folders = await ResourceFolder.find().sort({ createdAt: -1 });
        res.json(folders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create folder
router.post('/', async (req, res) => {
    try {
        const folder = new ResourceFolder(req.body);
        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete folder
router.delete('/:id', async (req, res) => {
    try {
        await ResourceFolder.findByIdAndDelete(req.params.id);
        // Delete all resources inside this folder
        await Exam.deleteMany({ resourceFolderId: req.params.id, isResource: true });
        res.json({ message: 'Folder deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
