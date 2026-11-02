import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName:   { type: String, required: true },
  adminEmail:  { type: String, required: true },
  action:      {
    type: String,
    enum: [
      'USER_SUSPENDED',
      'USER_UNSUSPENDED',
      'USER_DELETED',
      'USER_FORCE_LOGOUT',
      'USER_ROLE_CHANGED',
    ],
    required: true,
  },
  targetUser:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetName:  { type: String },
  targetEmail: { type: String },
  details:     { type: String, default: '' }, // e.g. "suspended for 24h"
}, { timestamps: true });

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ admin: 1 });

export default mongoose.model('AdminLog', adminLogSchema);
