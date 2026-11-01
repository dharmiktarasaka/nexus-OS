const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, readBy: 1 });

module.exports = mongoose.model('Message', messageSchema);
