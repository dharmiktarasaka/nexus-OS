const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  type: {
    type: String,
    enum: ['DIRECT', 'GROUP'],
    default: 'DIRECT'
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  participants: [{
    type: mongoose.Schema.Types.Mixed
  }],
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

conversationSchema.index({ companyId: 1, participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
