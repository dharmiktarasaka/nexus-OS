const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  searchLinkedInLeads,
  searchLinkedInPosts,
  saveConfig
} = require('../controllers/linkedinController');

router.use(protect);

router.get('/auth-url', getAuthUrl);
router.post('/callback', handleCallback);
router.get('/status', getStatus);
router.post('/disconnect', disconnect);
router.post('/search-leads', searchLinkedInLeads);
router.post('/search-posts', searchLinkedInPosts);
router.post('/config', saveConfig);

module.exports = router;
