const mongoose = require('mongoose');

const dynamicRecordSchema = new mongoose.Schema({
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
  datasetId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for dynamic record isolation'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  rowIndex: {
    type: Number,
    default: 0,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

dynamicRecordSchema.index({ companyId: 1, folderId: 1, createdBy: 1 });
dynamicRecordSchema.index({ companyId: 1, datasetId: 1, createdBy: 1 });
dynamicRecordSchema.index({ companyId: 1, folderId: 1, datasetId: 1, rowIndex: 1 });
dynamicRecordSchema.index({ companyId: 1, folderId: 1, datasetId: 1, createdAt: -1 });

module.exports = mongoose.model('DynamicRecord', dynamicRecordSchema);
