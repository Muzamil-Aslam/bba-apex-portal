const express = require('express');
const router = express.Router();
const { getAdminDashboard, getStudentDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin', 'faculty'), getAdminDashboard);
router.get('/student', protect, getStudentDashboard);

module.exports = router;
