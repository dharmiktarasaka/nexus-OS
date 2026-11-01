const FolderPermission = require('../models/FolderPermission');

const ACCESS_LEVEL_WEIGHTS = {
  'VIEW': 1,
  'VIEW_EXPORT': 2,
  'EDIT': 3,
  'FULL_ACCESS': 4
};

// Check if user has required permission path (e.g., 'folders', 'create')
const requirePermission = (category, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is inactive' });
    }

    // ADMIN/OWNER has full permission
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // VISITOR cannot perform write/delete/invite actions
    if (req.user.role === 'VISITOR' && ['create', 'edit', 'delete', 'upload', 'invite', 'manage', 'grant', 'revoke'].includes(action)) {
      return res.status(403).json({ success: false, message: 'Visitor role is not authorized to modify resources' });
    }

    const categoryPerms = req.user.permissions ? req.user.permissions[category] : null;
    if (categoryPerms && categoryPerms[action] === true) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires '${category}.${action}' permission.`
    });
  };
};

// Block VISITOR role explicitly on CUD routes
const blockVisitor = (req, res, next) => {
  if (req.user && req.user.role === 'VISITOR') {
    return res.status(403).json({
      success: false,
      message: 'Visitors have read-only and export access only'
    });
  }
  next();
};

// Evaluate Folder Access Level for a given User & Folder with strict owner isolation
const evaluateFolderAccess = async (user, folder, requiredLevel = 'VIEW') => {
  if (!user || !folder) return { allowed: false, accessLevel: 'NO_ACCESS' };

  const userUid = String(user.ownerId || user.uid || user._id || '').trim();
  const folderOwner = String(folder.ownerId || folder.createdBy || '').trim();
  const isOwner = Boolean(userUid && folderOwner && userUid === folderOwner);

  // 1. Folder Owner has full access to their own folders
  if (isOwner) {
    return { allowed: true, accessLevel: 'FULL_ACCESS' };
  }

  // 2. Strict Company Isolation Check (if company tenant context exists)
  if (folder.companyId && user.companyId && folder.companyId.toString() !== user.companyId.toString()) {
    return { allowed: false, accessLevel: 'NO_ACCESS' };
  }

  // 3. Check explicit FolderPermission record for granted access
  const permDoc = await FolderPermission.findOne({
    folderId: folder._id,
    $or: [{ userId: userUid }, { userEmail: user.email }]
  });

  if (permDoc) {
    const userWeight = ACCESS_LEVEL_WEIGHTS[permDoc.accessLevel] || 0;
    const requiredWeight = ACCESS_LEVEL_WEIGHTS[requiredLevel] || 1;
    return {
      allowed: userWeight >= requiredWeight,
      accessLevel: permDoc.accessLevel
    };
  }

  return { allowed: false, accessLevel: 'NO_ACCESS' };
};

module.exports = {
  requirePermission,
  blockVisitor,
  evaluateFolderAccess,
  ACCESS_LEVEL_WEIGHTS
};
