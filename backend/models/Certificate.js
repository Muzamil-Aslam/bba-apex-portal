const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  uid: { type: String, required: true, uppercase: true },
  studentName: { type: String, required: true },
  certificateType: { type: String, enum: ['participation', 'winner', 'runner-up', 'merit'], default: 'participation' },
  fileUrl: { type: String, required: true },
  certificateNumber: { type: String, unique: true },
  issuedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

certificateSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Certificate').countDocuments();
    this.certificateNumber = `CERT${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
