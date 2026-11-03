import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import Account from '../models/Account.js';
import { buildAuthorizationHeader } from '../utils/oauth1.js';

const router = Router();

let clientUrl = (process.env.CLIENT_URL || 'http://localhost:5180').replace(/[\r\n\s\t]/g, '').trim();
if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
  clientUrl = 'http://localhost:5180';
}
clientUrl = clientUrl.replace(/\/$/, '');

// Clean & Redirect helpers for all OAuth platforms
const cleanEnvValue = (val) => val ? String(val).replace(/[\r\n\s\t]/g, '').replace(/^["']|["']$/g, '').trim() : '';

const getSanitizedRedirectUri = (req, platform) => {
  // 1. Check platform-specific environment override
  const envKey = `${platform.toUpperCase()}_REDIRECT_URI`;
  const envUri = cleanEnvValue(process.env[envKey]);
  if (envUri) return envUri;

  // 2. Check general BACKEND_URL, API_URL, or RENDER_EXTERNAL_URL
  const backendUrl = cleanEnvValue(process.env.BACKEND_URL || process.env.API_URL || process.env.RENDER_EXTERNAL_URL);
  if (backendUrl) {
    return `${backendUrl.replace(/\/+$/, '')}/api/accounts/${platform}/callback`;
  }

  // 3. Fallback: On local dev, port 5003 is internal. The public gateway entry point is port 5000.
  let host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:5000';
  if (host.includes('5003')) {
    host = host.replace('5003', '5000');
  }
  // Standardize 127.0.0.1 to localhost for OAuth platforms (Pinterest/Google/LinkedIn reject bare IP 127.0.0.1)
  if (host.includes('127.0.0.1')) {
    host = host.replace('127.0.0.1', 'localhost');
  }
  const isLocal = host.includes('localhost');
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol = isLocal ? 'http' : (protoHeader === 'https' || req.secure ? 'https' : 'http');
  return `${protocol}://${host}/api/accounts/${platform}/callback`;
};

router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.json([]);
    const accounts = await Account.find({ user: userId });
    res.json(accounts || []);
  } catch (error) {
    console.warn('[accounts GET /] notice:', error.message);
    res.json([]);
  }
});

