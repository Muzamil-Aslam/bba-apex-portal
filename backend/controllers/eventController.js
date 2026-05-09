const Event = require('../models/Event');
const Registration = require('../models/Registration');

exports.getEvents = async (req, res) => {
  const { category, status, search, page = 1, limit = 12 } = req.query;
  const query = { isPublished: true };
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) query.$text = { $search: search };
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    Event.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name'),
    Event.countDocuments(query)
  ]);
  res.json({ success: true, count: events.length, total, pages: Math.ceil(total / limit), currentPage: Number(page), events });
};

exports.getEvent = async (req, res) => {
  const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  res.json({ success: true, event });
};

// Helper: check if Cloudinary is properly configured (not placeholder values)
const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return (
    CLOUDINARY_CLOUD_NAME && !CLOUDINARY_CLOUD_NAME.includes('your_') &&
    CLOUDINARY_API_KEY    && !CLOUDINARY_API_KEY.includes('your_')    &&
    CLOUDINARY_API_SECRET && !CLOUDINARY_API_SECRET.includes('your_')
  );
};

// Helper: upload to Cloudinary, returns URL or null on failure
const uploadToCloudinary = async (tempFilePath) => {
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.uploader.upload(tempFilePath, { folder: 'bba_apex/events' });
    return result.secure_url;
  } catch (err) {
    console.warn('⚠️  Cloudinary upload skipped:', err.message);
    return null;
  }
};

exports.createEvent = async (req, res) => {
  req.body.createdBy = req.user.id;
  if (req.files && req.files.poster) {
    if (isCloudinaryConfigured()) {
      const url = await uploadToCloudinary(req.files.poster.tempFilePath);
      if (url) req.body.poster = url;
    } else {
      console.warn('⚠️  Cloudinary not configured — poster image skipped. Set CLOUDINARY_* in .env to enable uploads.');
    }
  }
  const event = await Event.create(req.body);
  res.status(201).json({ success: true, message: 'Event created successfully.', event });
};

exports.updateEvent = async (req, res) => {
  let event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (req.files && req.files.poster) {
    if (isCloudinaryConfigured()) {
      const url = await uploadToCloudinary(req.files.poster.tempFilePath);
      if (url) req.body.poster = url;
    } else {
      console.warn('⚠️  Cloudinary not configured — poster image skipped.');
    }
  }
  event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, message: 'Event updated.', event });
};

exports.deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  await Registration.deleteMany({ event: req.params.id });
  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted.' });
};

exports.getStats = async (req, res) => {
  const [totalEvents, totalRegistrations, upcomingEvents, completedEvents] = await Promise.all([
    Event.countDocuments(),
    Registration.countDocuments(),
    Event.countDocuments({ status: 'upcoming' }),
    Event.countDocuments({ status: 'completed' })
  ]);
  res.json({ success: true, stats: { totalEvents, totalRegistrations, upcomingEvents, completedEvents, industrySessions: await Event.countDocuments({ category: 'Industry Session' }), competitions: await Event.countDocuments({ category: 'Competition' }) } });
};

exports.archiveEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  event.isPublished = !event.isPublished;
  await event.save();
  res.json({ success: true, message: `Event ${event.isPublished ? 'unarchived (visible)' : 'archived (hidden from students)'}.`, event });
};

exports.getAnalytics = async (req, res) => {
  const Registration = require('../models/Registration');
  const User = require('../models/User');

  // Registrations per month (last 6 months)
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const regByMonth = await Registration.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Events by category
  const eventsByCategory = await Event.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, totalParticipants: { $sum: '$currentParticipants' } } },
    { $sort: { count: -1 } }
  ]);

  // Events by status
  const eventsByStatus = await Event.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Top 5 most popular events
  const topEvents = await Event.find({ currentParticipants: { $gt: 0 } })
    .sort({ currentParticipants: -1 }).limit(5)
    .select('title currentParticipants maxParticipants category');

  // New students per month
  const studentsByMonth = await User.aggregate([
    { $match: { role: 'student', createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatMonthly = (data) => data.map(d => ({ month: `${months[d._id.month - 1]} ${d._id.year}`, count: d.count }));

  res.json({ success: true, analytics: {
    registrationsByMonth: formatMonthly(regByMonth),
    studentsByMonth: formatMonthly(studentsByMonth),
    eventsByCategory, eventsByStatus, topEvents
  }});
};

// ── GET /api/events/:id/qrcode ─────────────────────────────────────────────
// Returns a QR code (base64 PNG) that encodes the event's registration URL.
// Admins can print/display this at the event venue so students can scan & register.
exports.getEventQRCode = async (req, res) => {
  const QRCode = require('qrcode');
  const event = await Event.findById(req.params.id).select('title _id');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${event._id}`;
  const qrDataUrl = await QRCode.toDataURL(eventUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#800000', light: '#ffffff' },
  });
  res.json({ success: true, eventId: event._id, title: event.title, qrCode: qrDataUrl, url: eventUrl });
};
