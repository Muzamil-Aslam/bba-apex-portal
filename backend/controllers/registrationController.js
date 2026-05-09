const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User  = require('../models/User');
const XLSX  = require('xlsx');
const QRCode = require('qrcode');

// ── Send registration confirmation email ──────────────────────────────────
const sendConfirmationEmail = async ({ to, studentName, eventTitle, eventDate, eventVenue, regNumber, qrDataUrl }) => {
  const isEmailConfigured = () => {
    const u = process.env.EMAIL_USER || '';
    const p = process.env.EMAIL_PASS || '';
    return u && !u.includes('your_') && p && !p.includes('your_');
  };
  if (!isEmailConfigured()) return; // silently skip if email not set up

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // Convert base64 data URL to buffer for inline attachment
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    await transporter.sendMail({
      from: `"BBA Apex Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Registration Confirmed – ${eventTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:0;border:1px solid #eee;border-radius:14px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#800000,#a00000);padding:28px 32px;text-align:center">
            <h1 style="color:#FFD700;margin:0;font-size:22px;letter-spacing:1px">BBA Apex Portal</h1>
            <p style="color:#fff;margin:6px 0 0;font-size:13px">Chandigarh University</p>
          </div>
          <div style="padding:28px 32px">
            <h2 style="color:#800000;margin-top:0">🎉 You're Registered!</h2>
            <p style="color:#444">Hi <strong>${studentName}</strong>,</p>
            <p style="color:#444">Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
            <table style="width:100%;background:#f9f5f5;border-radius:10px;padding:16px;margin:20px 0;border-collapse:collapse">
              <tr><td style="padding:6px 10px;color:#888;font-size:13px">📅 Date</td><td style="padding:6px 10px;font-weight:600;color:#333;font-size:13px">${eventDate}</td></tr>
              <tr><td style="padding:6px 10px;color:#888;font-size:13px">📍 Venue</td><td style="padding:6px 10px;font-weight:600;color:#333;font-size:13px">${eventVenue}</td></tr>
              <tr><td style="padding:6px 10px;color:#888;font-size:13px">🎫 Reg. No.</td><td style="padding:6px 10px;font-weight:700;color:#800000;font-size:15px;letter-spacing:2px">${regNumber}</td></tr>
            </table>
            <p style="color:#555;font-size:14px;text-align:center">Show this QR code at the event entrance for attendance:</p>
            <div style="text-align:center;margin:16px 0">
              <img src="cid:qrcode" alt="QR Code" style="width:180px;height:180px;border:3px solid #FFD700;border-radius:12px" />
            </div>
            <p style="color:#999;font-size:12px;text-align:center">You can also find this QR code anytime in your Student Dashboard.</p>
          </div>
          <div style="background:#f5f5f5;padding:14px 32px;text-align:center">
            <p style="color:#aaa;font-size:12px;margin:0">BBA Apex • Chandigarh University</p>
          </div>
        </div>`,
      attachments: [{
        filename: 'qr-code.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'qrcode',
      }],
    });
  } catch (err) {
    console.warn('⚠️  Confirmation email failed (non-critical):', err.message);
  }
};

exports.registerForEvent = async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.status === 'cancelled') return res.status(400).json({ success: false, message: 'Event is cancelled.' });
  if (new Date() > new Date(event.registrationDeadline)) return res.status(400).json({ success: false, message: 'Registration deadline has passed.' });
  if (event.currentParticipants >= event.maxParticipants) return res.status(400).json({ success: false, message: 'Event is full. You can join the waitlist.' });
  const existing = await Registration.findOne({ student: req.user.id, event: req.params.eventId });
  if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event.' });
  const user = await User.findById(req.user.id);
  const registration = await Registration.create({
    student: req.user.id, event: req.params.eventId,
    studentName: user.name, uid: user.uid, course: user.course,
    semester: user.semester, phone: user.phone, email: user.email, status: 'confirmed'
  });
  await Event.findByIdAndUpdate(req.params.eventId, { $inc: { currentParticipants: 1 } });

  // Generate QR code (encodes the registration number)
  const qrDataUrl = await QRCode.toDataURL(registration.registrationNumber, { width: 200, margin: 1, color: { dark: '#800000', light: '#ffffff' } });

  // Send confirmation email (non-blocking — don't await so it doesn't slow down the response)
  sendConfirmationEmail({
    to: user.email,
    studentName: user.name,
    eventTitle: event.title,
    eventDate: new Date(event.date).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }),
    eventVenue: event.venue,
    regNumber: registration.registrationNumber,
    qrDataUrl,
  });

  res.status(201).json({ success: true, message: 'Registered successfully!', registration, qrCode: qrDataUrl });
};

