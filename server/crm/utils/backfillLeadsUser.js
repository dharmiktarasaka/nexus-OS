const Lead = require('../models/Lead');
const User = require('../models/User');

/**
 * Ensures all existing leads have a valid userId for per-user data isolation.
 * If a lead does not have a userId:
 * - Assigns to lead.assignedTo (if set)
 * - Otherwise assigns to the primary Admin account.
 */
const backfillLeadsUser = async () => {
  try {
    const unassignedCount = await Lead.countDocuments({
      $or: [{ userId: { $exists: false } }, { userId: null }]
    });
    if (unassignedCount === 0) {
      return;
    }

    console.log(`[Data Isolation Migration] Found ${unassignedCount} leads without userId. Backfilling ownership...`);

    // Find default admin user
    const adminUser = await User.findOne({ role: 'ADMIN' }) || await User.findOne({});
    const defaultOwnerId = adminUser ? adminUser._id : null;

    if (!defaultOwnerId) {
      console.warn('[Data Isolation Migration] No user accounts found yet to assign existing leads to.');
      return;
    }

    // 1. Backfill leads that already have an assignedTo user
    const assignedResult = await Lead.updateMany(
      {
        $or: [{ userId: { $exists: false } }, { userId: null }],
        assignedTo: { $ne: null }
      },
      [
        {
          $set: {
            userId: '$assignedTo'
          }
        }
      ]
    );

    // 2. Backfill any remaining leads without assignedTo to the primary admin
    const defaultResult = await Lead.updateMany(
      {
        $or: [{ userId: { $exists: false } }, { userId: null }]
      },
      {
        $set: {
          userId: defaultOwnerId,
          assignedTo: defaultOwnerId
        }
      }
    );

    const totalUpdated = (assignedResult.modifiedCount || 0) + (defaultResult.modifiedCount || 0);
    console.log(`[Data Isolation Migration] ✅ Successfully backfilled ${totalUpdated} leads with per-user ownership.`);
  } catch (err) {
    console.error('[Data Isolation Migration] Error during lead ownership backfill:', err.message);
  }
};

module.exports = { backfillLeadsUser };
