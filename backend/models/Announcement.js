const mongoose = require('mongoose');
const AnnouncementSchema = new mongoose.Schema({
    message: String,
    active: { type: Boolean, default: true }
});
module.exports = mongoose.model('Announcement', AnnouncementSchema);
