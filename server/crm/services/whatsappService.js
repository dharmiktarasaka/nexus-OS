const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
let { Client, LocalAuth, MessageMedia } = {};

try {
  const wwebjs = require('whatsapp-web.js');
  Client = wwebjs.Client;
  LocalAuth = wwebjs.LocalAuth;
  MessageMedia = wwebjs.MessageMedia;
} catch (err) {
  console.warn('whatsapp-web.js not yet loaded or installed:', err.message);
}

const WhatsAppCampaign = require('../models/WhatsAppCampaign');

class WhatsAppService {
  constructor(userId = 'default') {
    this.userId = String(userId || 'default');
    this.client = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, AUTHENTICATED, READY, AUTH_FAILURE
    this.loadingProgress = null; // { percent: number, message: string }
    this.qrCodeData = null; // Base64 data URL
    this.qrRaw = null;
    this.userProfile = null;
    this.errorMessage = null;
    this.activeBulkJobs = new Map();
    this.autoRepliedCache = new Map();
    this.unansweredTimers = new Map();
    this.readyTimestamp = 0;
    this.connectedAt = null;
    this.connectedTimestampMs = 0;
    this.isReadyForAutoReply = false;
    this.processedMessageIds = new Map(); // messageId -> timestamp for TTL eviction
    this.autoReplyDelayMs = 60000; // 60s
    this.autoReplyEnabled = false; // Can be toggled via UI
    this.sessionClientId = `user_${this.userId}`;
    this.authPath = path.join(__dirname, '../.wwebjs_auth');
    this.settingsFilePath = path.join(__dirname, '../data_db', `whatsapp_auto_reply_${this.userId}.json`);

    // Connection Persistence & Keep-Alive State
    this.isExplicitDisconnect = false;
    this.heartbeatInterval = null;
    this.watchdogInterval = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.initTimeoutTimer = null;

    // Live Campaign Dispatch State for real-time CRM tracking & countdown timers
    this.activeCampaignProgress = null;
    this.lastDirectMessage = null;

    // Load persisted settings on startup
    this.loadAutoReplySettings();
  }

