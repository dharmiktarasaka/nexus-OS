const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
const axios = require('axios');
const Email = require('../models/Email');
const ScheduledEmail = require('../models/ScheduledEmail');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { refreshAccessToken } = require('./outlookService');

// Normalize IMAP host from SMTP host or email address
const resolveImapHost = (smtpHost, userEmail) => {
  const email = (userEmail || '').toLowerCase();
  const host = (smtpHost || '').toLowerCase();

  if (email.includes('gmail.com') || host.includes('gmail.com')) return 'imap.gmail.com';
  if (email.includes('outlook.com') || email.includes('hotmail.com') || email.includes('office365.com') || host.includes('office365.com') || host.includes('outlook.com')) return 'outlook.office365.com';
  if (email.includes('yahoo.com') || host.includes('yahoo.com')) return 'imap.mail.yahoo.com';
  if (email.includes('zoho.com') || host.includes('zoho.com')) return 'imap.zoho.com';

  if (host.startsWith('smtp.')) {
    return host.replace(/^smtp\./i, 'imap.');
  }
  if (host.startsWith('mail.')) {
    return host;
  }
  return host ? `imap.${host}` : 'outlook.office365.com';
};

// Helper to strip HTML tags for plain text search
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s{2,}/g, ' ').trim();
};

// Track warned users to avoid spamming the console every 60s
const warnedMailboxForbiddenUsers = new Set();

/**
 * Automatically deny/cancel any pending follow-ups when a reply is received
 */
const autoDenyPendingFollowUpsForSender = async ({ companyId, senderEmail, receivedDate, subject, threadId }) => {
  if (!senderEmail || !senderEmail.includes('@')) return 0;

  const normalizedSender = senderEmail.toLowerCase().trim();

  // Find all pending scheduled follow-ups for this recipient email
  const pendingFollowUps = await ScheduledEmail.find({
    companyId,
    recipientEmail: normalizedSender,
    status: 'PENDING'
  });

  if (pendingFollowUps.length === 0) return 0;

  const reason = `Auto-Denied: Recipient replied on ${new Date(receivedDate || Date.now()).toLocaleString()}`;

  const updateRes = await ScheduledEmail.updateMany(
    {
      companyId,
      recipientEmail: normalizedSender,
      status: 'PENDING'
    },
    {
      $set: {
        status: 'DENIED',
        errorMessage: reason
      }
    }
  );

  console.log(`[AutoDeny] Successfully cancelled ${updateRes.modifiedCount} pending follow-up(s) for recipient ${normalizedSender} due to incoming reply.`);

  // Mark outgoing sent email in unified thread as REPLIED
  try {
    await Email.updateMany(
      {
        companyId,
        'to.email': normalizedSender,
        direction: 'OUTGOING',
        status: 'SENT'
      },
      {
        $set: { status: 'REPLIED' }
      }
    );
  } catch (err) {
    // Non-blocking
  }

  return updateRes.modifiedCount || 0;
};

/**
 * Sync Microsoft Graph API Inbox (Outlook 365 OAuth2)
 */
