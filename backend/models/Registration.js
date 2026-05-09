const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  studentName: { type: String, required: true },
  uid: { type: String, required: true, uppercase: true },
  course: { type: String },
  semester: { type: Number },
  phone: { type: String },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'attended', 'cancelled'], default: 'pending' },
  pointsAwarded: { type: Boolean, default: false },
  registrationNumber: { type: String, unique: true },
}, { timestamps: true });

// Auto-generate registration number
registrationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Registration').countDocuments();
    this.registrationNumber = `APEX${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Prevent duplicate registrations
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
