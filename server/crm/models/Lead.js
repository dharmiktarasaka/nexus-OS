const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  service: {
    type: String,
    trim: true,
    default: 'General'
  },
  decisionMaker: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  websiteUrl: {
    type: String,
    trim: true,
    default: ''
  },
  linkedinUrl: {
    type: String,
    trim: true,
    default: ''
  },
  googleReview: {
    type: String,
    trim: true,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  ingestionSource: {
    type: String,
    enum: ['EXCEL', 'RANDOM_TEXT', 'MANUAL'],
    default: 'EXCEL'
  },
  importRowNumber: {
    type: Number,
    default: null
  },
  excelFileName: {
    type: String,
    trim: true,
    default: ''
  },
  sheetName: {
    type: String,
    trim: true,
    default: ''
  },
  uploadBatchId: {
    type: String,
    trim: true,
    default: ''
  },
  emailStatus: {
    type: String,
    trim: true,
    default: ''
  },
  nextAction: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    trim: true,
    default: 'Other'
  },
  status: {
    type: String,
    enum: [
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'QUALIFIED',
      'MEETING',
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'WON',
      'LOST'
    ],
    default: 'NEW'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  value: {
    type: Number,
    default: 0
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for data isolation'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  nextFollowUp: {
    type: Date,
    default: null
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  lostReason: {
    type: String,
    default: ''
  },
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for fast searching and filtering performance
leadSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ companyName: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ service: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ createdAt: 1 });
leadSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Lead', leadSchema);
