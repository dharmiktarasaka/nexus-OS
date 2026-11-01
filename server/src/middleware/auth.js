import jwt from 'jsonwebtoken';
import { verifyFirebaseIdToken } from '../utils/firebaseAuth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';

/**
 * Strict authentication middleware for all platform API endpoints.
 * Independently verifies session JWT or Firebase ID token on every single request.
 * Sets req.user.uid as the immutable owner identifier.
 */
export async function authenticateUser(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required'
    });
  }

  // 1. Try verifying as Central Platform Session JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.uid || decoded.id || decoded.sub)) {
      const uid = String(decoded.uid || decoded.id || decoded.sub).trim();
      req.user = {
        uid,
        _id: uid,
        id: uid,
        email: decoded.email || '',
        name: decoded.name || decoded.displayName || 'User',
        role: decoded.role || 'USER',
        companyName: decoded.companyName || 'Personal Workspace'
      };
      return next();
    }
  } catch (jwtErr) {
    // If not central JWT, proceed to check Firebase ID token
  }

  // 2. Try verifying as Firebase ID Token
  try {
    const fbUser = await verifyFirebaseIdToken(token);
    if (fbUser && fbUser.uid) {
      req.user = {
        uid: fbUser.uid,
        _id: fbUser.uid,
        id: fbUser.uid,
        email: fbUser.email,
        name: fbUser.name,
        photoURL: fbUser.picture,
        role: 'USER',
        companyName: 'Personal Workspace'
      };
      return next();
    }
  } catch (fbErr) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication credentials'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication failed: unauthorized session'
  });
}

