const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantCompany',
    required: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VISITOR'],
    default: 'EMPLOYEE'
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  folderAccess: [{
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    accessLevel: { type: String, enum: ['VIEW', 'VIEW_EXPORT', 'EDIT', 'FULL_ACCESS'], default: 'VIEW' }
  }],
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED'],
    default: 'PENDING'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invitation', invitationSchema);
