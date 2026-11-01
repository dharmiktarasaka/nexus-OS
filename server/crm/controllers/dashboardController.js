const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Task = require('../models/Task');
const whatsappService = require('../services/whatsappService');

// @desc    Get dashboard metrics & analytics charts data
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const userOwnershipFilter = {
      $or: [
        { ownerId: ownerId },
        { userId: ownerId },
        { createdBy: ownerId }
      ]
    };

    const leadQuery = { isDeleted: false, ...userOwnershipFilter };
    const followUpQuery = { ...userOwnershipFilter };
    const taskQuery = {
      $or: [
        { ownerId: ownerId },
        { createdBy: ownerId },
        { assignedTo: ownerId }
      ]
    };

    // 1. KPI Counts
    const totalLeads = await Lead.countDocuments(leadQuery);
    const newLeads = await Lead.countDocuments({ ...leadQuery, status: 'NEW' });
    const qualifiedLeads = await Lead.countDocuments({ ...leadQuery, status: 'QUALIFIED' });
    const proposalSentLeads = await Lead.countDocuments({ ...leadQuery, status: 'PROPOSAL_SENT' });
    const wonLeads = await Lead.countDocuments({ ...leadQuery, status: 'WON' });
    const lostLeads = await Lead.countDocuments({ ...leadQuery, status: 'LOST' });

    // Conversion rate
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

    // Follow-ups today & overdue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const followUpsToday = await FollowUp.countDocuments({
      ...followUpQuery,
      status: 'PENDING',
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const overdueFollowUps = await FollowUp.countDocuments({
      ...followUpQuery,
      status: 'PENDING',
      date: { $lt: todayStart }
    });

    const overdueTasksCount = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'COMPLETED' },
      dueDate: { $lt: todayStart }
    });

    // 2. Pipeline Breakdown Chart Data
    const pipelineStages = [
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'QUALIFIED',
      'MEETING',
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'WON',
      'LOST'
    ];

    const pipelineCounts = await Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$status", count: { $sum: 1 }, totalValue: { $sum: "$value" } } }
    ]);

    const pipelineMap = new Map();
    pipelineCounts.forEach(item => pipelineMap.set(item._id, item));

    const pipelineData = pipelineStages.map(stage => {
      const found = pipelineMap.get(stage);
      return {
        stage,
        count: found ? found.count : 0,
        value: found ? found.totalValue : 0
      };
    });

    // 3. Lead Source Analytics Chart Data
    const sourceCounts = await Lead.aggregate([
      { $match: leadQuery },
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);

    const sourceData = sourceCounts.map(item => ({
      source: item._id || 'Other',
      count: item.count
    }));

    // 4. Lost Reason Analytics Chart Data
    const lostReasonCounts = await Lead.aggregate([
      { $match: { ...leadQuery, status: 'LOST' } },
      { $group: { _id: "$lostReason", count: { $sum: 1 } } }
    ]);

    const lostReasonData = lostReasonCounts.map(item => ({
      reason: item._id || 'Unspecified',
      count: item.count
    }));

    // 5. Monthly Lead Trend Data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Lead.aggregate([
      { $match: { ...leadQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ["$status", "WON"] }, 1, 0] }
          },
          lost: {
            $sum: { $cond: [{ $eq: ["$status", "LOST"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = monthlyTrends.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      total: item.total,
      won: item.won,
      lost: item.lost
    }));

    // 6. Live WhatsApp Campaign Dispatch Tracking
    let whatsappDispatch = null;
    try {
      whatsappDispatch = await whatsappService.getLiveDispatchStatus();
    } catch (wErr) {
      console.warn('[Dashboard] WhatsApp live status fetch warning:', wErr.message);
    }

    res.json({
      success: true,
      kpi: {
        totalLeads,
        newLeads,
        followUpsToday,
        overdueFollowUps,
        qualifiedLeads,
        proposalSentLeads,
        wonLeads,
        lostLeads,
        conversionRate,
        overdueTasksCount
      },
      charts: {
        pipelineData,
        sourceData,
        lostReasonData,
        trendData
      },
      whatsappDispatch
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
