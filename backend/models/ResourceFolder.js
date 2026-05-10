const mongoose = require('mongoose');

const resourceFolderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ResourceFolder', resourceFolderSchema);
