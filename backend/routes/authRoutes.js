const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register-admin', authController.registerAdmin);
router.put('/update-password', authController.updatePassword);
router.put('/update-profile', authController.updateProfile);

router.get('/admins', authController.getAdmins);
router.delete('/admins/:id', authController.deleteAdmin);

module.exports = router;
