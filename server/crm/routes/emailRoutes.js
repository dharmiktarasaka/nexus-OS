const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/emailController');

// All email routes require authentication
router.use(protect);

router.get('/', getEmails);
router.get('/stats', getEmailStats);
router.post('/send', sendEmail);
router.post('/sync-inbox', syncInbox);
router.post('/bulk-read', bulkMarkRead);
router.post('/bulk-trash', bulkTrash);
router.post('/bulk-delete', bulkDelete);

router.get('/:id', getEmailById);
router.post('/:id/reply', replyEmail);
router.post('/:id/cancel', cancelScheduledEmail);
router.put('/:id/star', toggleStar);
router.put('/:id/read', markRead);
router.post('/:id/trash', moveToTrash);
router.post('/:id/restore', restoreFromTrash);
router.delete('/:id', deletePermanent);

module.exports = router;
