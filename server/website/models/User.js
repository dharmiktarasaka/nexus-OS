// server/models/User.js - MongoDB User Model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      default: ''
    },
    displayName: {
      type: String,
      default: ''
    },
    photoURL: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['creator', 'admin', 'qa'],
      default: 'creator'
    },
    authProvider: {
      type: String,
      enum: ['local', 'firebase', 'google', 'guest'],
      default: 'local'
    },
    firebaseUid: {
      type: String,
      default: '',
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe profile view (excluding password)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName || this.email.split('@')[0],
    photoURL: this.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: this.role,
    authProvider: this.authProvider,
    firebaseUid: this.firebaseUid,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt
  };
};

module.exports = mongoose.model('User', userSchema);
