const express = require('express');
const router = express.Router();
const {
  getLeads,
  getKanbanLeads,
  getLeadById,
  createLead,
  updateLead,
  changeLeadStatus,
  deleteLead,
  restoreLead,
  getLeadActivities,
  addLeadNote
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getLeads);
router.get('/kanban', getKanbanLeads);
router.post('/', createLead);

router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.patch('/:id/status', changeLeadStatus);
router.delete('/:id', deleteLead);
router.patch('/:id/restore', authorize('ADMIN'), restoreLead);

router.get('/:id/activities', getLeadActivities);
router.post('/:id/notes', addLeadNote);

module.exports = router;