const syncOutlookGraphInbox = async (user) => {
  const smtp = user?.smtpConfig || {};
  if (!smtp.clientId || !smtp.refreshToken) return { count: 0, deniedFollowUps: 0 };

  // Skip syncing if already flagged as needing re-authentication until user connects again
  if (smtp.needsReauth) {
    return { count: 0, deniedFollowUps: 0 };
  }

  try {
    const tokenData = await refreshAccessToken({
      refreshToken: String(smtp.refreshToken).trim(),
      clientId: String(smtp.clientId).trim(),
      clientSecret: String(smtp.clientSecret || smtp.pass).trim(),
      tenantId: smtp.tenantId || 'common'
    });

    let rawMessages = [];
    let isMailboxForbidden = false;

    // 1. Try querying /me/mailFolders/inbox/messages
    try {
      const inboxRes = await axios.get(
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
          timeout: 15000
        }
      );
      if (Array.isArray(inboxRes.data?.value)) {
        rawMessages.push(...inboxRes.data.value);
      }
    } catch (inboxFolderErr) {
      if (inboxFolderErr.response?.status === 403) {
        isMailboxForbidden = true;
      } else {
        console.warn(`[Graph Inbox User ${user.email}]:`, inboxFolderErr.message);
      }
    }

    // 2. Also query /me/messages to capture Focused, Other, and all incoming replies
    try {
      const allRes = await axios.get(
        'https://graph.microsoft.com/v1.0/me/messages?$top=100&$orderby=receivedDateTime desc',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
          timeout: 15000
        }
      );
      if (Array.isArray(allRes.data?.value)) {
        for (const m of allRes.data.value) {
          if (!rawMessages.some(existing => existing.id === m.id)) {
            rawMessages.push(m);
          }
        }
      }
    } catch (allFolderErr) {
      if (allFolderErr.response?.status === 403) {
        isMailboxForbidden = true;
      } else {
        console.warn(`[Graph All Messages User ${user.email}]:`, allFolderErr.message);
      }
    }

    if (rawMessages.length === 0 && isMailboxForbidden) {
      if (!warnedMailboxForbiddenUsers.has(String(user._id || user.email))) {
        warnedMailboxForbiddenUsers.add(String(user._id || user.email));
        console.warn(`[GraphSync Notice] User ${user.email}: Mailbox read access is not permitted (403 Forbidden). Inbox sync skipped (account can still send emails if Mail.Send is permitted).`);
      }
      return { count: 0, deniedFollowUps: 0 };
    }

    let fetchedCount = 0;
    let totalDenied = 0;

    for (const msg of rawMessages) {
      const senderEmail = msg.from?.emailAddress?.address?.toLowerCase()?.trim() || '';
      const senderName = msg.from?.emailAddress?.name || '';
      const subject = msg.subject || '(No Subject)';
      const body = msg.body?.content || msg.bodyPreview || '';
      const receivedDate = new Date(msg.receivedDateTime || Date.now());
      const conversationId = msg.conversationId || `graph_${msg.id}`;

      // Skip self-sent emails from user's own email address
      const selfEmail = (smtp.user || user.email || '').toLowerCase().trim();
      if (!senderEmail || senderEmail === selfEmail) continue;

      // Check if this incoming email is already stored
      const existing = await Email.findOne({
        companyId: user.companyId,
        userId: user._id,
        direction: 'INCOMING',
        'from.email': senderEmail,
        subject,
        receivedAt: receivedDate
      });

      if (!existing) {
        const matchedSent = await Email.findOne({
          companyId: user.companyId,
          direction: 'OUTGOING',
          'to.email': senderEmail
        }).sort({ createdAt: -1 });

        const matchedLead = await Lead.findOne({
          companyId: user.companyId,
          email: senderEmail
        });

        await Email.create({
          companyId: user.companyId,
          userId: user._id,
          folder: 'INBOX',
          from: { name: senderName, email: senderEmail },
          to: [{ name: user.name || '', email: user.email || smtp.user }],
          subject,
          body,
          plainText: stripHtml(body),
          direction: 'INCOMING',
          status: 'RECEIVED',
          isRead: Boolean(msg.isRead),
          receivedAt: receivedDate,
          threadId: matchedSent?.threadId || conversationId,
          inReplyTo: matchedSent?._id || null,
          crmFolderId: matchedSent?.crmFolderId || null,
          leadId: matchedLead?._id || matchedSent?.leadId || null,
          smtpProvider: 'Microsoft Outlook'
        });

        fetchedCount++;

        // Trigger automatic follow-up denial for this sender
        const denied = await autoDenyPendingFollowUpsForSender({
          companyId: user.companyId,
          senderEmail,
          receivedDate,
          subject,
          threadId: matchedSent?.threadId || conversationId
        });
        totalDenied += denied;
      }
    }

    return { count: fetchedCount, deniedFollowUps: totalDenied };
  } catch (graphErr) {
    const errorMsg = graphErr.message || String(graphErr);
    
    // Check if error is due to revoked / expired grant or invalid refresh token
    const isRevokedOrExpired = 
      errorMsg.includes('AADSTS50173') || 
      errorMsg.includes('AADSTS700082') || 
      errorMsg.includes('AADSTS700084') || 
      errorMsg.includes('AADSTS500133') || 
      errorMsg.includes('invalid_grant') ||
      errorMsg.includes('grant has expired');

    if (isRevokedOrExpired) {
      console.warn(`[GraphSync Notice] User ${user.email}: Microsoft OAuth token has expired or was revoked. Please reconnect Outlook in Settings.`);
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'smtpConfig.needsReauth': true,
            'smtpConfig.authError': 'OAuth token expired or revoked. Please reconnect your Outlook account in Settings.'
          }
        });
      } catch (uErr) {
        // Non-blocking
      }
      return { count: 0, deniedFollowUps: 0 };
    }

    console.warn(`[GraphSync Warning] User ${user.email}:`, errorMsg);
    
    // ONLY fallback to IMAP if authType is password and actual password is provided
    if (smtp.authType === 'password' && smtp.user && smtp.pass) {
      return await syncStandardImapInbox(user);
    }
    
    return { count: 0, deniedFollowUps: 0 };
  }
};

/**
 * Sync Standard IMAP Inbox (Gmail, Yahoo, Zoho, Custom SMTP/IMAP)
 */
