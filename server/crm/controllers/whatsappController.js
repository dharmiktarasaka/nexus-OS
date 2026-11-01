const whatsappService = require('../services/whatsappService');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const Lead = require('../models/Lead');

// @desc    Get WhatsApp connection status and QR code if waiting
// @route   GET /api/whatsapp/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const session = whatsappService.getSession(userId);

    if (session.status === 'READY') {
      const p = session.userProfile;
      if (!p || !p.phone || p.phone === 'Connected' || !p.pushname || p.pushname === 'WhatsApp User') {
        await Promise.race([
          session.refreshUserProfile(),
          new Promise(r => setTimeout(r, 800))
        ]).catch(() => {});
      }
    }
    const status = session.getStatus();
    return res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve WhatsApp status',
      error: error.message
    });
  }
};

// @desc    Initialize WhatsApp Web client to generate new QR Code
// @route   POST /api/whatsapp/connect
// @access  Private
exports.connect = async (req, res) => {
  try {
    const userId = req.user?._id;
    const session = whatsappService.getSession(userId);
    const currentStatus = session.getStatus();

    if (currentStatus.status === 'READY') {
      return res.json({
        success: true,
        message: 'WhatsApp is already connected',
        ...currentStatus
      });
    }

    // Trigger async initialization
    whatsappService.initializeClient({ userId, force: true }).catch(err => {
      console.error(`[WhatsAppController][${userId}] Background WhatsApp initialization error:`, err.message);
    });

    // Return immediate state (INITIALIZING or QR_READY)
    const initialStatus = session.getStatus();
    return res.json({
      success: true,
      message: 'WhatsApp initialization started. QR code will be generated shortly.',
      ...initialStatus
    });
  } catch (error) {
    console.error('Error initiating WhatsApp connection:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize WhatsApp connection'
    });
  }
};

// @desc    Disconnect/Logout WhatsApp Web session
// @route   POST /api/whatsapp/disconnect
// @access  Private
exports.disconnect = async (req, res) => {
  try {
    const userId = req.user?._id;
    const result = await whatsappService.disconnect(userId);
    return res.json({
      success: true,
      message: 'WhatsApp session disconnected successfully',
      ...result
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect WhatsApp'
    });
  }
};

// @desc    Send a single direct or test message
// @route   POST /api/whatsapp/send-single
// @access  Private
exports.sendSingleMessage = async (req, res) => {
  try {
    const { phone, message, mediaBase64, mediaMimeType, mediaFileName, mediaUrl, defaultCountryCode } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.'
      });
    }

    const hasText = Boolean(message && String(message).trim().length > 0);
    const hasMedia = Boolean((mediaBase64 && mediaMimeType) || mediaUrl);

    if (!hasText && !hasMedia) {
      return res.status(400).json({
        success: false,
        message: 'Please provide message text or attach a photo.'
      });
    }

    const result = await whatsappService.sendSingleMessage({
      userId: req.user?._id,
      phone,
      message,
      mediaBase64,
      mediaMimeType,
      mediaFileName,
      mediaUrl,
      defaultCountryCode: defaultCountryCode || '91'
    });

    return res.json({
      success: true,
      message: 'Message sent successfully via WhatsApp',
      data: result
    });
  } catch (error) {
    console.error('Error sending single WhatsApp message:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp message'
    });
  }
};

