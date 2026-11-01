const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStatus,
  connect,
  disconnect,
  sendSingleMessage,
  sendBulk,
  getCampaigns,
  getCampaignById,
  cancelCampaign,
  getLeadsForWhatsApp,
  handleWebhook,
  verifyWebhook,
  getAutoReplySettings,
  updateAutoReplySettings,
  clearAutoReplyCache,
  getLiveDispatch,
  stopLiveDispatch
} = require('../controllers/whatsappController');

// Public Webhook endpoints (for incoming webhook events and verification challenges)
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Protected management routes
router.use(protect);

router.get('/status', getStatus);
router.get('/live-dispatch', getLiveDispatch);
router.post('/live-dispatch/stop', stopLiveDispatch);
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.post('/send-single', sendSingleMessage);
router.post('/send-bulk', sendBulk);
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns/:id/cancel', cancelCampaign);
router.get('/leads', getLeadsForWhatsApp);

// Auto-reply settings routes
router.get('/auto-reply', getAutoReplySettings);
router.post('/auto-reply', updateAutoReplySettings);
router.post('/clear-cache', clearAutoReplyCache);

module.exports = router;