const syncStandardImapInbox = async (user) => {
  const smtp = user?.smtpConfig || {};
  const userEmail = smtp.user || user.email;
  const password = smtp.pass;

  // If in OAuth2 mode or password missing or marked as needing reauth, skip standard IMAP
  if (smtp.authType === 'oauth2' || !userEmail || !password || smtp.needsReauth) {
    return { count: 0, deniedFollowUps: 0 };
  }

  const imapHost = resolveImapHost(smtp.host, userEmail);
  const imapPort = 993; // standard secure IMAP port

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: String(userEmail).trim(),
      pass: String(password).trim()
    },
    logger: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  let fetchedCount = 0;
  let totalDenied = 0;

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true });
      const totalMsgs = status.messages || 0;

      if (totalMsgs > 0) {
        // Fetch up to the last 100 messages
        const startSeq = Math.max(1, totalMsgs - 100);
        const fetchRange = `${startSeq}:*`;

        for await (const message of client.fetch(fetchRange, { envelope: true, source: true })) {
          try {
            const parsed = await simpleParser(message.source);

            const senderEmail = (parsed.from?.value?.[0]?.address || message.envelope?.from?.[0]?.address || '').toLowerCase().trim();
            const senderName = parsed.from?.value?.[0]?.name || message.envelope?.from?.[0]?.name || '';
            const subject = parsed.subject || message.envelope?.subject || '(No Subject)';
            const bodyHtml = parsed.html || (parsed.text ? `<p style="white-space: pre-wrap;">${parsed.text}</p>` : '');
            const plainText = parsed.text || stripHtml(bodyHtml);
            const receivedDate = parsed.date || message.envelope?.date || new Date();
            const messageId = parsed.messageId || `imap_${message.uid}`;

            const selfEmail = (smtp.user || user.email || '').toLowerCase().trim();
            if (!senderEmail || senderEmail === selfEmail) continue;

            const existing = await Email.findOne({
              companyId: user.companyId,
              userId: user._id,
              direction: 'INCOMING',
              'from.email': senderEmail,
              subject,
              receivedAt: receivedDate
            });

            if (!existing) {
              const matchedSent = await Email.findOne({
                companyId: user.companyId,
                direction: 'OUTGOING',
                'to.email': senderEmail
              }).sort({ createdAt: -1 });

              const matchedLead = await Lead.findOne({
                companyId: user.companyId,
                email: senderEmail
              });

              await Email.create({
                companyId: user.companyId,
                userId: user._id,
                folder: 'INBOX',
                from: { name: senderName, email: senderEmail },
                to: [{ name: user.name || '', email: userEmail }],
                subject,
                body: bodyHtml,
                plainText,
                direction: 'INCOMING',
                status: 'RECEIVED',
                isRead: false,
                receivedAt: receivedDate,
                threadId: matchedSent?.threadId || messageId,
                inReplyTo: matchedSent?._id || null,
                crmFolderId: matchedSent?.crmFolderId || null,
                leadId: matchedLead?._id || matchedSent?.leadId || null,
                smtpProvider: `${imapHost} (IMAP)`
              });

              fetchedCount++;

              // Auto-deny follow-ups for this sender
              const denied = await autoDenyPendingFollowUpsForSender({
                companyId: user.companyId,
                senderEmail,
                receivedDate,
                subject,
                threadId: matchedSent?.threadId || messageId
              });
              totalDenied += denied;
            }
          } catch (itemErr) {
            // Continue parsing other items
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (imapErr) {
    // If IMAP fails (e.g. invalid host or credentials), catch gracefully
    const errorMsg = imapErr?.message || String(imapErr || 'Connection failed');
    console.warn(`[ImapSync Warning] ${userEmail} (${imapHost}): ${errorMsg}`);
  }

  return { count: fetchedCount, deniedFollowUps: totalDenied };
};

/**
 * Universal Inbox Sync for any User (Graph API or IMAP)
 */
const syncUserInbox = async (user) => {
  if (!user || !user.smtpConfig) return { count: 0, deniedFollowUps: 0 };

  const isOAuth2 = user.smtpConfig.authType === 'oauth2' && Boolean(user.smtpConfig.clientId && user.smtpConfig.refreshToken);

  if (isOAuth2) {
    return await syncOutlookGraphInbox(user);
  } else {
    return await syncStandardImapInbox(user);
  }
};

/**
 * Periodic Background Inbox Sync for All Active Users
 */
let isAutoSyncRunning = false;

const syncAllActiveInboxes = async () => {
  if (isAutoSyncRunning) return;
  isAutoSyncRunning = true;

  try {
    const usersWithMail = await User.find({
      $and: [
        {
          $or: [
            { 'smtpConfig.user': { $exists: true, $ne: '' } },
            { 'smtpConfig.refreshToken': { $exists: true, $ne: '' } }
          ]
        },
        { 'smtpConfig.needsReauth': { $ne: true } }
      ]
    }).limit(20);

    for (const u of usersWithMail) {
      try {
        await syncUserInbox(u);
      } catch (err) {
        // Continue with next user
      }
    }
  } catch (err) {
    console.error('[ImapSync Background Error]:', err.message);
  } finally {
    isAutoSyncRunning = false;
  }
};

module.exports = {
  syncUserInbox,
  syncAllActiveInboxes,
  autoDenyPendingFollowUpsForSender,
  resolveImapHost
};
