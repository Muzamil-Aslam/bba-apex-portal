const Certificate  = require('../models/Certificate');
const User         = require('../models/User');
const Registration = require('../models/Registration');

exports.uploadCertificate = async (req, res) => {
  if (!req.files || !req.files.certificate) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const { uid, studentName, eventId, certificateType } = req.body;
  // Validate UID exists
  const student = await User.findOne({ uid: uid.toUpperCase() });
  if (!student) return res.status(404).json({ success: false, message: `No student found with UID: ${uid}. Please verify the UID first.` });
  const result = await cloudinary.uploader.upload(req.files.certificate.tempFilePath, { folder: 'bba_apex/certificates', resource_type: 'auto' });
  const certificate = await Certificate.create({
    student: student._id, event: eventId, uid: uid.toUpperCase(),
    studentName: studentName || student.name, certificateType: certificateType || 'participation',
    fileUrl: result.secure_url, uploadedBy: req.user.id
  });
  res.status(201).json({ success: true, message: `Certificate uploaded for ${student.name}.`, certificate });
};

// Validate UID before upload (quick check)
exports.validateUID = async (req, res) => {
  const { uid } = req.params;
  const student = await User.findOne({ uid: uid.toUpperCase() }).select('name uid email course semester');
  if (!student) return res.status(404).json({ success: false, message: `No student found with UID: ${uid.toUpperCase()}` });
  res.json({ success: true, message: 'UID is valid.', student });
};

// Bulk upload: admin submits CSV with uid,studentName,eventId,certificateType + individual files via fileUrls array
exports.bulkUploadFromCSV = async (req, res) => {
  if (!req.body.entries) return res.status(400).json({ success: false, message: 'No entries provided.' });
  let entries;
  try { entries = JSON.parse(req.body.entries); } catch { return res.status(400).json({ success: false, message: 'Invalid JSON entries.' }); }
  const results = { created: [], failed: [] };
  for (const entry of entries) {
    try {
      const student = await User.findOne({ uid: entry.uid?.toUpperCase() });
      if (!student) { results.failed.push({ uid: entry.uid, reason: 'UID not found' }); continue; }
      const existing = await Certificate.findOne({ student: student._id, event: entry.eventId, certificateType: entry.certificateType || 'participation' });
      if (existing) { results.failed.push({ uid: entry.uid, reason: 'Certificate already exists' }); continue; }
      const cert = await Certificate.create({
        student: student._id, event: entry.eventId, uid: student.uid,
        studentName: student.name, certificateType: entry.certificateType || 'participation',
        fileUrl: entry.fileUrl || '', uploadedBy: req.user.id
      });
      results.created.push({ uid: student.uid, name: student.name, certNumber: cert.certificateNumber });
    } catch (err) { results.failed.push({ uid: entry.uid, reason: err.message }); }
  }
  res.json({ success: true, message: `${results.created.length} created, ${results.failed.length} failed.`, results });
};

exports.getMyCertificates = async (req, res) => {
  const certificates = await Certificate.find({ student: req.user.id })
    .populate('event', 'title date category').sort({ createdAt: -1 });
  res.json({ success: true, count: certificates.length, certificates });
};

exports.getCertificatesByUID = async (req, res) => {
  const { uid } = req.params;
  const certificates = await Certificate.find({ uid: uid.toUpperCase() })
    .populate('event', 'title date category venue');
  res.json({ success: true, count: certificates.length, certificates });
};

exports.getAllCertificates = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    Certificate.find().populate('event', 'title').populate('student', 'name uid').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Certificate.countDocuments()
  ]);
  res.json({ success: true, total, certificates });
};

exports.deleteCertificate = async (req, res) => {
  const cert = await Certificate.findByIdAndDelete(req.params.id);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  res.json({ success: true, message: 'Certificate deleted.' });
};