// @desc    Create and launch bulk WhatsApp campaign
// @route   POST /api/whatsapp/send-bulk
// @access  Private
exports.sendBulk = async (req, res) => {
  try {
    const {
      title,
      messageTemplate,
      templates,
      mediaBase64,
      mediaMimeType,
      mediaFileName,
      mediaUrl,
      minDelaySeconds = 15.0,
      maxDelaySeconds = 45.0,
      speedPreset = 'safe_human',
      strictHourlyLimit = true,
      hourlyLimit = 15,
      nonRepeatingDelays = true,
      typingSimulation = true,
      batchSize = 10,
      batchCooldownSeconds = 60,
      spintaxEnabled = true,
      randomizeTemplates = true,
      paceAcrossHour = true,
      recipients, // Array of { name, phone, company, leadId } or plain phone numbers
      leadIds,    // Optional array of Lead ObjectIds
      delayMs = 2500,
      defaultCountryCode = '91'
    } = req.body;

    const hasMedia = Boolean((mediaBase64 && mediaMimeType) || mediaUrl);
    const allTemplates = Array.isArray(templates) && templates.length > 0
      ? templates.filter(t => t && t.trim())
      : (messageTemplate && messageTemplate.trim() ? [messageTemplate.trim()] : []);

    if (!hasMedia && allTemplates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide message text or attach a photo.'
      });
    }

    let finalRecipients = [];
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    // If lead IDs are specified, pull details directly from database scoped to current user
    if (Array.isArray(leadIds) && leadIds.length > 0) {
      const leads = await Lead.find({ _id: { $in: leadIds }, isDeleted: false, $or: [{ ownerId }, { userId: ownerId }] });
      for (const lead of leads) {
        if (lead.phone && lead.phone.trim()) {
          finalRecipients.push({
            leadId: lead._id,
            name: lead.name || '',
            phone: lead.phone.trim(),
            company: lead.companyName || ''
          });
        }
      }
    }

    // If custom recipient objects are provided
    if (Array.isArray(recipients) && recipients.length > 0) {
      for (const r of recipients) {
        if (typeof r === 'string' && r.trim()) {
          finalRecipients.push({
            name: '',
            phone: r.trim(),
            company: ''
          });
        } else if (r && r.phone && String(r.phone).trim()) {
          finalRecipients.push({
            leadId: r.leadId || null,
            name: r.name || '',
            phone: String(r.phone).trim(),
            company: r.company || ''
          });
        }
      }
    }

    // Deduplicate by cleaned phone number
    const seenPhones = new Set();
    const uniqueRecipients = [];
    for (const r of finalRecipients) {
      const clean = whatsappService.cleanPhoneNumber(r.phone, defaultCountryCode);
      if (clean && !seenPhones.has(clean)) {
        seenPhones.add(clean);
        uniqueRecipients.push({
          ...r,
          status: 'PENDING'
        });
      }
    }

    if (uniqueRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid phone numbers found to send messages to.'
      });
    }

    // Create Campaign in MongoDB with Anti-Ban Pacing configuration scoped to sentBy: req.user._id
    const campaign = new WhatsAppCampaign({
      title: title || `Bulk WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
      messageTemplate: allTemplates[0] || '',
      templates: allTemplates,
      mediaBase64: mediaBase64 || '',
      mediaMimeType: mediaMimeType || '',
      mediaFileName: mediaFileName || '',
      mediaUrl: mediaUrl || '',
      randomizeTemplates: Boolean(randomizeTemplates),
      speedPreset: speedPreset || 'safe_human',
      strictHourlyLimit: Boolean(strictHourlyLimit),
      hourlyLimit: Math.max(1, Number(hourlyLimit) || 15),
      nonRepeatingDelays: Boolean(nonRepeatingDelays),
      typingSimulation: Boolean(typingSimulation),
      minDelaySeconds: Math.max(0.5, Number(minDelaySeconds) || 15.0),
      maxDelaySeconds: Math.max(1.0, Number(maxDelaySeconds) || 45.0),
      batchSize: Math.max(1, Number(batchSize) || 10),
      batchCooldownSeconds: Math.max(5, Number(batchCooldownSeconds) || 60),
      spintaxEnabled: Boolean(spintaxEnabled),
      paceAcrossHour: paceAcrossHour !== false,
      totalRecipients: uniqueRecipients.length,
      recipients: uniqueRecipients,
      ownerId: ownerId,
      sentBy: ownerId,
      status: 'DRAFT'
    });

    await campaign.save();

    // Launch async sending process for this user
    await whatsappService.startBulkCampaign({
      campaignId: campaign._id,
      userId: ownerId,
      defaultCountryCode,
      delayMs: Math.max(1000, Number(delayMs) || 2500)
    });

    return res.json({
      success: true,
      message: 'Bulk WhatsApp campaign initiated successfully.',
      campaignId: campaign._id,
      totalRecipients: uniqueRecipients.length
    });
  } catch (error) {
    console.error('Error starting bulk WhatsApp campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to start bulk WhatsApp campaign'
    });
  }
};

// @desc    Get all campaigns history scoped to logged-in user
// @route   GET /api/whatsapp/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
  try {
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const campaigns = await WhatsAppCampaign.find({ $or: [{ ownerId }, { sentBy: ownerId }] })
      .select('-recipients')
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  }
};

// @desc    Get single campaign with live progress and recipients
// @route   GET /api/whatsapp/campaigns/:id
// @access  Private
exports.getCampaignById = async (req, res) => {
  try {
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const campaign = await WhatsAppCampaign.findOne({
      _id: req.params.id,
      $or: [{ ownerId }, { sentBy: ownerId }]
    }).populate('sentBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found or access denied'
      });
    }

    const campaignObj = campaign.toObject ? campaign.toObject() : JSON.parse(JSON.stringify(campaign));
    const session = whatsappService.getSession(req.user._id);
    const active = session.activeCampaignProgress;
    if (active && String(active.campaignId) === String(campaign._id)) {
      if (active.currentRecipient) campaignObj.currentRecipient = active.currentRecipient;
      if (active.nextRecipient) campaignObj.nextRecipient = active.nextRecipient;
      if (active.nextSendAt) campaignObj.nextSendAt = active.nextSendAt;
      if (active.dispatchState) campaignObj.dispatchState = active.dispatchState;
      if (active.lastSentPhone) campaignObj.lastSentPhone = active.lastSentPhone;
      if (active.lastSentName) campaignObj.lastSentName = active.lastSentName;
      if (active.lastSentAt) campaignObj.lastSentAt = active.lastSentAt;
      if (typeof active.successCount === 'number') campaignObj.successCount = active.successCount;
      if (typeof active.failedCount === 'number') campaignObj.failedCount = active.failedCount;
    }

    return res.json({
      success: true,
      campaign: campaignObj
    });
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign details'
    });
  }
};

// @desc    Cancel an in-progress campaign
// @route   POST /api/whatsapp/campaigns/:id/cancel
// @access  Private
exports.cancelCampaign = async (req, res) => {
  try {
    const campaign = await WhatsAppCampaign.findOne({ _id: req.params.id, sentBy: req.user._id });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = 'CANCELLED';
    campaign.dispatchState = 'CANCELLED';
    campaign.currentRecipient = null;
    campaign.nextRecipient = null;
    campaign.nextSendAt = null;
    await campaign.save();

    await whatsappService.stopActiveBroadcast(req.user._id);

    return res.json({
      success: true,
      message: 'Campaign cancelled',
      campaign
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Stop any active broadcast immediately
// @route   POST /api/whatsapp/live-dispatch/stop
// @access  Private
exports.stopLiveDispatch = async (req, res) => {
  try {
    await whatsappService.stopActiveBroadcast(req.user._id);
    return res.json({
      success: true,
      message: 'Active broadcast stopped successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop broadcast'
    });
  }
};

// @desc    Get leads suitable for WhatsApp (with non-empty phone numbers) scoped to user
// @route   GET /api/whatsapp/leads
// @access  Private
exports.getLeadsForWhatsApp = async (req, res) => {
  try {
    const leads = await Lead.find({
      userId: req.user._id,
      isDeleted: false,
      phone: { $exists: true, $ne: '' }
    })
      .select('name companyName phone email status service')
      .sort({ createdAt: -1 })
      .limit(1000);

    return res.json({
      success: true,
      leads
    });
  } catch (error) {
    console.error('Error fetching leads for WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leads'
    });
  }
};

// @desc    Verify incoming WhatsApp webhook (e.g. Meta / Cloud API challenge)
// @route   GET /api/whatsapp/webhook
// @access  Public
exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && (token === process.env.WHATSAPP_VERIFY_TOKEN || token === 'crm_whatsapp_verify_token')) {
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    }
    return res.status(200).json({ success: true, message: 'WhatsApp Webhook Endpoint Ready' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process incoming WhatsApp webhook messages
// @route   POST /api/whatsapp/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body;

    // Check if this is a standard message object or Meta Cloud API structure
    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value;
            if (value && Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                const normalizedMsg = {
                  id: msg.id,
                  from: msg.from ? `${msg.from}@c.us` : '',
                  body: msg.text?.body || msg.body || '',
                  timestamp: msg.timestamp,
                  fromMe: false
                };
                await whatsappService.processIncomingMessage(normalizedMsg);
              }
            }
          }
        }
      }
      return res.status(200).json({ success: true, message: 'Webhook processed' });
    }

    // Direct message payload format
    if (body.id || body.from || body.body || body.message || body.timestamp) {
      const result = await whatsappService.processIncomingMessage(body);
      return res.status(200).json({
        success: true,
        result
      });
    }

    return res.status(200).json({ success: true, message: 'Webhook received (no actionable messages)' });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process WhatsApp webhook',
      error: error.message
    });
  }
};

// @desc    Get current auto-reply settings
// @route   GET /api/whatsapp/auto-reply
// @access  Private
exports.getAutoReplySettings = async (req, res) => {
  try {
    const settings = whatsappService.getAutoReplySettings(req.user._id);
    return res.json({ success: true, ...settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update auto-reply enabled toggle and/or message text
// @route   POST /api/whatsapp/auto-reply
// @access  Private
exports.updateAutoReplySettings = async (req, res) => {
  try {
    const { enabled, text } = req.body;

    if (typeof enabled !== 'boolean' && typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: enabled (boolean) or text (string).'
      });
    }

    if (typeof text === 'string' && text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Auto-reply message text cannot be empty.'
      });
    }

    const settings = whatsappService.setAutoReply({ userId: req.user._id, enabled, text });
    console.log(`[WhatsApp Auto-Reply][${req.user._id}] Settings updated:`, settings);

    return res.json({
      success: true,
      message: 'Auto-reply settings updated successfully.',
      ...settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear the auto-reply 24h cooldown cache (for testing or manual reset)
// @route   POST /api/whatsapp/clear-cache
// @access  Private
exports.clearAutoReplyCache = async (req, res) => {
  try {
    const { senderId } = req.body;
    const result = whatsappService.clearAutoReplyCache(senderId || null, req.user._id);
    return res.json({
      success: true,
      message: senderId
        ? `Auto-reply cache cleared for ${senderId}`
        : 'Entire auto-reply cache cleared. All senders can now receive auto-reply again.',
      ...result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live campaign dispatch progress, current target number, next number and live countdown
// @route   GET /api/whatsapp/live-dispatch
// @access  Private
exports.getLiveDispatch = async (req, res) => {
  try {
    const liveStatus = await whatsappService.getLiveDispatchStatus(req.user._id);
    return res.json({
      success: true,
      ...liveStatus
    });
  } catch (error) {
    console.error('Error fetching live WhatsApp dispatch:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve live dispatch progress',
      error: error.message
    });
  }
};
