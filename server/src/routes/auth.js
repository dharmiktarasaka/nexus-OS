import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { verifyFirebaseIdToken } from '../utils/firebaseAuth.js';
import { authenticateUser } from '../middleware/auth.js';
import {
  recordAccessRequest,
  checkUserStatus,
  MASTER_ADMIN_EMAIL
} from '../models/userAccessStorage.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';

// POST /api/auth/check-status - Checks user access request status or submits a new request
router.post('/check-status', async (req, res) => {
  try {
    const { email, uid, displayName, photoURL, provider } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Record or update the request
    const requestRecord = await recordAccessRequest({
      uid,
      email: normalizedEmail,
      displayName,
      photoURL,
      provider: provider || 'email'
    });

    const isApproved = requestRecord.status === 'APPROVED';

    res.json({
      success: true,
      status: requestRecord.status, // 'PENDING' | 'APPROVED' | 'REJECTED'
      isApproved,
      message: isApproved
        ? 'Access approved'
        : requestRecord.status === 'REJECTED'
          ? (requestRecord.rejectionReason || 'Access request declined by administrator')
          : 'Access request is pending administrator approval',
      user: {
        email: requestRecord.email,
        displayName: requestRecord.displayName,
        status: requestRecord.status,
        role: requestRecord.role,
        requestedAt: requestRecord.requestedAt
      }
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/bridge - Bridges Firebase Auth user into verified Central Platform session
router.post('/bridge', async (req, res) => {
  try {
    const { idToken, uid, email, displayName, photoURL, provider } = req.body;

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

    const normalizedEmail = (verifiedEmail || '').trim().toLowerCase();

    // 2. CHECK ADMIN ACCESS APPROVAL
    // Check or record the access request in MongoDB
    const accessRecord = await recordAccessRequest({
      uid: verifiedUid,
      email: normalizedEmail,
      displayName: verifiedName,
      photoURL: verifiedPhoto,
      provider: provider || 'auth-bridge'
    });

    const isMasterAdmin = normalizedEmail === MASTER_ADMIN_EMAIL;

    // Strict Gate: If not master admin and status is not APPROVED, block login!
    if (!isMasterAdmin && accessRecord.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        status: accessRecord.status, // 'PENDING' or 'REJECTED'
        message: accessRecord.status === 'REJECTED'
          ? (accessRecord.rejectionReason || 'Access request was declined by the administrator.')
          : 'Your account is pending administrator approval. Once an admin accepts your request in the Admin Panel, you will be able to log in.',
        user: {
          uid: verifiedUid,
          email: normalizedEmail,
          displayName: verifiedName || normalizedEmail.split('@')[0],
          status: accessRecord.status
        }
      });
    }

    const userRole = isMasterAdmin ? 'ADMIN' : (accessRecord.role || 'USER');

    const payload = {
      uid: String(verifiedUid).trim(),
      email: normalizedEmail,
      name: verifiedName || (normalizedEmail ? normalizedEmail.split('@')[0] : 'User'),
      photoURL: verifiedPhoto || null,
      role: userRole,
      status: 'APPROVED',
      companyName: isMasterAdmin ? 'Tarasaka Global Holdings' : 'Personal Workspace',
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
        role: userRole,
        name: payload.name
      },
      process.env.CRM_JWT_SECRET || 'Tarasaka_supersecrectKey$2028',
      { expiresIn: '30d' }
    );

    const stratiqToken = jwt.sign(
      { uid: payload.uid, email: payload.email, role: userRole },
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
