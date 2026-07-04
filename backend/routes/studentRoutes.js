const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/upload', requireAdmin, studentController.uploadStudentsExcel); // Excel bulk upload
router.post('/email-broadcast', requireAdmin, studentController.emailStudents);
router.get('/email-history', requireAdmin, studentController.getEmailHistory);
router.post('/', requireAdmin, studentController.createStudent);
router.get('/', requireAuth, studentController.getStudents);
router.put('/:id', requireAdmin, studentController.updateStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);

module.exports = router;
