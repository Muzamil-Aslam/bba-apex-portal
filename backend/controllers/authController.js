const User = require('../models/User');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, uid: user.uid, email: user.email, role: user.role, course: user.course, semester: user.semester, phone: user.phone, totalPoints: user.totalPoints, avatar: user.avatar }
  });
};

exports.register = async (req, res) => {
  const { name, uid, email, password, course, semester, phone } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { uid }] });
  if (existing) return res.status(400).json({ success: false, message: existing.email === email ? 'Email already registered.' : 'UID already registered.' });
  const user = await User.create({ name, uid, email, password, course, semester, phone });
  sendToken(user, 201, res);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  sendToken(user, 200, res);
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
};

exports.updateProfile = async (req, res) => {
  const { name, course, semester, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, course, semester, phone }, { new: true, runValidators: true });
  res.json({ success: true, user });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
};

const crypto = require('crypto');

// ── helpers ────────────────────────────────────────────────────────────────
const isEmailConfigured = () => {
  const u = process.env.EMAIL_USER || '';
  const p = process.env.EMAIL_PASS || '';
  return u && !u.includes('your_') && p && !p.includes('your_');
};

const sendOtpEmail = async (toEmail, userName, otp) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"BBA Apex Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP – BBA Apex Password Reset',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#800000;margin-bottom:4px">BBA Apex – Password Reset OTP</h2>
        <p style="color:#555">Hi <b>${userName}</b>,</p>
        <p style="color:#555">Use the OTP below to reset your password. It expires in <b>10 minutes</b>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#800000;background:#fff8e1;border:2px dashed #FFD700;border-radius:10px;padding:16px 24px;text-align:center;margin:20px 0">${otp}</div>
        <p style="color:#888;font-size:13px">If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#aaa;font-size:12px">BBA Apex • Chandigarh University</p>
      </div>`,
  });
};

// ── POST /api/auth/forgot-password  { email } ──────────────────────────────
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });

  // Generate a 6-digit OTP
  const otp        = String(Math.floor(100000 + Math.random() * 900000));
  user.otpCode     = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpire   = Date.now() + 10 * 60 * 1000; // 10 minutes
  // Clear any old reset token
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save({ validateBeforeSave: false });

  if (isEmailConfigured()) {
    // ── Email IS configured → send OTP by email ──────────────────────────
    try {
      await sendOtpEmail(user.email, user.name, otp);
      return res.json({ success: true, message: `OTP sent to ${user.email}. It expires in 10 minutes.` });
    } catch (err) {
      // Roll back OTP on email failure
      user.otpCode = undefined; user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }
  } else {
    // ── Email NOT configured (development mode) → return OTP in response ─
    console.warn(`\n⚠️  EMAIL NOT CONFIGURED — OTP for ${user.email}: ${otp}\n`);
    return res.json({
      success: true,
      devOtp: otp,           // shown in UI only when email is not set up
      message: 'Email service not configured. OTP shown below (development mode only).',
    });
  }
};

// ── POST /api/auth/verify-otp  { email, otp, newPassword } ────────────────
exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ success: false, message: 'Email, OTP and new password are required.' });

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await User.findOne({ email, otpCode: hashedOtp, otpExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

  user.password  = newPassword;
  user.otpCode   = undefined;
  user.otpExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
};

// ── POST /api/auth/reset-password/:token  (legacy link-based, kept for compatibility) ──
exports.resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  user.password = req.body.password;
  user.passwordResetToken = undefined; user.passwordResetExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
};
