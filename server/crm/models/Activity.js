const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: [
      'CALL',
      'WHATSAPP',
      'EMAIL',
      'MEETING',
      'NOTE',
      'STATUS_CHANGE',
      'FOLLOW_UP',
      'PROPOSAL',
      'OTHER'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

activitySchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
