const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

auditLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
