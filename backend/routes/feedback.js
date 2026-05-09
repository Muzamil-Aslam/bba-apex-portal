const express = require('express');
const router = express.Router();
const { submitFeedback, getEventFeedback, getMyFeedbacks } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');
router.post('/event/:eventId', protect, submitFeedback);
router.get('/event/:eventId', protect, authorize('admin','faculty'), getEventFeedback);
router.get('/my', protect, getMyFeedbacks);
module.exports = router;
