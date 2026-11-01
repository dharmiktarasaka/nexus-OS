import { Router } from 'express';
import { dbConnections, connectionStatus } from '../config/db.js';
import { authenticateUser } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

// Apply strict authentication to all CRM routes
router.use(authenticateUser);

// Helper to safely build ObjectId query or string match
function buildIdQuery(id, userUid) {
  const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
  const matchId = isObjId ? new ObjectId(id) : id;
  return {
    _id: matchId,
    $or: [{ ownerId: userUid }, { userId: userUid }]
  };
}

// GET /api/crm/leads - User-specific lead listing for Central Platform CRM Hub
router.get('/leads', async (req, res) => {
  try {
    const userUid = req.user.uid;

    if (!dbConnections.crm || !connectionStatus.crm) {
      // Offline fallback: isolated per user
      return res.json({
        success: true,
        isLiveDb: false,
        total: 0,
        leads: []
      });
    }

    const leadCol = dbConnections.crm.collection('leads');
    const query = {
      $or: [
        { ownerId: userUid },
        { userId: userUid }
      ],
      isDeleted: { $ne: true }
    };

    const leads = await leadCol.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      success: true,
      isLiveDb: true,
      total: leads.length,
      leads
    });
  } catch (error) {
    console.error('Error in CRM leads route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/crm/leads/:id - Get single lead (strictly owned by authenticated user)
router.get('/leads/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.crm || !connectionStatus.crm) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const leadCol = dbConnections.crm.collection('leads');
    const query = buildIdQuery(req.params.id, userUid);
    query.isDeleted = { $ne: true };

    const lead = await leadCol.findOne(query);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/crm/leads - Quick add lead directly from Central Navigation
router.post('/leads', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { name, company, email, phone, dealValue, priority, status } = req.body;

    const newLead = {
      name: name || 'Untitled Lead',
      company: company || 'Personal Client',
      companyName: company || 'Personal Client',
      email: email || '',
      phone: phone || '',
      dealValue: Number(dealValue) || 2500,
      priority: priority || 'MEDIUM',
      status: status || 'NEW',
      source: 'Central SaaS Shell',
      ownerId: userUid,
      userId: userUid,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbConnections.crm && connectionStatus.crm) {
      const leadCol = dbConnections.crm.collection('leads');
      const result = await leadCol.insertOne(newLead);
      newLead._id = result.insertedId;
    } else {
      newLead._id = `lead_${Date.now()}`;
    }

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: newLead
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/crm/leads/:id - Update lead (strictly owned)
router.put('/leads/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.crm || !connectionStatus.crm) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const leadCol = dbConnections.crm.collection('leads');
    const query = buildIdQuery(req.params.id, userUid);
    query.isDeleted = { $ne: true };

    // Strip protected ownership fields
    const updates = { ...req.body };
    delete updates._id;
    delete updates.ownerId;
    delete updates.userId;
    updates.updatedAt = new Date();

    const result = await leadCol.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    res.json({ success: true, message: 'Lead updated', lead: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/crm/leads/:id - Soft delete lead (strictly owned)
router.delete('/leads/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.crm || !connectionStatus.crm) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    const leadCol = dbConnections.crm.collection('leads');
    const query = buildIdQuery(req.params.id, userUid);

    const result = await leadCol.findOneAndUpdate(
      query,
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userUid } },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Lead not found or access denied' });
    }

    res.json({ success: true, message: 'Lead moved to trash' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
