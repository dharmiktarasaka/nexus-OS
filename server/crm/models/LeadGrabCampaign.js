const mongoose = require('mongoose');

const leadGrabCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  niche: {
    type: String,
    required: [true, 'Target niche/industry is required'],
    trim: true
  },
  targetCity: {
    type: String,
    required: [true, 'Target city is required'],
    trim: true
  },
  targetCountry: {
    type: String,
    trim: true,
    default: 'Global'
  },
  platforms: {
    type: [String],
    default: ['Google Maps', 'LinkedIn', 'Web Directory']
  },
  targetCount: {
    type: Number,
    required: true,
    default: 25,
    min: 5,
    max: 500
  },
  extractedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED'],
    default: 'DRAFT'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentStep: {
    type: String,
    default: 'Ready to launch'
  },
  config: {
    requireEmail: { type: Boolean, default: false },
    requirePhone: { type: Boolean, default: false },
    requireWebsite: { type: Boolean, default: false },
    minRating: { type: Number, default: 0 },
    keywords: { type: [String], default: [] }
  },
  stats: {
    withPhone: { type: Number, default: 0 },
    withEmail: { type: Number, default: 0 },
    withWebsite: { type: Number, default: 0 },
    withLinkedIn: { type: Number, default: 0 },
    importedToCRM: { type: Number, default: 0 }
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for lead grab isolation'],
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

leadGrabCampaignSchema.index({ companyId: 1, createdBy: 1, createdAt: -1 });
leadGrabCampaignSchema.index({ status: 1 });

module.exports = mongoose.model('LeadGrabCampaign', leadGrabCampaignSchema);
