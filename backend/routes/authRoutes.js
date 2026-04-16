const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register-admin', authController.registerAdmin);
router.put('/update-password', authController.updatePassword);


module.exports = router;
