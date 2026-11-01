const axios = require('axios');

/**
 * Parses Microsoft Azure OAuth Token Error response and extracts exact AADSTS error details.
 */
const parseMicrosoftError = (err) => {
  if (err.response && err.response.data) {
    const data = err.response.data;
    if (data.error_description) {
      if (data.error_description.includes('AADSTS65001')) {
        return 'Microsoft Permissions Required (AADSTS65001): Please click "Connect Outlook" to grant consent for Mail Read & Send permissions.';
      }
      return data.error_description;
    }
    if (data.error) {
      return `Microsoft OAuth Error: ${data.error}`;
    }
  }
  return err.message || 'Microsoft OAuth authentication failed';
};

/**
 * Constructs the Microsoft OAuth 2.0 Authorization URL
 */
const getOutlookAuthUrl = ({ clientId, tenantId, redirectUri, state }) => {
  if (!clientId || !clientId.trim()) {
    throw new Error('Application (Client) ID is required to initiate Microsoft authorization');
  }

  const tenant = (tenantId && tenantId.trim()) ? tenantId.trim() : 'common';
  const defaultRedirect = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL.replace(/\/+$/, '')}/auth/outlook/callback`
    : 'http://localhost:5173/auth/outlook/callback';
  const rUri = (redirectUri && redirectUri.trim()) ? redirectUri.trim() : defaultRedirect;
  const scopes = 'openid profile email offline_access User.Read Mail.Send Mail.Read Mail.ReadWrite';

  const params = new URLSearchParams({
    client_id: clientId.trim(),
    response_type: 'code',
    redirect_uri: rUri,
    response_mode: 'query',
    scope: scopes,
    prompt: 'consent',
    state: state || ''
  });

  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
};

/**
 * Exchanges Microsoft Authorization Code for Access Token and Refresh Token
 */
const exchangeCodeForTokens = async ({ code, clientId, clientSecret, tenantId, redirectUri }) => {
  if (!code) throw new Error('Authorization Code is required');
  if (!clientId) throw new Error('Application (Client) ID is required');
  if (!clientSecret) throw new Error('Client Secret is required');

  const tenant = (tenantId && tenantId.trim()) ? tenantId.trim() : 'common';
  const defaultRedirect = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL.replace(/\/+$/, '')}/auth/outlook/callback`
    : 'http://localhost:5173/auth/outlook/callback';
  const rUri = (redirectUri && redirectUri.trim()) ? redirectUri.trim() : defaultRedirect;

  const params = new URLSearchParams();
  params.append('client_id', clientId.trim());
  params.append('client_secret', clientSecret.trim());
  params.append('code', code.trim());
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', rUri);
  params.append('scope', 'openid profile email offline_access User.Read Mail.Send Mail.Read Mail.ReadWrite');

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data; // { access_token, refresh_token, expires_in, scope, id_token, token_type }
  } catch (err) {
    throw new Error(parseMicrosoftError(err));
  }
};

/**
 * Refreshes Access Token using Refresh Token from Microsoft OAuth Endpoint
 */
const refreshAccessToken = async ({ refreshToken, clientId, clientSecret, tenantId }) => {
  if (!refreshToken || !refreshToken.trim()) {
    throw new Error('Refresh Token is required for OAuth2 authentication');
  }
  if (!clientId || !clientId.trim()) {
    throw new Error('Application (Client) ID is required');
  }
  if (!clientSecret || !clientSecret.trim()) {
    throw new Error('Client Secret is required');
  }

  // Reject obvious non-OAuth manual dummy text strings (e.g. "tarasaka_BDE")
  const trimmedToken = refreshToken.trim();
  if (trimmedToken.length < 20 || trimmedToken.includes(' ') || !/^[A-Za-z0-9_\-\.\:\+]+$/.test(trimmedToken)) {
    throw new Error('Invalid Microsoft Refresh Token format. Please click "Connect Outlook" to authorize with Microsoft.');
  }

  const tenant = (tenantId && tenantId.trim()) ? tenantId.trim() : 'common';

  const params = new URLSearchParams();
  params.append('client_id', clientId.trim());
  params.append('client_secret', clientSecret.trim());
  params.append('refresh_token', trimmedToken);
  params.append('grant_type', 'refresh_token');

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data; // { access_token, refresh_token, expires_in, scope }
  } catch (err) {
    throw new Error(parseMicrosoftError(err));
  }
};

/**
 * Calls Microsoft Graph API /v1.0/me to fetch connected account info
 */
const getMicrosoftGraphUser = async (accessToken) => {
  if (!accessToken) throw new Error('Access Token is required');

  try {
    const response = await axios.get(
      'https://graph.microsoft.com/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,mobilePhone,businessPhones,officeLocation,companyName,department',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    return response.data;
  } catch (err) {
    // Fallback to basic /me if select query fails
    try {
      const basicResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return basicResponse.data;
    } catch (fallbackErr) {
      throw new Error(parseMicrosoftError(err));
    }
  }
};

/**
 * Sends an email using Microsoft Graph API POST /v1.0/me/sendMail
 */
const sendMailViaGraph = async ({ accessToken, to, subject, body, fromName }) => {
  if (!accessToken) throw new Error('Access Token is required to send mail via Graph API');
  if (!to) throw new Error('Recipient email address is required');

  const payload = {
    message: {
      subject: subject || '(No Subject)',
      body: {
        contentType: 'HTML',
        content: body || ''
      },
      toRecipients: [
        {
          emailAddress: {
            address: String(to).trim()
          }
        }
      ]
    },
    saveToSentItems: 'true'
  };

  try {
    await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (err) {
    throw new Error(parseMicrosoftError(err));
  }
};

module.exports = {
  getOutlookAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getMicrosoftGraphUser,
  sendMailViaGraph,
  parseMicrosoftError
};
