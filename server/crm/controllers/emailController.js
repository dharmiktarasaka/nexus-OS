const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const User = require('../models/User');
const Lead = require('../models/Lead');
const ScheduledEmail = require('../models/ScheduledEmail');
const Activity = require('../models/Activity');
const {
  refreshAccessToken,
  sendMailViaGraph,
  getMicrosoftGraphUser
} = require('../services/outlookService');
const { normalizeSmtpHost } = require('../services/emailSchedulerService');
const { formatEmailHtml, generateOutlookSignature } = require('../utils/emailFormatter');
const axios = require('axios');

// Helper to strip HTML tags for plain text search
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s{2,}/g, ' ').trim();
};

// Helper to isolate email records strictly to the authenticated user
const getEmailOwnerQuery = (req) => {
  const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
  return {
    $or: [
      { ownerId: ownerId },
      { userId: ownerId }
    ]
  };
};

// @desc    Get emails with folder filtering, search, and pagination
// @route   GET /api/emails
const getEmails = async (req, res, next) => {
  try {
    const {
      folder = 'INBOX',
      page = 1,
      limit = 25,
      search = '',
      status,
      isStarred,
      isRead
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const query = {
      ...getEmailOwnerQuery(req)
    };

    const targetFolder = String(folder).toUpperCase();

    // SPECIAL CASE: SCHEDULED FOLDER QUERIES PENDING FOLLOW-UPS FROM ScheduledEmail MODEL
    if (targetFolder === 'SCHEDULED') {
      const scheduledQuery = {
        ...getEmailOwnerQuery(req)
      };

      if (status) {
        scheduledQuery.status = status;
      } else {
        scheduledQuery.status = { $in: ['PENDING', 'PROCESSING', 'DENIED', 'FAILED'] };
      }

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        scheduledQuery.$or = [
          { subject: searchRegex },
          { recipientEmail: searchRegex },
          { body: searchRegex }
        ];
      }

      const [scheduledDocs, totalScheduled] = await Promise.all([
        ScheduledEmail.find(scheduledQuery)
          .sort({ scheduledFor: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('folderId', 'name'),
        ScheduledEmail.countDocuments(scheduledQuery)
      ]);

      const formattedScheduledEmails = scheduledDocs.map(doc => ({
        _id: doc._id,
        companyId: doc.companyId,
        userId: req.user._id,
        folder: 'SCHEDULED',
        from: { name: 'Follow-Up Queue', email: doc.smtpConfig?.user || 'Automated Scheduler' },
        to: [{ name: doc.recipientData?.Name || doc.recipientEmail, email: doc.recipientEmail }],
        subject: doc.subject || '(Follow-up Nudge)',
        body: doc.body || '',
        plainText: stripHtml(doc.body || ''),
        direction: 'OUTGOING',
        status: doc.status === 'PENDING' ? 'SCHEDULED' : doc.status,
        isRead: true,
        isStarred: false,
        isDeleted: false,
        scheduledAt: doc.scheduledFor,
        sequenceNumber: doc.sequenceNumber,
        folderName: doc.folderId?.name || 'Campaign Folder',
        errorMessage: doc.errorMessage,
        isScheduledEmailDoc: true,
        createdAt: doc.createdAt
      }));

      const ownerFilter = getEmailOwnerQuery(req);
      const [inboxUnread, inboxTotal, sentTotal, scheduledTotal, trashTotal, starredTotal] = await Promise.all([
        Email.countDocuments({ ...ownerFilter, folder: 'INBOX', isRead: false, isDeleted: false }),
        Email.countDocuments({ ...ownerFilter, folder: 'INBOX', isDeleted: false }),
        Email.countDocuments({ ...ownerFilter, folder: 'SENT', isDeleted: false }),
        ScheduledEmail.countDocuments({ ...ownerFilter, status: { $in: ['PENDING', 'PROCESSING'] } }),
        Email.countDocuments({ ...ownerFilter, folder: 'TRASH' }),
        Email.countDocuments({ ...ownerFilter, isStarred: true, isDeleted: false })
      ]);

      return res.json({
        success: true,
        data: formattedScheduledEmails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalScheduled / limitNum) || 1,
          totalItems: totalScheduled
        },
        counts: {
          inboxUnread,
          inboxTotal,
          sentTotal,
          scheduledTotal,
          trashTotal,
          starredTotal
        }
      });
    }

    if (targetFolder === 'STARRED') {
      query.isStarred = true;
      query.isDeleted = false;
    } else if (targetFolder === 'TRASH') {
      query.folder = 'TRASH';
    } else {
      query.folder = targetFolder;
      query.isDeleted = false;
    }

    if (status) {
      query.status = status;
    }

    if (isStarred !== undefined && targetFolder !== 'STARRED') {
      query.isStarred = isStarred === 'true';
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { subject: searchRegex },
        { 'from.name': searchRegex },
        { 'from.email': searchRegex },
        { 'to.name': searchRegex },
        { 'to.email': searchRegex },
        { plainText: searchRegex }
      ];
    }

    const [emails, total] = await Promise.all([
      Email.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('leadId', 'name companyName phone status'),
      Email.countDocuments(query)
    ]);

    // Also get folder counts
    const [inboxUnread, inboxTotal, sentTotal, scheduledTotal, trashTotal, starredTotal] = await Promise.all([
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'INBOX', isRead: false, isDeleted: false }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'INBOX', isDeleted: false }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'SENT', isDeleted: false }),
      ScheduledEmail.countDocuments({ companyId: req.user.companyId, status: { $in: ['PENDING', 'PROCESSING'] } }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'TRASH' }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, isStarred: true, isDeleted: false })
    ]);

    res.json({
      success: true,
      data: emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total
      },
      counts: {
        inboxUnread,
        inboxTotal,
        sentTotal,
        scheduledTotal,
        trashTotal,
        starredTotal
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single email details & full conversation thread
// @route   GET /api/emails/:id
const getEmailById = async (req, res, next) => {
  try {
    const ownerFilter = getEmailOwnerQuery(req);
    let email = await Email.findOne({
      _id: req.params.id,
      ...ownerFilter
    }).populate('leadId', 'name companyName phone email status');

    if (!email) {
      // Check if it's a ScheduledEmail
      const scheduledDoc = await ScheduledEmail.findOne({
        _id: req.params.id,
        ...ownerFilter
      }).populate('folderId', 'name');

      if (scheduledDoc) {
        const item = {
          _id: scheduledDoc._id,
          companyId: scheduledDoc.companyId,
          userId: req.user._id,
          folder: 'SCHEDULED',
          from: { name: 'Follow-Up Queue', email: scheduledDoc.smtpConfig?.user || 'Automated Scheduler' },
          to: [{ name: scheduledDoc.recipientData?.Name || scheduledDoc.recipientEmail, email: scheduledDoc.recipientEmail }],
          subject: scheduledDoc.subject,
          body: scheduledDoc.body,
          plainText: stripHtml(scheduledDoc.body),
          direction: 'OUTGOING',
          status: scheduledDoc.status === 'PENDING' ? 'SCHEDULED' : scheduledDoc.status,
          scheduledAt: scheduledDoc.scheduledFor,
          sequenceNumber: scheduledDoc.sequenceNumber,
          folderName: scheduledDoc.folderId?.name || 'Campaign Folder',
          errorMessage: scheduledDoc.errorMessage,
          isScheduledEmailDoc: true,
          createdAt: scheduledDoc.createdAt
        };
        return res.json({
          success: true,
          data: item,
          thread: [item]
        });
      }

      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Auto mark as read
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    // Fetch conversation thread if available
    let thread = [];
    if (email.threadId) {
      thread = await Email.find({
        threadId: email.threadId,
        companyId: req.user.companyId
      }).sort({ createdAt: 1 });
    }

    res.json({
      success: true,
      data: email,
      thread: thread.length > 0 ? thread : [email]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a new email or scheduled email via user's SMTP/Outlook
// @route   POST /api/emails/send
const sendEmail = async (req, res, next) => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      body,
      scheduledFor,
      leadId,
      crmFolderId,
      inReplyTo,
      threadId
    } = req.body;

    if (!to || (!Array.isArray(to) && !to.trim())) {
      return res.status(400).json({ success: false, message: 'Recipient email address is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Email subject is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Email message body is required' });
    }

    const user = await User.findById(req.user._id);
    const smtp = user?.smtpConfig || {};

    // Normalize recipients
    const toRecipients = Array.isArray(to)
      ? to.map(item => (typeof item === 'string' ? { email: item.trim() } : item))
      : to.split(/[,;]/).map(e => ({ email: e.trim() })).filter(e => Boolean(e.email));

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc.map(e => (typeof e === 'string' ? { email: e.trim() } : e)) : cc.split(/[,;]/).map(e => ({ email: e.trim() })).filter(e => Boolean(e.email)))
      : [];

    const bccRecipients = bcc
      ? (Array.isArray(bcc) ? bcc.map(e => (typeof e === 'string' ? { email: e.trim() } : e)) : bcc.split(/[,;]/).map(e => ({ email: e.trim() })).filter(e => Boolean(e.email)))
      : [];

    const senderEmail = smtp.user || user.email;
    const senderName = smtp.fromName || user.name || 'Sales Team';
    const shouldIncludeSig = req.body.includeSignature !== undefined
      ? Boolean(req.body.includeSignature)
      : (smtp.includeSignature !== undefined ? Boolean(smtp.includeSignature) : true);

    let effectiveSignature = (req.body.signature || smtp.signature || '').trim();
    if (shouldIncludeSig && !effectiveSignature) {
      effectiveSignature = generateOutlookSignature({
        displayName: senderName,
        jobTitle: smtp.jobTitle || '',
        companyName: smtp.companyName || '',
        email: senderEmail,
        phone: smtp.phone || '',
        website: smtp.website || ''
      });
    }

    const formattedHtmlBody = formatEmailHtml(body, effectiveSignature, shouldIncludeSig);

    // Check if scheduling for later
    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

    if (isScheduled) {
      const emailDoc = await Email.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        folder: 'SCHEDULED',
        from: { name: senderName, email: senderEmail },
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        subject: subject.trim(),
        body: formattedHtmlBody,
        plainText: stripHtml(body),
        direction: 'OUTGOING',
        status: 'SCHEDULED',
        scheduledFor: new Date(scheduledFor),
        isRead: true,
        threadId: emailThreadId,
        inReplyTo: inReplyTo || null,
        leadId: leadId || null,
        crmFolderId: crmFolderId || null,
        smtpProvider: smtp.authType === 'oauth2' ? 'Microsoft Outlook' : 'SMTP Server'
      });

      return res.status(201).json({
        success: true,
        message: `Email scheduled for ${new Date(scheduledFor).toLocaleString()}!`,
        data: emailDoc
      });
    }

    // Direct Live Send via Microsoft Outlook or SMTP
    const isOAuth2 = smtp.authType === 'oauth2' && Boolean(smtp.clientId && smtp.refreshToken);

    if (isOAuth2) {
      const tokenData = await refreshAccessToken({
        refreshToken: String(smtp.refreshToken).trim(),
        clientId: String(smtp.clientId).trim(),
        clientSecret: String(smtp.clientSecret || smtp.pass).trim(),
        tenantId: smtp.tenantId || 'common'
      });

      for (const recipient of toRecipients) {
        await sendMailViaGraph({
          accessToken: tokenData.access_token,
          to: recipient.email,
          subject: subject.trim(),
          body: formattedHtmlBody,
          fromName: senderName
        });
      }
    } else {
      // Standard SMTP transporter
      const host = normalizeSmtpHost(smtp.host, smtp.user);
      const port = smtp.port ? parseInt(smtp.port, 10) : 587;
      const secure = smtp.secure !== undefined ? Boolean(smtp.secure) : (port === 465);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: smtp.user || senderEmail,
          pass: smtp.pass || ''
        },
        tls: { rejectUnauthorized: false }
      });

      const toList = toRecipients.map(r => r.email).join(', ');
      const ccList = ccRecipients.map(r => r.email).join(', ');
      const bccList = bccRecipients.map(r => r.email).join(', ');

      await transporter.sendMail({
        from: `"${senderName}" <${smtp.user || senderEmail}>`,
        to: toList,
        cc: ccList || undefined,
        bcc: bccList || undefined,
        subject: subject.trim(),
        html: formattedHtmlBody
      });
    }

    // Save into SENT folder
    const createdEmail = await Email.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      folder: 'SENT',
      from: { name: senderName, email: senderEmail },
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: subject.trim(),
      body: formattedHtmlBody,
      plainText: stripHtml(body),
      direction: 'OUTGOING',
      status: 'SENT',
      sentAt: new Date(),
      isRead: true,
      threadId: emailThreadId,
      inReplyTo: inReplyTo || null,
      leadId: leadId || null,
      crmFolderId: crmFolderId || null,
      smtpProvider: isOAuth2 ? 'Microsoft Outlook' : 'SMTP Server'
    });

    // If linked to lead, log activity
    if (leadId) {
      try {
        await Activity.create({
          leadId,
          userId: req.user._id,
          action: 'EMAIL_SENT',
          description: `Sent email "${subject}" to ${toRecipients.map(r => r.email).join(', ')}`
        });
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: 'Email sent successfully!',
      data: createdEmail
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send email. Please check your SMTP settings in Settings.'
    });
  }
};

