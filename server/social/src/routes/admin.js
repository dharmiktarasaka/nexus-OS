import { Router } from 'express';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Post from '../models/Post.js';
import AdminLog from '../models/AdminLog.js';
import { adminProtect, generateToken } from '../middleware/auth.js';

const router = Router();

// All routes require admin role
router.use(adminProtect);

// ─── Admin Login (separate endpoint that returns role info) ──────────────────
// Note: Admins log in via the regular /api/auth/login, this is just a helper
// to get admin-specific data after login.
router.get('/me', (req, res) => {
  res.json({ user: req.user, role: req.user.role });
});

// ─── Helper: Log an admin action ─────────────────────────────────────────────
async function logAction(admin, action, targetUser, details = '') {
  try {
    await AdminLog.create({
      admin:       admin._id,
      adminName:   admin.name,
      adminEmail:  admin.email,
      action,
      targetUser:  targetUser?._id,
      targetName:  targetUser?.name,
      targetEmail: targetUser?.email,
      details,
    });
  } catch (err) {
    console.error('[AdminLog] Failed to write log:', err.message);
  }
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      onlineUsers,
      totalAccounts,
      scheduledPosts,
      publishedPosts,
      failedPosts,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isSuspended: { $ne: true } }),
      User.countDocuments({ role: 'user', lastActivity: { $gte: fiveMinutesAgo } }),
      Account.countDocuments(),
      Post.countDocuments({ status: 'scheduled' }),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'failed' }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      onlineUsers,
      totalAccounts,
      scheduledPosts,
      publishedPosts,
      failedPosts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Online Users ─────────────────────────────────────────────────────────────
router.get('/online', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await User.find({
      role: 'user',
      lastActivity: { $gte: fiveMinutesAgo },
    }).select('name email lastLogin lastActivity isSuspended').sort({ lastActivity: -1 });

    const result = users.map(u => ({
      _id:          u._id,
      name:         u.name,
      email:        u.email,
      lastLogin:    u.lastLogin,
      lastActivity: u.lastActivity,
      status:       'online',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── User List ────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { role: { $ne: 'admin' } };
    if (search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      query.$or = [{ name: re }, { email: re }];
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (status === 'online') {
      query.lastActivity = { $gte: fiveMinutesAgo };
      query.isSuspended = { $ne: true };
    } else if (status === 'offline') {
      query.$or = [
        { lastActivity: { $lt: fiveMinutesAgo } },
        { lastActivity: null }
      ];
      query.isSuspended = { $ne: true };
    } else if (status === 'suspended') {
      query.isSuspended = true;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email createdAt lastLogin lastActivity isSuspended suspendedUntil suspendReason role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    // Attach post counts and online status
    const userIds = users.map(u => u._id);
    const [postStats, accountCounts] = await Promise.all([
      Post.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: {
            _id: { user: '$user', status: '$status' },
            count: { $sum: 1 }
        } }
      ]),
      Account.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ])
    ]);

    const postMap = {};
    postStats.forEach(p => {
      const userIdStr = p._id.user.toString();
      const status = p._id.status;
      if (!postMap[userIdStr]) {
        postMap[userIdStr] = { scheduled: 0, published: 0, failed: 0, total: 0 };
      }
      postMap[userIdStr][status] = p.count;
      postMap[userIdStr].total += p.count;
    });

    const accountMap = {};
    accountCounts.forEach(a => {
      accountMap[a._id.toString()] = a.count;
    });

    const result = users.map(u => {
      const uId = u._id.toString();
      const pStats = postMap[uId] || { scheduled: 0, published: 0, failed: 0, total: 0 };
      return {
        _id:            u._id,
        name:           u.name,
        email:          u.email,
        registeredAt:   u.createdAt,
        lastLogin:      u.lastLogin,
        lastActivity:   u.lastActivity,
        isOnline:       u.lastActivity && u.lastActivity >= fiveMinutesAgo,
        isSuspended:    u.isSuspended,
        suspendedUntil: u.suspendedUntil,
        suspendReason:  u.suspendReason,
        totalAccounts:  accountMap[uId] || 0,
        totalPosts:     pStats.total,
        scheduledPosts: pStats.scheduled,
        publishedPosts: pStats.published,
        failedPosts:    pStats.failed,
      };
    });

    res.json({ users: result, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── User Detail ──────────────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -openrouterApiKey -firebaseUid -sessionVersion');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [accounts, posts, logs, scheduled, published, failed] = await Promise.all([
      Account.find({ user: user._id }).select('platform name createdAt'),
      Post.find({ user: user._id }).populate('account', 'name platform').sort({ scheduledAt: -1, createdAt: -1 }),
      AdminLog.find({ targetUser: user._id }).sort({ createdAt: -1 }),
      Post.countDocuments({ user: user._id, status: 'scheduled' }),
      Post.countDocuments({ user: user._id, status: 'published' }),
      Post.countDocuments({ user: user._id, status: 'failed' }),
    ]);

    res.json({
      user: {
        ...user.toObject(),
        isOnline: user.lastActivity && user.lastActivity >= fiveMinutesAgo,
      },
      accounts,
      posts,
      logs,
      stats: { scheduled, published, failed, total: scheduled + published + failed },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Suspend User ─────────────────────────────────────────────────────────────
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { durationHours, reason = 'Violation of terms of service.' } = req.body;
    if (!durationHours || durationHours <= 0) {
      return res.status(400).json({ message: 'durationHours is required and must be > 0' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot suspend an admin' });

    const suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    user.isSuspended    = true;
    user.suspendedUntil = suspendedUntil;
    user.suspendReason  = reason;
    // Bump sessionVersion to invalidate existing tokens
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();

    await logAction(req.user, 'USER_SUSPENDED', user,
      `Suspended for ${durationHours}h. Reason: ${reason}`);

    res.json({ message: `User suspended until ${suspendedUntil.toISOString()}`, suspendedUntil });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Unsuspend User ───────────────────────────────────────────────────────────
router.post('/users/:id/unsuspend', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isSuspended    = false;
    user.suspendedUntil = null;
    user.suspendReason  = '';
    await user.save();

    await logAction(req.user, 'USER_UNSUSPENDED', user);

    res.json({ message: 'User unsuspended successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Force Logout ─────────────────────────────────────────────────────────────
router.post('/users/:id/force-logout', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot force-logout an admin' });

    // Increment sessionVersion — invalidates all issued JWTs instantly
    await User.updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });

    await logAction(req.user, 'USER_FORCE_LOGOUT', user);

    res.json({ message: 'User has been logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Delete User ──────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin' });

    const userName  = user.name;
    const userEmail = user.email;

    // Delete all related data in parallel
    await Promise.all([
      Post.deleteMany({ user: user._id }),
      Account.deleteMany({ user: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    await logAction(req.user, 'USER_DELETED', { _id: user._id, name: userName, email: userEmail },
      'User account and all data permanently deleted');

    res.json({ message: 'User and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin Logs ───────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AdminLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdminLog.countDocuments(),
    ]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