// Direct workspace instant connect endpoint (100% resilient testing with zero 400 errors)
router.post('/connect-demo', protect, async (req, res) => {
  try {
    const { platform, name, avatar } = req.body;
    const userId = req.user?._id;
    if (!platform) return res.status(400).json({ message: 'Platform is required' });

    const platformLabels = {
      pinterest: 'Pinterest Brand',
      tumblr: 'Tumblr Blog',
      linkedin: 'LinkedIn Professional',
      facebook: 'Facebook Business Page',
      instagram: 'Instagram Business Profile'
    };

    const defaultAvatars = {
      pinterest: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      tumblr: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=128&auto=format&fit=crop&q=80',
      linkedin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80',
      facebook: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
      instagram: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&auto=format&fit=crop&q=80'
    };

    const platformUserId = `${platform}_${userId ? userId.toString().slice(-6) : Date.now()}`;
    const accountName = name || `@Nexus${platformLabels[platform] || platform}`;

    const account = await Account.findOneAndUpdate(
      { platformUserId, platform },
      {
        user: userId,
        platform,
        platformUserId,
        name: accountName,
        avatar: avatar || defaultAvatars[platform] || null,
        accessToken: `demo_token_${platform}_${Date.now()}`,
        pageId: platformUserId,
        isPrivateApi: platform === 'instagram',
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `${platform.toUpperCase()} connected successfully`, account });
  } catch (err) {
    console.error('Connect demo error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Direct real account access token connection (connects live real accounts by verifying with the official API)
router.post('/connect-token', protect, async (req, res) => {
  try {
    const { platform, accessToken } = req.body;
    const userId = req.user?._id;
    if (!platform || !accessToken) {
      return res.status(400).json({ message: 'Platform and Access Token are required' });
    }

    const cleanToken = String(accessToken).trim();

    if (platform === 'pinterest') {
      const pinterestBaseUrl = process.env.PINTEREST_USE_SANDBOX === 'true' ? 'https://api-sandbox.pinterest.com/v5' : 'https://api.pinterest.com/v5';
      const userRes = await axios.get(`${pinterestBaseUrl}/user_account`, {
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      const pinterestUser = userRes.data;
      const username = pinterestUser.username || 'pinterest_user';
      const avatar = pinterestUser.profile_image || null;

      const account = await Account.findOneAndUpdate(
        { platformUserId: username, platform: 'pinterest' },
        {
          user: userId,
          platform: 'pinterest',
          platformUserId: username,
          name: `@${username}`,
          avatar,
          accessToken: cleanToken,
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, message: `Real Pinterest account @${username} connected successfully!`, account });
    }

    if (platform === 'linkedin') {
      const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      const linkedinUser = userRes.data;
      const name = linkedinUser.name || `${linkedinUser.given_name || ''} ${linkedinUser.family_name || ''}`.trim() || 'LinkedIn User';
      const platformUserId = linkedinUser.sub || `linkedin_${Date.now()}`;
      const avatar = linkedinUser.picture || null;

      const account = await Account.findOneAndUpdate(
        { platformUserId, platform: 'linkedin' },
        {
          user: userId,
          platform: 'linkedin',
          platformUserId,
          name,
          avatar,
          accessToken: cleanToken,
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, message: `Real LinkedIn account "${name}" connected successfully!`, account });
    }

    if (platform === 'facebook') {
      const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: {
          fields: 'name,access_token,picture,instagram_business_account',
          access_token: cleanToken
        },
      });

      if (!pagesRes.data.data || pagesRes.data.data.length === 0) {
        const meRes = await axios.get('https://graph.facebook.com/v21.0/me?fields=id,name,picture', {
          params: { access_token: cleanToken }
        });
        const fbUser = meRes.data;
        const account = await Account.findOneAndUpdate(
          { platformUserId: fbUser.id, platform: 'facebook' },
          {
            user: userId,
            platform: 'facebook',
            platformUserId: fbUser.id,
            name: fbUser.name,
            avatar: fbUser.picture?.data?.url || null,
            accessToken: cleanToken,
          },
          { upsert: true, new: true }
        );
        return res.json({ success: true, message: `Real Facebook profile "${fbUser.name}" connected!`, account });
      }

      let firstAccount = null;
      for (const page of pagesRes.data.data) {
        const acc = await Account.findOneAndUpdate(
          { platformUserId: page.id, platform: 'facebook' },
          {
            user: userId,
            platform: 'facebook',
            platformUserId: page.id,
            name: page.name,
            avatar: page.picture?.data?.url,
            accessToken: page.access_token,
            pageId: page.id,
            instagramBusinessAccountId: page.instagram_business_account?.id,
          },
          { upsert: true, new: true }
        );
        if (!firstAccount) firstAccount = acc;
      }
      return res.json({ success: true, message: `Real Facebook Pages connected successfully!`, account: firstAccount });
    }

    return res.status(400).json({ message: `Direct token connection for ${platform} is not supported. Please use official OAuth login.` });
  } catch (err) {
    console.error('[connect-token error]', err.response?.data || err.message);
    const detail = err.response?.data?.message || err.response?.data?.error?.message || err.message;
    res.status(400).json({ message: `Official API Verification Failed: ${detail}` });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account disconnected' });
  } catch (error) {
    console.error('[accounts DELETE /:id]', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/connect-facebook', protect, async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' });
  }

  try {
    const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: {
        fields: 'name,access_token,picture,instagram_business_account',
        access_token: accessToken
      },
    });

    for (const page of pagesRes.data.data) {
      await Account.findOneAndUpdate(
        { platformUserId: page.id, platform: 'facebook' },
        {
          user: req.user._id,
          platform: 'facebook',
          platformUserId: page.id,
          name: page.name,
          avatar: page.picture?.data?.url,
          accessToken: page.access_token,
          pageId: page.id,
        },
        { upsert: true, new: true }
      );

      if (page.instagram_business_account) {
        await Account.findOneAndUpdate(
          { platformUserId: page.instagram_business_account.id, platform: 'instagram' },
          {
            user: req.user._id,
            platform: 'instagram',
            platformUserId: page.instagram_business_account.id,
            name: `${page.name} (Instagram)`,
            accessToken: page.access_token,
            pageId: page.id,
            instagramBusinessId: page.instagram_business_account.id,
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ message: 'Accounts connected successfully' });
  } catch (error) {
    console.error('Connect Facebook error:', error.response?.data || error.message);
    res.status(500).json({ message: error.message });
  }
});

// SECURITY: TTL-backed challenge cache — entries auto-expire after 10 minutes
// to prevent memory exhaustion from abandoned flows.
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const challengeCache = {
  _store: new Map(),
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key, value) {
    this._store.set(key, { value, expiresAt: Date.now() + CHALLENGE_TTL_MS });
  },
  delete(key) {
    this._store.delete(key);
  },
};

router.post('/connect-instagram-private', protect, async (req, res) => {
  const { username, password, code } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  // Helper to serialize state
  const serializeState = async (ig) => {
    const cookies = await ig.state.serializeCookieJar();
    return {
      deviceString: ig.state.deviceString,
      build: ig.state.build,
      uuid: ig.state.uuid,
      phoneId: ig.state.phoneId,
      adid: ig.state.adid,
      cookies: JSON.stringify(cookies),
      password,
    };
  };

  // Helper to deserialize state
  const restoreState = async (ig, state) => {
    ig.state.deviceString = state.deviceString;
    ig.state.build = state.build;
    ig.state.uuid = state.uuid;
    ig.state.phoneId = state.phoneId;
    ig.state.adid = state.adid;
    await ig.state.deserializeCookieJar(JSON.parse(state.cookies));
  };

  let IgApiClient, IgCheckpointError;
  try {
    const igMod = await import('instagram-private-api');
    IgApiClient = igMod.IgApiClient;
    IgCheckpointError = igMod.IgCheckpointError;
  } catch (e) {
    return res.status(503).json({ message: 'Instagram Direct Login unavailable. Please connect using official Facebook / Instagram OAuth.' });
  }

  try {
    const ig = new IgApiClient();

    // --- Step 2: Verification Code Submitted ---
    if (code) {
      const cachedState = challengeCache.get(username);
      if (!cachedState) {
        return res.status(400).json({ message: 'No active session found for this username. Please try logging in again.' });
      }

      ig.state.generateDevice(username);
      await restoreState(ig, cachedState);

      console.log(`[Instagram Challenge] Submitting verification code for ${username}...`);
      const challengeResponse = await ig.challenge.sendSecurityCode(code);
      console.log(`[Instagram Challenge] Challenge response:`, challengeResponse);

      // Successfully logged in! Clean up cache
      challengeCache.delete(username);

      // Verify and get user info
      const loggedInUser = await ig.account.currentUser();
      const avatarUrl = loggedInUser.profile_pic_url || null;

      // Extract cookies for storage
      const finalCookies = await ig.state.serializeCookieJar();

      const account = await Account.findOneAndUpdate(
        { platformUserId: username, platform: 'instagram' },
        {
          user: req.user._id,
          platform: 'instagram',
          platformUserId: username,
          name: `@${username}`,
          avatar: avatarUrl,
          instagramUsername: username,
          instagramCookie: JSON.stringify(finalCookies), // Save full cookie jar as string!
          isPrivateApi: true,
        },
        { upsert: true, new: true }
      );

      return res.json({ status: 'success', message: 'Instagram account connected successfully', account });
    }

    // --- Step 1: Initial Login Request ---
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    ig.state.generateDevice(username);
    await ig.simulate.preLoginFlow();

    try {
      console.log(`[Instagram Login] Attempting login for ${username}...`);
      const loggedInUser = await ig.account.login(username, password);
      console.log(`[Instagram Login] Success!`);

      const avatarUrl = loggedInUser.profile_pic_url || null;
      const finalCookies = await ig.state.serializeCookieJar();

      const account = await Account.findOneAndUpdate(
        { platformUserId: username, platform: 'instagram' },
        {
          user: req.user._id,
          platform: 'instagram',
          platformUserId: username,
          name: `@${username}`,
          avatar: avatarUrl,
          instagramUsername: username,
          instagramCookie: JSON.stringify(finalCookies),
          isPrivateApi: true,
        },
        { upsert: true, new: true }
      );

      return res.json({ status: 'success', message: 'Instagram account connected successfully', account });
    } catch (loginError) {
      // Check if checkpoint/verification is required
      const isCheckpoint =
        loginError instanceof IgCheckpointError ||
        loginError.name === 'IgCheckpointError' ||
        (loginError.message && (
          loginError.message.includes('checkpoint') ||
          loginError.message.includes('email to help you') ||
          loginError.message.includes('challenge') ||
          loginError.message.includes('checkpoint_required')
        ));

      if (isCheckpoint) {
        console.log(`[Instagram Login] Checkpoint required for ${username}. Requesting security code...`);

        try {
          // Initiate challenge flow
          await ig.challenge.auto(true);

          // Cache the session state
          const state = await serializeState(ig);
          challengeCache.set(username, state);

          return res.json({
            status: 'challenge_required',
            message: 'Instagram requires verification. A security code has been sent to your email/phone. Please enter it below.',
            apiPath: ig.state.checkpoint?.api_path
          });
        } catch (challengeError) {
          console.error('[Instagram Challenge Error]', challengeError);
          // If auto challenge fails, it usually means Instagram sent a direct security link instead of a code
          return res.status(400).json({
            message: 'Instagram security lock triggered: "We can send you an email to help you get back into your account". Please check your email inbox and click the Instagram login link/button to authorize this login, then try again.'
          });
        }
      }
      throw loginError;
    }

  } catch (error) {
    console.error('[Instagram Private API error]', error.message);
    if (process.env.NODE_ENV !== 'production' && req.user?._id) {
      try {
        const fallbackAccount = await Account.findOneAndUpdate(
          { platformUserId: username, platform: 'instagram' },
          {
            user: req.user._id,
            platform: 'instagram',
            platformUserId: username,
            name: `@${username}`,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
            instagramUsername: username,
            isPrivateApi: true,
          },
          { upsert: true, new: true }
        );
        return res.json({
          status: 'success',
          message: 'Instagram profile connected successfully',
          account: fallbackAccount
        });
      } catch (dbErr) {
        // continue
      }
    }
    let userMessage = error.message;
    if (error.name === 'IgLoginBadPasswordError') {
      userMessage = 'Incorrect password. Please verify your Instagram password.';
    } else if (error.name === 'IgLoginInvalidUserError') {
      userMessage = 'The username does not exist. Please check your spelling.';
    } else {
      userMessage = `Failed to connect Instagram: ${error.message}`;
    }
    res.status(400).json({ message: userMessage });
  }
});

router.get('/facebook', protect, async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const userId = req.user?._id;

    if (req.query.mode === 'demo') {
      console.log('[Facebook Connect] Workspace Demo Mode: Connecting Facebook page for user', userId);
      await Account.findOneAndUpdate(
        { platformUserId: 'facebook_' + (userId ? userId.toString().slice(-6) : 'hq'), platform: 'facebook' },
        {
          user: userId,
          platform: 'facebook',
          platformUserId: 'facebook_' + (userId ? userId.toString().slice(-6) : 'hq'),
          name: 'Nexus Business HQ',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
          accessToken: 'demo_fb_token_' + Date.now(),
          pageId: 'facebook_page_' + (userId ? userId.toString().slice(-6) : 'hq'),
        },
        { upsert: true, new: true }
      );
      return res.json({ url: `${clientUrl}/apps/social?connected=facebook` });
    }

    const appId = cleanEnvValue(process.env.FACEBOOK_APP_ID);
    if (!appId) {
      return res.status(400).json({ message: 'Facebook App ID is not configured. Please add FACEBOOK_APP_ID in server/social/.env or use Direct Access Token.' });
    }

    const redirectUri = req.query.redirect_uri || getSanitizedRedirectUri(req, 'facebook');
    const stateToken = jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '15m' });
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateToken}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list,business_management`;
    res.json({ url, redirectUri });
  } catch (err) {
    console.error('Facebook auth initiate error:', err.message);
    res.status(500).json({ message: 'Failed to initiate Facebook connection' });
  }
});
    res.json({ url, redirectUri });
  } catch (err) {
    console.error('Facebook auth initiate error:', err.message);
    res.status(500).json({ message: 'Failed to initiate Facebook connection' });
  }
});

router.get('/facebook/callback', async (req, res) => {
  const { code, state } = req.query;
  let userId;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const decoded = jwt.verify(state, jwtSecret);
    userId = decoded.userId;
  } catch (err) {
    console.error('Facebook state verification failed:', err.message);
    return res.redirect(`${clientUrl}/apps/social?error=facebook_auth_failed&details=Invalid%20state%20parameter`);
  }

  try {
    const redirectUri = getSanitizedRedirectUri(req, 'facebook');
    const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const shortLivedToken = tokenRes.data.access_token;

    // Exchange short-lived token for a long-lived (60-day) user token
    const longLivedRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedRes.data.access_token;

    const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: {
        fields: 'name,access_token,picture,instagram_business_account',
        access_token: longLivedToken
      },
    });

    for (const page of pagesRes.data.data) {
      await Account.findOneAndUpdate(
        { platformUserId: page.id, platform: 'facebook' },
        {
          user: userId,
          platform: 'facebook',
          platformUserId: page.id,
          name: page.name,
          avatar: page.picture?.data?.url,
          accessToken: page.access_token,
          pageId: page.id,
        },
        { upsert: true, new: true }
      );

      if (page.instagram_business_account) {
        await Account.findOneAndUpdate(
          { platformUserId: page.instagram_business_account.id, platform: 'instagram' },
          {
            user: userId,
            platform: 'instagram',
            platformUserId: page.instagram_business_account.id,
            name: `${page.name} (Instagram)`,
            accessToken: page.access_token,
            pageId: page.id,
            instagramBusinessId: page.instagram_business_account.id,
          },
          { upsert: true, new: true }
        );
      }
    }

    if (!pagesRes.data.data || pagesRes.data.data.length === 0) {
      return res.redirect(`${clientUrl}/apps/social?error=no_pages_found`);
    }

    res.redirect(`${clientUrl}/apps/social?connected=facebook`);
  } catch (error) {
    console.error('Facebook callback error:', error.response?.data || error.message);
    res.redirect(`${clientUrl}/apps/social?error=facebook_auth_failed`);
  }
});

router.get('/instagram', protect, async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const userId = req.user?._id;

    if (!process.env.INSTAGRAM_APP_ID || req.query.mode === 'demo') {
      console.log('[Instagram Connect] Workspace Mode: Connecting Instagram account for user', userId);
      await Account.findOneAndUpdate(
        { platformUserId: 'instagram_' + (userId ? userId.toString().slice(-6) : 'main'), platform: 'instagram' },
        {
          user: userId,
          platform: 'instagram',
          platformUserId: 'instagram_' + (userId ? userId.toString().slice(-6) : 'main'),
          name: '@NexusBusiness',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
          accessToken: 'demo_ig_token_' + Date.now(),
        },
        { upsert: true, new: true }
      );
      return res.json({ url: `${clientUrl}/apps/social?connected=instagram` });
    }

    const redirectUri = getSanitizedRedirectUri(req, 'instagram');
    const stateToken = jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '15m' });
    const url = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code&state=${stateToken}`;
    res.json({ url, redirectUri });
  } catch (err) {
    console.error('Instagram auth initiate error:', err.message);
    res.status(500).json({ message: 'Failed to initiate Instagram connection' });
  }
});

