const mongoose = require('mongoose');
const waitlistSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event:   { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  studentName: { type: String, required: true },
  uid:   { type: String, required: true },
  email: { type: String, required: true },
  position: { type: Number, required: true },
  notified: { type: Boolean, default: false },
}, { timestamps: true });
waitlistSchema.index({ student: 1, event: 1 }, { unique: true });
module.exports = mongoose.model('Waitlist', waitlistSchema);
