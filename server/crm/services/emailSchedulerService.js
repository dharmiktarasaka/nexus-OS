const nodemailer = require('nodemailer');
const ScheduledEmail = require('../models/ScheduledEmail');

// Helper to normalize SMTP Host
const normalizeSmtpHost = (inputHost, inputUser) => {
  let hostStr = inputHost ? String(inputHost).trim() : '';

  if (!hostStr || hostStr.includes('@')) {
    const emailToUse = hostStr.includes('@') ? hostStr : (inputUser ? String(inputUser).trim() : '');
    if (emailToUse.includes('@')) {
      const domain = emailToUse.split('@')[1].trim().toLowerCase();
      if (domain.includes('gmail')) return 'smtp.gmail.com';
      if (domain.includes('yahoo')) return 'smtp.mail.yahoo.com';
      if (domain.includes('zoho')) return 'smtp.zoho.com';
      return 'smtp.office365.com';
    }
    return 'smtp.office365.com';
  }

  const lower = hostStr.toLowerCase();
  if (lower === 'gmail.com' || lower.includes('gmail')) return 'smtp.gmail.com';
  if (lower === 'outlook.com' || lower === 'hotmail.com' || lower === 'office365.com' || lower.includes('outlook') || lower.includes('office365')) return 'smtp.office365.com';
  if (lower === 'yahoo.com' || lower.includes('yahoo')) return 'smtp.mail.yahoo.com';
  if (lower === 'zoho.com' || lower.includes('zoho')) return 'smtp.zoho.com';

  if (!lower.startsWith('smtp.') && !lower.startsWith('mail.')) {
    return `smtp.${hostStr}`;
  }

  return hostStr;
};

