const User = require('../models/User');
const Registration = require('../models/Registration');

// Admin: create faculty or admin account
exports.createStaff = async (req, res) => {
  const { name, uid, email, password, role, phone, designation } = req.body;
  if (!['faculty', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be faculty or admin.' });
  }
  const existing = await User.findOne({ $or: [{ email }, { uid: uid.toUpperCase() }] });
  if (existing) {
    return res.status(400).json({ success: false, message: existing.email === email ? 'Email already in use.' : 'UID already in use.' });
  }
  const user = await User.create({ name, uid: uid.toUpperCase(), email, password, role, phone, course: designation || '' });
  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
    user: { id: user._id, name: user.name, uid: user.uid, email: user.email, role: user.role, phone: user.phone }
  });
};

// Admin: get all staff (faculty + admin)
exports.getAllStaff = async (req, res) => {
  const staff = await User.find({ role: { $in: ['faculty', 'admin'] } })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: staff.length, staff });
};

// Admin: update staff password
exports.resetStaffPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'student') return res.status(403).json({ success: false, message: 'Cannot reset student passwords from here.' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: `Password updated for ${user.name}.` });
};

exports.getLeaderboard = async (req, res) => {
  const { limit = 10 } = req.query;
  const users = await User.find({ role: 'student', isActive: true })
    .select('name uid course totalPoints avatar')
    .sort({ totalPoints: -1 })
    .limit(Number(limit));
  res.json({ success: true, leaderboard: users });
};

exports.getAllStudents = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = { role: 'student' };
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { uid: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([User.find(query).select('-password').skip(skip).limit(Number(limit)).sort({ totalPoints: -1 }), User.countDocuments(query)]);
  res.json({ success: true, total, students });
};

exports.getStudentProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  const registrations = await Registration.find({ student: req.params.id }).populate('event', 'title date category').sort({ createdAt: -1 });
  res.json({ success: true, user, registrations });
};

exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
};

exports.awardPoints = async (req, res) => {
  const { points, reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { $inc: { totalPoints: points } }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: `${points} points awarded to ${user.name}.`, user });
};