exports.getMyRegistrations = async (req, res) => {
  const registrations = await Registration.find({ student: req.user.id })
    .populate('event', 'title date venue category status poster points')
    .sort({ createdAt: -1 });
  // Generate QR codes for all
  const regsWithQR = await Promise.all(registrations.map(async (r) => {
    const qrCode = await QRCode.toDataURL(r.registrationNumber, { width: 150, margin: 1, color: { dark: '#800000', light: '#ffffff' } });
    return { ...r.toObject(), qrCode };
  }));
  res.json({ success: true, count: regsWithQR.length, registrations: regsWithQR });
};

exports.getEventRegistrations = async (req, res) => {
  const registrations = await Registration.find({ event: req.params.eventId })
    .populate('student', 'name uid email course semester phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: registrations.length, registrations });
};

// QR code scan attendance — looks up by registration number
exports.scanQRAttendance = async (req, res) => {
  const { registrationNumber } = req.body;
  const registration = await Registration.findOne({ registrationNumber }).populate('event', 'title date');
  if (!registration) return res.status(404).json({ success: false, message: 'Invalid QR code / Registration not found.' });
  if (registration.status === 'attended') return res.status(400).json({ success: false, message: `${registration.studentName} already marked as attended.` });
  registration.status = 'attended';
  await registration.save();
  if (!registration.pointsAwarded) {
    const event = await Event.findById(registration.event);
    if (event) {
      await User.findByIdAndUpdate(registration.student, { $inc: { totalPoints: event.points } });
      registration.pointsAwarded = true;
      await registration.save();
    }
  }
  res.json({ success: true, message: `✅ ${registration.studentName} (${registration.uid}) marked as attended!`, registration });
};

exports.updateAttendance = async (req, res) => {
  const { registrationId } = req.params;
  const { status } = req.body;
  const registration = await Registration.findByIdAndUpdate(registrationId, { status }, { new: true });
  if (!registration) return res.status(404).json({ success: false, message: 'Registration not found.' });
  if (status === 'attended' && !registration.pointsAwarded) {
    const event = await Event.findById(registration.event);
    if (event) {
      await User.findByIdAndUpdate(registration.student, { $inc: { totalPoints: event.points } });
      await Registration.findByIdAndUpdate(registrationId, { pointsAwarded: true });
    }
  }
  res.json({ success: true, message: 'Attendance updated.', registration });
};

exports.cancelRegistration = async (req, res) => {
  const registration = await Registration.findOne({ student: req.user.id, event: req.params.eventId });
  if (!registration) return res.status(404).json({ success: false, message: 'Registration not found.' });
  await registration.deleteOne();
  await Event.findByIdAndUpdate(req.params.eventId, { $inc: { currentParticipants: -1 } });
  // Promote first person from waitlist
  const { promoteFromWaitlist } = require('./waitlistController');
  await promoteFromWaitlist(req.params.eventId);
  res.json({ success: true, message: 'Registration cancelled.' });
};

exports.downloadRegistrations = async (req, res) => {
  const registrations = await Registration.find({ event: req.params.eventId })
    .populate('student', 'name uid email course semester phone');
  const data = registrations.map((r, i) => ({
    'S.No': i + 1, 'Registration No': r.registrationNumber, 'Student Name': r.studentName,
    'UID': r.uid, 'Course': r.course || '', 'Semester': r.semester || '',
    'Phone': r.phone || '', 'Email': r.email, 'Status': r.status,
    'Registered On': new Date(r.createdAt).toLocaleDateString()
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [6,16,25,15,15,10,12,30,12,15].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename=registrations_${req.params.eventId}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};