// Helper for dynamic variable interpolation
const interpolate = (text, dataObj) => {
  if (!text) return '';
  let result = text;
  if (dataObj && typeof dataObj === 'object') {
    Object.keys(dataObj).forEach(key => {
      const val = dataObj[key] !== undefined && dataObj[key] !== null ? String(dataObj[key]) : '';
      const keyRegex = new RegExp(`\\{\\{\\s*${key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\s*\\}\\}`, 'gi');
      result = result.replace(keyRegex, val);
    });
  }
  result = result.replace(/\{\{\s*([a-zA-Z0-9_\-\s]+)\s*\}\}/g, (match, p1) => {
    const cleanKey = p1.trim();
    return dataObj[cleanKey] !== undefined && dataObj[cleanKey] !== null ? String(dataObj[cleanKey]) : match;
  });
  return result;
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isSchedulerRunning = false;

const processScheduledEmails = async () => {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  try {
    const dueEmails = await ScheduledEmail.find({
      status: 'PENDING',
      scheduledFor: { $lte: new Date() }
    }).sort({ scheduledFor: 1 }).limit(50);

    if (dueEmails.length === 0) {
      isSchedulerRunning = false;
      return;
    }

    console.log(`[EmailScheduler] Found ${dueEmails.length} due scheduled emails/follow-ups to process.`);

    for (let i = 0; i < dueEmails.length; i++) {
      const item = dueEmails[i];

      // 1. Check if recipient has already replied (auto-deny / cancel follow-up)
      const recipientLower = (item.recipientEmail || '').toLowerCase().trim();
      const Email = require('../models/Email');
      const hasReplied = await Email.findOne({
        companyId: item.companyId,
        folder: 'INBOX',
        direction: 'INCOMING',
        'from.email': recipientLower
      });

      if (hasReplied) {
        console.log(`[EmailScheduler] Auto-Denying follow-up for ${recipientLower} because recipient replied with subject "${hasReplied.subject}" on ${new Date(hasReplied.receivedAt || hasReplied.createdAt).toLocaleString()}`);
        item.status = 'DENIED';
        item.errorMessage = `Auto-cancelled: Recipient replied to your email on ${new Date(hasReplied.receivedAt || hasReplied.createdAt).toLocaleDateString()}.`;
        await item.save();

        // Also cancel all other pending follow-ups for this recipient
        await ScheduledEmail.updateMany(
          {
            companyId: item.companyId,
            recipientEmail: recipientLower,
            status: 'PENDING'
          },
          {
            $set: {
              status: 'DENIED',
              errorMessage: `Auto-cancelled: Recipient replied to your email.`
            }
          }
        );
        continue;
      }

      // Mark processing
      item.status = 'PROCESSING';
      await item.save();

      const smtp = item.smtpConfig;
      const targetHost = normalizeSmtpHost(smtp.host, smtp.user);
      const portNum = smtp.port ? parseInt(smtp.port, 10) : 587;
      const isSecure = smtp.secure !== undefined ? Boolean(smtp.secure) : (portNum === 465);

      try {
        const { formatEmailHtml } = require('../utils/emailFormatter');
        const personalizedSubject = interpolate(item.subject, item.recipientData || {});
        const rawPersonalizedBody = interpolate(item.body, item.recipientData || {});
        const formattedHtmlBody = formatEmailHtml(
          rawPersonalizedBody,
          smtp.signature || '',
          smtp.includeSignature !== undefined ? smtp.includeSignature : true
        );

        const isOAuth2 = smtp.authType === 'oauth2' && Boolean(smtp.clientId && (smtp.clientSecret || smtp.pass) && smtp.refreshToken && String(smtp.refreshToken).trim());

        if (isOAuth2) {
          const { refreshAccessToken, sendMailViaGraph } = require('./outlookService');
          const tokenData = await refreshAccessToken({
            refreshToken: String(smtp.refreshToken).trim(),
            clientId: String(smtp.clientId).trim(),
            clientSecret: String(smtp.clientSecret || smtp.pass).trim(),
            tenantId: (smtp.tenantId && String(smtp.tenantId).trim()) ? String(smtp.tenantId).trim() : 'common'
          });

          await sendMailViaGraph({
            accessToken: tokenData.access_token,
            to: item.recipientEmail,
            subject: personalizedSubject || 'Follow-Up Update',
            body: formattedHtmlBody,
            fromName: smtp.fromName
          });
        } else {
          const authObj = {
            user: String(smtp.user).trim(),
            pass: String(smtp.pass).trim()
          };

          const transporter = nodemailer.createTransport({
            host: targetHost || 'smtp.office365.com',
            port: portNum,
            secure: isSecure,
            auth: authObj,
            tls: {
              rejectUnauthorized: false
            }
          });

          const fromAddress = smtp.fromName
            ? `"${smtp.fromName}" <${smtp.user}>`
            : smtp.user;

          await transporter.sendMail({
            from: fromAddress,
            to: item.recipientEmail,
            subject: personalizedSubject || 'Follow-Up Update',
            html: formattedHtmlBody
          });
        }

        item.status = 'SENT';
        item.sentAt = new Date();
        await item.save();
        console.log(`[EmailScheduler] Successfully sent ${item.type} email to ${item.recipientEmail}`);

      } catch (err) {
        console.error(`[EmailScheduler] Failed to send email to ${item.recipientEmail}:`, err.message);
        item.status = 'FAILED';
        item.errorMessage = err.message || 'SMTP Dispatch Failed';
        await item.save();
      }

      // Anti-Spam Throttling Delay: 5 to 10 seconds random pause before processing next email
      if (i < dueEmails.length - 1) {
        const randomDelay = Math.floor(Math.random() * 5000) + 5000; // 5000ms to 10000ms
        console.log(`[EmailScheduler] Anti-spam throttling: Waiting ${Math.round(randomDelay / 1000)}s before next mail...`);
        await sleep(randomDelay);
      }
    }
  } catch (error) {
    console.error('[EmailScheduler] Error in scheduler loop:', error);
  } finally {
    isSchedulerRunning = false;
  }
};

const formatSmtpError = (error, host) => {
  const msg = error?.message || String(error);
  if (msg.includes("Can't create new access token") || msg.includes('xoauth2')) {
    return `OAuth Authentication Error: Refresh Token is missing or expired. Please use standard Email and Password/App Password.`;
  }
  if (msg.includes('AADSTS90027')) {
    return `Microsoft Azure OAuth Error: Tenant ID is required. Please enter your Directory (Tenant) ID from your Azure Portal.`;
  }
  if (msg.includes('AADSTS7000215') || msg.includes('Invalid client secret')) {
    return `Microsoft Azure OAuth Error: Invalid Client Secret. Please verify your Client Secret in your Azure App Registration.`;
  }
  if (msg.includes('invalid_client') || msg.includes('OAuth client was not found') || msg.includes('AADSTS700016')) {
    return `Microsoft Azure OAuth Error: Invalid Client ID. Please verify your Application (Client) ID and Directory (Tenant) ID.`;
  }
  if (msg.includes('invalid_grant') || msg.includes('AADSTS')) {
    return `Microsoft Azure OAuth Error (${msg}). Please verify your Azure App Registration credentials.`;
  }
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_FAIL' || error.code === 'EAI_AGAIN' || msg.includes('getaddrinfo')) {
    return `Invalid Host Server (${host}). Please use 'smtp.office365.com' for Outlook or 'smtp.gmail.com' for Gmail.`;
  }
  if (msg.includes('535') || msg.includes('Authentication failed') || msg.includes('Invalid login') || msg.includes('5.7.139') || msg.includes('5.7.3')) {
    return `Authentication failed for ${host}. Please check your email and password. For Outlook / Office 365, if 2-Factor Authentication (2FA) is enabled, please use an App Password or ensure SMTP AUTH is enabled for your mailbox.`;
  }
  return msg || 'Failed to authenticate with mail server';
};

