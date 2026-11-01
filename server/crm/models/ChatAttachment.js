const mongoose = require('mongoose');

const chatAttachmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantCompany',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String, // 'image', 'video', 'audio', 'document'
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatAttachment', chatAttachmentSchema);