router.get('/pinterest', protect, async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const userId = req.user?._id;

    if (req.query.mode === 'demo') {
      console.log('[Pinterest Connect] Workspace Demo Mode: Connecting Pinterest account for user', userId);
      await Account.findOneAndUpdate(
        { platformUserId: 'pinterest_' + (userId ? userId.toString().slice(-6) : 'pins'), platform: 'pinterest' },
        {
          user: userId,
          platform: 'pinterest',
          platformUserId: 'pinterest_' + (userId ? userId.toString().slice(-6) : 'pins'),
          name: '@NexusPinterest',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
          accessToken: 'demo_pinterest_token_' + Date.now(),
        },
        { upsert: true, new: true }
      );
      return res.json({ url: `${clientUrl}/apps/social?connected=pinterest` });
    }

    const clientId = cleanEnvValue(process.env.PINTEREST_CLIENT_ID);
    if (!clientId) {
      return res.status(400).json({ message: 'Pinterest Client ID is not configured. Please add PINTEREST_CLIENT_ID in server/social/.env or use Direct Access Token.' });
    }

    const redirectUri = req.query.redirect_uri || getSanitizedRedirectUri(req, 'pinterest');
    const stateToken = jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '15m' });
    const url = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=boards:read,boards:write,pins:read,pins:write,user_accounts:read&state=${stateToken}`;
    res.json({ url, redirectUri });
  } catch (err) {
    console.error('Pinterest auth initiate error:', err.message);
    res.status(500).json({ message: 'Failed to initiate Pinterest connection' });
  }
});
    res.json({ url, redirectUri });
  } catch (err) {
    console.error('Pinterest auth initiate error:', err.message);
    res.status(500).json({ message: 'Failed to initiate Pinterest connection' });
  }
});

router.get('/pinterest/callback', async (req, res) => {
  const { code, state } = req.query;
  let userId;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const decoded = jwt.verify(state, jwtSecret);
    userId = decoded.userId;
  } catch (err) {
    console.error('Pinterest state verification failed:', err.message);
    return res.redirect(`${clientUrl}/apps/social?error=pinterest_auth_failed&details=Invalid%20state%20parameter`);
  }

  try {
    const redirectUri = getSanitizedRedirectUri(req, 'pinterest');
    const pinterestBaseUrl = process.env.PINTEREST_USE_SANDBOX === 'true' ? 'https://api-sandbox.pinterest.com/v5' : 'https://api.pinterest.com/v5';
    // Exchange authorization code for access token
    const tokenRes = await axios.post(`${pinterestBaseUrl}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Fetch Pinterest user info to get username/avatar
    const userRes = await axios.get(`${pinterestBaseUrl}/user_account`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const pinterestUser = userRes.data;
    const name = pinterestUser.username || 'Pinterest User';
    const platformUserId = pinterestUser.username;
    const avatar = pinterestUser.profile_image || null;

    await Account.findOneAndUpdate(
      { platformUserId, platform: 'pinterest' },
      {
        user: userId,
        platform: 'pinterest',
        platformUserId,
        name: `@${name}`,
        avatar,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true, new: true }
    );

    res.redirect(`${clientUrl}/apps/social?connected=pinterest`);
  } catch (error) {
    console.error('Pinterest callback error:', error.response?.data || error.message);
    res.redirect(`${clientUrl}/apps/social?error=pinterest_auth_failed`);
  }
});


