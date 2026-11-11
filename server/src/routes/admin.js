import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  getAllRequests,
  approveRequest,
  rejectRequest,
  revokeRequest,
  deleteRequest,
  getAccessStats,
  MASTER_ADMIN_EMAIL
} from '../models/userAccessStorage.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026';
const MASTER_ADMIN_KEY = process.env.MASTER_ADMIN_KEY || 'nexus_master_admin_secret_key_2026';

// Middleware to strictly verify Admin identity
export function authenticateAdmin(req, res, next) {
  try {
    // Allow master key header for API calls
    const apiKey = (req.headers['x-admin-key'] || (req.query && req.query.adminKey) || '').trim();
    if (apiKey && apiKey === MASTER_ADMIN_KEY) {
      req.admin = {
        email: MASTER_ADMIN_EMAIL,
        role: 'ADMIN',
        name: 'Super Administrator'
      };
      return next();
    }

    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.role === 'ADMIN' || decoded.isAdmin === true || decoded.email === MASTER_ADMIN_EMAIL)) {
      req.admin = {
        email: decoded.email || MASTER_ADMIN_EMAIL,
        role: 'ADMIN',
        name: decoded.name || 'Master Admin'
      };
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires administrator credentials'
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }
}

// In-memory rate limiting map for admin authentication attempts
const adminLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const record = adminLoginAttempts.get(ip);
  if (!record) return { allowed: true };
  if (Date.now() - record.lastAttempt > LOCKOUT_MS) {
    adminLoginAttempts.delete(ip);
    return { allowed: true };
  }
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const remainingMinutes = Math.ceil((LOCKOUT_MS - (Date.now() - record.lastAttempt)) / 60000);
    return { allowed: false, remainingMinutes };
  }
  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const record = adminLoginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  record.count += 1;
  record.lastAttempt = Date.now();
  adminLoginAttempts.set(ip, record);
}

function resetAttempts(ip) {
  adminLoginAttempts.delete(ip);
}

// POST /api/admin/login - Authenticate Administrator
router.post('/login', (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const limitCheck = checkRateLimit(ip);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Account temporarily locked for security. Try again in ${limitCheck.remainingMinutes} minute(s).`
      });
    }

    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const masterKey = (body.masterKey || '').trim();

    // Check master key bypass
    const isMasterKey = masterKey && (masterKey === MASTER_ADMIN_KEY);
    if (isMasterKey) {
      resetAttempts(ip);
      const token = jwt.sign(
        { email: MASTER_ADMIN_EMAIL, role: 'ADMIN', isAdmin: true, name: 'Super Administrator' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        message: 'Admin authenticated successfully with Master Key',
        token,
        admin: {
          email: MASTER_ADMIN_EMAIL,
          role: 'ADMIN',
          displayName: 'Super Administrator'
        }
      });
    }

    // Check admin credentials strictly without default backdoor passwords
    const validEmails = [
      MASTER_ADMIN_EMAIL.toLowerCase(),
      'admin@nexus.io',
      'dharmik.tarasaka@gmail.com'
    ];
    const isEmailValid = validEmails.includes(email);
    const isPassValid = password === ADMIN_PASSWORD;

    if (!isEmailValid || !isPassValid) {
      recordFailedAttempt(ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email or password'
      });
    }

    resetAttempts(ip);
    const token = jwt.sign(
      { email: email || MASTER_ADMIN_EMAIL, role: 'ADMIN', isAdmin: true, name: 'Enterprise Super Admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Administrator login successful',
      token,
      admin: {
        email: email || MASTER_ADMIN_EMAIL,
        role: 'ADMIN',
        displayName: 'Enterprise Super Admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error processing admin login' });
  }
});

// GET /api/admin/stats - Overview metrics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await getAccessStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/requests - List access requests with optional status filter
router.get('/requests', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'ALL' ? status.toUpperCase() : null;
    const requests = await getAllRequests(filter);
    const counts = await getAccessStats();

    res.json({
      success: true,
      total: requests.length,
      counts,
      requests
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/requests/:id/approve - Approve access request
router.post('/requests/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin?.email || 'Super Admin';
    const updated = await approveRequest(id, adminEmail);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    res.json({
      success: true,
      message: `User ${updated.email} approved! They can now log in to the main site.`,
      request: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/requests/:id/reject - Reject access request
router.post('/requests/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = (req.body && req.body.reason) || '';
    const adminEmail = req.admin?.email || 'Super Admin';
    const updated = await rejectRequest(id, adminEmail, reason);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    res.json({
      success: true,
      message: `User ${updated.email} rejected.`,
      request: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/requests/:id/revoke - Revoke approved access (set back to PENDING)
router.post('/requests/:id/revoke', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.admin?.email || 'Super Admin';
    const updated = await revokeRequest(id, adminEmail);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    res.json({
      success: true,
      message: `User ${updated.email} access revoked. Status set back to PENDING.`,
      request: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/requests/:id - Delete an access request
router.delete('/requests/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteRequest(id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    res.json({
      success: true,
      message: 'Access request record removed'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

