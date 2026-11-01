const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission, blockVisitor } = require('../middleware/rbacMiddleware');
const {
  getUsers,
  getUserById,
  inviteUser,
  updateUser,
  updateUserPermissions,
  grantFolderAccess,
  revokeFolderAccess,
  toggleUserStatus,
  deleteUser,
  getSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testUserEmailConnection
} = require('../controllers/userController');

router.use(protect);

router.route('/smtp-config')
  .get(getSmtpConfig)
  .put(updateSmtpConfig)
  .delete(deleteSmtpConfig);

router.post('/test-email-connection', testUserEmailConnection);

router.get('/', requirePermission('users', 'view'), getUsers);
router.get('/:userId', requirePermission('users', 'view'), getUserById);
router.put('/:userId', requirePermission('users', 'manage'), updateUser);
router.patch('/:userId', requirePermission('users', 'manage'), updateUser);
router.post('/invite', requirePermission('users', 'invite'), inviteUser);
router.put('/:userId/permissions', requirePermission('permissions', 'grant'), updateUserPermissions);
router.post('/:userId/folder-access', blockVisitor, grantFolderAccess);
router.delete('/:userId/folder-access/:folderId', blockVisitor, revokeFolderAccess);
router.patch('/:userId/status', requirePermission('users', 'manage'), toggleUserStatus);
router.delete('/:userId', requirePermission('users', 'delete'), deleteUser);

module.exports = router;