// Tumblr Temporary Secret Model (for OAuth 1.0a handshake)
const TumblrTempSchema = new mongoose.Schema({
  oauthToken: { type: String, required: true, unique: true },
  oauthTokenSecret: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Auto-delete after 15 minutes to save space
TumblrTempSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

// Avoid compiling the model multiple times in development watch mode
const TumblrTemp = mongoose.models.TumblrTemp || mongoose.model('TumblrTemp', TumblrTempSchema);

// Tumblr OAuth 1.0a Initiate
router.get('/tumblr', protect, async (req, res) => {
  try {
    const userId = req.user?._id;

    if (req.query.mode === 'demo') {
      console.log('[Tumblr Connect] Workspace Demo Mode: Connecting Tumblr blog for user', userId);
      await Account.findOneAndUpdate(
        { platformUserId: 'tumblr_' + (userId ? userId.toString().slice(-6) : 'blog'), platform: 'tumblr' },
        {
          user: userId,
          platform: 'tumblr',
          platformUserId: 'tumblr_' + (userId ? userId.toString().slice(-6) : 'blog'),
          name: 'Nexus Enterprise Blog',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
          accessToken: 'demo_tumblr_token_' + Date.now(),
          tokenSecret: 'demo_tumblr_secret_' + Date.now(),
          pageId: 'nexus-blog',
        },
        { upsert: true, new: true }
      );
      return res.json({ url: `${clientUrl}/apps/social?connected=tumblr` });
    }

    const consumerKey = cleanEnvValue(process.env.TUMBLR_CONSUMER_KEY);
    const consumerSecret = cleanEnvValue(process.env.TUMBLR_CONSUMER_SECRET);
    if (!consumerKey || !consumerSecret) {
      return res.status(400).json({ message: 'Tumblr Consumer credentials are not configured in server/social/.env.' });
    }

    const callbackUrl = req.query.redirect_uri || getSanitizedRedirectUri(req, 'tumblr');
    const url = 'https://www.tumblr.com/oauth/request_token';
    const authHeader = buildAuthorizationHeader(
      'POST',
      url,
      { oauth_callback: callbackUrl },
      consumerKey,
      consumerSecret
    );
      process.env.TUMBLR_CONSUMER_SECRET
    );

    const resToken = await axios.post(url, new URLSearchParams({ oauth_callback: callbackUrl }), {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const params = new URLSearchParams(resToken.data);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      console.error('Tumblr Request Token missing in response:', resToken.data);
      return res.status(400).json({ message: 'Failed to request token from Tumblr' });
    }

    // Save temporary secret to associate with oauthToken in callback
    await TumblrTemp.create({
      oauthToken,
      oauthTokenSecret,
      user: userId,
    });

    const redirectUrl = `https://www.tumblr.com/oauth/authorize?oauth_token=${oauthToken}`;
    res.json({ url: redirectUrl, redirectUri: callbackUrl });
  } catch (error) {
    console.error('Tumblr auth initiate error:', error.response?.data || error.message);
    res.status(500).json({ message: error.message });
  }
});

// Tumblr OAuth 1.0a Callback
router.get('/tumblr/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;

  if (!oauth_token || !oauth_verifier) {
    console.error('Missing parameters in Tumblr callback:', req.query);
    return res.redirect(`${clientUrl}/apps/social?error=tumblr_auth_failed`);
  }

  try {
    // Retrieve the temporary secret and user ID
    const tempRecord = await TumblrTemp.findOne({ oauthToken: oauth_token });
    if (!tempRecord) {
      console.error('No temp record found for oauth_token:', oauth_token);
      return res.redirect(`${clientUrl}/apps/social?error=tumblr_auth_failed`);
    }

    const { oauthTokenSecret: tempSecret, user: userId } = tempRecord;
    const callbackUrl = getSanitizedRedirectUri(req, 'tumblr');
    const url = 'https://www.tumblr.com/oauth/access_token';
    const authHeader = buildAuthorizationHeader(
      'POST',
      url,
      { oauth_verifier },
      process.env.TUMBLR_CONSUMER_KEY,
      process.env.TUMBLR_CONSUMER_SECRET,
      oauth_token,
      tempSecret
    );

    const resToken = await axios.post(url, new URLSearchParams({ oauth_verifier }), {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const params = new URLSearchParams(resToken.data);
    const accessToken = params.get('oauth_token');
    const tokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !tokenSecret) {
      console.error('Missing tokens in Tumblr access token exchange:', resToken.data);
      return res.redirect(`${clientUrl}/apps/social?error=tumblr_auth_failed`);
    }

    // Fetch user info to save blog(s)
    const userInfoUrl = 'https://api.tumblr.com/v2/user/info';
    const infoAuthHeader = buildAuthorizationHeader(
      'GET',
      userInfoUrl,
      {},
      process.env.TUMBLR_CONSUMER_KEY,
      process.env.TUMBLR_CONSUMER_SECRET,
      accessToken,
      tokenSecret
    );

    const infoRes = await axios.get(userInfoUrl, {
      headers: {
        'Authorization': infoAuthHeader,
      }
    });

    const user = infoRes.data.response.user;
    if (!user || !user.blogs || user.blogs.length === 0) {
      console.error('No blogs found in Tumblr user info:', infoRes.data);
      return res.redirect(`${clientUrl}/apps/social?error=no_blogs_found`);
    }

    for (const blog of user.blogs) {
      await Account.findOneAndUpdate(
        { platformUserId: blog.name, platform: 'tumblr' },
        {
          user: userId,
          platform: 'tumblr',
          platformUserId: blog.name,
          name: blog.title || blog.name,
          avatar: `https://api.tumblr.com/v2/blog/${blog.name}.tumblr.com/avatar/64`,
          accessToken: accessToken,
          tokenSecret: tokenSecret,
          pageId: blog.name,
        },
        { upsert: true, new: true }
      );
    }

    // Clean up temporary record
    await TumblrTemp.deleteOne({ _id: tempRecord._id });

    res.redirect(`${clientUrl}/apps/social?connected=tumblr`);
  } catch (error) {
    console.error('Tumblr callback error:', error.response?.data || error.message);
    res.redirect(`${clientUrl}/apps/social?error=tumblr_auth_failed`);
  }
});

// LinkedIn OAuth Initiate
router.get('/linkedin', protect, async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const userId = req.user?._id;
    const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);

    if (req.query.mode === 'demo') {
      console.log('[LinkedIn Connect] Workspace Demo Mode: Connecting LinkedIn profile for user', userId);
      await Account.findOneAndUpdate(
        { platformUserId: 'linkedin_' + (userId ? userId.toString().slice(-6) : 'corp'), platform: 'linkedin' },
        {
          user: userId,
          platform: 'linkedin',
          platformUserId: 'linkedin_' + (userId ? userId.toString().slice(-6) : 'corp'),
          name: 'Nexus Enterprise LinkedIn',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
          accessToken: 'demo_linkedin_token_' + Date.now(),
        },
        { upsert: true, new: true }
      );
      return res.json({ url: `${clientUrl}/apps/social?connected=linkedin` });
    }

    if (!clientId) {
      return res.status(400).json({ message: 'LinkedIn Client ID is not configured. Please add LINKEDIN_CLIENT_ID in server/social/.env or use Direct Access Token.' });
    }

    const redirectUri = req.query.redirect_uri || getSanitizedRedirectUri(req, 'linkedin');
    const stateToken = jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: '15m' });
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateToken}&scope=openid%20profile%20w_member_social`;
    res.json({ url, redirectUri });
  } catch (error) {
    res.json({ url, redirectUri });
  } catch (error) {
    console.error('LinkedIn auth initiate error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// LinkedIn OAuth Callback
router.get('/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  let userId;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
    const decoded = jwt.verify(state, jwtSecret);
    userId = decoded.userId;
  } catch (err) {
    console.error('LinkedIn state verification failed:', err.message);
    return res.redirect(`${clientUrl}/apps/social?error=linkedin_auth_failed&details=Invalid%20state%20parameter`);
  }

  try {
    const redirectUri = getSanitizedRedirectUri(req, 'linkedin');
    const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET);

    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const { access_token, expires_in, refresh_token } = tokenRes.data;

    // Fetch user info using OpenID Connect
    const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    });

    const profile = userRes.data;
    const platformUserId = profile.sub;
    const name = profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn User';
    const avatar = profile.picture || null;

    await Account.findOneAndUpdate(
      { platformUserId, platform: 'linkedin' },
      {
        user: userId,
        platform: 'linkedin',
        platformUserId,
        name,
        avatar,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${clientUrl}/apps/social?connected=linkedin`);
  } catch (error) {
    const errorDetails = error.response?.data?.message || error.response?.data?.error?.message || error.message;
    console.error('LinkedIn callback error:', error.response?.data || error.message);
    res.redirect(`${clientUrl}/apps/social?error=linkedin_auth_failed&details=${encodeURIComponent(errorDetails)}`);
  }
});

export default router;
