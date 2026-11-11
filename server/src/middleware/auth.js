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

  // 1. Try verifying as Central Platform or microservice Session JWT
  const secrets = [
    process.env.JWT_SECRET,
    process.env.CENTRAL_JWT_SECRET,
    process.env.CRM_JWT_SECRET,
    'super_secret_central_saas_platform_key_2026',
    'Tarasaka_supersecrectKey$2028',
    'super_secret_crm_jwt_key_2026_production_grade'
  ].filter(Boolean);

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded && (decoded.uid || decoded.id || decoded.sub || decoded.email)) {
        const uid = String(decoded.uid || decoded.id || decoded.sub || decoded.email).trim();
        req.user = {
          uid,
          _id: uid,
          id: uid,
          email: decoded.email || '',
          name: decoded.name || decoded.displayName || (decoded.email ? decoded.email.split('@')[0] : 'User'),
          role: decoded.role || 'USER',
          companyName: decoded.companyName || 'Personal Workspace'
        };
        return next();
      }
    } catch (jwtErr) {
      // Try next configured secret
    }
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

