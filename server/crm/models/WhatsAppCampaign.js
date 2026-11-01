const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  renderedMessage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  error: {
    type: String,
    default: ''
  },
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sentAt: {
    type: Date,
    default: null
  }
});

const whatsAppCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: 'Bulk WhatsApp Message'
  },
  messageTemplate: {
    type: String,
    default: ''
  },
  templates: {
    type: [String],
    default: []
  },
  randomizeTemplates: {
    type: Boolean,
    default: true
  },
  minDelaySeconds: {
    type: Number,
    default: 15.0
  },
  maxDelaySeconds: {
    type: Number,
    default: 45.0
  },
  speedPreset: {
    type: String,
    enum: ['ultra_safe', 'safe_human', 'balanced', 'custom'],
    default: 'safe_human'
  },
  strictHourlyLimit: {
    type: Boolean,
    default: true
  },
  hourlyLimit: {
    type: Number,
    default: 15
  },
  nonRepeatingDelays: {
    type: Boolean,
    default: true
  },
  typingSimulation: {
    type: Boolean,
    default: true
  },
  batchSize: {
    type: Number,
    default: 10
  },
  batchCooldownSeconds: {
    type: Number,
    default: 60
  },
  spintaxEnabled: {
    type: Boolean,
    default: true
  },
  paceAcrossHour: {
    type: Boolean,
    default: true
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  mediaBase64: {
    type: String,
    default: ''
  },
  mediaMimeType: {
    type: String,
    default: ''
  },
  mediaFileName: {
    type: String,
    default: ''
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'DRAFT'
  },
  currentRecipient: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    index: { type: Number, default: 0 }
  },
  nextRecipient: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    index: { type: Number, default: 0 }
  },
  nextSendAt: {
    type: Date,
    default: null
  },
  dispatchState: {
    type: String,
    enum: ['IDLE', 'SENDING', 'DELAY_WAIT', 'BATCH_COOLDOWN', 'HOURLY_THROTTLED', 'COMPLETED', 'CANCELLED'],
    default: 'IDLE'
  },
  lastSentPhone: {
    type: String,
    default: ''
  },
  lastSentName: {
    type: String,
    default: ''
  },
  lastSentAt: {
    type: Date,
    default: null
  },
  recipients: [recipientSchema],
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for WhatsApp campaign isolation'],
    index: true
  },
  sentBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

whatsAppCampaignSchema.index({ sentBy: 1, createdAt: -1 });
whatsAppCampaignSchema.index({ status: 1 });

module.exports = mongoose.model('WhatsAppCampaign', whatsAppCampaignSchema);
