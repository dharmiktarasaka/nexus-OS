const express = require('express');
const router = express.Router();
const {
  getFollowUps,
  createFollowUp,
  completeFollowUp,
  updateFollowUp
} = require('../controllers/followupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.patch('/:id/complete', completeFollowUp);
router.put('/:id', updateFollowUp);

module.exports = router;
