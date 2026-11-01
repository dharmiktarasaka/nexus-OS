const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission, blockVisitor } = require('../middleware/rbacMiddleware');
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  parseExcelForImport,
  importDataset,
  getFolderRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  bulkDeleteRecords,
  exportFolderData,
  testSmtpConnection,
  sendFolderEmails,
  sendFolderWhatsApp,
  getScheduledEmails,
  generateAIEmailSequence
} = require('../controllers/folderController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.use(protect);

// AI Email Sequence Generation via DeepSeek
router.post('/generate-ai-email', blockVisitor, generateAIEmailSequence);
router.post('/:folderId/generate-ai-email', blockVisitor, generateAIEmailSequence);

// Folder Management Routes
router.route('/')
  .post(blockVisitor, requirePermission('folders', 'create'), createFolder)
  .get(requirePermission('folders', 'view'), getFolders);

router.route('/:folderId')
  .get(requirePermission('folders', 'view'), getFolderById)
  .put(blockVisitor, requirePermission('folders', 'edit'), updateFolder)
  .delete(blockVisitor, requirePermission('folders', 'delete'), deleteFolder);

// Import & Record Parsing Routes
router.post('/:folderId/parse', blockVisitor, requirePermission('datasets', 'upload'), upload.single('file'), parseExcelForImport);
router.post('/:folderId/import', blockVisitor, requirePermission('datasets', 'upload'), importDataset);
router.get('/:folderId/records', requirePermission('records', 'view'), getFolderRecords);
router.post('/:folderId/bulk-delete', blockVisitor, requirePermission('records', 'delete'), bulkDeleteRecords);
router.get('/:folderId/export', requirePermission('records', 'export'), exportFolderData);
router.post('/:folderId/test-smtp', blockVisitor, testSmtpConnection);
router.post('/:folderId/send-emails', blockVisitor, sendFolderEmails);
router.post('/:folderId/send-whatsapp', blockVisitor, sendFolderWhatsApp);
router.get('/:folderId/scheduled-emails', requirePermission('records', 'view'), getScheduledEmails);

// Single Record CRUD
router.post('/datasets/:datasetId/records', blockVisitor, requirePermission('records', 'create'), createRecord);
router.put('/records/:recordId', blockVisitor, requirePermission('records', 'edit'), updateRecord);
router.delete('/records/:recordId', blockVisitor, requirePermission('records', 'delete'), deleteRecord);

module.exports = router;
