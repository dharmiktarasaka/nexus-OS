const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

router.use(protect);
router.get('/', requirePermission('audit', 'view'), getAuditLogs);

module.exports = router;
