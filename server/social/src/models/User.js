import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '../utils/crypto.js';

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String },
  firebaseUid:      { type: String, unique: true, sparse: true },
  aiProvider:       { type: String, default: 'qwen' },
  openrouterApiKey: { type: String, default: '' },

  // ── Admin / access control ─────────────────────────────────────────────────
  role:            { type: String, enum: ['user', 'admin'], default: 'user' },
  isSuspended:     { type: Boolean, default: false },
  suspendedUntil:  { type: Date, default: null },
  suspendReason:   { type: String, default: '' },

  // ── Session tracking ───────────────────────────────────────────────────────
  // Incrementing this value invalidates all previously issued JWT tokens
  sessionVersion:  { type: Number, default: 0 },
  lastLogin:       { type: Date, default: null },
  lastActivity:    { type: Date, default: null },
}, { timestamps: true });

// ── Hooks ───────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.openrouterApiKey) this.openrouterApiKey = encrypt(this.openrouterApiKey);
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.openrouterApiKey) update.openrouterApiKey = encrypt(update.openrouterApiKey);
    if (update.$set?.openrouterApiKey) update.$set.openrouterApiKey = encrypt(update.$set.openrouterApiKey);
  }
  next();
});

function decryptUser(doc) {
  if (doc?.openrouterApiKey) doc.openrouterApiKey = decrypt(doc.openrouterApiKey);
}
userSchema.post('init', decryptUser);
userSchema.post('save', decryptUser);
userSchema.post('findOneAndUpdate', decryptUser);

// ── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isCurrentlySuspended = function () {
  if (!this.isSuspended) return false;
  if (this.suspendedUntil && new Date() > this.suspendedUntil) return false; // expired
  return true;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.openrouterApiKey;
  delete obj.firebaseUid;
  delete obj.sessionVersion;
  return obj;
};

export default mongoose.model('User', userSchema);