// @desc    Send manual reply in thread
// @route   POST /api/emails/:id/reply
const replyEmail = async (req, res, next) => {
  try {
    const { body, replyAll = false } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
    }

    const originalEmail = await Email.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!originalEmail) {
      return res.status(404).json({ success: false, message: 'Original email not found' });
    }

    const user = await User.findById(req.user._id);
    const smtp = user?.smtpConfig || {};
    const senderEmail = smtp.user || user.email;
    const senderName = smtp.fromName || user.name || 'Sales Team';

    // Target recipient is original sender (or original 'to' if it was outgoing)
    const replyToEmail = originalEmail.direction === 'INCOMING'
      ? originalEmail.from.email
      : (originalEmail.to[0]?.email || '');

    const replyToName = originalEmail.direction === 'INCOMING'
      ? originalEmail.from.name
      : (originalEmail.to[0]?.name || '');

    const replySubject = originalEmail.subject.startsWith('Re:')
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`;

    const quotedBody = `
      <div style="font-family: sans-serif; font-size: 14px; color: #1e293b;">
        <div>${body.replace(/\n/g, '<br/>')}</div>
        <br/><br/>
        <div style="border-left: 2px solid #cbd5e1; padding-left: 12px; margin-left: 4px; color: #64748b; font-size: 12px;">
          <p><strong>On ${new Date(originalEmail.createdAt).toLocaleString()}, ${originalEmail.from.name || originalEmail.from.email} wrote:</strong></p>
          <div>${originalEmail.body}</div>
        </div>
      </div>
    `;

    const toRecipients = [{ name: replyToName, email: replyToEmail }];
    const emailThreadId = originalEmail.threadId || `th_${originalEmail._id}`;

    // Send Live via Outlook or SMTP
    const isOAuth2 = smtp.authType === 'oauth2' && Boolean(smtp.clientId && smtp.refreshToken);

    if (isOAuth2) {
      const tokenData = await refreshAccessToken({
        refreshToken: String(smtp.refreshToken).trim(),
        clientId: String(smtp.clientId).trim(),
        clientSecret: String(smtp.clientSecret || smtp.pass).trim(),
        tenantId: smtp.tenantId || 'common'
      });

      await sendMailViaGraph({
        accessToken: tokenData.access_token,
        to: replyToEmail,
        subject: replySubject,
        body: quotedBody,
        fromName: senderName
      });
    } else {
      const host = normalizeSmtpHost(smtp.host, smtp.user);
      const port = smtp.port ? parseInt(smtp.port, 10) : 587;
      const secure = smtp.secure !== undefined ? Boolean(smtp.secure) : (port === 465);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: smtp.user || senderEmail,
          pass: smtp.pass || ''
        },
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({
        from: `"${senderName}" <${smtp.user || senderEmail}>`,
        to: replyToEmail,
        subject: replySubject,
        html: quotedBody
      });
    }

    // Save reply to SENT folder
    const replyDoc = await Email.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      folder: 'SENT',
      from: { name: senderName, email: senderEmail },
      to: toRecipients,
      subject: replySubject,
      body: quotedBody,
      plainText: stripHtml(body),
      direction: 'OUTGOING',
      status: 'SENT',
      sentAt: new Date(),
      isRead: true,
      threadId: emailThreadId,
      inReplyTo: originalEmail._id,
      leadId: originalEmail.leadId || null,
      crmFolderId: originalEmail.crmFolderId || null,
      smtpProvider: isOAuth2 ? 'Microsoft Outlook' : 'SMTP Server'
    });

    // Mark original email as replied
    originalEmail.status = 'REPLIED';
    if (!originalEmail.threadId) {
      originalEmail.threadId = emailThreadId;
    }
    await originalEmail.save();

    res.json({
      success: true,
      message: `Reply sent successfully to ${replyToEmail}!`,
      data: replyDoc
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send reply. Please check your SMTP settings.'
    });
  }
};

// @desc    Sync received emails from Microsoft Outlook Graph API or IMAP
// @route   POST /api/emails/sync-inbox
const syncInbox = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { syncUserInbox } = require('../services/imapSyncService');
    const { count, deniedFollowUps } = await syncUserInbox(user);

    // If 0 found, ensure user has at least some welcome/sample inbox emails if empty
    const existingInboxCount = await Email.countDocuments({
      companyId: req.user.companyId,
      userId: req.user._id,
      folder: 'INBOX'
    });

    let finalCount = count;
    if (existingInboxCount === 0 && finalCount === 0) {
      // Seed initial helpful welcome message
      await Email.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        folder: 'INBOX',
        from: { name: 'LeadFlow CRM System', email: 'notifications@leadflowcrm.com' },
        to: [{ name: user.name, email: user.email }],
        subject: 'Welcome to your LeadFlow Email Hub! 📬',
        body: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #1A3548;">Welcome to your Unified Email Hub!</h2>
            <p>From here you can:</p>
            <ul>
              <li><strong>Read & Reply</strong> to incoming emails directly</li>
              <li><strong>Compose & Send</strong> emails via your custom SMTP or Microsoft Outlook 365</li>
              <li><strong>Track Sent Campaigns</strong> from your Grabbed Leads and CRM Folders</li>
              <li><strong>Manage Follow-ups</strong>: When a prospect replies, pending follow-ups are automatically cancelled</li>
            </ul>
            <p>Connect your Microsoft 365 or custom SMTP in <em>Settings</em> to send and receive live emails directly.</p>
          </div>
        `,
        plainText: 'Welcome to your LeadFlow Email Hub! From here you can read, reply, compose, and manage all your sent and received emails.',
        direction: 'INCOMING',
        status: 'RECEIVED',
        isRead: false,
        receivedAt: new Date(),
        smtpProvider: 'System'
      });
      finalCount = 1;
    }

    let message = finalCount > 0 ? `Synced ${finalCount} new email(s)!` : 'Inbox is up to date!';
    if (deniedFollowUps > 0) {
      message += ` (${deniedFollowUps} pending follow-up(s) automatically cancelled)`;
    }

    res.json({
      success: true,
      message,
      syncedCount: finalCount,
      deniedFollowUps
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle email starred status
// @route   PUT /api/emails/:id/star
const toggleStar = async (req, res, next) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.isStarred = !email.isStarred;
    await email.save();

    res.json({
      success: true,
      isStarred: email.isStarred,
      message: email.isStarred ? 'Email starred' : 'Email unstarred'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark email as read or unread
// @route   PUT /api/emails/:id/read
const markRead = async (req, res, next) => {
  try {
    const { isRead = true } = req.body;
    const email = await Email.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.isRead = isRead;
    await email.save();

    res.json({
      success: true,
      isRead: email.isRead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk mark emails as read
// @route   POST /api/emails/bulk-read
const bulkMarkRead = async (req, res, next) => {
  try {
    const { emailIds = [], isRead = true } = req.body;

    await Email.updateMany(
      {
        _id: { $in: emailIds },
        companyId: req.user.companyId,
        userId: req.user._id
      },
      { $set: { isRead } }
    );

    res.json({
      success: true,
      message: `Marked ${emailIds.length} emails as ${isRead ? 'read' : 'unread'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move email to trash
// @route   POST /api/emails/:id/trash
const moveToTrash = async (req, res, next) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!email) {
      const scheduled = await ScheduledEmail.findOne({ _id: req.params.id, companyId: req.user.companyId });
      if (scheduled) {
        await ScheduledEmail.deleteOne({ _id: req.params.id });
        return res.json({ success: true, message: 'Scheduled follow-up cancelled successfully' });
      }
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.originalFolderBeforeTrash = email.folder;
    email.folder = 'TRASH';
    email.isDeleted = true;
    email.deletedAt = new Date();
    await email.save();

    res.json({
      success: true,
      message: 'Email moved to Trash'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore email from trash
// @route   POST /api/emails/:id/restore
const restoreFromTrash = async (req, res, next) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    email.folder = email.originalFolderBeforeTrash || 'INBOX';
    email.isDeleted = false;
    email.deletedAt = null;
    await email.save();

    res.json({
      success: true,
      message: `Email restored to ${email.folder}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete single email
// @route   DELETE /api/emails/:id
const deletePermanent = async (req, res, next) => {
  try {
    const email = await Email.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!email) {
      const scheduled = await ScheduledEmail.findOneAndDelete({
        _id: req.params.id,
        companyId: req.user.companyId
      });
      if (scheduled) {
        return res.json({ success: true, message: 'Scheduled follow-up deleted' });
      }
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    res.json({
      success: true,
      message: 'Email permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk move emails to trash
// @route   POST /api/emails/bulk-trash
const bulkTrash = async (req, res, next) => {
  try {
    const { emailIds = [] } = req.body;

    await Email.updateMany(
      {
        _id: { $in: emailIds },
        companyId: req.user.companyId,
        userId: req.user._id
      },
      {
        $set: {
          folder: 'TRASH',
          isDeleted: true,
          deletedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Moved ${emailIds.length} emails to Trash`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk permanently delete emails
// @route   POST /api/emails/bulk-delete
const bulkDelete = async (req, res, next) => {
  try {
    const { emailIds = [] } = req.body;

    await Email.deleteMany({
      _id: { $in: emailIds },
      companyId: req.user.companyId,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `Permanently deleted ${emailIds.length} emails`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a scheduled follow-up email
// @route   POST /api/emails/:id/cancel
const cancelScheduledEmail = async (req, res, next) => {
  try {
    const scheduled = await ScheduledEmail.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!scheduled) {
      return res.status(404).json({ success: false, message: 'Scheduled follow-up email not found' });
    }

    scheduled.status = 'CANCELLED';
    scheduled.errorMessage = `Cancelled manually by ${req.user.name || 'user'} on ${new Date().toLocaleString()}`;
    await scheduled.save();

    res.json({
      success: true,
      message: 'Scheduled follow-up cancelled successfully!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get counts & stats for sidebar badge
// @route   GET /api/emails/stats
const getEmailStats = async (req, res, next) => {
  try {
    const [inboxUnread, inboxTotal, sentTotal, scheduledTotal, trashTotal, starredTotal] = await Promise.all([
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'INBOX', isRead: false, isDeleted: false }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'INBOX', isDeleted: false }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'SENT', isDeleted: false }),
      ScheduledEmail.countDocuments({ companyId: req.user.companyId, status: { $in: ['PENDING', 'PROCESSING'] } }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, folder: 'TRASH' }),
      Email.countDocuments({ companyId: req.user.companyId, userId: req.user._id, isStarred: true, isDeleted: false })
    ]);

    res.json({
      success: true,
      counts: {
        inboxUnread,
        inboxTotal,
        sentTotal,
        scheduledTotal,
        trashTotal,
        starredTotal
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmails,
  getEmailById,
  sendEmail,
  replyEmail,
  syncInbox,
  toggleStar,
  markRead,
  bulkMarkRead,
  moveToTrash,
  restoreFromTrash,
  deletePermanent,
  cancelScheduledEmail,
  bulkTrash,
  bulkDelete,
  getEmailStats
};
