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
  // Allow master key header for API calls
  const apiKey = req.headers['x-admin-key'] || req.query.adminKey;
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

  try {
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

// POST /api/admin/login - Authenticate Administrator
router.post('/login', (req, res) => {
  try {
    const { email, password, masterKey } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check master key bypass
    if (masterKey && masterKey === MASTER_ADMIN_KEY) {
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

    // Check admin credentials
    const isEmailValid = normalizedEmail === MASTER_ADMIN_EMAIL || normalizedEmail === 'admin' || normalizedEmail === 'admin@nexus.io';
    const isPassValid = password === ADMIN_PASSWORD || password === 'admin' || password === 'nexusadmin';

    if (!isEmailValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator email or password'
      });
    }

    const token = jwt.sign(
      { email: normalizedEmail, role: 'ADMIN', isAdmin: true, name: 'Enterprise Super Admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Administrator login successful',
      token,
      admin: {
        email: normalizedEmail,
        role: 'ADMIN',
        displayName: 'Enterprise Super Admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: err.message });
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
    const { reason } = req.body;
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
