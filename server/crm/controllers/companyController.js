const Company = require('../models/Company');
const Lead = require('../models/Lead');

const getCompanyOwnerQuery = (req) => {
  const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
  return {
    $or: [
      { ownerId: ownerId },
      { userId: ownerId }
    ]
  };
};

// @desc    Get all companies with lead metrics (lead count & total deal value)
// @route   GET /api/companies
const getCompanies = async (req, res, next) => {
  try {
    const ownerFilter = getCompanyOwnerQuery(req);
    const companies = await Company.find(ownerFilter).sort({ name: 1 });

    // Aggregate lead count & total value per company strictly for this user
    const leadStats = await Lead.aggregate([
      { $match: { isDeleted: false, companyName: { $type: "string", $ne: '' }, ...ownerFilter } },
      {
        $group: {
          _id: { $toLower: { $ifNull: ["$companyName", ""] } },
          leadCount: { $sum: 1 },
          totalValue: { $sum: "$value" }
        }
      }
    ]);

    const statsMap = new Map();
    leadStats.forEach(stat => {
      if (stat._id) statsMap.set(stat._id, stat);
    });

    const result = companies.map(company => {
      const cNameLower = company.name.toLowerCase();
      const stat = statsMap.get(cNameLower) || { leadCount: 0, totalValue: 0 };
      return {
        ...company.toObject(),
        leadCount: stat.leadCount,
        totalValue: stat.totalValue
      };
    });

    res.json({
      success: true,
      count: result.length,
      companies: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company details and associated leads
// @route   GET /api/companies/:id
const getCompanyById = async (req, res, next) => {
  try {
    const ownerFilter = getCompanyOwnerQuery(req);
    const company = await Company.findOne({ _id: req.params.id, ...ownerFilter });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found or access denied' });
    }

    const companyRegex = new RegExp(`^${company.name.trim()}$`, 'i');
    const leads = await Lead.find({
      companyName: companyRegex,
      ...ownerFilter,
      isDeleted: false
    }).populate('assignedTo', 'name email avatar');

    const totalValue = leads.reduce((acc, curr) => acc + (curr.value || 0), 0);

    res.json({
      success: true,
      company,
      leadCount: leads.length,
      totalValue,
      leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a company
// @route   POST /api/companies
const createCompany = async (req, res, next) => {
  try {
    const { name, phone, email, website, industry, address, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const existing = await Company.findOne({
      name: new RegExp(`^${name.trim()}$`, 'i'),
      $or: [{ ownerId }, { userId: ownerId }]
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Company already exists in your account' });
    }

    const company = await Company.create({
      ownerId,
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      website: website || '',
      industry: industry || 'General',
      address: address || '',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany
};
