const Waitlist = require('../models/Waitlist');
const Event   = require('../models/Event');
const User    = require('../models/User');
const Registration = require('../models/Registration');

exports.joinWaitlist = async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.currentParticipants < event.maxParticipants)
    return res.status(400).json({ success: false, message: 'Event still has spots. Register directly.' });
  const alreadyRegistered = await Registration.findOne({ student: req.user.id, event: req.params.eventId });
  if (alreadyRegistered) return res.status(400).json({ success: false, message: 'You are already registered.' });
  const alreadyWaiting = await Waitlist.findOne({ student: req.user.id, event: req.params.eventId });
  if (alreadyWaiting) return res.status(400).json({ success: false, message: 'You are already on the waitlist.' });
  const count = await Waitlist.countDocuments({ event: req.params.eventId });
  const user = await User.findById(req.user.id);
  const entry = await Waitlist.create({
    student: req.user.id, event: req.params.eventId,
    studentName: user.name, uid: user.uid, email: user.email,
    position: count + 1,
  });
  res.status(201).json({ success: true, message: `Added to waitlist at position #${entry.position}`, entry });
};

exports.getMyWaitlist = async (req, res) => {
  const entries = await Waitlist.find({ student: req.user.id })
    .populate('event', 'title date venue status').sort({ createdAt: -1 });
  res.json({ success: true, entries });
};

exports.getEventWaitlist = async (req, res) => {
  const entries = await Waitlist.find({ event: req.params.eventId }).sort({ position: 1 });
  res.json({ success: true, count: entries.length, entries });
};

exports.leaveWaitlist = async (req, res) => {
  const entry = await Waitlist.findOneAndDelete({ student: req.user.id, event: req.params.eventId });
  if (!entry) return res.status(404).json({ success: false, message: 'Waitlist entry not found.' });
  // Reorder positions
  await Waitlist.updateMany({ event: req.params.eventId, position: { $gt: entry.position } }, { $inc: { position: -1 } });
  res.json({ success: true, message: 'Removed from waitlist.' });
};

// Called internally when a registration is cancelled
exports.promoteFromWaitlist = async (eventId) => {
  const next = await Waitlist.findOne({ event: eventId }).sort({ position: 1 });
  if (!next) return null;
  const event = await Event.findById(eventId);
  if (!event || event.currentParticipants >= event.maxParticipants) return null;
  // Auto-register the first waitlisted student
  try {
    const reg = await Registration.create({
      student: next.student, event: eventId,
      studentName: next.studentName, uid: next.uid, email: next.email, status: 'confirmed',
    });
    await Event.findByIdAndUpdate(eventId, { $inc: { currentParticipants: 1 } });
    await next.deleteOne();
    await Waitlist.updateMany({ event: eventId, position: { $gt: 1 } }, { $inc: { position: -1 } });
    return next;
  } catch { return null; }
};
