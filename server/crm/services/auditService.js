const AuditLog = require('../models/AuditLog');

const logAudit = async (req, action, resourceType, resourceId = '', details = '') => {
  try {
    if (!req.user || !req.user.companyId) return;

    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      userName: req.user.name || '',
      userEmail: req.user.email || '',
      action,
      resourceType,
      resourceId: String(resourceId),
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAudit };
