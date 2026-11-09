import { Router } from 'express';
import { body, validationResult } from '../utils/validation.js';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';
import axios from 'axios';
import Account from '../models/Account.js';
import jwt from 'jsonwebtoken';
import { sendLoginNotification } from '../utils/email.js';

const router = Router();
let clientUrl = (process.env.CLIENT_URL || 'http://localhost:5180').replace(/[\r\n\s\t]/g, '').trim();
if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
  clientUrl = 'http://localhost:5180';
}
clientUrl = clientUrl.replace(/\/$/, '');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id, user.sessionVersion);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Static Admin Credentials Bypass
    if (email === 'dharmik.tarasaka@gmail.com' && password === 'myadmin@99') {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: 'Dharmik Tarasaka',
          email,
          role: 'admin'
        });
      } else if (user.role !== 'admin') {
        user.role = 'admin';
        user.isSuspended = false;
        user.suspendedUntil = null;
        user.suspendReason = '';
        await user.save();
      }

      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();

      const token = generateToken(user._id, user.sessionVersion);

      // Async email notification
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
      sendLoginNotification(user, clientIp);

      return res.json({ token, user });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check suspension before allowing login
    if (user.isCurrentlySuspended()) {
      const remaining = user.suspendedUntil
        ? Math.ceil((new Date(user.suspendedUntil) - Date.now()) / 1000 / 60)
        : null;
      return res.status(403).json({
        message: 'Your account has been suspended.',
        reason: user.suspendReason || '',
        suspendedUntil: user.suspendedUntil,
        remainingMinutes: remaining,
      });
    }

    // Track last login
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = generateToken(user._id, user.sessionVersion);

    // Async email notification
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
    sendLoginNotification(user, clientIp);

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

router.put('/settings', protect, async (req, res) => {
  try {
    const { aiProvider, openrouterApiKey } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (aiProvider !== undefined) user.aiProvider = aiProvider;
    if (openrouterApiKey !== undefined) user.openrouterApiKey = openrouterApiKey;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/instagram/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.redirect(`${clientUrl}/dashboard?error=instagram_auth_failed`);
  }

  let userId;
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (err) {
    console.error('Instagram state verification failed:', err.message);
    return res.redirect(`${clientUrl}/dashboard?error=instagram_auth_failed&details=Invalid%20state%20parameter`);
  }

  try {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/instagram/callback`;

    // 1. Get short-lived token
    const formData = new URLSearchParams();
    formData.append('client_id', process.env.INSTAGRAM_APP_ID);
    formData.append('client_secret', process.env.INSTAGRAM_APP_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, user_id } = tokenRes.data;

    // 2. Exchange for long-lived token
    const longLivedRes = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        access_token: access_token
      }
    });

    const longLivedToken = longLivedRes.data.access_token;
    const expiresSec = longLivedRes.data.expires_in || 5183999;
    const tokenExpiresAt = new Date(Date.now() + expiresSec * 1000);

    // 3. Get user profile
    const profileRes = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username',
        access_token: longLivedToken
      }
    });

    const { id, username } = profileRes.data;

    // Save as Account in Database strictly isolated by authenticated user
    await Account.findOneAndUpdate(
      { user: userId, platformUserId: id, platform: 'instagram' },
      {
        user: userId,
        platform: 'instagram',
        platformUserId: id,
        name: username,
        accessToken: longLivedToken,
        tokenExpiresAt: tokenExpiresAt,
        instagramBusinessId: id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.redirect(`${clientUrl}/apps/social?connected=instagram`);
  } catch (error) {
    console.error('Instagram direct callback error:', error.response?.data || error.message);
    res.redirect(`${clientUrl}/apps/social?error=instagram_auth_failed`);
  }
});

router.post('/login-notify', protect, async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
    sendLoginNotification(req.user, clientIp);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
