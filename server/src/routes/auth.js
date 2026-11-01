import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyFirebaseIdToken } from '../utils/firebaseAuth.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';

// POST /api/auth/bridge - Bridges Firebase Auth user into verified Central Platform session
router.post('/bridge', async (req, res) => {
  try {
    const { idToken, uid, email, displayName, photoURL } = req.body;

    let verifiedUid = uid;
    let verifiedEmail = email;
    let verifiedName = displayName;
    let verifiedPhoto = photoURL;

    // 1. If Firebase ID token is provided, verify it independently
    if (idToken) {
      try {
        const verified = await verifyFirebaseIdToken(idToken);
        verifiedUid = verified.uid;
        if (verified.email) verifiedEmail = verified.email;
        if (verified.name) verifiedName = verified.name;
        if (verified.picture) verifiedPhoto = verified.picture;
      } catch (tokenErr) {
        return res.status(401).json({
          success: false,
          message: `Firebase token verification failed: ${tokenErr.message}`
        });
      }
    }

    if (!verifiedUid) {
      return res.status(400).json({ success: false, message: 'Valid user identity (UID) is required' });
    }

    const payload = {
      uid: String(verifiedUid).trim(),
      email: verifiedEmail || '',
      name: verifiedName || (verifiedEmail ? verifiedEmail.split('@')[0] : 'User'),
      photoURL: verifiedPhoto || null,
      role: 'ADMIN',
      companyName: 'Personal Workspace',
      plan: 'Enterprise Suite'
    };

    // Issue central session token with user UID baked in
    const centralToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    // Sub-tokens for CRM and sub-services, embedding the same Firebase UID
    const crmToken = jwt.sign(
      {
        id: payload.uid,
        uid: payload.uid,
        email: payload.email,
        role: 'ADMIN',
        name: payload.name
      },
      process.env.CRM_JWT_SECRET || 'Tarasaka_supersecrectKey$2028',
      { expiresIn: '30d' }
    );

    const stratiqToken = jwt.sign(
      { uid: payload.uid, email: payload.email, role: 'ADMIN' },
      process.env.STRATIQ_JWT_SECRET || 'stratiq-jwt-secret-2026',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: centralToken,
      user: payload,
      tokens: {
        central: centralToken,
        crm: crmToken,
        stratiq: stratiqToken
      }
    });
  } catch (error) {
    console.error('Auth bridge error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me - Get current user profile (protected)
router.get('/me', authenticateUser, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
