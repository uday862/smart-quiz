const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register-admin', requireAdmin, authController.registerAdmin);
router.put('/update-password', requireAuth, authController.updatePassword);
router.put('/update-profile', requireAuth, authController.updateProfile);

router.get('/admins', requireAdmin, authController.getAdmins);
router.delete('/admins/:id', requireAdmin, authController.deleteAdmin);

module.exports = router;
