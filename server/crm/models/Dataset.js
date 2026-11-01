const mongoose = require('mongoose');

const headerSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['TEXT', 'PHONE', 'EMAIL', 'NUMBER', 'DATE', 'URL', 'SELECT'],
    default: 'TEXT'
  }
}, { _id: false });

const datasetSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for dataset isolation'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    default: ''
  },
  headers: [headerSchema],
  recordCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

datasetSchema.index({ companyId: 1, folderId: 1, createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
