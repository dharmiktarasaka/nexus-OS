const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#1A3548'
  },
  category: {
    type: String,
    enum: ['INDIA', 'INTERNATIONAL'],
    default: 'INDIA',
    uppercase: true,
    index: true
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for folder isolation'],
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

folderSchema.index({ companyId: 1, createdBy: 1, updatedAt: -1 });

module.exports = mongoose.model('Folder', folderSchema);
