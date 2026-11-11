const mongoose = require('mongoose');
const User = require('../models/User');
const TenantCompany = require('../models/TenantCompany');
const Invitation = require('../models/Invitation');
const FolderPermission = require('../models/FolderPermission');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_crm_jwt_key_2026_production_grade', {
    expiresIn: '30d'
  });
};

// @desc    Register a new company owner / admin account
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Create or find Tenant Company
    const compName = companyName ? companyName.trim() : `${name.trim()}'s Company`;
    const company = await TenantCompany.create({ name: compName });

    const user = await User.create({
      companyId: company._id,
      name: name.trim(),
      email: cleanEmail,
      password: String(password).trim(),
      role: 'ADMIN'
    });

    company.ownerId = user._id;
    await company.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Company Owner account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: company.name,
        avatar: user.avatar,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('companyId', 'name');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId?._id || user.companyId,
        companyName: user.companyId?.name || 'My Company',
        avatar: user.avatar,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    let user = null;
    if (mongoose.Types.ObjectId.isValid(req.user.id)) {
      user = await User.findById(req.user.id).populate('companyId', 'name');
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email }).populate('companyId', 'name');
    }
    if (!user) {
      return res.json({
        success: true,
        user: {
          id: req.user.id || req.user._id,
          name: req.user.name || 'User',
          email: req.user.email || '',
          role: req.user.role || 'ADMIN',
          companyId: req.user.companyId || null,
          companyName: 'Personal Workspace',
          avatar: req.user.avatar || null,
          permissions: req.user.permissions || []
        }
      });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId?._id || user.companyId,
        companyName: user.companyId?.name || 'My Company',
        avatar: user.avatar,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate invitation token
// @route   GET /api/auth/invitation/:token
const getInvitationInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'PENDING' }).populate('companyId', 'name');

    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invitation link is invalid or expired' });
    }

    res.json({
      success: true,
      invitation: {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyId?.name || 'Company'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation & set user password
// @route   POST /api/auth/accept-invitation
const acceptInvitation = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Invitation token and password are required' });
    }

    const invitation = await Invitation.findOne({ token, status: 'PENDING' });
    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invitation link is invalid or expired' });
    }

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Create new User from Invitation settings
    const user = await User.create({
      companyId: invitation.companyId,
      name: invitation.name,
      email: invitation.email,
      password,
      role: invitation.role,
      permissions: invitation.permissions || undefined
    });

    // Grant folder permissions from invitation
    if (invitation.folderAccess && invitation.folderAccess.length > 0) {
      const folderPermDocs = invitation.folderAccess.map(item => ({
        companyId: invitation.companyId,
        folderId: item.folderId,
        userId: user._id,
        grantedBy: invitation.invitedBy,
        accessLevel: item.accessLevel || 'VIEW'
      }));
      await FolderPermission.insertMany(folderPermDocs);
    }

    invitation.status = 'ACCEPTED';
    await invitation.save();

    const authToken = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully from invitation',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change logged-in user password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const trimmedOld = oldPassword ? String(oldPassword).trim() : '';
    const trimmedNew = newPassword ? String(newPassword).trim() : '';

    if (!trimmedOld || !trimmedNew) {
      return res.status(400).json({ success: false, message: 'Please provide current password and new password' });
    }

    if (trimmedNew.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(trimmedOld);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = trimmedNew;
    await user.save();

    await logAudit(req, 'USER_PASSWORD_CHANGE', 'User', user._id, 'User changed their password');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  register,
  login,
  getMe,
  getInvitationInfo,
  acceptInvitation,
  changePassword
};

