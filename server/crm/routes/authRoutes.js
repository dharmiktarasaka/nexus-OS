const express = require('express');
const router = express.Router();
const { register, login, getMe, getInvitationInfo, acceptInvitation, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/invitation/:token', getInvitationInfo);
router.post('/accept-invitation', acceptInvitation);
router.put('/change-password', protect, changePassword);

module.exports = router;