  loadAutoReplySettings() {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        const data = JSON.parse(raw);
        if (typeof data.enabled === 'boolean') {
          this.autoReplyEnabled = data.enabled;
        }
        if (typeof data.text === 'string' && data.text.trim().length > 0) {
          this.autoReplyText = data.text.trim();
        }
        console.log('[WhatsApp Auto-Reply] Loaded persisted settings:', {
          enabled: this.autoReplyEnabled,
          text: this.autoReplyText
        });
      }
    } catch (e) {
      console.warn('[WhatsApp Auto-Reply] Could not load persisted settings:', e.message);
    }
  }

  saveAutoReplySettings() {
    try {
      const dir = path.dirname(this.settingsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.settingsFilePath,
        JSON.stringify({ enabled: this.autoReplyEnabled, text: this.autoReplyText }, null, 2),
        'utf8'
      );
      console.log('[WhatsApp Auto-Reply] Persisted settings saved:', {
        enabled: this.autoReplyEnabled,
        text: this.autoReplyText
      });
    } catch (e) {
      console.warn('[WhatsApp Auto-Reply] Could not save persisted settings:', e.message);
    }
  }

  // Update auto-reply settings from the UI/API
  setAutoReply({ enabled, text } = {}) {
    if (typeof enabled === 'boolean') {
      this.autoReplyEnabled = enabled;
    }
    if (typeof text === 'string' && text.trim().length > 0) {
      this.autoReplyText = text.trim();
    }
    this.saveAutoReplySettings();
    return this.getAutoReplySettings();
  }

  getAutoReplySettings() {
    return {
      autoReplyEnabled: this.autoReplyEnabled,
      autoReplyText: this.autoReplyText
    };
  }

  // Clear the 24-hour auto-reply cooldown cache (useful for testing)
  clearAutoReplyCache(senderId = null) {
    if (senderId) {
      this.autoRepliedCache.delete(String(senderId));
      console.log(`[WhatsApp Auto-Reply] 🧹 Cleared reply cache for sender: ${senderId}`);
    } else {
      this.autoRepliedCache.clear();
      console.log('[WhatsApp Auto-Reply] 🧹 Cleared entire auto-reply cache.');
    }
    return { cleared: true, senderId: senderId || 'ALL' };
  }

  getStatus() {
    return {
      status: this.status,
      loadingProgress: this.loadingProgress,
      qrCodeData: this.qrCodeData,
      userProfile: this.userProfile,
      errorMessage: this.errorMessage,
      isConnected: this.status === 'READY',
      connectedAt: this.connectedAt,
      connectedTimestampMs: this.connectedTimestampMs,
      isReadyForAutoReply: this.isReadyForAutoReply,
      autoReplyEnabled: this.autoReplyEnabled,
      autoReplyText: this.autoReplyText
    };
  }

  setConnectionTimestamp(timestamp) {
    if (timestamp instanceof Date) {
      this.connectedAt = timestamp;
      this.connectedTimestampMs = timestamp.getTime();
    } else if (typeof timestamp === 'number' && timestamp > 0) {
      const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
      this.connectedTimestampMs = ms;
      this.connectedAt = new Date(ms);
    } else {
      this.connectedAt = new Date();
      this.connectedTimestampMs = this.connectedAt.getTime();
    }
    this.readyTimestamp = this.connectedTimestampMs;
    this.isReadyForAutoReply = true;
  }

  parseMessageTimestamp(rawTs) {
    if (rawTs === null || rawTs === undefined || rawTs === '' || typeof rawTs === 'boolean') {
      return null;
    }

    if (rawTs instanceof Date) {
      const time = rawTs.getTime();
      return isNaN(time) || time <= 0 ? null : time;
    }

    const num = Number(rawTs);
    if (isNaN(num) || !isFinite(num) || num <= 0) {
      return null;
    }

    // If timestamp is in seconds (e.g. 1712345678, standard for whatsapp-web.js), convert to ms
    // If timestamp is already in milliseconds (>= 1e11), use as-is
    return num < 1e11 ? Math.round(num * 1000) : Math.round(num);
  }

  isMessageProcessed(messageId) {
    if (!messageId) return false;
    this.cleanupProcessedCache();
    return this.processedMessageIds.has(String(messageId));
  }

  markMessageProcessed(messageId) {
    if (!messageId) return;
    this.processedMessageIds.set(String(messageId), Date.now());
  }

  cleanupProcessedCache() {
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours
    if (this.processedMessageIds.size > 5000) {
      for (const [id, time] of this.processedMessageIds.entries()) {
        if (now - time > TTL) {
          this.processedMessageIds.delete(id);
        }
      }
    }
  }

  async processIncomingMessage(msg, { isOutgoingEvent = false } = {}) {
    try {
      if (!msg) {
        return { success: false, ignored: true, reason: 'EMPTY_MESSAGE' };
      }

      // 1. Extract message identifier for deduplication
      const messageId = msg.id?._serialized || msg.id?.id || (typeof msg.id === 'string' ? msg.id : null) || msg.messageId || msg.key?.id;

      // 2. Prevent duplicate processing
      if (messageId && this.isMessageProcessed(messageId)) {
        return { success: true, ignored: true, reason: 'DUPLICATE_MESSAGE', messageId };
      }

      // 3. Handle outgoing messages sent by YOU (fromMe)
      if (msg.fromMe || msg.isOutgoing || isOutgoingEvent) {
        const recipientId = msg.to || msg.recipient || msg.chatId;
        if (recipientId) {
          // If you replied/messaged them, also mark in autoRepliedCache so we don't auto-reply to them
          this.autoRepliedCache.set(recipientId, Date.now());
          if (this.unansweredTimers.has(recipientId)) {
            clearTimeout(this.unansweredTimers.get(recipientId));
            this.unansweredTimers.delete(recipientId);
            console.log(`[WhatsApp Auto-Reply] ✅ Outgoing message sent to ${recipientId}. Auto-reply cancelled.`);
          }
        }
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, isOutgoing: true, cancelledTimer: Boolean(recipientId) };
      }

      // 4. Ignore status stories, broadcasts, or group messages immediately
      const rawFrom = String(msg.from || '');
      if (msg.isStatus || rawFrom.includes('@broadcast') || rawFrom.includes('@g.us') || msg.isGroup) {
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'BROADCAST_OR_GROUP' };
      }

      // Ignore non-user message types (system/protocol/sync events)
      const ignoredTypes = ['protocol', 'e2e_notification', 'notification_template', 'call_log', 'gp2', 'revoked'];
      if (msg.type && ignoredTypes.includes(msg.type)) {
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'SYSTEM_PROTOCOL_MESSAGE' };
      }

      const senderId = msg.from || msg.sender || msg.chatId;
      const messageBody = (msg.body || msg.text || msg.content || '').trim();

      // STRICT CHECK: Message MUST have actual text or media content (reject empty sync stubs)
      if (!messageBody && !msg.hasMedia) {
        console.log(`[WhatsApp Auto-Reply] 🛡️ Ignored empty/non-text message stub from ${senderId}`);
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'EMPTY_MESSAGE_STUB' };
      }

      // 5. Connection & Activation check
      if (this.status !== 'READY' || !this.connectedTimestampMs) {
        return { success: false, ignored: true, reason: 'NOT_CONNECTED' };
      }

      // 6. STRICT TIMESTAMP & REAL-TIME FRESHNESS VERIFICATION
      const now = Date.now();
      const rawTimestamp = msg.timestamp || msg.messageTimestamp || msg.date || msg.createdAt;
      const msgTimestampMs = this.parseMessageTimestamp(rawTimestamp);

      if (msgTimestampMs === null) {
        console.warn(`[WhatsApp Auto-Reply] ⚠️ Message timestamp unverified (raw: ${rawTimestamp}). Ignoring.`);
        if (messageId) this.markMessageProcessed(messageId);
        return { success: false, ignored: true, reason: 'UNVERIFIABLE_TIMESTAMP' };
      }

      // Check A: 15-second startup warm-up gate (ignores any initial chat sync on connection)
      const timeSinceConnect = now - this.connectedTimestampMs;
      if (timeSinceConnect < 15000 && msgTimestampMs <= (this.connectedTimestampMs + 15000)) {
        console.log(`[WhatsApp Auto-Reply] 🛡️ Ignored startup sync message during 15s connection warm-up (${senderId})`);
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'STARTUP_SYNC_WARMUP' };
      }

      // Check B: Message must have been sent AFTER WhatsApp connected (with 5-second safety buffer)
      if (msgTimestampMs <= (this.connectedTimestampMs + 5000)) {
        console.log(`[WhatsApp Auto-Reply] 🛡️ Ignored past/historical message (msgTime: ${new Date(msgTimestampMs).toISOString()} <= connectedAt: ${new Date(this.connectedTimestampMs).toISOString()})`);
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'HISTORICAL_MESSAGE_BEFORE_CONNECTION' };
      }

      // Check C: Message must be FRESH (sent within the last 60 seconds of server real time)
      if (now - msgTimestampMs > 60000) {
        console.log(`[WhatsApp Auto-Reply] 🛡️ Ignored stale backlogged message (age: ${Math.round((now - msgTimestampMs) / 1000)}s old)`);
        if (messageId) this.markMessageProcessed(messageId);
        return { success: true, ignored: true, reason: 'STALE_MESSAGE_TOO_OLD' };
      }

      // Mark message as processed
      if (messageId) {
        this.markMessageProcessed(messageId);
      }

      // 7. Validate sender is a direct 1-on-1 chat
      const isDirectChat = senderId && (
        senderId.includes('@c.us') ||
        senderId.includes('@s.whatsapp.net') ||
        senderId.includes('@lid')
      );
      if (!isDirectChat) {
        console.log(`[WhatsApp Auto-Reply] Ignored: senderId (${senderId}) is not a direct user chat.`);
        return { success: true, ignored: true, reason: 'INVALID_DIRECT_SENDER' };
      }

      // 8. STRICT SAVED CONTACT & OLD CHAT HISTORY SCAN (Multi-layer verification)
      let isSavedContact = false;
      let isOldChatWithHistory = false;
      let contactDetails = { isMyContact: false, name: null };

      // Layer 1: Check msg.getContact()
      try {
        if (typeof msg.getContact === 'function') {
          const contact = await Promise.race([
            msg.getContact(),
            new Promise(res => setTimeout(() => res(null), 2500))
          ]);

          if (contact) {
            contactDetails.isMyContact = Boolean(contact.isMyContact || contact.isAddressBookContact);
            contactDetails.name = contact.name || null;

            // Check if contact has a saved name that is NOT just a phone number
            const hasCustomSavedName = Boolean(
              contact.name &&
              typeof contact.name === 'string' &&
              contact.name.trim().length > 0 &&
              contact.name !== contact.number &&
              !/^\+?\d[\d\s\-().]{4,}$/.test(contact.name.trim())
            );

            if (contact.isMyContact === true || contact.isAddressBookContact === true || hasCustomSavedName) {
              isSavedContact = true;
            }
          }
        }
      } catch (cErr) {
        console.warn('[WhatsApp Auto-Reply] Contact lookup error:', cErr.message);
      }

      // Layer 2: Check msg.getChat() for group protection, chat name check & PRIOR CHAT HISTORY
      try {
        if (typeof msg.getChat === 'function') {
          const chat = await Promise.race([
            msg.getChat(),
            new Promise(res => setTimeout(() => res(null), 2500))
          ]);

          if (chat) {
            // Group / Broadcast safeguard
            if (chat.isGroup || chat.isBroadcast || chat.id?._serialized?.includes('@g.us') || chat.id?._serialized?.includes('@broadcast')) {
              return { success: true, ignored: true, reason: 'GROUP_OR_BROADCAST' };
            }

            // If chat name is saved with a non-phone name
            if (chat.name && typeof chat.name === 'string' && chat.name.trim().length > 0) {
              const isNamePhoneNumber = /^\+?\d[\d\s\-().]{4,}$/.test(chat.name.trim());
              if (!isNamePhoneNumber && chat.name !== chat.id?.user) {
                isSavedContact = true;
              }
            }

            // SCAN CHAT HISTORY: If there are prior messages before this connection or outgoing messages from you, it is an OLD CHAT!
            if (typeof chat.fetchMessages === 'function') {
              const history = await Promise.race([
                chat.fetchMessages({ limit: 12 }),
                new Promise(res => setTimeout(() => res([]), 2500))
              ]);

              const priorMessages = (history || []).filter(m => {
                const id = m.id?._serialized || m.id?.id;
                return id !== messageId;
              });

              if (priorMessages.length > 0) {
                const hasPastHistory = priorMessages.some(m => {
                  const mTs = (m.timestamp || 0) * 1000;
                  return m.fromMe === true || (this.connectedTimestampMs && mTs <= this.connectedTimestampMs);
                });

                if (hasPastHistory) {
                  isOldChatWithHistory = true;
                }
              }
            }
          }
        }
      } catch (chatErr) {
        // Continue with available checks
      }

      console.log(`[WhatsApp Incoming Live] From: ${senderId} | SavedContact: ${isSavedContact} | OldChat: ${isOldChatWithHistory} | Name: "${contactDetails.name || 'N/A'}" | AutoReply ON: ${this.autoReplyEnabled} | Msg: "${messageBody}"`);

      // 9. If SAVED CONTACT -> STRICTLY DO NOT AUTO-REPLY
      if (isSavedContact) {
        console.log(`[WhatsApp Auto-Reply] 👤 Contact is saved in phone (${senderId}). Skipping auto-reply.`);
        return { success: true, processed: true, isSavedContact: true, senderId, messageBody };
      }

      // 10. If OLD / EXISTING CHAT WITH PRIOR HISTORY -> STRICTLY DO NOT AUTO-REPLY
      if (isOldChatWithHistory) {
        console.log(`[WhatsApp Auto-Reply] 📜 Existing/old chat with prior conversation detected (${senderId}). Skipping auto-reply.`);
        return { success: true, processed: true, isOldChat: true, isSavedContact: false, autoReplied: false, reason: 'EXISTING_CHAT_HISTORY', senderId, messageBody };
      }

      // 10. Auto-reply disabled toggle
      if (!this.autoReplyEnabled) {
        console.log(`[WhatsApp Auto-Reply] ⏸️ Auto-reply toggle is OFF. Skipping reply to ${senderId}.`);
        return { success: true, processed: true, isSavedContact: false, autoReplied: false, reason: 'AUTO_REPLY_DISABLED', senderId, messageBody };
      }

      // 11. 24-Hour Cooldown per unsaved sender
      const AUTO_REPLY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
      const lastRepliedAt = this.autoRepliedCache.get(senderId);
      if (lastRepliedAt && (now - lastRepliedAt < AUTO_REPLY_COOLDOWN_MS)) {
        console.log(`[WhatsApp Auto-Reply] ℹ️ Already auto-replied to ${senderId} within 24h. Skipping.`);
        return { success: true, processed: true, isSavedContact: false, autoReplied: false, reason: 'ALREADY_REPLIED_RECENTLY', senderId, messageBody };
      }

      // 12. Send Auto-Reply to this new unsaved sender
      const replyText = this.autoReplyText;
      this.autoRepliedCache.set(senderId, now);

      try {
        if (this.client && this.status === 'READY') {
          await this.client.sendMessage(senderId, replyText);
          console.log(`[WhatsApp Auto-Reply] 🚀 Auto-reply sent to unknown sender (${senderId}): "${replyText}"`);
        } else {
          console.warn(`[WhatsApp Auto-Reply] Client not ready, could not send reply to ${senderId}`);
        }
      } catch (replyErr) {
        console.warn(`[WhatsApp Auto-Reply] ❌ Failed to send auto-reply to ${senderId}:`, replyErr.message);
      }

      return { success: true, processed: true, isSavedContact: false, autoReplied: true, senderId, messageBody };
    } catch (msgErr) {
      console.warn('[WhatsAppService] Error in processIncomingMessage:', msgErr.message);
      return { success: false, error: msgErr.message };
    }
  }

  getChromeExecutablePath() {
    // 1. Check environment variables
    const envPaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
      process.env.GOOGLE_CHROME_BIN,
      process.env.CHROME_PATH
    ].filter(Boolean);

    // 2. Windows specific paths
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const userProfile = process.env.USERPROFILE || '';

    const windowsPaths = [
      path.join(programFiles, 'Google/Chrome/Application/chrome.exe'),
      path.join(programFilesX86, 'Google/Chrome/Application/chrome.exe'),
      path.join(localAppData, 'Google/Chrome/Application/chrome.exe'),
      path.join(userProfile, 'AppData/Local/Google/Chrome/Application/chrome.exe'),
      path.join(programFiles, 'Microsoft/Edge/Application/msedge.exe'),
      path.join(programFilesX86, 'Microsoft/Edge/Application/msedge.exe'),
      path.join(localAppData, 'Microsoft/Edge/Application/msedge.exe'),
      path.join(userProfile, 'AppData/Local/Microsoft/Edge/Application/msedge.exe'),
      path.join(programFiles, 'BraveSoftware/Brave-Browser/Application/brave.exe'),
      path.join(localAppData, 'BraveSoftware/Brave-Browser/Application/brave.exe')
    ];

    // 3. Linux / Cloud (Render, Heroku, Docker, DigitalOcean, Ubuntu, Debian)
    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/local/bin/chrome',
      '/usr/local/bin/google-chrome',
      '/usr/bin/chrome'
    ];

    // 4. macOS
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    ];

    const allPossible = [...envPaths, ...windowsPaths, ...linuxPaths, ...macPaths];

    for (const p of allPossible) {
      try {
        if (p && fs.existsSync(p)) {
          return p;
        }
      } catch (e) {}
    }

    // 5. Check local .cache/puppeteer directory (where postinstall downloads it on cloud build)
    const localCacheDirs = [
      path.join(__dirname, '../.cache/puppeteer'),
      path.join(process.cwd(), '.cache/puppeteer'),
      '/opt/render/.cache/puppeteer',
      '/app/.cache/puppeteer',
      '/root/.cache/puppeteer'
    ];

    for (const cacheDir of localCacheDirs) {
      try {
        if (fs.existsSync(cacheDir)) {
          const findExe = (dir) => {
            const files = fs.readdirSync(dir);
            for (const f of files) {
              const full = path.join(dir, f);
              const stat = fs.statSync(full);
              if (stat.isDirectory()) {
                const res = findExe(full);
                if (res) return res;
              } else if (f === 'chrome' || f === 'chrome.exe' || f === 'chromium' || f === 'chromium.exe') {
                return full;
              }
            }
            return null;
          };
          const found = findExe(cacheDir);
          if (found) return found;
        }
      } catch (e) {}
    }

    // 6. Puppeteer built-in executablePath if exists
    try {
      const puppeteer = require('puppeteer');
      if (typeof puppeteer.executablePath === 'function') {
        const puppeteerPath = puppeteer.executablePath();
        if (puppeteerPath && fs.existsSync(puppeteerPath)) {
          return puppeteerPath;
        }
      }
    } catch (e) {}

    return undefined;
  }

  cleanSessionLocks() {
    try {
      const lockNames = new Set([
        'singletonlock',
        'singletoncookie',
        'singletonsocket',
        'devtoolsactiveport',
        'lockfile',
        'lock',
        'parent.lock'
      ]);

      const cleanRecursive = (dir) => {
        if (!fs.existsSync(dir)) return;
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              cleanRecursive(fullPath);
            } else {
              const lower = entry.name.toLowerCase();
              if (lockNames.has(lower) || lower.startsWith('singleton') || lower === 'devtoolsactiveport') {
                try {
                  fs.unlinkSync(fullPath);
                } catch (e) {}
              }
            }
          }
        } catch (e) {}
      };

      cleanRecursive(this.authPath);
    } catch (e) {
      console.warn(`[WhatsAppService][${this.userId}] Notice while cleaning session locks:`, e.message);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.failedHeartbeatCount = 0;
    console.log('[WhatsAppService] 💓 Starting continuous WhatsApp keep-alive heartbeat (every 20s)');
    this.heartbeatInterval = setInterval(async () => {
      if (!this.client || this.status !== 'READY') return;
      if (this.isExplicitDisconnect) return;

      try {
        // 1. Send active keep-alive probe directly to WhatsApp Web DOM/JS engine
        let isPageAlive = false;
        if (this.client.pupPage && !this.client.pupPage.isClosed()) {
          const pagePing = await Promise.race([
            this.client.pupPage.evaluate(() => {
              try {
                const hasApp = Boolean(document.querySelector('#app') || document.querySelector('#pane-side') || document.querySelector('[data-testid="chat-list"]'));
                const state = window.AuthStore?.AppState?.state || (window.Store?.Conn?.wid ? 'CONNECTED' : null);
                return { alive: hasApp, state };
              } catch (e) {
                return { alive: true, state: null };
              }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Heartbeat page probe timeout')), 6000))
          ]).catch(() => null);

          if (pagePing && pagePing.alive) {
            isPageAlive = true;
          }
        }

        // 2. Query client.getState()
        const state = await Promise.race([
          this.client.getState(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Heartbeat getState timeout')), 6000))
        ]).catch(() => null);

        if (state === 'CONNECTED' || (isPageAlive && (!state || state === 'CONNECTED' || state === 'PAIRING'))) {
          // Healthy connection
          this.failedHeartbeatCount = 0;
        } else {
          this.failedHeartbeatCount = (this.failedHeartbeatCount || 0) + 1;
          console.warn(`[WhatsAppService] ⚠️ Heartbeat probe notice (${this.failedHeartbeatCount}/3): state='${state}', pageAlive=${isPageAlive}`);

          // Only initiate auto-recovery after 3 consecutive failed probes (60 seconds continuous unresponsiveness)
          if (this.failedHeartbeatCount >= 3 && !this.isExplicitDisconnect) {
            console.warn('[WhatsAppService] 🔄 3 consecutive heartbeat failures detected. Auto-recovering session...');
            this.failedHeartbeatCount = 0;
            this.scheduleAutoReconnect(2000);
          }
        }
      } catch (err) {
        this.failedHeartbeatCount = (this.failedHeartbeatCount || 0) + 1;
        if (this.failedHeartbeatCount >= 3 && !this.isExplicitDisconnect) {
          console.warn('[WhatsAppService] 🔄 Auto-recovering after persistent heartbeat timeout:', err.message);
          this.failedHeartbeatCount = 0;
          this.scheduleAutoReconnect(3000);
        }
      }
    }, 20000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  startConnectionWatchdog() {
    this.stopConnectionWatchdog();
    console.log(`[WhatsAppService][${this.userId}] 🚀 Starting connection detector watchdog`);
    this.watchdogInterval = setInterval(async () => {
      if (!this.client || this.status === 'READY') {
        this.stopConnectionWatchdog();
        return;
      }

      try {
        // 1. Direct client.info check
        if (this.client.info && (this.client.info.wid || this.client.info.pushname)) {
          console.log(`[WhatsAppService][${this.userId}] ⚡ Instant connection detected via client.info!`);
          await this.markReady();
          return;
        }

        // 2. Direct client.getState() check
        const state = await Promise.race([
          this.client.getState(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
        ]).catch(() => null);

        if (state === 'CONNECTED') {
          console.log(`[WhatsAppService][${this.userId}] ⚡ Instant connection detected via client.getState() === CONNECTED!`);
          await this.markReady();
          return;
        }
      } catch (err) {
        // quiet fail on watchdog poll
      }
    }, 1500);
  }

  stopConnectionWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  formatDisplayPhone(rawPhone) {
    if (!rawPhone) return '';
    let digits = String(rawPhone).replace(/\D/g, '');
    if (!digits) return rawPhone;

    // Format India numbers (91 + 10 digits)
    if (digits.startsWith('91') && digits.length === 12) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    // Format US/Canada numbers (1 + 10 digits)
    if (digits.startsWith('1') && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    // General international numbers
    if (digits.length >= 10 && digits.length <= 15) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    return `+${digits}`;
  }

  async refreshUserProfile(customWid = null) {
    try {
      let info = this.client?.info;
      let pushname = info?.pushname || '';
      let rawWid = info?.wid?.user || (customWid ? String(customWid).replace(/@.*$/, '') : '') || '';
      let phone = '';
      let platform = info?.platform || 'WhatsApp Multi-Device';
      let profilePicUrl = null;

      // 1. If we have a wid user that looks like a phone number (e.g. 7-15 digits)
      if (rawWid && !rawWid.includes(':') && /^\d{7,15}$/.test(rawWid)) {
        phone = rawWid;
      }

      // 2. Try fetching contact info using whatsapp-web.js Contact model
      try {
        const widSerialized = info?.wid?._serialized || (rawWid ? (rawWid.includes('@') ? rawWid : `${rawWid}@c.us`) : null);
        if (this.client && widSerialized && typeof this.client.getContactById === 'function') {
          const contact = await Promise.race([
            this.client.getContactById(widSerialized),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
          ]).catch(() => null);

          if (contact) {
            if (contact.pushname && !pushname) pushname = contact.pushname;
            if (contact.name && !pushname) pushname = contact.name;
            if (contact.number && !phone) phone = contact.number;
            if (typeof contact.getProfilePicUrl === 'function') {
              profilePicUrl = await Promise.race([
                contact.getProfilePicUrl(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
              ]).catch(() => null);
            }
          }
        }
      } catch (cErr) {}

      // 3. If phone or pushname still missing, inspect WhatsApp Web DOM / AuthStore / WAWebUserPrefsMeUser
      if (this.client?.pupPage && !this.client.pupPage.isClosed() && (!phone || !pushname || pushname === 'WhatsApp User')) {
        try {
          const domProfile = await Promise.race([
            this.client.pupPage.evaluate(() => {
              try {
                let pName = '';
                let pPhone = '';
                let pWid = '';

                // WAWebUserPrefsMeUser module
                try {
                  if (window.require && typeof window.require === 'function') {
                    const meModule = window.require('WAWebUserPrefsMeUser') || window.require('WAWebMeUser');
                    if (meModule) {
                      if (typeof meModule.getPushname === 'function') pName = meModule.getPushname() || pName;
                      if (typeof meModule.getMaybeMePnUser === 'function') {
                        const pn = meModule.getMaybeMePnUser();
                        if (pn && pn.user) pPhone = pn.user;
                      }
                      if (typeof meModule.getMeUser === 'function') {
                        const me = meModule.getMeUser();
                        if (me && me.user && !pPhone) pPhone = me.user;
                      }
                    }
                  }
                } catch (e) {}

                // window.Store Conn & User
                if (window.Store) {
                  if (window.Store.Conn) {
                    if (!pName && window.Store.Conn.pushname) pName = window.Store.Conn.pushname;
                    if (!pPhone && window.Store.Conn.wid) {
                      const u = window.Store.Conn.wid.user;
                      if (u && !u.includes(':')) pPhone = u;
                      pWid = window.Store.Conn.wid._serialized || '';
                    }
                    if (!pPhone && window.Store.Conn.me) {
                      pPhone = window.Store.Conn.me.user || '';
                    }
                  }
                  if (window.Store.User) {
                    if (!pPhone && typeof window.Store.User.getMaybeMePnUser === 'function') {
                      const pn = window.Store.User.getMaybeMePnUser();
                      if (pn && pn.user) pPhone = pn.user;
                    }
                    if (!pPhone && typeof window.Store.User.getMeUser === 'function') {
                      const me = window.Store.User.getMeUser();
                      if (me && me.user) pPhone = me.user;
                    }
                  }
                  if (window.Store.Contact && (pWid || (window.Store.Conn && window.Store.Conn.wid))) {
                    const meContact = window.Store.Contact.get(pWid || window.Store.Conn.wid);
                    if (meContact) {
                      if (!pName && meContact.pushname) pName = meContact.pushname;
                      if (!pName && meContact.name) pName = meContact.name;
                      if (!pPhone && meContact.number) pPhone = meContact.number;
                    }
                  }
                }

                // window.AuthStore
                if (window.AuthStore && window.AuthStore.Conn) {
                  if (!pName && window.AuthStore.Conn.pushname) pName = window.AuthStore.Conn.pushname;
                  if (!pPhone && window.AuthStore.Conn.wid) {
                    const w = window.AuthStore.Conn.wid;
                    const u = typeof w === 'string' ? w.replace(/@.*$/, '') : (w.user || '');
                    if (u && !u.includes(':')) pPhone = u;
                  }
                }

                // Check LocalStorage keys
                if (!pPhone) {
                  const lastWid = localStorage.getItem('last-wid') || localStorage.getItem('last-wid-md');
                  if (lastWid) {
                    const clean = lastWid.replace(/["\s]/g, '').replace(/@.*$/, '').replace(/:\d+$/, '');
                    if (/^\d{7,15}$/.test(clean)) pPhone = clean;
                  }
                }

                return { pushname: pName, phone: pPhone, wid: pWid };
              } catch (err) {
                return null;
              }
            }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
          ]).catch(() => null);

          if (domProfile) {
            if (domProfile.pushname && (!pushname || pushname === 'WhatsApp User')) pushname = domProfile.pushname;
            if (domProfile.phone && !phone) phone = domProfile.phone;
          }
        } catch (domErr) {}
      }

      // 4. Normalize clean phone number
      let cleanPhone = phone || rawWid || '';
      // Remove any :device (e.g. 919876543210:0 -> 919876543210)
      cleanPhone = cleanPhone.replace(/:\d+$/, '').replace(/[^0-9]/g, '');

      let formattedPhone = cleanPhone ? (cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`) : 'Connected';
      let displayPhone = cleanPhone ? this.formatDisplayPhone(cleanPhone) : 'Connected';
      let finalPushname = pushname ? pushname.trim() : (this.userProfile?.pushname && this.userProfile.pushname !== 'WhatsApp User' ? this.userProfile.pushname : 'WhatsApp User');

      this.userProfile = {
        pushname: finalPushname,
        phone: formattedPhone,
        displayPhone: displayPhone,
        rawNumber: cleanPhone,
        wid: rawWid || info?.wid?._serialized || '',
        platform: platform,
        profilePicUrl: profilePicUrl || this.userProfile?.profilePicUrl || null,
        connectedAt: this.connectedAt || new Date()
      };

      console.log('[WhatsAppService] 📱 WhatsApp Profile identified:', {
        pushname: this.userProfile.pushname,
        phone: this.userProfile.phone,
        displayPhone: this.userProfile.displayPhone
      });

      return this.userProfile;
    } catch (err) {
      console.warn('[WhatsAppService] Notice while refreshing profile:', err.message);
      if (!this.userProfile) {
        this.userProfile = {
          pushname: 'WhatsApp User',
          phone: 'Connected',
          displayPhone: 'Connected'
        };
      }
      return this.userProfile;
    }
  }

  async markReady(customWid = null) {
    const isFirstReady = this.status !== 'READY';
    this.status = 'READY';
    this.stopConnectionWatchdog();
    this.loadingProgress = null;
    if (isFirstReady) {
      this.setConnectionTimestamp(new Date());
    }
    this.reconnectAttempts = 0;
    this.qrCodeData = null;
    this.qrRaw = null;
    this.errorMessage = null;

    console.log('[WhatsAppService] ✅ WhatsApp Web Client is READY & Connected');

    // Start 25s keep-alive heartbeat
    this.startHeartbeat();

    // Refresh user profile with actual WhatsApp name and actual mobile number
    await this.refreshUserProfile(customWid);
  }

  scheduleAutoReconnect(delayMs = 3000) {
    if (this.isExplicitDisconnect) {
      console.log('[WhatsAppService] Explicit user disconnect active; auto-reconnect aborted.');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`[WhatsAppService] ⚠️ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Pausing for 45s before retry...`);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts = 0;
        this.scheduleAutoReconnect(2000);
      }, 45000);
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WhatsAppService] 🔄 Auto-reconnect attempt #${this.reconnectAttempts} scheduled in ${Math.round(delayMs / 1000)}s...`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      if (this.isExplicitDisconnect) return;

      try {
        console.log(`[WhatsAppService] 🚀 Running auto-reconnect #${this.reconnectAttempts}...`);
        await this.initializeClient({ force: false });
      } catch (err) {
        console.error('[WhatsAppService] ❌ Auto-reconnect attempt failed:', err.message);
        const nextDelay = Math.min(20000, Math.round(delayMs * 1.5));
        this.scheduleAutoReconnect(nextDelay);
      }
    }, delayMs);
  }

  async initializeClient({ force = false } = {}) {
    if (!Client || !LocalAuth) {
      try {
        const wwebjs = require('whatsapp-web.js');
        Client = wwebjs.Client;
        LocalAuth = wwebjs.LocalAuth;
      } catch (err) {
        this.status = 'AUTH_FAILURE';
        this.errorMessage = 'WhatsApp library not available: ' + err.message;
        throw new Error(this.errorMessage);
      }
    }

    if (this.status === 'READY' && this.client && !force) {
      return this.getStatus();
    }

    if (this.status === 'INITIALIZING' && !force) {
      return this.getStatus();
    }

    this.isExplicitDisconnect = false;
    this.status = 'INITIALIZING';
    this.loadingProgress = { percent: 0, message: 'Starting WhatsApp Web engine...' };
    this.qrCodeData = null;
    this.qrRaw = null;
    this.errorMessage = null;

    if (this.client) {
      this.stopHeartbeat();
      this.stopConnectionWatchdog();
      try {
        if (this.client.pupBrowser) {
          const proc = this.client.pupBrowser.process();
          if (proc && proc.pid) {
            try {
              process.kill(proc.pid, 'SIGKILL');
            } catch (e) {}
          }
        }
        await this.client.destroy();
      } catch (err) {
        console.error('Error destroying previous WhatsApp client instance:', err.message);
      }
      this.client = null;
    }

    // If force initializing and current status is not READY, clean stale unauthenticated session folder
    if (force && this.status !== 'READY') {
      const userSessionDir = path.join(this.authPath, `session-${this.sessionClientId}`);
      try {
        if (fs.existsSync(userSessionDir)) {
          fs.rmSync(userSessionDir, { recursive: true, force: true });
          console.log(`[WhatsAppService][${this.userId}] Removed stale unauthenticated session directory for fresh QR code.`);
        }
      } catch (rmErr) {
        console.warn(`[WhatsAppService][${this.userId}] Notice cleaning user session dir:`, rmErr.message);
      }
    }

    this.cleanSessionLocks();

    try {
      const puppeteerOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-blink-features=AutomationControlled'
        ]
      };

      const systemChrome = this.getChromeExecutablePath();
      if (systemChrome) {
        puppeteerOptions.executablePath = systemChrome;
        console.log(`[WhatsAppService][${this.userId}] Launching browser with executable path:`, systemChrome);
      } else {
        console.log(`[WhatsAppService][${this.userId}] Using Puppeteer default browser.`);
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.sessionClientId,
          dataPath: this.authPath
        }),
        puppeteer: puppeteerOptions,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      });

      // 45-second timeout guard to prevent indefinite INITIALIZING hang
      if (this.initTimeoutTimer) clearTimeout(this.initTimeoutTimer);
      this.initTimeoutTimer = setTimeout(async () => {
        if (this.status === 'INITIALIZING') {
          console.warn(`[WhatsAppService][${this.userId}] Initialization timed out after 45s.`);
          this.status = 'DISCONNECTED';
          this.errorMessage = 'WhatsApp engine timed out while generating QR. Please click button to retry.';
          try {
            if (this.client) await this.client.destroy();
          } catch (e) {}
          this.client = null;
        }
      }, 45000);

      this.client.on('qr', async (qr) => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.log(`[WhatsAppService][${this.userId}] New QR Code generated successfully`);
        this.status = 'QR_READY';
        this.loadingProgress = null;
        this.qrRaw = qr;
        try {
          this.qrCodeData = await qrcode.toDataURL(qr, { width: 320, margin: 2 });
        } catch (qrErr) {
          console.error(`[WhatsAppService][${this.userId}] Failed to generate QR code data URL:`, qrErr);
        }
        // Start watching for mobile QR scan
        this.startConnectionWatchdog();
      });

      this.client.on('authenticated', () => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.log(`[WhatsAppService][${this.userId}] Authenticated with WhatsApp Web`);
        this.status = 'AUTHENTICATED';
        this.loadingProgress = { percent: 50, message: 'Authenticated! Connecting session...' };
        this.qrCodeData = null;
        this.qrRaw = null;
        this.errorMessage = null;
        this.startConnectionWatchdog();
      });

      this.client.on('change_state', async (state) => {
        console.log(`[WhatsAppService][${this.userId}] Connection state changed:`, state);
        if (state === 'CONNECTED') {
          await this.markReady();
        } else if ((state === 'TIMEOUT' || state === 'CONFLICT') && !this.isExplicitDisconnect) {
          console.warn(`[WhatsAppService][${this.userId}] State '${state}' encountered. Triggering auto-reconnect...`);
          this.scheduleAutoReconnect(2500);
        } else if (state === 'UNPAIRED' || state === 'UNLAUNCHED') {
          console.log(`[WhatsAppService][${this.userId}] State '${state}' (device unlinked from phone).`);
          this.stopHeartbeat();
          this.stopConnectionWatchdog();
          this.status = 'DISCONNECTED';
          this.userProfile = null;
          this.client = null;
        }
      });

      this.client.on('loading_screen', (percent, message) => {
        console.log(`[WhatsAppService][${this.userId}] WhatsApp Web Loading: ${percent}% - ${message}`);
        if (this.status !== 'READY') {
          this.status = 'AUTHENTICATED';
          this.loadingProgress = {
            percent: typeof percent === 'number' ? percent : null,
            message: message || 'Synchronizing chats and media with WhatsApp Web...'
          };
          this.startConnectionWatchdog();
        }
      });

      this.client.on('ready', async () => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.log(`[WhatsAppService][${this.userId}] Client fired native "ready" event.`);
        await this.markReady();
        setTimeout(async () => {
          await this.refreshUserProfile();
        }, 600);
        setTimeout(async () => {
          await this.refreshUserProfile();
        }, 2000);
      });

      // 'message' fires only for INCOMING messages from others — used for auto-reply logic
      this.client.on('message', async (msg) => {
        await this.processIncomingMessage(msg, { isOutgoingEvent: false });
      });

      // 'message_create' fires for ALL messages including ones YOU send — used only for cancelling timers
      this.client.on('message_create', async (msg) => {
        if (msg.fromMe) {
          await this.processIncomingMessage(msg, { isOutgoingEvent: true });
        }
      });

      this.client.on('auth_failure', (msg) => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.error(`[WhatsAppService][${this.userId}] Authentication failure:`, msg);
        this.stopHeartbeat();
        this.stopConnectionWatchdog();
        this.status = 'AUTH_FAILURE';
        this.errorMessage = typeof msg === 'string' ? msg : 'WhatsApp authentication failure';
      });

      this.client.on('disconnected', (reason) => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.log(`[WhatsAppService][${this.userId}] ⚠️ WhatsApp Client disconnected event:`, reason);
        this.stopHeartbeat();
        this.stopConnectionWatchdog();
        this.status = 'DISCONNECTED';
        this.errorMessage = typeof reason === 'string' ? reason : 'WhatsApp session disconnected';
        this.client = null;

        const reasonUpper = String(reason || '').toUpperCase();
        const isUserLogout = reasonUpper.includes('LOGOUT') ||
                             reasonUpper.includes('UNPAIRED') ||
                             this.isExplicitDisconnect;

        if (!isUserLogout) {
          console.log(`[WhatsAppService][${this.userId}] 🔄 Unexpected drop detected. Auto-reconnecting saved session in 2.5s...`);
          this.scheduleAutoReconnect(2500);
        } else {
          console.log(`[WhatsAppService][${this.userId}] 🛑 Device unlinked manually by user.`);
          this.userProfile = null;
          this.connectedAt = null;
          this.connectedTimestampMs = 0;
          this.readyTimestamp = 0;
          this.isReadyForAutoReply = false;
        }
      });

      this.client.initialize().catch((initErr) => {
        if (this.initTimeoutTimer) {
          clearTimeout(this.initTimeoutTimer);
          this.initTimeoutTimer = null;
        }
        console.error(`[WhatsAppService][${this.userId}] Initialization error:`, initErr.message);
        this.stopHeartbeat();
        this.stopConnectionWatchdog();
        this.status = 'DISCONNECTED';
        this.errorMessage = initErr.message || 'Failed to initialize browser for WhatsApp';
        this.client = null;
      });

      return this.getStatus();
    } catch (err) {
      if (this.initTimeoutTimer) {
        clearTimeout(this.initTimeoutTimer);
        this.initTimeoutTimer = null;
      }
      this.stopHeartbeat();
      this.stopConnectionWatchdog();
      this.status = 'DISCONNECTED';
      this.errorMessage = err.message || 'Failed to start WhatsApp service';
      this.client = null;
      console.error(`[WhatsAppService][${this.userId}] Failed to start:`, err);
      throw err;
    }
  }

  async disconnect() {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();
    this.stopConnectionWatchdog();

    if (this.initTimeoutTimer) {
      clearTimeout(this.initTimeoutTimer);
      this.initTimeoutTimer = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        await this.client.logout();
      } catch (logoutErr) {
        console.warn(`[WhatsAppService][${this.userId}] Logout error:`, logoutErr.message);
      }
      try {
        await this.client.destroy();
      } catch (destroyErr) {
        console.warn(`[WhatsAppService][${this.userId}] Destroy error:`, destroyErr.message);
      }
      this.client = null;
    }

    this.status = 'DISCONNECTED';
    this.qrCodeData = null;
    this.qrRaw = null;
    this.userProfile = null;
    this.errorMessage = null;
    this.connectedAt = null;
    this.connectedTimestampMs = 0;
    this.readyTimestamp = 0;
    this.isReadyForAutoReply = false;
    this.processedMessageIds.clear();

    // Clear all pending unanswered timers
    for (const [key, timerId] of this.unansweredTimers.entries()) {
      clearTimeout(timerId);
    }
    this.unansweredTimers.clear();

    this.cleanSessionLocks();

    // Clean session directory to force fresh scan next time
    try {
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
      }
    } catch (rmErr) {
      console.warn(`[WhatsAppService][${this.userId}] Could not clear auth folder:`, rmErr.message);
    }

    return this.getStatus();
  }

  cleanPhoneNumber(rawNumber, defaultCountryCode = '91') {
    if (!rawNumber) return '';
    let cleaned = String(rawNumber).replace(/[^0-9]/g, '').replace(/^0+/, '');
    const code = String(defaultCountryCode || '91').replace(/[^0-9]/g, '');

    // If standard 10 digit number, prepend country code (e.g. 91 for India)
    if (cleaned.length === 10 && code) {
      cleaned = code + cleaned;
    }

    return cleaned;
  }

  async resolveWhatsAppId(rawPhone, defaultCountryCode = '91') {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const cleaned = this.cleanPhoneNumber(rawPhone, defaultCountryCode);
    if (!cleaned || cleaned.length < 7) {
      throw new Error(`Invalid phone number: ${rawPhone}`);
    }

    let targetChatId = `${cleaned}@c.us`;

    // Attempt getNumberId with strict 1-second race timeout so it NEVER hangs
    try {
      const numberId = await Promise.race([
        this.client.getNumberId(cleaned),
        new Promise(res => setTimeout(() => res(null), 1000))
      ]);
      if (numberId && numberId._serialized) {
        targetChatId = numberId._serialized;
      }
    } catch (e) {
      // Fall back to standard chatId
    }

    return targetChatId;
  }

  parseSpintax(text) {
    if (!text || typeof text !== 'string') return '';
    let result = text;
    // Matches {option1|option2|...} containing at least one '|'
    const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/;
    let iterations = 0;
    while (spintaxRegex.test(result) && iterations < 50) {
      iterations++;
      result = result.replace(spintaxRegex, (_, choices) => {
        const options = choices.split('|');
        return options[Math.floor(Math.random() * options.length)];
      });
    }
    return result;
  }

  renderTemplate(template, vars = {}, spintaxEnabled = true) {
    let result = template || '';
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, val != null ? String(val) : '');
    }
    if (spintaxEnabled) {
      result = this.parseSpintax(result);
    }
    return result;
  }

  async simulateTypingPresence(chatId, minMs = 2000, maxMs = 4000) {
    if (!this.client || this.status !== 'READY' || !chatId) return;
    try {
      const typingTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
      const chat = await Promise.race([
        this.client.getChatById(chatId),
        new Promise(res => setTimeout(() => res(null), 1500))
      ]).catch(() => null);

      if (chat && typeof chat.sendStateTyping === 'function') {
        console.log(`[WhatsApp Anti-Ban] ⌨️ Human typing presence active for ${chatId} (${(typingTime / 1000).toFixed(1)}s)...`);
        await chat.sendStateTyping().catch(() => {});
        await new Promise(r => setTimeout(r, typingTime));
        if (typeof chat.clearState === 'function') {
          await chat.clearState().catch(() => {});
        }
      } else {
        await new Promise(r => setTimeout(r, Math.min(1500, typingTime)));
      }
    } catch (err) {
      console.warn('[WhatsApp Anti-Ban] Typing presence simulation notice:', err.message);
    }
  }

  generateNonRepeatingDelay(minSec, maxSec, recentDelays = []) {
    const min = Math.max(0.5, Number(minSec) || 5.0);
    const max = Math.max(min + 0.5, Number(maxSec) || 25.0);
    let chosen = 0;
    let attempts = 0;

    do {
      attempts++;
      const raw = Math.random() * (max - min) + min;
      const jitter = (Math.random() - 0.5) * 0.5;
      chosen = Math.max(min, Math.min(max, parseFloat((raw + jitter).toFixed(3))));
    } while (recentDelays.includes(chosen) && attempts < 10);

    return chosen;
  }

  createMediaInstance({ mediaBase64, mediaMimeType, mediaFileName }) {
    if (!MessageMedia) {
      try {
        const wwebjs = require('whatsapp-web.js');
        MessageMedia = wwebjs.MessageMedia;
      } catch (e) {}
    }
    if (!MessageMedia) return null;

    if (mediaBase64 && mediaMimeType) {
      const cleanBase64 = String(mediaBase64).replace(/^data:([A-Za-z0-9-+\/]+);base64,/, '').trim();
      return new MessageMedia(mediaMimeType, cleanBase64, mediaFileName || 'image.jpg');
    }
    return null;
  }

  async sendSingleMessage({ phone, message, mediaBase64, mediaMimeType, mediaFileName, mediaUrl, defaultCountryCode = '91' }) {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WhatsApp is not connected. Please scan the QR code on the WhatsApp page first.');
    }

    if (!phone) {
      throw new Error('Phone number is required.');
    }

    const hasText = Boolean(message && String(message).trim().length > 0);
    const hasMedia = Boolean((mediaBase64 && mediaMimeType) || mediaUrl);

    if (!hasText && !hasMedia) {
      throw new Error('Please provide message text or attach a photo.');
    }

    const chatId = await this.resolveWhatsAppId(phone, defaultCountryCode);
    console.log(`[WhatsAppService] Sending single message to ${chatId}...`);

    let mediaInstance = null;
    if (hasMedia) {
      if (mediaBase64 && mediaMimeType) {
        mediaInstance = this.createMediaInstance({ mediaBase64, mediaMimeType, mediaFileName });
      } else if (mediaUrl && MessageMedia) {
        try {
          mediaInstance = await MessageMedia.fromUrl(mediaUrl);
        } catch (e) {
          console.warn('[WhatsAppService] Error fetching media from URL:', e.message);
        }
      }
    }

    let sendPromise;
    if (mediaInstance) {
      if (hasText) {
        sendPromise = this.client.sendMessage(chatId, mediaInstance, { caption: String(message).trim() });
      } else {
        sendPromise = this.client.sendMessage(chatId, mediaInstance);
      }
    } else {
      sendPromise = this.client.sendMessage(chatId, String(message).trim());
    }

    // Send with a 25-second timeout safeguard
    const sent = await Promise.race([
      sendPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sending timed out. Please check your phone connection.')), 25000)
      )
    ]);

    console.log(`[WhatsAppService] Successfully sent message to ${chatId}`);

    return {
      success: true,
      chatId,
      messageId: sent?.id?._serialized || sent?.id?.id || 'SENT',
      timestamp: new Date()
    };
  }

  async startBulkCampaign({ campaignId, defaultCountryCode = '91', delayMs = 2500 }) {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found.');
    }

    campaign.status = 'IN_PROGRESS';
    await campaign.save();

    // Prepare campaign media if attached
    let campaignMediaInstance = null;
    if (campaign.mediaBase64 && campaign.mediaMimeType) {
      campaignMediaInstance = this.createMediaInstance({
        mediaBase64: campaign.mediaBase64,
        mediaMimeType: campaign.mediaMimeType,
        mediaFileName: campaign.mediaFileName
      });
    } else if (campaign.mediaUrl && MessageMedia) {
      try {
        campaignMediaInstance = await MessageMedia.fromUrl(campaign.mediaUrl);
      } catch (mErr) {
        console.warn('[WhatsAppService] Bulk media URL fetch error:', mErr.message);
      }
    }

    // Run async in background without blocking API response
    (async () => {
      let success = 0;
      let failed = 0;
      let sentInCurrentBatch = 0;
      const recentDelays = [];
      const sentTimestamps = []; // Sliding 60-minute window for velocity control

      const strictHourlyLimit = campaign.strictHourlyLimit !== false;
      const hourlyLimit = Math.max(1, Number(campaign.hourlyLimit) || 15);
      const batchSize = Math.max(1, Number(campaign.batchSize) || 15);
      const batchCooldownSeconds = Math.max(5, Number(campaign.batchCooldownSeconds) || 45);
      const spintaxEnabled = campaign.spintaxEnabled !== false;
      const typingSimulation = campaign.typingSimulation !== false;

      // Initialize live tracking progress in-memory and database
      this.activeCampaignProgress = {
        campaignId: campaign._id.toString(),
        title: campaign.title,
        status: 'IN_PROGRESS',
        dispatchState: 'STARTING',
        totalRecipients: campaign.recipients.length,
        successCount: 0,
        failedCount: 0,
        currentRecipient: null,
        nextRecipient: campaign.recipients[0] ? {
          name: campaign.recipients[0].name || '',
          phone: campaign.recipients[0].phone,
          index: 1
        } : null,
        nextSendAt: new Date(Date.now() + 1000),
        lastSentPhone: '',
        lastSentName: '',
        lastSentAt: null,
        startedAt: new Date()
      };

      await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
        status: 'IN_PROGRESS',
        dispatchState: 'STARTING',
        nextRecipient: this.activeCampaignProgress.nextRecipient,
        nextSendAt: this.activeCampaignProgress.nextSendAt
      });

      console.log(`[WhatsApp Anti-Ban] 🛡️ Algorithmic Shield Activated for Campaign "${campaign.title}":`, {
        preset: campaign.speedPreset || 'safe_human',
        hourlyLimit: strictHourlyLimit ? `${hourlyLimit}/hr` : 'Disabled',
        paceAcrossHour: campaign.paceAcrossHour !== false,
        typingSimulation,
        batchSize,
        batchCooldown: `${batchCooldownSeconds}s`,
        delayRange: `${campaign.minDelaySeconds}s - ${campaign.maxDelaySeconds}s`,
        spintaxEnabled
      });

      for (let i = 0; i < campaign.recipients.length; i++) {
        // Check if campaign was cancelled
        const currentCampaign = await WhatsAppCampaign.findById(campaignId);
        if (!currentCampaign || currentCampaign.status === 'CANCELLED') {
          console.log(`[WhatsApp Anti-Ban] Campaign ${campaignId} cancelled by user.`);
          if (this.activeCampaignProgress) {
            this.activeCampaignProgress.status = 'CANCELLED';
            this.activeCampaignProgress.dispatchState = 'CANCELLED';
            this.activeCampaignProgress.currentRecipient = null;
            this.activeCampaignProgress.nextRecipient = null;
            this.activeCampaignProgress.nextSendAt = null;
          }
          break;
        }

        const recipient = campaign.recipients[i];
        if (recipient.status === 'SENT') {
          success++;
          continue;
        }

        // --- ANTI-BAN STEP 1: STRICT 60-MINUTE HOURLY RATE LIMIT ---
        if (strictHourlyLimit) {
          const oneHourAgo = Date.now() - 3600000;
          while (sentTimestamps.length > 0 && sentTimestamps[0] < oneHourAgo) {
            sentTimestamps.shift();
          }

          if (sentTimestamps.length >= hourlyLimit) {
            const oldest = sentTimestamps[0];
            const waitTimeMs = Math.max(2000, (oldest + 3600000) - Date.now() + 2000);
            const waitMin = Math.ceil(waitTimeMs / 60000);
            console.log(`[WhatsApp Anti-Ban] 🛡️ Strict hourly limit reached (${hourlyLimit} msgs/hr). Throttling execution for ${waitMin} minutes to evade WhatsApp velocity triggers...`);

            const waitUntil = Date.now() + waitTimeMs;
            const nextSendAt = new Date(waitUntil);
            this.activeCampaignProgress.dispatchState = 'HOURLY_THROTTLED';
            this.activeCampaignProgress.nextSendAt = nextSendAt;

            await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
              dispatchState: 'HOURLY_THROTTLED',
              nextSendAt
            });

            while (Date.now() < waitUntil) {
              const check = await WhatsAppCampaign.findById(campaignId).select('status');
              if (!check || check.status === 'CANCELLED') break;
              await new Promise(r => setTimeout(r, Math.min(5000, waitUntil - Date.now())));
            }

            // If cancelled while waiting
            const afterWait = await WhatsAppCampaign.findById(campaignId).select('status');
            if (!afterWait || afterWait.status === 'CANCELLED') break;

            sentTimestamps.shift();
          }
        }

        // --- ANTI-BAN STEP 2: TEMPLATE ROTATION & SPINTAX RANDOMIZATION ---
        let templateToUse = campaign.messageTemplate || '';
        const validTemplates = Array.isArray(campaign.templates) && campaign.templates.length > 0
          ? campaign.templates.filter(t => t && t.trim())
          : [];

        if (validTemplates.length > 0) {
          const randomIndex = Math.floor(Math.random() * validTemplates.length);
          templateToUse = validTemplates[randomIndex];
        }

        const templateVars = {
          name: recipient.name || 'Valued Customer',
          company: recipient.company || '',
          phone: recipient.phone || '',
          date: new Date().toLocaleDateString(),
          ...(recipient.customFields || {})
        };

        const renderedMsg = this.renderTemplate(templateToUse, templateVars, spintaxEnabled);
        recipient.renderedMessage = renderedMsg;
        const hasText = Boolean(renderedMsg && renderedMsg.trim().length > 0);

        // Update live tracking info: Mark active recipient
        const currentRec = {
          name: recipient.name || '',
          phone: recipient.phone,
          index: i + 1
        };
        const nextRec = i + 1 < campaign.recipients.length ? {
          name: campaign.recipients[i + 1].name || '',
          phone: campaign.recipients[i + 1].phone,
          index: i + 2
        } : null;

        this.activeCampaignProgress.currentRecipient = currentRec;
        this.activeCampaignProgress.nextRecipient = nextRec;
        this.activeCampaignProgress.dispatchState = typingSimulation ? 'TYPING' : 'SENDING';
        this.activeCampaignProgress.nextSendAt = null;

        await WhatsAppCampaign.updateOne(
          { _id: campaignId, 'recipients._id': recipient._id },
          {
            $set: {
              'recipients.$.status': 'SENDING',
              'currentRecipient.name': currentRec.name,
              'currentRecipient.phone': currentRec.phone,
              'currentRecipient.index': currentRec.index,
              'nextRecipient.name': nextRec ? nextRec.name : '',
              'nextRecipient.phone': nextRec ? nextRec.phone : '',
              'nextRecipient.index': nextRec ? nextRec.index : 0,
              dispatchState: typingSimulation ? 'TYPING' : 'SENDING',
              nextSendAt: null
            }
          }
        );

        try {
          const chatId = await this.resolveWhatsAppId(recipient.phone, defaultCountryCode);

          // --- ANTI-BAN STEP 3: HUMAN TYPING PRESENCE SIMULATION ---
          if (typingSimulation) {
            await this.simulateTypingPresence(chatId, 2000, 4200);
          }

          if (campaignMediaInstance) {
            if (hasText) {
              await this.client.sendMessage(chatId, campaignMediaInstance, { caption: renderedMsg });
            } else {
              await this.client.sendMessage(chatId, campaignMediaInstance);
            }
          } else if (hasText) {
            await this.client.sendMessage(chatId, renderedMsg);
          } else {
            throw new Error('No message text or image to send');
          }

          recipient.status = 'SENT';
          recipient.sentAt = new Date();
          recipient.error = '';
          success++;
          sentTimestamps.push(Date.now());
        } catch (sendErr) {
          recipient.status = 'FAILED';
          recipient.error = sendErr.message || 'Failed to send WhatsApp message';
          failed++;
        }

        campaign.successCount = success;
        campaign.failedCount = failed;
        this.activeCampaignProgress.successCount = success;
        this.activeCampaignProgress.failedCount = failed;
        this.activeCampaignProgress.lastSentPhone = recipient.phone;
        this.activeCampaignProgress.lastSentName = recipient.name || '';
        this.activeCampaignProgress.lastSentAt = new Date();

        // Save progress periodically or every iteration
        await WhatsAppCampaign.updateOne(
          { _id: campaignId, 'recipients._id': recipient._id },
          {
            $set: {
              'recipients.$.status': recipient.status,
              'recipients.$.sentAt': recipient.sentAt,
              'recipients.$.error': recipient.error,
              'recipients.$.renderedMessage': recipient.renderedMessage,
              successCount: success,
              failedCount: failed,
              lastSentPhone: recipient.phone,
              lastSentName: recipient.name || '',
              lastSentAt: new Date()
            }
          }
        );

        // --- ANTI-BAN STEP 4: BATCH COOLDOWN PAUSE & HIGH-VARIANCE NON-REPEATING DELAY ---
        sentInCurrentBatch++;
        if (sentInCurrentBatch >= batchSize && i < campaign.recipients.length - 1) {
          const cooldownJitter = (Math.random() * 0.3 - 0.15) * batchCooldownSeconds;
          const actualCooldownSec = Math.max(5, Math.round(batchCooldownSeconds + cooldownJitter));
          console.log(`[WhatsApp Anti-Ban] ⏸️ Micro-batch safety threshold reached (${batchSize} msgs). Taking human cooldown pause for ${actualCooldownSec}s...`);

          const cooldownEnd = Date.now() + (actualCooldownSec * 1000);
          const nextSendAt = new Date(cooldownEnd);
          this.activeCampaignProgress.dispatchState = 'BATCH_COOLDOWN';
          this.activeCampaignProgress.nextSendAt = nextSendAt;

          await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
            dispatchState: 'BATCH_COOLDOWN',
            nextSendAt,
            lastSentPhone: recipient.phone,
            lastSentName: recipient.name || '',
            lastSentAt: new Date(),
            successCount: success,
            failedCount: failed
          });

          while (Date.now() < cooldownEnd) {
            const check = await WhatsAppCampaign.findById(campaignId).select('status');
            if (!check || check.status === 'CANCELLED') break;
            await new Promise(r => setTimeout(r, Math.min(3000, cooldownEnd - Date.now())));
          }
          sentInCurrentBatch = 0;
        } else if (i < campaign.recipients.length - 1) {
          let minSec = typeof campaign.minDelaySeconds === 'number' ? campaign.minDelaySeconds : 15.0;
          let maxSec = typeof campaign.maxDelaySeconds === 'number' ? campaign.maxDelaySeconds : 45.0;

          // Whole-hour randomized pacing:
          // Distributes messages across the full 60 minutes instead of burning all quota in 5 minutes
          if (campaign.paceAcrossHour !== false && strictHourlyLimit && hourlyLimit > 0) {
            const avgIntervalSec = 3600 / hourlyLimit;
            const pacedMin = Math.max(15, Math.round(avgIntervalSec * 0.72));
            const pacedMax = Math.max(pacedMin + 20, Math.round(avgIntervalSec * 1.28));
            minSec = Math.max(minSec, pacedMin);
            maxSec = Math.max(maxSec, pacedMax);
          }

          const randomDelaySec = campaign.nonRepeatingDelays !== false
            ? this.generateNonRepeatingDelay(minSec, maxSec, recentDelays)
            : (Math.random() * (maxSec - minSec) + minSec);

          recentDelays.push(randomDelaySec);
          if (recentDelays.length > 10) recentDelays.shift();

          const waitTimeMs = Math.round(randomDelaySec * 1000);
          const delayEnd = Date.now() + waitTimeMs;
          const nextSendAt = new Date(delayEnd);

          this.activeCampaignProgress.dispatchState = 'DELAY_WAIT';
          this.activeCampaignProgress.nextSendAt = nextSendAt;

          await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
            dispatchState: 'DELAY_WAIT',
            nextSendAt,
            lastSentPhone: recipient.phone,
            lastSentName: recipient.name || '',
            lastSentAt: new Date(),
            successCount: success,
            failedCount: failed
          });

          console.log(`[WhatsApp Anti-Ban] 🎲 Randomized interval: ${(randomDelaySec / 60).toFixed(2)} min (${randomDelaySec.toFixed(1)}s) [whole-hour pacing: ${campaign.paceAcrossHour !== false ? 'ON' : 'OFF'}]...`);

          // Responsive cancellation check loop every 2 seconds during the interval wait
          while (Date.now() < delayEnd) {
            const check = await WhatsAppCampaign.findById(campaignId).select('status');
            if (!check || check.status === 'CANCELLED') break;
            await new Promise(r => setTimeout(r, Math.min(2000, delayEnd - Date.now())));
          }

          const checkAfter = await WhatsAppCampaign.findById(campaignId).select('status');
          if (!checkAfter || checkAfter.status === 'CANCELLED') {
            console.log(`[WhatsApp Anti-Ban] Campaign ${campaignId} cancelled during pacing interval.`);
            break;
          }
        }
      }

      const finalStatus = (failed === campaign.recipients.length && campaign.recipients.length > 0)
        ? 'FAILED'
        : 'COMPLETED';

      this.activeCampaignProgress = {
        ...this.activeCampaignProgress,
        status: finalStatus,
        dispatchState: finalStatus,
        currentRecipient: null,
        nextRecipient: null,
        nextSendAt: null,
        successCount: success,
        failedCount: failed,
        completedAt: new Date()
      };

      await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
        status: finalStatus,
        dispatchState: finalStatus,
        currentRecipient: null,
        nextRecipient: null,
        nextSendAt: null,
        successCount: success,
        failedCount: failed
      });
      console.log(`[WhatsApp Anti-Ban] Campaign ${campaignId} finished with status ${finalStatus}. Sent: ${success}, Failed: ${failed}`);
    })().catch(async (bulkErr) => {
      console.error('Error during bulk WhatsApp campaign processing:', bulkErr);
      if (this.activeCampaignProgress) {
        this.activeCampaignProgress.status = 'FAILED';
        this.activeCampaignProgress.dispatchState = 'FAILED';
        this.activeCampaignProgress.nextSendAt = null;
      }
      await WhatsAppCampaign.findByIdAndUpdate(campaignId, {
        status: 'FAILED',
        dispatchState: 'FAILED',
        nextSendAt: null
      });
    });

    return {
      message: 'Bulk WhatsApp campaign started with Anti-Ban Algorithmic Shield',
      campaignId: campaign._id,
      totalRecipients: campaign.recipients.length
    };
  }

  // @desc Stop any active in-memory and database broadcast immediately
  async stopActiveBroadcast() {
    try {
      if (this.activeCampaignProgress) {
        const cid = this.activeCampaignProgress.campaignId;
        this.activeCampaignProgress.status = 'CANCELLED';
        this.activeCampaignProgress.dispatchState = 'CANCELLED';
        this.activeCampaignProgress.currentRecipient = null;
        this.activeCampaignProgress.nextRecipient = null;
        this.activeCampaignProgress.nextSendAt = null;

        if (cid) {
          await WhatsAppCampaign.findByIdAndUpdate(cid, {
            status: 'CANCELLED',
            dispatchState: 'CANCELLED',
            currentRecipient: null,
            nextRecipient: null,
            nextSendAt: null
          });
        }
      }

      await WhatsAppCampaign.updateMany(
        { status: 'IN_PROGRESS' },
        { $set: { status: 'CANCELLED', dispatchState: 'CANCELLED', nextSendAt: null } }
      );

      this.activeCampaignProgress = null;
      return true;
    } catch (err) {
      console.error('[WhatsAppService] Error stopping active broadcast:', err);
      return false;
    }
  }

  // @desc Retrieve active or latest campaign dispatch metrics for live CRM dashboard & countdown timers
  async getLiveDispatchStatus() {
    try {
      // 1. Check in-memory active progress
      if (this.activeCampaignProgress && ['IN_PROGRESS', 'STARTING'].includes(this.activeCampaignProgress.status)) {
        // Fetch full recipients from DB for queue view
        const liveDoc = await WhatsAppCampaign.findById(this.activeCampaignProgress.campaignId)
          .select('title status currentRecipient nextRecipient nextSendAt dispatchState lastSentPhone lastSentName lastSentAt totalRecipients successCount failedCount recipients createdAt speedPreset')
          .lean();

        if (liveDoc && ['IN_PROGRESS', 'STARTING'].includes(liveDoc.status)) {
          return {
            isRunning: true,
            campaign: {
              ...liveDoc,
              ...this.activeCampaignProgress,
              recipients: liveDoc.recipients || []
            },
            serverTime: new Date()
          };
        } else {
          // Document was cancelled or deleted in DB
          this.activeCampaignProgress = null;
        }
      }

      // 2. If no active in-memory dispatch is executing, clean up any stale 'IN_PROGRESS' records left in DB
      await WhatsAppCampaign.updateMany(
        { status: 'IN_PROGRESS' },
        { $set: { status: 'CANCELLED', dispatchState: 'CANCELLED', nextSendAt: null } }
      );

      // 3. Return latest finished/cancelled campaign for dashboard summary with isRunning: false
      const latestCampaign = await WhatsAppCampaign.findOne()
        .sort({ createdAt: -1 })
        .lean();

      return {
        isRunning: false,
        campaign: latestCampaign || null,
        serverTime: new Date()
      };
    } catch (err) {
      console.error('[WhatsAppService] Error fetching live dispatch status:', err.message);
      return {
        isRunning: false,
        campaign: null,
        serverTime: new Date()
      };
    }
  }
}

