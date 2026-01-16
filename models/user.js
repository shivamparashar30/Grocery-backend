const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined for username
  },
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please use a valid email address',
    ],
    required: [true, 'Please enter your email address'],
    unique: true,
  },
  phone: {
    type: String,
    required: [true, 'Please enter your phone number'],
  },
  phoneno: {
    type: String,
  },
  Description: {
    type: String,
  },
  address: {
    type: String,
  },
  Address: {
    type: String,
  },
  avatar: {
    type: String,
    default: 'no-photo.png',
  },
  ImageUrl: {
    type: String,
    default: 'no-photo.png',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  ngoRegistrationNo: {
    type: String,
    default: '0',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDenied: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  donationCount: {
    type: Number,
    default: 0,
  },
  driverName: {
    type: String,
  },
  driverPhone: {
    type: String,
  },
});

// Encrypt password using bcrypt (only if password is modified)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // For hashing the password in database
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and Token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Matches user entered password to hashed password in db
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash Token and set to resetPasswordToken Field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);