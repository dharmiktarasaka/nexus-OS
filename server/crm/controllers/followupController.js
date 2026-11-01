const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

const getFollowUpOwnerQuery = (req) => {
  const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
  return {
    $or: [
      { ownerId: ownerId },
      { userId: ownerId }
    ]
  };
};

// @desc    Get follow-ups list grouped or filtered
// @route   GET /api/followups
const getFollowUps = async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query; // all, today, overdue, upcoming, completed

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const query = {
      ...getFollowUpOwnerQuery(req)
    };

    if (filter === 'today') {
      query.date = { $gte: todayStart, $lte: todayEnd };
      query.status = 'PENDING';
    } else if (filter === 'overdue') {
      query.date = { $lt: todayStart };
      query.status = 'PENDING';
    } else if (filter === 'upcoming') {
      query.date = { $gt: todayEnd };
      query.status = 'PENDING';
    } else if (filter === 'completed') {
      query.status = 'COMPLETED';
    }

    const followUps = await FollowUp.find(query)
      .populate('leadId', 'name companyName phone email status service priority')
      .populate('userId', 'name email avatar')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: followUps.length,
      followUps
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new follow-up for a lead
// @route   POST /api/followups
const createFollowUp = async (req, res, next) => {
  try {
    const { leadId, date, time, note, reminder } = req.body;

    if (!leadId || !date) {
      return res.status(400).json({ success: false, message: 'Lead ID and Date are required' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const lead = await Lead.findOne({ _id: leadId, $or: [{ ownerId }, { userId: ownerId }] });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const followUp = await FollowUp.create({
      leadId,
      ownerId: ownerId,
      userId: ownerId,
      date: new Date(date),
      time: time || '10:00 AM',
      note: note || '',
      reminder: reminder !== undefined ? reminder : true,
      status: 'PENDING'
    });

    // Update nextFollowUp on lead record
    lead.nextFollowUp = new Date(date);
    await lead.save();

    // Log Activity
    await Activity.create({
      leadId,
      userId: ownerId,
      type: 'FOLLOW_UP',
      description: `Follow-up scheduled for ${new Date(date).toLocaleDateString()} at ${time || '10:00 AM'} by ${req.user.name}`
    });

    const populated = await FollowUp.findById(followUp._id)
      .populate('leadId', 'name companyName phone email status service priority')
      .populate('userId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Follow-up scheduled successfully',
      followUp: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a follow-up
// @route   PATCH /api/followups/:id/complete
const completeFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, ...getFollowUpOwnerQuery(req) });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found or access denied' });
    }

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    followUp.status = 'COMPLETED';
    await followUp.save();

    // Clear lead's nextFollowUp if it matches
    const lead = await Lead.findOne({ _id: followUp.leadId, $or: [{ ownerId }, { userId: ownerId }] });
    if (lead) {
      lead.lastContactedAt = new Date();
      await lead.save();

      await Activity.create({
        leadId: lead._id,
        userId: ownerId,
        type: 'FOLLOW_UP',
        description: `Follow-up completed by ${req.user.name}: ${followUp.note || 'Done'}`
      });
    }

    res.json({
      success: true,
      message: 'Follow-up marked as completed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule a follow-up
// @route   PUT /api/followups/:id
const updateFollowUp = async (req, res, next) => {
  try {
    const { date, time, note, status } = req.body;
    const followUp = await FollowUp.findOne({ _id: req.params.id, ...getFollowUpOwnerQuery(req) });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found or access denied' });
    }

    if (date) followUp.date = new Date(date);
    if (time) followUp.time = time;
    if (note !== undefined) followUp.note = note;
    if (status) followUp.status = status;

    await followUp.save();

    if (date) {
      const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
      const lead = await Lead.findOne({ _id: followUp.leadId, $or: [{ ownerId }, { userId: ownerId }] });
      if (lead) {
        lead.nextFollowUp = new Date(date);
        await lead.save();
      }
    }

    const updated = await FollowUp.findById(followUp._id)
      .populate('leadId', 'name companyName phone email status service priority')
      .populate('userId', 'name email avatar');

    res.json({
      success: true,
      message: 'Follow-up updated successfully',
      followUp: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFollowUps,
  createFollowUp,
  completeFollowUp,
  updateFollowUp
};
