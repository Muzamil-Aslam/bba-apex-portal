const Feedback  = require('../models/Feedback');
const Event     = require('../models/Event');
const Registration = require('../models/Registration');

exports.submitFeedback = async (req, res) => {
  const { rating, comment, wouldRecommend } = req.body;
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.status !== 'completed')
    return res.status(400).json({ success: false, message: 'Feedback is only for completed events.' });
  const attended = await Registration.findOne({ student: req.user.id, event: req.params.eventId, status: 'attended' });
  if (!attended) return res.status(403).json({ success: false, message: 'Only attended students can leave feedback.' });
  const existing = await Feedback.findOne({ student: req.user.id, event: req.params.eventId });
  if (existing) return res.status(400).json({ success: false, message: 'You already submitted feedback for this event.' });
  const feedback = await Feedback.create({ student: req.user.id, event: req.params.eventId, rating, comment, wouldRecommend });
  res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
};

exports.getEventFeedback = async (req, res) => {
  const feedbacks = await Feedback.find({ event: req.params.eventId })
    .populate('student', 'name uid').sort({ createdAt: -1 });
  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : 0;
  const recommend = feedbacks.length ? Math.round(feedbacks.filter(f => f.wouldRecommend).length / feedbacks.length * 100) : 0;
  res.json({ success: true, count: feedbacks.length, averageRating: Number(avg), recommendPercent: recommend, feedbacks });
};

exports.getMyFeedbacks = async (req, res) => {
  const feedbacks = await Feedback.find({ student: req.user.id })
    .populate('event', 'title date').sort({ createdAt: -1 });
  res.json({ success: true, feedbacks });
};
