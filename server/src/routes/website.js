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

// GET /api/website/projects - User-specific projects for Website Studio Hub
router.get('/projects', async (req, res) => {
  try {
    const userUid = req.user.uid;

    if (!dbConnections.website || !connectionStatus.website) {
      return res.json({
        success: true,
        isLiveDb: false,
        total: 0,
        projects: []
      });
    }

    const projCol = dbConnections.website.collection('projects');
    const query = {
      $or: [{ ownerId: userUid }, { userId: userUid }]
    };

    const projects = await projCol.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(30)
      .toArray();

    res.json({
      success: true,
      isLiveDb: true,
      total: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/website/projects/:id - Get single project (strictly owned)
router.get('/projects/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.website || !connectionStatus.website) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const projCol = dbConnections.website.collection('projects');
    const project = await projCol.findOne(buildIdQuery(req.params.id, userUid));

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/website/projects - Create website project
router.post('/projects', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { name, category, framework, pagesCount, previewUrl } = req.body;

    const newProject = {
      name: name || 'Untitled Project',
      category: category || 'General Business',
      status: 'DRAFT',
      framework: framework || 'React + Tailwind',
      pagesCount: Number(pagesCount) || 1,
      previewUrl: previewUrl || '',
      ownerId: userUid,
      userId: userUid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbConnections.website && connectionStatus.website) {
      const projCol = dbConnections.website.collection('projects');
      const result = await projCol.insertOne(newProject);
      newProject._id = result.insertedId;
    } else {
      newProject._id = `proj_${Date.now()}`;
    }

    res.status(201).json({
      success: true,
      message: 'Website project created',
      project: newProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/website/projects/:id - Update project
router.put('/projects/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.website || !connectionStatus.website) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const projCol = dbConnections.website.collection('projects');
    const updates = { ...req.body };
    delete updates._id;
    delete updates.ownerId;
    delete updates.userId;
    updates.updatedAt = new Date();

    const result = await projCol.findOneAndUpdate(
      buildIdQuery(req.params.id, userUid),
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    res.json({ success: true, message: 'Project updated', project: result.value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/website/projects/:id - Delete project
router.delete('/projects/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.website || !connectionStatus.website) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    const projCol = dbConnections.website.collection('projects');
    const result = await projCol.findOneAndDelete(buildIdQuery(req.params.id, userUid));

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