class WhatsAppServiceManager {
  constructor() {
    this.sessions = new Map();
  }

  getSession(userId) {
    const key = (userId && typeof userId === 'object' && userId.toString)
      ? userId.toString()
      : String(userId || 'default');
    if (!this.sessions.has(key)) {
      this.sessions.set(key, new WhatsAppService(key));
    }
    return this.sessions.get(key);
  }

  getStatus(userId) {
    return this.getSession(userId).getStatus();
  }

  async refreshUserProfile(userId, customWid) {
    return this.getSession(userId).refreshUserProfile(customWid);
  }

  async initializeClient({ userId, force = false } = {}) {
    return this.getSession(userId).initializeClient({ force });
  }

  async disconnect(userId) {
    return this.getSession(userId).disconnect();
  }

  async sendSingleMessage({ userId, ...options } = {}) {
    return this.getSession(userId).sendSingleMessage(options);
  }

  cleanPhoneNumber(rawNumber, defaultCountryCode = '91') {
    return this.getSession('default').cleanPhoneNumber(rawNumber, defaultCountryCode);
  }

  async startBulkCampaign(options = {}, maybeOpts = {}) {
    let payload = {};
    let userId = null;
    if (typeof options === 'object') {
      payload = { ...options, ...maybeOpts };
      userId = payload.userId || maybeOpts.userId;
    } else {
      payload = { campaignId: options, ...maybeOpts };
      userId = maybeOpts.userId;
    }
    return this.getSession(userId).startBulkCampaign(payload);
  }

