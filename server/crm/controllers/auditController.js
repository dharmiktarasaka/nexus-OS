const AuditLog = require('../models/AuditLog');

// @desc    Get audit trail logs for company
// @route   GET /api/audit
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', resourceType = '' } = req.query;

    const query = { companyId: req.user.companyId };

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { action: searchRegex },
        { details: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