const verifyMailConnection = async (smtp) => {
  const userEmail = smtp.user ? String(smtp.user).trim() : '';
  if (!userEmail) {
    throw new Error('User Email Address is required');
  }

  const targetHost = normalizeSmtpHost(smtp.host, userEmail) || 'smtp.office365.com';
  const portNum = smtp.port ? parseInt(smtp.port, 10) : 587;
  const isSecure = smtp.secure !== undefined ? Boolean(smtp.secure) : (portNum === 465);

  const errors = [];
  const isOAuth2Mode = smtp.authType === 'oauth2';

  // OAuth2 Strategy (Only when user explicitly selected OAuth2 mode)
  if (isOAuth2Mode) {
    const { refreshAccessToken, getMicrosoftGraphUser } = require('./outlookService');
    const clientId = (smtp.clientId || '').trim();
    const clientSecret = (smtp.clientSecret || smtp.pass || '').trim();
    const tenantId = (smtp.tenantId || '').trim();
    const refreshToken = (smtp.refreshToken || '').trim();

    if (!clientId) throw new Error('Application (Client) ID is required for OAuth2');
    if (!clientSecret) throw new Error('Client Secret is required for OAuth2');
    if (!refreshToken) throw new Error('Microsoft Refresh Token is missing. Please click "Connect Outlook" to authorize.');

    const tokenData = await refreshAccessToken({
      refreshToken,
      clientId,
      clientSecret,
      tenantId
    });

    const graphUser = await getMicrosoftGraphUser(tokenData.access_token);
    return { targetHost: 'graph.microsoft.com', isOAuth2: true, accessToken: tokenData.access_token, graphUser };
  }

  // Standard Password / App Password Strategy
  const passwordToUse = String(smtp.pass || smtp.clientSecret || '').trim();
  if (!passwordToUse) {
    throw new Error('Password or App Password is required');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: portNum,
      secure: isSecure,
      auth: {
        user: userEmail,
        pass: passwordToUse
      },
      tls: { rejectUnauthorized: false }
    });
    await transporter.verify();
    return { targetHost, transporter };
  } catch (err) {
    throw err;
  }
};

const startEmailScheduler = () => {
  console.log('[EmailScheduler] Background scheduler initialized (Follow-up processor 20s, Live Inbox Sync 60s)...');
  const { syncAllActiveInboxes } = require('./imapSyncService');

  // Initial check on boot
  processScheduledEmails();
  setTimeout(syncAllActiveInboxes, 5000);

  // Interval for follow-up dispatching every 20 seconds
  setInterval(processScheduledEmails, 20000);

  // Interval for live inbox sync every 60 seconds
  setInterval(syncAllActiveInboxes, 60000);
};

module.exports = {
  startEmailScheduler,
  processScheduledEmails,
  normalizeSmtpHost,
  verifyMailConnection,
  formatSmtpError
};
