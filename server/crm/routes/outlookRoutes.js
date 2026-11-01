const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAuthUrl,
  handleCallback,
  testOAuthConnection,
  generateSignature
} = require('../controllers/outlookController');

router.get('/authorize', protect, getAuthUrl);
router.post('/callback', protect, handleCallback);
router.post('/test-connection', protect, testOAuthConnection);
router.post('/generate-signature', protect, generateSignature);

module.exports = router;
