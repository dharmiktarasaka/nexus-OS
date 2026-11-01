const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  getConversations,
  getCompanyDirectory,
  getUnreadChatCount,
  createConversation,
  getMessages,
  markConversationAsRead,
  sendMessage,
  uploadAttachment,
  getAttachmentFile,
  editMessage,
  deleteMessage
} = require('../controllers/chatController');

// Memory storage keeps file buffers in memory for direct MongoDB Atlas persistence
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});

// Public File Serving Route for browser img/video/audio tags
router.get('/files/:id', getAttachmentFile);
router.get('/files/:id/:filename', getAttachmentFile);

router.use(protect);

router.get('/unread-count', requirePermission('chat', 'view'), getUnreadChatCount);
router.get('/conversations', requirePermission('chat', 'view'), getConversations);
router.get('/users', requirePermission('chat', 'view'), getCompanyDirectory);
router.post('/conversations', requirePermission('chat', 'send'), createConversation);
router.get('/conversations/:id/messages', requirePermission('chat', 'view'), getMessages);
router.post('/conversations/:id/read', requirePermission('chat', 'view'), markConversationAsRead);
router.post('/conversations/:id/messages', requirePermission('chat', 'send'), sendMessage);
router.put('/messages/:id', requirePermission('chat', 'send'), editMessage);
router.delete('/messages/:id', requirePermission('chat', 'send'), deleteMessage);
router.post('/upload', requirePermission('chat', 'send'), upload.single('file'), uploadAttachment);

module.exports = router;
