const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for follow-up isolation'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  reminder: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

followUpSchema.index({ userId: 1, date: 1, status: 1 });
followUpSchema.index({ leadId: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
