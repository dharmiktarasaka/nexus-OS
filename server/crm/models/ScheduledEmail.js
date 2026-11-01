const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for scheduled email isolation'],
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  folderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  datasetId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  type: {
    type: String,
    enum: ['INITIAL', 'FOLLOW_UP'],
    default: 'FOLLOW_UP'
  },
  sequenceNumber: {
    type: Number,
    default: 1
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  emailField: {
    type: String,
    required: true
  },
  smtpConfig: {
    authType: { type: String, default: 'password' },
    host: { type: String, default: 'smtp.office365.com' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, required: true },
    pass: { type: String, default: '' },
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    tenantId: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    fromName: { type: String, default: '' },
    signature: { type: String, default: '' },
    includeSignature: { type: Boolean, default: true }
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DENIED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

scheduledEmailSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);
