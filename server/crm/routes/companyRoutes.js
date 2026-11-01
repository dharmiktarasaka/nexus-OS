const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  createCompany
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);

module.exports = router;
