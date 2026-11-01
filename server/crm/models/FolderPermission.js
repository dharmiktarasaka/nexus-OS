const mongoose = require('mongoose');

const folderPermissionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantCompany',
    required: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['VIEW', 'VIEW_EXPORT', 'EDIT', 'FULL_ACCESS'],
    default: 'VIEW'
  }
}, {
  timestamps: true
});

folderPermissionSchema.index({ folderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('FolderPermission', folderPermissionSchema);
