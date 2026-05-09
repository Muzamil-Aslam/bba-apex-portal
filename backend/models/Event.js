const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Event title is required'], trim: true, maxlength: 200 },
  description: { type: String, required: [true, 'Description is required'], maxlength: 2000 },
  category: {
    type: String,
    required: true,
    enum: ['Academic', 'Industry Session', 'Competition', 'Cultural', 'Workshop', 'Seminar', 'Other']
  },
  date: { type: Date, required: [true, 'Event date is required'] },
  endDate: { type: Date },
  registrationDeadline: { type: Date, required: [true, 'Registration deadline is required'] },
  venue: { type: String, required: [true, 'Venue is required'], trim: true },
  poster: { type: String, default: '' },
  maxParticipants: { type: Number, default: 100 },
  currentParticipants: { type: Number, default: 0 },
  points: { type: Number, default: 5 },
  winnerBonus: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  isPublished: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  organizer: { type: String, trim: true },
  speakerName: { type: String, trim: true },
  speakerDesignation: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  winners: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, position: Number, bonusAwarded: { type: Boolean, default: false } }]
}, { timestamps: true });

// Auto-assign points based on category
eventSchema.pre('save', function (next) {
  if (this.isNew) {
    const pointsMap = { 'Workshop': 5, 'Seminar': 5, 'Academic': 5, 'Industry Session': 5, 'Competition': 10, 'Cultural': 5, 'Other': 5 };
    this.points = pointsMap[this.category] || 5;
    if (this.category === 'Competition') this.winnerBonus = 20;
  }
  next();
});

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ category: 1, status: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
