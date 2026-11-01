const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  pauseCampaign,
  getGrabbedLeads,
  updateGrabbedLead,
  deleteGrabbedLead,
  deduplicateCampaignLeads,
  importLeadToCRM,
  bulkImportToCRM,
  exportCampaignLeads,
  getLeadGrabStats,
  getTinyFishApiKey,
  saveTinyFishApiKey,
  testTinyFishApiKey,
  getOutscraperApiKey,
  saveOutscraperApiKey,
  testOutscraperApiKey,
  getDeepSeekKey,
  saveDeepSeekKey,
  testDeepSeekKey,
  getAiConfig,
  saveAiConfig,
  testGeminiKey,
  analyzeLeadWithDeepSeek,
  bulkEnrichCampaignWithDeepSeek,
  inspectDiscordInvite,
  parseDiscordTranscriptData,
  getDiscordConfig,
  saveDiscordConfig,
  testDiscordWebhook
} = require('../controllers/leadGrabController');

// All lead-grab routes are protected by auth
router.use(protect);

// Overview stats & API keys
router.get('/stats', getLeadGrabStats);
router.get('/tinyfish-key', getTinyFishApiKey);
router.post('/tinyfish-key', saveTinyFishApiKey);
router.post('/test-tinyfish', testTinyFishApiKey);

router.get('/api-key', getOutscraperApiKey);
router.post('/api-key', saveOutscraperApiKey);
router.post('/test-api-key', testOutscraperApiKey);

// Discord Intelligence endpoints
router.post('/discord/inspect-invite', inspectDiscordInvite);
router.post('/discord/parse-text', parseDiscordTranscriptData);
router.get('/discord-config', getDiscordConfig);
router.post('/discord-config', saveDiscordConfig);
router.post('/test-discord-webhook', testDiscordWebhook);

// AI Configuration & Provider Switcher endpoints
router.get('/ai-config', getAiConfig);
router.post('/save-ai-config', saveAiConfig);
router.post('/test-gemini', testGeminiKey);

// DeepSeek AI endpoints
router.get('/deepseek-key', getDeepSeekKey);
router.post('/deepseek-key', saveDeepSeekKey);
router.post('/test-deepseek', testDeepSeekKey);
router.post('/leads/:id/ai-analyze', analyzeLeadWithDeepSeek);

// Campaign endpoints
router.route('/campaigns')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/campaigns/:id')
  .get(getCampaign)
  .put(updateCampaign)
  .delete(deleteCampaign);

// Campaign actions
router.post('/campaigns/:id/start', startCampaign);
router.post('/campaigns/:id/pause', pauseCampaign);
router.post('/campaigns/:id/deduplicate', deduplicateCampaignLeads);
router.get('/campaigns/:id/leads', getGrabbedLeads);
router.post('/campaigns/:id/bulk-import-to-crm', bulkImportToCRM);
router.post('/campaigns/:id/ai-enrich-all', bulkEnrichCampaignWithDeepSeek);
router.get('/campaigns/:id/export', exportCampaignLeads);

// Individual lead actions
router.route('/leads/:id')
  .put(updateGrabbedLead)
  .delete(deleteGrabbedLead);

router.post('/leads/:id/import-to-crm', importLeadToCRM);

module.exports = router;
