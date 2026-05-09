const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  uid: { type: String, required: [true, 'UID is required'], unique: true, uppercase: true, trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['student', 'admin', 'faculty'], default: 'student' },
  course: { type: String, trim: true },
  semester: { type: Number, min: 1, max: 8 },
  phone: { type: String, match: [/^[0-9]{10}$/, 'Invalid phone number'] },
  avatar: { type: String, default: '' },
  totalPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  // OTP-based password reset
  otpCode:   String,
  otpExpire: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT
userSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

module.exports = mongoose.model('User', userSchema);
