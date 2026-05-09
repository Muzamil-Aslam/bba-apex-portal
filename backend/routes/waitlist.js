const express = require('express');
const router = express.Router();
const { joinWaitlist, getMyWaitlist, getEventWaitlist, leaveWaitlist } = require('../controllers/waitlistController');
const { protect, authorize } = require('../middleware/auth');
router.post('/event/:eventId', protect, joinWaitlist);
router.get('/my', protect, getMyWaitlist);
router.delete('/event/:eventId', protect, leaveWaitlist);
router.get('/event/:eventId', protect, authorize('admin','faculty'), getEventWaitlist);
module.exports = router;
