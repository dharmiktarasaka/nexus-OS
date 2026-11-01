const mongoose = require('mongoose');

const grabbedLeadSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for grabbed lead isolation'],
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  decisionMaker: {
    type: String,
    trim: true,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  niche: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  alternatePhone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
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
  location: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  country: {
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
  sourcePlatform: {
    type: String,
    trim: true,
    default: 'Google Maps'
  },
  isImportedToCRM: {
    type: Boolean,
    default: false
  },
  crmLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  status: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'NOT_INTERESTED', 'DISQUALIFIED'],
    default: 'NEW'
  },
  notes: {
    type: String,
    default: ''
  },
  confidenceScore: {
    type: Number,
    default: 90
  },
  socialProfiles: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  rawDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

grabbedLeadSchema.index({ campaignId: 1, createdAt: -1 });
grabbedLeadSchema.index({ email: 1 });
grabbedLeadSchema.index({ phone: 1 });
grabbedLeadSchema.index({ isImportedToCRM: 1 });

module.exports = mongoose.model('GrabbedLead', grabbedLeadSchema);
