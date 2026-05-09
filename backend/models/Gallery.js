const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  eventName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  description: { type: String, trim: true },
  isFeatured: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
