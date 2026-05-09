const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');

exports.getAdminDashboard = async (req, res) => {
  const [totalStudents, totalEvents, totalRegistrations, totalCertificates,
    upcomingEvents, recentRegistrations, topStudents] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Event.countDocuments(),
    Registration.countDocuments(),
    Certificate.countDocuments(),
    Event.find({ status: 'upcoming' }).sort({ date: 1 }).limit(5).select('title date venue category currentParticipants maxParticipants'),
    Registration.find().sort({ createdAt: -1 }).limit(10).populate('student', 'name uid').populate('event', 'title'),
    User.find({ role: 'student' }).sort({ totalPoints: -1 }).limit(5).select('name uid totalPoints course')
  ]);
  const categoryStats = await Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  res.json({ success: true, stats: { totalStudents, totalEvents, totalRegistrations, totalCertificates }, upcomingEvents, recentRegistrations, topStudents, categoryStats });
};

exports.getStudentDashboard = async (req, res) => {
  const [registrations, certificates] = await Promise.all([
    Registration.find({ student: req.user.id }).populate('event', 'title date venue category status poster points').sort({ createdAt: -1 }),
    Certificate.find({ student: req.user.id }).populate('event', 'title date').sort({ createdAt: -1 })
  ]);
  const user = await User.findById(req.user.id).select('-password');
  const rank = await User.countDocuments({ totalPoints: { $gt: user.totalPoints }, role: 'student' }) + 1;
  const attended = registrations.filter(r => r.status === 'attended').length;
  const upcoming = registrations.filter(r => r.event && new Date(r.event.date) > new Date()).length;
  res.json({ success: true, user, stats: { totalRegistrations: registrations.length, attended, upcomingEvents: upcoming, certificates: certificates.length, totalPoints: user.totalPoints, rank }, registrations, certificates });
};
