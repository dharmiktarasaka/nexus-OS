import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAuth.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
function suspensionResponse(res, user) {
  const remaining = user.suspendedUntil
    ? Math.ceil((new Date(user.suspendedUntil) - Date.now()) / 1000 / 60)
    : null;
  return res.status(403).json({
    message: 'Your account has been suspended.',
    reason: user.suspendReason || 'Violation of terms of service.',
    suspendedUntil: user.suspendedUntil,
    remainingMinutes: remaining,
  });
}

// ── protect ──────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized: Authentication Bearer token required' });
  }

  const token = header.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ message: 'Not authorized: Token missing' });
  }

  // 1. Cryptographic JWT Verification (Central Platform JWT, CRM JWT, Social JWT)
  const secrets = [
    process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026',
    process.env.CRM_JWT_SECRET || 'Tarasaka_supersecrectKey$2028',
    'super_secret_central_saas_platform_key_2026'
  ];

  let verifiedDecoded = null;
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded && (decoded.id || decoded.uid || decoded.sub || decoded.email)) {
        verifiedDecoded = decoded;
        break;
      }
    } catch (e) {
      // Continue trying configured secrets
    }
  }

  // 2. Firebase ID Token Verification
  if (!verifiedDecoded) {
    try {
      const fbUser = await verifyFirebaseIdToken(token);
      if (fbUser && fbUser.uid) {
        verifiedDecoded = {
          uid: fbUser.uid,
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.name || fbUser.email?.split('@')[0]
        };
      }
    } catch (err) {
      // Invalid Firebase token
    }
  }

  if (!verifiedDecoded) {
    return res.status(401).json({ message: 'Not authorized: Invalid or expired session token' });
  }

  try {
    const lookup = [];
    if (verifiedDecoded.id && mongoose.Types.ObjectId.isValid(verifiedDecoded.id)) {
      lookup.push({ _id: verifiedDecoded.id });
    }
    if (verifiedDecoded.uid) {
      lookup.push({ firebaseUid: verifiedDecoded.uid });
    }
    if (verifiedDecoded.email) {
      lookup.push({ email: verifiedDecoded.email.toLowerCase() });
    }

    let user = null;
    if (mongoose.connection.readyState === 1 && lookup.length > 0) {
      user = await User.findOne({ $or: lookup });
      if (!user && (verifiedDecoded.email || verifiedDecoded.uid)) {
        const userEmail = (verifiedDecoded.email || `${verifiedDecoded.uid || 'user'}@nexus.io`).toLowerCase();
        user = await User.create({
          name: verifiedDecoded.name || userEmail.split('@')[0],
          email: userEmail,
          firebaseUid: verifiedDecoded.uid || String(verifiedDecoded.id || ''),
          role: verifiedDecoded.role === 'ADMIN' ? 'admin' : 'user'
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User record could not be established from session token' });
    }

    if (typeof user.isCurrentlySuspended === 'function' && user.isCurrentlySuspended()) {
      return suspensionResponse(res, user);
    }

    User.updateOne({ _id: user._id }, { lastActivity: new Date() }).catch(() => {});
    req.user = user;
    return next();
  } catch (dbErr) {
    console.error('[Social Auth] Verification database error:', dbErr.message);
    return res.status(500).json({ message: 'Authentication verification service error' });
  }
};

// ── adminProtect ─────────────────────────────────────────────────────────────
export const adminProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const decoded = jwt.verify(token, secret);
    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id);
    } else if (decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin' && decoded.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });

    User.updateOne({ _id: user._id }, { lastActivity: new Date() }).catch(() => {});
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// ── generateToken ─────────────────────────────────────────────────────────────
export const generateToken = (userId, sessionVersion = 0) => {
  return jwt.sign({ id: userId, sv: sessionVersion }, process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026', { expiresIn: '7d' });
};
