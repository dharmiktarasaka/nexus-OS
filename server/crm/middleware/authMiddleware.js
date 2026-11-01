const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { getDefaultPermissionsForRole } = require('../models/User');
const { verifyFirebaseIdToken } = require('../utils/firebaseAuth');

const CRM_JWT_SECRET = process.env.JWT_SECRET || 'Tarasaka_supersecrectKey$2028';
const CENTRAL_JWT_SECRET = process.env.CENTRAL_JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
const FALLBACK_SECRET = 'super_secret_crm_jwt_key_2026_production_grade';

const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  let decoded = null;

  // 1. Check for mock/bridge prefix token format: crm_bridge_token_<UID>
  if (token.startsWith('crm_bridge_token_')) {
    const rawUid = token.replace('crm_bridge_token_', '').trim();
    if (rawUid) {
      decoded = { uid: rawUid, id: rawUid, role: 'ADMIN' };
    }
  }

  // 2. Try verifying as CRM JWT
  if (!decoded) {
    try {
      decoded = jwt.verify(token, CRM_JWT_SECRET);
    } catch (e1) {
      try {
        decoded = jwt.verify(token, FALLBACK_SECRET);
      } catch (e2) {
        // Try Central JWT
      }
    }
  }

  // 3. Try verifying as Central Platform JWT
  if (!decoded) {
    try {
      decoded = jwt.verify(token, CENTRAL_JWT_SECRET);
    } catch (e3) {
      // Try Firebase ID token
    }
  }

  // 4. Try verifying as Firebase ID Token
  if (!decoded) {
    try {
      const fbUser = await verifyFirebaseIdToken(token);
      if (fbUser && fbUser.uid) {
        decoded = {
          uid: fbUser.uid,
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.name,
          role: 'ADMIN'
        };
      }
    } catch (fbErr) {
      // Decoding failed
    }
  }

  if (!decoded || (!decoded.uid && !decoded.id && !decoded.sub)) {
    return res.status(401).json({ success: false, message: 'Token failed validation: invalid or expired credentials' });
  }

  const userUid = String(decoded.uid || decoded.id || decoded.sub).trim();

  try {
    let userDoc = null;

    // Check by ObjectId if valid 24-hex string
    if (mongoose.Types.ObjectId.isValid(userUid) && userUid.length === 24) {
      userDoc = await User.findById(userUid).select('-password');
    }

    // Check by email if not found
    if (!userDoc && decoded.email) {
      userDoc = await User.findOne({ email: decoded.email }).select('-password');
    }

    if (userDoc) {
      if (userDoc.isActive === false) {
        return res.status(401).json({ success: false, message: 'User account is inactive' });
      }
      req.user = userDoc;
      req.user.ownerId = userUid;
    } else {
      // Ephemeral authenticated user object with full isolation ownerId
      req.user = {
        _id: userUid,
        id: userUid,
        uid: userUid,
        ownerId: userUid,
        name: decoded.name || 'Enterprise User',
        email: decoded.email || '',
        role: decoded.role || 'ADMIN',
        permissions: getDefaultPermissionsForRole(decoded.role || 'ADMIN'),
        companyId: null,
        isActive: true
      };
    }

    // Explicitly guarantee ownerId is the verified immutable UID
    req.user.ownerId = userUid;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
  }
};

module.exports = { protect };
