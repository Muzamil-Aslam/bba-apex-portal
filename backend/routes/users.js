const express = require('express');
const router = express.Router();
const { getLeaderboard, getAllStudents, getStudentProfile, toggleUserStatus, awardPoints, createStaff, getAllStaff, resetStaffPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard);
router.get('/staff', protect, authorize('admin'), getAllStaff);
router.post('/staff', protect, authorize('admin'), createStaff);
router.patch('/staff/:id/password', protect, authorize('admin'), resetStaffPassword);
router.get('/', protect, authorize('admin', 'faculty'), getAllStudents);
router.get('/:id', protect, getStudentProfile);
router.patch('/:id/status', protect, authorize('admin'), toggleUserStatus);
router.patch('/:id/points', protect, authorize('admin', 'faculty'), awardPoints);

module.exports = router;
