const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for email isolation'],
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
  folder: {
    type: String,
    enum: ['INBOX', 'SENT', 'SCHEDULED', 'TRASH'],
    default: 'SENT',
    index: true
  },
  from: {
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true }
  },
  to: [{
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true }
  }],
  cc: [{
    name: { type: String, default: '' },
    email: { type: String, lowercase: true, trim: true }
  }],
  bcc: [{
    name: { type: String, default: '' },
    email: { type: String, lowercase: true, trim: true }
  }],
  subject: {
    type: String,
    required: true,
    trim: true,
    default: '(No Subject)'
  },
  body: {
    type: String,
    required: true,
    default: ''
  },
  plainText: {
    type: String,
    default: ''
  },
  direction: {
    type: String,
    enum: ['INCOMING', 'OUTGOING'],
    default: 'OUTGOING'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'SENT', 'DELIVERED', 'RECEIVED', 'REPLIED', 'FAILED', 'SCHEDULED'],
    default: 'SENT',
    index: true
  },
  isRead: {
    type: Boolean,
    default: true,
    index: true
  },
  isStarred: {
    type: Boolean,
    default: false,
    index: true
  },
  threadId: {
    type: String,
    index: true,
    default: null
  },
  inReplyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    default: null
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  crmFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  scheduledEmailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledEmail',
    default: null
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    url: String
  }],
  smtpProvider: {
    type: String,
    default: 'SMTP'
  },
  sentAt: {
    type: Date,
    default: null
  },
  receivedAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  originalFolderBeforeTrash: {
    type: String,
    default: 'INBOX'
  }
}, {
  timestamps: true
});

emailSchema.index({ companyId: 1, userId: 1, folder: 1, createdAt: -1 });
emailSchema.index({ companyId: 1, userId: 1, isRead: 1 });

module.exports = mongoose.model('Email', emailSchema);
