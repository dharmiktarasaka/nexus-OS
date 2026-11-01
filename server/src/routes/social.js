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

// GET /api/social/posts - User-specific social media posts
router.get('/posts', async (req, res) => {
  try {
    const userUid = req.user.uid;

    if (!dbConnections.central || !connectionStatus.central) {
      // Per-user isolated local state if central cluster offline
      return res.json({
        success: true,
        isLiveDb: false,
        total: 0,
        posts: []
      });
    }

    const postCol = dbConnections.central.collection('social_posts');
    const query = {
      $or: [{ ownerId: userUid }, { userId: userUid }]
    };

    const posts = await postCol.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      success: true,
      isLiveDb: true,
      total: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social/posts/:id - Single post (strictly owned)
router.get('/posts/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.central || !connectionStatus.central) {
      return res.status(404).json({ success: false, message: 'Post not found or access denied' });
    }

    const postCol = dbConnections.central.collection('social_posts');
    const post = await postCol.findOne(buildIdQuery(req.params.id, userUid));

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or access denied' });
    }

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/social/posts - Create social post
router.post('/posts', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { content, caption, platform, platforms, status, scheduledAt, media, accountName } = req.body;

    const postContent = caption || content || '';
    const postPlatform = platform || (Array.isArray(platforms) ? platforms[0] : 'instagram');

    const newPost = {
      content: postContent,
      caption: postContent,
      platform: postPlatform,
      platforms: platforms || [postPlatform],
      status: status || 'DRAFT',
      scheduledAt: scheduledAt || null,
      media: media || [],
      accountName: accountName || '@workspace',
      likes: 0,
      ownerId: userUid,
      userId: userUid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (dbConnections.central && connectionStatus.central) {
      const postCol = dbConnections.central.collection('social_posts');
      const result = await postCol.insertOne(newPost);
      newPost._id = result.insertedId;
    } else {
      newPost._id = `post_${Date.now()}`;
    }

    res.status(201).json({
      success: true,
      message: 'Social post created successfully',
      post: newPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/social/posts/:id - Delete post (strictly owned)
router.delete('/posts/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.central || !connectionStatus.central) {
      return res.status(404).json({ success: false, message: 'Post not found or access denied' });
    }

    const postCol = dbConnections.central.collection('social_posts');
    const result = await postCol.findOneAndDelete(buildIdQuery(req.params.id, userUid));

    if (!result || !result.value) {
      return res.status(404).json({ success: false, message: 'Post not found or access denied' });
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social/accounts - Connected accounts (strictly owned)
router.get('/accounts', async (req, res) => {
  try {
    const userUid = req.user.uid;
    if (!dbConnections.central || !connectionStatus.central) {
      return res.json({ success: true, accounts: [] });
    }

    const accCol = dbConnections.central.collection('social_accounts');
    const accounts = await accCol.find({
      $or: [{ ownerId: userUid }, { userId: userUid }]
    }).toArray();

    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
