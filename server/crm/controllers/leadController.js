const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Company = require('../models/Company');

// Helper to auto-create or connect Company
const syncCompany = async (companyName, phone, email, ownerId) => {
  if (!companyName || !companyName.trim()) return;
  const nameTrimmed = companyName.trim();
  try {
    const existing = await Company.findOne({
      name: new RegExp(`^${nameTrimmed}$`, 'i'),
      $or: [{ ownerId }, { userId: ownerId }]
    });
    if (!existing) {
      await Company.create({
        ownerId,
        name: nameTrimmed,
        phone: phone || '',
        email: email || ''
      });
    }
  } catch (err) {
    console.error('Error syncing company:', err);
  }
};

const getLeadOwnerQuery = (req) => {
  const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
  return {
    $or: [
      { ownerId: ownerId },
      { userId: ownerId },
      { createdBy: ownerId }
    ]
  };
};

// @desc    Get paginated leads with search and filters
// @route   GET /api/leads
const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      source,
      service,
      priority,
      assignedTo,
      followUpDate,
      isDeleted = 'false'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      ...getLeadOwnerQuery(req),
      isDeleted: isDeleted === 'true'
    };

    // Search query across name, companyName, phone, email
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { name: searchRegex },
        { companyName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
      query.$and = [
        getLeadOwnerQuery(req),
        { isDeleted: isDeleted === 'true' },
        { $or: searchConditions }
      ];
      delete query.$or;
    }

    // Direct Filters
    if (status) query.status = status;
    if (source) query.source = source;
    if (service) query.service = service;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (followUpDate) {
      const startOfDay = new Date(followUpDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(followUpDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.nextFollowUp = { $gte: startOfDay, $lte: endOfDay };
    }

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: leads.length,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / limitNum),
      currentPage: pageNum,
      leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leads for Kanban view (unpaginated or larger limit)
// @route   GET /api/leads/kanban
const getKanbanLeads = async (req, res, next) => {
  try {
    const query = {
      ...getLeadOwnerQuery(req),
      isDeleted: false
    };

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) })
      .populate('assignedTo', 'name email avatar');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new lead
// @route   POST /api/leads
const createLead = async (req, res, next) => {
  try {
    const {
      name,
      companyName,
      phone,
      alternatePhone,
      email,
      service,
      source,
      status,
      priority,
      value,
      assignedTo,
      nextFollowUp,
      notes
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Lead Name and Phone number are required' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    const lead = await Lead.create({
      name,
      companyName: companyName || '',
      phone,
      alternatePhone: alternatePhone || '',
      email: email || '',
      service: service || 'General',
      source: source || 'Other',
      status: status || 'NEW',
      priority: priority || 'MEDIUM',
      value: value || 0,
      ownerId: ownerId,
      userId: ownerId,
      assignedTo: assignedTo || ownerId,
      nextFollowUp: nextFollowUp || null,
      notes: notes || ''
    });

    if (companyName) {
      await syncCompany(companyName, phone, email, ownerId);
    }

    // Create Activity log
    await Activity.create({
      leadId: lead._id,
      userId: ownerId,
      type: 'NOTE',
      description: `Lead created by ${req.user.name}`,
      metadata: { initialStatus: lead.status }
    });

    const populatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: populatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead information
// @route   PUT /api/leads/:id
const updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });

    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const previousService = lead.service;
    const previousPriority = lead.priority;
    const previousAssigned = lead.assignedTo;
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    const updates = { ...req.body };
    // Prevent client tampering with ownership fields
    delete updates.ownerId;
    delete updates.userId;
    delete updates.createdBy;

    Object.assign(lead, updates);
    lead.ownerId = ownerId;
    await lead.save();

    if (req.body.companyName) {
      await syncCompany(req.body.companyName, lead.phone, lead.email, ownerId);
    }

    // Track important updates
    if (req.body.service && req.body.service !== previousService) {
      await Activity.create({
        leadId: lead._id,
        userId: ownerId,
        type: 'NOTE',
        description: `Service updated from '${previousService}' to '${req.body.service}' by ${req.user.name}`
      });
    }

    if (req.body.priority && req.body.priority !== previousPriority) {
      await Activity.create({
        leadId: lead._id,
        userId: ownerId,
        type: 'NOTE',
        description: `Priority changed from '${previousPriority}' to '${req.body.priority}' by ${req.user.name}`
      });
    }

    const updatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email avatar');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change lead status (and Lost Reason if status is LOST)
// @route   PATCH /api/leads/:id/status
const changeLeadStatus = async (req, res, next) => {
  try {
    const { status, lostReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    let lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });
    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const oldStatus = lead.status;
    lead.status = status;
    
    if (status === 'LOST') {
      lead.lostReason = lostReason || 'Reason not specified';
    } else {
      lead.lostReason = '';
    }

    lead.lastContactedAt = new Date();
    await lead.save();

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    // Create status change activity
    let desc = `Status changed: ${oldStatus} → ${status} by ${req.user.name}`;
    if (status === 'LOST' && lostReason) {
      desc += ` (Reason: ${lostReason})`;
    }

    await Activity.create({
      leadId: lead._id,
      userId: ownerId,
      type: 'STATUS_CHANGE',
      description: desc,
      metadata: { oldStatus, newStatus: status, lostReason }
    });

    const updatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email avatar');

    res.json({
      success: true,
      message: `Lead status updated to ${status}`,
      lead: updatedLead
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete lead
// @route   DELETE /api/leads/:id
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    lead.isDeleted = true;
    lead.deletedAt = new Date();
    lead.deletedBy = ownerId;
    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: ownerId,
      type: 'NOTE',
      description: `Lead moved to Trash by ${req.user.name}`
    });

    res.json({
      success: true,
      message: 'Lead moved to Trash'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft deleted lead
// @route   PATCH /api/leads/:id/restore
const restoreLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    lead.isDeleted = false;
    lead.deletedAt = null;
    lead.deletedBy = null;
    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: ownerId,
      type: 'NOTE',
      description: `Lead restored from Trash by ${req.user.name}`
    });

    res.json({
      success: true,
      message: 'Lead restored successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lead activities timeline
// @route   GET /api/leads/:id/activities
const getLeadActivities = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const activities = await Activity.find({ leadId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to lead activity
// @route   POST /api/leads/:id/notes
const addLeadNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const lead = await Lead.findOne({ _id: req.params.id, ...getLeadOwnerQuery(req) });
    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    await Activity.create({
      leadId: lead._id,
      userId: ownerId,
      type: 'NOTE',
      description: note.trim()
    });

    lead.notes = lead.notes ? `${lead.notes}\n[${new Date().toLocaleDateString()}] ${note.trim()}` : note.trim();
    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