  async cancelCampaign(campaignId, userId) {
    return this.getSession(userId).stopActiveBroadcast();
  }

  async getLiveDispatchStatus(userId) {
    return this.getSession(userId).getLiveDispatchStatus();
  }

  async stopLiveDispatch(userId) {
    return this.getSession(userId).stopActiveBroadcast();
  }

  async stopActiveBroadcast(userId) {
    return this.getSession(userId).stopActiveBroadcast();
  }

  getAutoReplySettings(userId) {
    return this.getSession(userId).getAutoReplySettings();
  }

  setAutoReply({ userId, enabled, text } = {}) {
    return this.getSession(userId).setAutoReply({ enabled, text });
  }

  clearAutoReplyCache(senderId, userId) {
    return this.getSession(userId).clearAutoReplyCache(senderId);
  }

  // Backward-compatibility accessors for tests / single-tenant callers
  get activeCampaignProgress() { return this.getSession('default').activeCampaignProgress; }
  get status() { return this.getSession('default').status; }
  get client() { return this.getSession('default').client; }
  get userProfile() { return this.getSession('default').userProfile; }
  get autoReplyEnabled() { return this.getSession('default').autoReplyEnabled; }
  get autoReplyText() { return this.getSession('default').autoReplyText; }
  get autoRepliedCache() { return this.getSession('default').autoRepliedCache; }
  get processedMessageIds() { return this.getSession('default').processedMessageIds; }
  get authPath() { return path.join(__dirname, '../.wwebjs_auth'); }
  setConnectionTimestamp(ts) { return this.getSession('default').setConnectionTimestamp(ts); }
  processIncomingMessage(msg, opts) { return this.getSession('default').processIncomingMessage(msg, opts); }
  getChromeExecutablePath() { return this.getSession('default').getChromeExecutablePath(); }
}

// Singleton manager instance
const whatsappServiceManager = new WhatsAppServiceManager();
module.exports = whatsappServiceManager;
