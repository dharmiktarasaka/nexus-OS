import { Router } from 'express';
import { dbConnections, connectionStatus } from '../config/db.js';
import { authenticateUser } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.use(authenticateUser);

function buildIdQuery(id, userUid) {
  const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
  const matchId = isObjId ? new ObjectId(id) : id;
  return {
    _id: matchId,
    $or: [{ ownerId: userUid }, { userId: userUid }]
  };
}

// GET /api/analytics/reports - User-specific diagnostic reports
router.get('/reports', async (req, res) => {
  try {
    const userUid = req.user.uid;

    if (!dbConnections.analytics || !connectionStatus.analytics) {
      return res.json({
        success: true,
        isLiveDb: false,
        total: 0,
        reports: []
      });
    }

    const reportCol = dbConnections.analytics.collection('reports');
    const query = {
      $or: [{ ownerId: userUid }, { userId: userUid }]
    };

    const reports = await reportCol.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    res.json({
      success: true,
      isLiveDb: true,
      total: reports.length,
      reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/reports/:id - Get single report (strictly owned)
router.get('/reports/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.analytics || !connectionStatus.analytics) {
      return res.status(404).json({ success: false, message: 'Report not found or access denied' });
    }

    const reportCol = dbConnections.analytics.collection('reports');
    const report = await reportCol.findOne(buildIdQuery(req.params.id, userUid));

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or access denied' });
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/analytics/reports - Create new report
router.post('/reports', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { businessName, industry, overallScore, pillars, recommendationsCount } = req.body;

    const newReport = {
      businessName: businessName || 'Personal Business Diagnostic',
      industry: industry || 'Technology & Services',
      overallScore: Number(overallScore) || 85,
      status: 'COMPLETED',
      pillars: pillars || { marketing: 85, operations: 85, finance: 85, technology: 85 },
      recommendationsCount: Number(recommendationsCount) || 10,
      ownerId: userUid,
      userId: userUid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbConnections.analytics && connectionStatus.analytics) {
      const reportCol = dbConnections.analytics.collection('reports');
      const result = await reportCol.insertOne(newReport);
      newReport._id = result.insertedId;
    } else {
      newReport._id = `rep_${Date.now()}`;
    }

    res.status(201).json({
      success: true,
      message: 'Diagnostic report saved successfully',
      report: newReport
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/analytics/reports/:id - Delete report (strictly owned)
router.delete('/reports/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.analytics || !connectionStatus.analytics) {
      return res.status(404).json({ success: false, message: 'Report not found or access denied' });
    }

    const reportCol = dbConnections.analytics.collection('reports');
    const result = await reportCol.findOneAndDelete(buildIdQuery(req.params.id, userUid));

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Report not found or access denied' });
    }

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
