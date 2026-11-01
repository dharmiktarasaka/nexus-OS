const User = require('../models/User');
const {
  getLinkedInAuthUrl,
  exchangeCodeForTokens,
  getLinkedInUserProfile,
  extractLinkedInLeads,
  extractLinkedInIntentPosts
} = require('../services/linkedinService');

// @desc    Generate LinkedIn OAuth 2.0 Authorization URL
// @route   GET /api/linkedin/auth-url
// @access  Private
const getAuthUrl = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const clientId = req.query.clientId || user?.linkedinConfig?.clientId || process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = req.query.redirectUri || 'http://localhost:5173/auth/linkedin/callback';
    const scope = req.query.scope || user?.linkedinConfig?.scope || 'openid profile email';

    if (!clientId || !clientId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn Client ID is required. Please enter your LinkedIn Developer App Client ID.'
      });
    }

    const authUrl = getLinkedInAuthUrl({
      clientId: clientId.trim(),
      redirectUri,
      state: String(req.user._id),
      scope: scope.trim()
    });

    return res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate LinkedIn Authorization URL'
    });
  }
};

// @desc    Handle LinkedIn OAuth 2.0 Callback
// @route   POST /api/linkedin/callback
// @access  Private
const handleCallback = async (req, res) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = req.body;
    const user = await User.findById(req.user._id);

    const effectiveClientId = (clientId || user?.linkedinConfig?.clientId || process.env.LINKEDIN_CLIENT_ID || '').trim();
    const effectiveClientSecret = (clientSecret || user?.linkedinConfig?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '').trim();
    const effectiveRedirectUri = (redirectUri || 'http://localhost:5173/auth/linkedin/callback').trim();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }
    if (!effectiveClientId || !effectiveClientSecret) {
      return res.status(400).json({ success: false, message: 'LinkedIn Client ID and Secret are required' });
    }

    const tokens = await exchangeCodeForTokens({
      code,
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      redirectUri: effectiveRedirectUri
    });

    const profile = await getLinkedInUserProfile(tokens.access_token);

    user.linkedinConfig = {
      isConnected: true,
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresIn: tokens.expires_in,
      profile: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        sub: profile.sub
      },
      connectedAt: new Date()
    };

    await user.save();

    return res.json({
      success: true,
      message: `Successfully connected LinkedIn account: ${profile.name}!`,
      profile
    });
  } catch (error) {
    console.error('LinkedIn Callback Error:', error);
    return res.status(400).json({
      success: false,
      message: error.response?.data?.error_description || error.message || 'Failed to complete LinkedIn connection'
    });
  }
};

// @desc    Get current LinkedIn connection status
// @route   GET /api/linkedin/status
// @access  Private
const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const config = user?.linkedinConfig || {};

    return res.json({
      success: true,
      isConnected: Boolean(config.isConnected && config.accessToken),
      profile: config.profile || null,
      clientId: config.clientId || '',
      scope: config.scope || 'openid profile email',
      connectedAt: config.connectedAt || null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Disconnect LinkedIn Account
// @route   POST /api/linkedin/disconnect
// @access  Private
const disconnect = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.linkedinConfig = {
        isConnected: false,
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: '',
        profile: null
      };
      await user.save();
    }

    return res.json({
      success: true,
      message: 'LinkedIn account disconnected successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search and extract qualified leads from LinkedIn
// @route   POST /api/linkedin/search-leads
// @access  Private
const searchLinkedInLeads = async (req, res) => {
  try {
    const { niche, targetCity, targetCountry = 'Global', targetCount = 20 } = req.body;

    if (!niche || !targetCity) {
      return res.status(400).json({
        success: false,
        message: 'Target Niche and City are required'
      });
    }

    const leads = await extractLinkedInLeads({
      niche: niche.trim(),
      targetCity: targetCity.trim(),
      targetCountry,
      targetCount: parseInt(targetCount, 10) || 20
    });

    return res.json({
      success: true,
      leads,
      count: leads.length
    });
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract LinkedIn leads'
    });
  }
};

// @desc    Save LinkedIn App Client ID & Secret & Scope
// @route   POST /api/linkedin/config
// @access  Private
const saveConfig = async (req, res) => {
  try {
    const { clientId, clientSecret, scope } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.linkedinConfig) {
      user.linkedinConfig = {};
    }

    if (clientId !== undefined) {
      user.linkedinConfig.clientId = String(clientId).trim();
    }
    if (clientSecret !== undefined && clientSecret.trim()) {
      user.linkedinConfig.clientSecret = String(clientSecret).trim();
    }
    if (scope !== undefined && scope.trim()) {
      user.linkedinConfig.scope = String(scope).trim();
    }

    await user.save();

    return res.json({
      success: true,
      message: 'LinkedIn configuration saved successfully',
      clientId: user.linkedinConfig.clientId,
      scope: user.linkedinConfig.scope
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save LinkedIn configuration'
    });
  }
};

// @desc    Search live LinkedIn posts for buying intent and hiring leads
// @route   POST /api/linkedin/search-posts
// @access  Private
const searchLinkedInPosts = async (req, res) => {
  try {
    const { niche, targetLocation = 'Global', targetCount = 15 } = req.body;

    if (!niche || !niche.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Target Niche / Service requirement is required (e.g. Website Development)'
      });
    }

    const user = await User.findById(req.user._id);
    const linkedinConfig = user?.linkedinConfig || {};

    const leads = await extractLinkedInIntentPosts({
      niche: niche.trim(),
      targetLocation: targetLocation ? targetLocation.trim() : 'Global',
      targetCount: parseInt(targetCount, 10) || 15,
      accessToken: linkedinConfig.accessToken || '',
      userProfile: linkedinConfig.profile || null
    });

    return res.json({
      success: true,
      leads,
      count: leads.length
    });
  } catch (error) {
    console.error('LinkedIn post search error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract live LinkedIn intent leads'
    });
  }
};

module.exports = {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  searchLinkedInLeads,
  searchLinkedInPosts,
  saveConfig
};
