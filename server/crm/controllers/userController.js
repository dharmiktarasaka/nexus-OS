const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Folder = require('../models/Folder');
const FolderPermission = require('../models/FolderPermission');
const { getDefaultPermissionsForRole } = require('../models/User');
const { logAudit } = require('../services/auditService');

// @desc    Get all users in tenant company with folder access summaries
// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const query = { companyId: req.user.companyId };
    const users = await User.find(query).sort({ createdAt: -1 });

    const userIds = users.map(u => u._id);

    // Aggregate folder permission counts per user
    const folderPerms = await FolderPermission.find({
      companyId: req.user.companyId,
      userId: { $in: userIds }
    });

    const permMap = new Map();
    folderPerms.forEach(fp => {
      const uId = fp.userId.toString();
      permMap.set(uId, (permMap.get(uId) || 0) + 1);
    });

    const result = users.map(u => {
      // Calculate accessible folders count (created folders + granted permissions)
      const grantedCount = permMap.get(u._id.toString()) || 0;
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        isActive: u.isActive,
        permissions: u.permissions,
        grantedFolderCount: grantedCount,
        createdAt: u.createdAt
      };
    });

    res.json({
      success: true,
      users: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user detail and explicit folder permissions
// @route   GET /api/users/:userId
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    const permissions = await FolderPermission.find({
      companyId: req.user.companyId,
      userId: user._id
    }).populate('folderId', 'name color description');

    res.json({
      success: true,
      user,
      folderPermissions: permissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite new user to company with role, folder access, and permissions
// @route   POST /api/users/invite
const inviteUser = async (req, res, next) => {
  try {
    const { name, email, role = 'EMPLOYEE', permissions, folderAccess = [] } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required for invitation' });
    }

    // Privilege escalation check: Non-admin cannot invite ADMIN or grant permissions higher than own
    // Privilege escalation & folder owner invitation check:
    if (req.user.role !== 'ADMIN') {
      if (role === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Company Owner / Admin can invite ADMIN role' });
      }

      // Check if employee is inviting a user specifically for access to folder(s) that they own
      let isFolderOwnerInvite = false;
      if (folderAccess && folderAccess.length > 0) {
        const folderCheckResults = await Promise.all(folderAccess.map(async (fa) => {
          const f = await Folder.findOne({ _id: fa.folderId, companyId: req.user.companyId });
          return f && (f.createdBy.toString() === req.user._id.toString() || (f.ownerId && f.ownerId.toString() === req.user._id.toString()));
        }));
        isFolderOwnerInvite = folderCheckResults.every(Boolean);
      }

      if (!isFolderOwnerInvite && !req.user.permissions?.users?.invite) {
        return res.status(403).json({ success: false, message: 'You do not have permission to invite global company users' });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists in CRM' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const defaultPerms = getDefaultPermissionsForRole(role);
    const finalPerms = permissions ? { ...defaultPerms, ...permissions } : defaultPerms;

    const invitation = await Invitation.create({
      companyId: req.user.companyId,
      invitedBy: req.user._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      permissions: finalPerms,
      folderAccess,
      token,
      status: 'PENDING',
      expiresAt
    });

    await logAudit(req, 'USER_INVITED', 'Invitation', invitation._id, `Invited ${email} as ${role}`);

    const invitationLink = `${req.protocol}://${req.get('host')}/accept-invitation/${token}`;

    res.status(201).json({
      success: true,
      message: `Invitation created for ${email}`,
      invitation,
      invitationLink
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & permissions by Admin/Boss
// @route   PUT /api/users/:userId or PATCH /api/users/:userId
const updateUser = async (req, res, next) => {
  try {
    const { name, role, permissions, isActive } = req.body;
    const targetUser = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    // Privilege check: Admin or users with 'users.manage' permission can edit user details
    if (req.user.role !== 'ADMIN' && !req.user.permissions?.users?.manage) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit user details' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      targetUser.name = name.trim();
    }

    if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES', 'VISITOR'].includes(role)) {
      if (req.user.role !== 'ADMIN' && (targetUser.role === 'ADMIN' || role === 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Only Company Owner / Admin can modify Admin user roles' });
      }
      targetUser.role = role;
    }

    if (permissions) {
      targetUser.permissions = permissions;
      targetUser.markModified('permissions');
    }

    if (typeof isActive === 'boolean') {
      if (targetUser._id.toString() !== req.user._id.toString()) {
        targetUser.isActive = isActive;
      }
    }

    await targetUser.save();

    await logAudit(req, 'USER_UPDATED', 'User', targetUser._id, `Updated user details for ${targetUser.email} (Name: ${targetUser.name})`);

    res.json({
      success: true,
      message: 'User details updated successfully',
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role, name, and granular permissions matrix
// @route   PUT /api/users/:userId/permissions
const updateUserPermissions = async (req, res, next) => {
  try {
    const { name, role, permissions } = req.body;
    const targetUser = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    // Prevent non-admin from modifying ADMIN user or elevating privileges
    if (req.user.role !== 'ADMIN') {
      if (targetUser.role === 'ADMIN' || role === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Admin can modify Admin user roles' });
      }
      if (!req.user.permissions?.permissions?.grant && !req.user.permissions?.users?.manage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to grant user permissions' });
      }
    }

    if (name && typeof name === 'string' && name.trim()) {
      targetUser.name = name.trim();
    }

    if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES', 'VISITOR'].includes(role)) {
      targetUser.role = role;
    }

    if (permissions) {
      targetUser.permissions = permissions;
      targetUser.markModified('permissions');
    }

    await targetUser.save();

    await logAudit(req, 'USER_PERMISSIONS_UPDATED', 'User', targetUser._id, `Updated user ${targetUser.name} (${targetUser.email}) - role: ${targetUser.role}`);

    res.json({
      success: true,
      message: 'User details and permissions updated successfully',
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grant or update explicit folder access level for a user
// @route   POST /api/users/:userId/folder-access
const grantFolderAccess = async (req, res, next) => {
  try {
    const { folderId, accessLevel = 'VIEW' } = req.body;
    const targetUser = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found or access denied' });
    }

    const folder = await Folder.findOne({ _id: folderId, companyId: req.user.companyId });
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    // Check delegation authority
    if (req.user.role !== 'ADMIN' && folder.ownerId.toString() !== req.user._id.toString()) {
      const myPerm = await FolderPermission.findOne({ folderId: folder._id, userId: req.user._id });
      if (!myPerm || myPerm.accessLevel !== 'FULL_ACCESS') {
        return res.status(403).json({ success: false, message: 'You do not have delegation rights to share this folder' });
      }
    }

    const folderPerm = await FolderPermission.findOneAndUpdate(
      { companyId: req.user.companyId, folderId: folder._id, userId: targetUser._id },
      { grantedBy: req.user._id, accessLevel },
      { upsert: true, new: true }
    );

    await logAudit(req, 'FOLDER_ACCESS_GRANTED', 'FolderPermission', folderPerm._id, `Granted ${accessLevel} on folder '${folder.name}' to ${targetUser.email}`);

    res.json({
      success: true,
      message: `Granted ${accessLevel} access to ${targetUser.name} on folder "${folder.name}"`,
      folderPermission: folderPerm
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke user's folder access
// @route   DELETE /api/users/:userId/folder-access/:folderId
const revokeFolderAccess = async (req, res, next) => {
  try {
    const { userId, folderId } = req.params;

    await FolderPermission.deleteOne({
      companyId: req.user.companyId,
      folderId,
      userId
    });

    await logAudit(req, 'FOLDER_ACCESS_REVOKED', 'FolderPermission', folderId, `Revoked folder access for user ID ${userId}`);

    res.json({
      success: true,
      message: 'Folder access revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Enable / Disable User)
// @route   PATCH /api/users/:userId/status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own active account' });
    }

    targetUser.isActive = Boolean(isActive);
    await targetUser.save();

    await logAudit(req, targetUser.isActive ? 'USER_ENABLED' : 'USER_DISABLED', 'User', targetUser._id, `${targetUser.isActive ? 'Enabled' : 'Disabled'} user ${targetUser.email}`);

    res.json({
      success: true,
      message: `User status changed to ${targetUser.isActive ? 'Active' : 'Disabled'}`,
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:userId
const deleteUser = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ _id: req.params.userId, companyId: req.user.companyId });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await FolderPermission.deleteMany({ userId: targetUser._id });
    await User.deleteOne({ _id: targetUser._id });

    await logAudit(req, 'USER_DELETED', 'User', targetUser._id, `Deleted user account ${targetUser.email}`);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const { verifyMailConnection, normalizeSmtpHost } = require('../services/emailSchedulerService');

// @desc    Get logged in user's saved SMTP configuration
// @route   GET /api/users/smtp-config
const getSmtpConfig = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      smtpConfig: user.smtpConfig || {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update logged in user's SMTP configuration
// @route   PUT /api/users/smtp-config
const updateSmtpConfig = async (req, res, next) => {
  try {
    const {
      authType,
      host,
      port,
      secure,
      user: smtpUser,
      pass,
      clientId,
      clientSecret,
      tenantId,
      refreshToken,
      fromName,
      signature,
      includeSignature,
      jobTitle,
      phone,
      companyName,
      website
    } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.smtpConfig = {
      authType: authType || 'password',
      host: host ? String(host).trim() : 'smtp.office365.com',
      port: port ? parseInt(port, 10) : 587,
      secure: Boolean(secure),
      user: smtpUser ? String(smtpUser).trim() : '',
      pass: pass ? String(pass).trim() : '',
      clientId: clientId ? String(clientId).trim() : '',
      clientSecret: clientSecret ? String(clientSecret).trim() : '',
      tenantId: tenantId ? String(tenantId).trim() : '',
      refreshToken: refreshToken ? String(refreshToken).trim() : '',
      fromName: fromName ? String(fromName).trim() : '',
      signature: signature !== undefined ? signature : (user.smtpConfig?.signature || ''),
      includeSignature: includeSignature !== undefined ? Boolean(includeSignature) : (user.smtpConfig?.includeSignature !== undefined ? user.smtpConfig.includeSignature : true),
      jobTitle: jobTitle !== undefined ? String(jobTitle).trim() : (user.smtpConfig?.jobTitle || ''),
      phone: phone !== undefined ? String(phone).trim() : (user.smtpConfig?.phone || ''),
      companyName: companyName !== undefined ? String(companyName).trim() : (user.smtpConfig?.companyName || ''),
      website: website !== undefined ? String(website).trim() : (user.smtpConfig?.website || ''),
      needsReauth: false,
      authError: ''
    };

    await user.save();

    res.json({
      success: true,
      message: 'Email & Outlook connection saved to profile',
      smtpConfig: user.smtpConfig
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear/Disconnect user's saved SMTP configuration
// @route   DELETE /api/users/smtp-config
const deleteSmtpConfig = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.smtpConfig = {
      authType: 'password',
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      clientId: '',
      clientSecret: '',
      tenantId: '',
      refreshToken: '',
      fromName: ''
    };

    await user.save();

    res.json({
      success: true,
      message: 'Email account disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test Email connection directly from user settings or modal
// @route   POST /api/users/test-email-connection
const testUserEmailConnection = async (req, res, next) => {
  try {
    const smtp = req.body;
    if (!smtp || (!smtp.user && smtp.authType !== 'oauth2')) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    if (smtp.authType === 'oauth2') {
      const { refreshAccessToken, getMicrosoftGraphUser } = require('../services/outlookService');
      const user = await User.findById(req.user._id);

      const clientId = (smtp.clientId || user?.smtpConfig?.clientId || '').trim();
      const clientSecret = (smtp.clientSecret || smtp.pass || user?.smtpConfig?.clientSecret || user?.smtpConfig?.pass || '').trim();
      const tenantId = (smtp.tenantId || user?.smtpConfig?.tenantId || '').trim();
      const refreshToken = (smtp.refreshToken || user?.smtpConfig?.refreshToken || '').trim();

      if (!clientId) {
        return res.status(400).json({ success: false, message: 'Application (Client) ID is required' });
      }
      if (!clientSecret) {
        return res.status(400).json({ success: false, message: 'Client Secret is required' });
      }
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Microsoft Refresh Token is missing. Please click "Connect Outlook" to authorize.' });
      }

      const tokenData = await refreshAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        tenantId
      });

      const graphUser = await getMicrosoftGraphUser(tokenData.access_token);
      const connectedEmail = graphUser.mail || graphUser.userPrincipalName || graphUser.displayName;

      return res.json({
        success: true,
        message: `Verified Microsoft Outlook OAuth connection via Graph API /me as ${connectedEmail}!`,
        targetHost: 'graph.microsoft.com',
        graphUser
      });
    }

    const { targetHost } = await verifyMailConnection(smtp);

    return res.json({
      success: true,
      message: `Mail connection verified successfully with ${targetHost}!`,
      targetHost
    });
  } catch (error) {
    const targetHost = req.body.host || 'smtp.office365.com';
    return res.status(400).json({
      success: false,
      message: typeof formatSmtpError !== 'undefined' ? formatSmtpError(error, targetHost) : (error.message || `Failed to connect to ${targetHost || 'Mail Server'}`)
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  inviteUser,
  updateUser,
  updateUserPermissions,
  grantFolderAccess,
  revokeFolderAccess,
  toggleUserStatus,
  deleteUser,
  getSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testUserEmailConnection
};

