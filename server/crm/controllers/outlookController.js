const User = require('../models/User');
const {
  getOutlookAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getMicrosoftGraphUser
} = require('../services/outlookService');
const { generateOutlookSignature } = require('../utils/emailFormatter');

// @desc    Generate Microsoft Azure OAuth 2.0 Authorization URL
// @route   GET /api/outlook/authorize
const getAuthUrl = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const clientId = req.query.clientId || user?.smtpConfig?.clientId;
    const tenantId = req.query.tenantId || user?.smtpConfig?.tenantId;
    const redirectUri = req.query.redirectUri || 'http://localhost:5173/auth/outlook/callback';

    if (!clientId || !clientId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Application (Client) ID is required. Please enter your Client ID in the Outlook connection settings.'
      });
    }

    const authUrl = getOutlookAuthUrl({
      clientId: clientId.trim(),
      tenantId: tenantId ? tenantId.trim() : 'common',
      redirectUri,
      state: String(req.user._id)
    });

    return res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate Microsoft Authorization URL'
    });
  }
};

// @desc    Handle OAuth 2.0 Callback and Exchange Authorization Code for Tokens
// @route   POST /api/outlook/callback
const handleCallback = async (req, res, next) => {
  try {
    const { code, clientId, clientSecret, tenantId, redirectUri } = req.body;

    const user = await User.findById(req.user._id);
    const effectiveClientId = (clientId || user?.smtpConfig?.clientId || '').trim();
    const effectiveClientSecret = (clientSecret || user?.smtpConfig?.clientSecret || user?.smtpConfig?.pass || '').trim();
    const effectiveTenantId = (tenantId || user?.smtpConfig?.tenantId || '').trim();
    const effectiveRedirectUri = (redirectUri || 'http://localhost:5173/auth/outlook/callback').trim();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization Code is required' });
    }
    if (!effectiveClientId) {
      return res.status(400).json({ success: false, message: 'Application (Client) ID is required' });
    }
    if (!effectiveClientSecret) {
      return res.status(400).json({ success: false, message: 'Client Secret is required' });
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens({
      code,
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      tenantId: effectiveTenantId,
      redirectUri: effectiveRedirectUri
    });

    // Fetch account info from Graph API
    const graphUser = await getMicrosoftGraphUser(tokenData.access_token);
    const userEmail = graphUser.mail || graphUser.userPrincipalName || '';
    const displayName = graphUser.displayName || user.name || '';
    const jobTitle = graphUser.jobTitle || user.smtpConfig?.jobTitle || '';
    const phone = graphUser.mobilePhone || (graphUser.businessPhones && graphUser.businessPhones[0]) || user.smtpConfig?.phone || '';
    const companyName = graphUser.companyName || graphUser.department || user.smtpConfig?.companyName || '';

    const autoSignature = generateOutlookSignature({
      displayName,
      jobTitle,
      companyName,
      email: userEmail,
      phone
    });

    // Update user SMTP configuration
    user.smtpConfig = {
      ...user.smtpConfig,
      authType: 'oauth2',
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      user: userEmail || user.smtpConfig?.user || '',
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      tenantId: effectiveTenantId,
      refreshToken: tokenData.refresh_token || user.smtpConfig?.refreshToken || '',
      fromName: displayName || user.smtpConfig?.fromName || '',
      jobTitle: jobTitle || user.smtpConfig?.jobTitle || '',
      phone: phone || user.smtpConfig?.phone || '',
      companyName: companyName || user.smtpConfig?.companyName || '',
      signature: user.smtpConfig?.signature || autoSignature,
      includeSignature: user.smtpConfig?.includeSignature !== undefined ? user.smtpConfig.includeSignature : true,
      needsReauth: false,
      authError: ''
    };

    await user.save();

    return res.json({
      success: true,
      message: `Successfully connected Microsoft Outlook account (${userEmail || displayName})!`,
      userEmail,
      displayName,
      signature: user.smtpConfig.signature
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to exchange Microsoft authorization code'
    });
  }
};

// @desc    Test Microsoft Outlook OAuth Connection using Refresh Token & Microsoft Graph /me
// @route   POST /api/outlook/test-connection
const testOAuthConnection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const clientId = (req.body.clientId || user?.smtpConfig?.clientId || '').trim();
    const clientSecret = (req.body.clientSecret || req.body.pass || user?.smtpConfig?.clientSecret || user?.smtpConfig?.pass || '').trim();
    const tenantId = (req.body.tenantId || user?.smtpConfig?.tenantId || '').trim();
    const refreshToken = (req.body.refreshToken || user?.smtpConfig?.refreshToken || '').trim();

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Application (Client) ID is required for OAuth connection test.' });
    }
    if (!clientSecret) {
      return res.status(400).json({ success: false, message: 'Client Secret is required for OAuth connection test.' });
    }
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'No Microsoft Refresh Token found. Please click "Connect Outlook" to authorize with Microsoft.' });
    }

    // Refresh token with Microsoft OAuth endpoint
    const tokenData = await refreshAccessToken({
      refreshToken,
      clientId,
      clientSecret,
      tenantId
    });

    // Test calling Microsoft Graph /v1.0/me
    const graphUser = await getMicrosoftGraphUser(tokenData.access_token);
    const connectedAccount = graphUser.mail || graphUser.userPrincipalName || graphUser.displayName;

    const signature = generateOutlookSignature({
      displayName: graphUser.displayName || user?.name || '',
      jobTitle: graphUser.jobTitle || user?.smtpConfig?.jobTitle || '',
      companyName: graphUser.companyName || user?.smtpConfig?.companyName || '',
      email: graphUser.mail || graphUser.userPrincipalName || user?.smtpConfig?.user || '',
      phone: graphUser.mobilePhone || (graphUser.businessPhones && graphUser.businessPhones[0]) || user?.smtpConfig?.phone || ''
    });

    return res.json({
      success: true,
      message: `Successfully verified Microsoft Outlook connection via Graph API /me as ${connectedAccount}!`,
      graphUser: {
        displayName: graphUser.displayName,
        mail: graphUser.mail,
        userPrincipalName: graphUser.userPrincipalName,
        jobTitle: graphUser.jobTitle,
        phone: graphUser.mobilePhone || (graphUser.businessPhones && graphUser.businessPhones[0]),
        companyName: graphUser.companyName
      },
      suggestedSignature: signature
    });
  } catch (error) {
    // Return exact Microsoft AADSTS error description to frontend
    return res.status(400).json({
      success: false,
      message: error.message || 'Microsoft Outlook OAuth connection test failed'
    });
  }
};

// @desc    Generate / Preview auto Outlook signature
// @route   POST /api/outlook/generate-signature
const generateSignature = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { displayName, jobTitle, companyName, email, phone, website } = req.body;

    const signature = generateOutlookSignature({
      displayName: displayName || user?.smtpConfig?.fromName || user?.name || '',
      jobTitle: jobTitle || user?.smtpConfig?.jobTitle || '',
      companyName: companyName || user?.smtpConfig?.companyName || '',
      email: email || user?.smtpConfig?.user || user?.email || '',
      phone: phone || user?.smtpConfig?.phone || '',
      website: website || user?.smtpConfig?.website || ''
    });

    res.json({
      success: true,
      signature
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuthUrl,
  handleCallback,
  testOAuthConnection,
  generateSignature
};
