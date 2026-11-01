import { Router } from 'express';
import { CORE_APPLICATIONS, FUTURE_APPLICATIONS } from '../config/modules.js';
import { connectionStatus } from '../config/db.js';

const router = Router();

// GET /api/modules - Return all integrated and upcoming applications
router.get('/', (req, res) => {
  const coreWithLiveStatus = CORE_APPLICATIONS.map(app => ({
    ...app,
    isDbConnected: connectionStatus[app.id] ?? true
  }));

  res.json({
    success: true,
    core: coreWithLiveStatus,
    upcoming: FUTURE_APPLICATIONS,
    totalInstalled: CORE_APPLICATIONS.length,
    totalAvailable: CORE_APPLICATIONS.length + FUTURE_APPLICATIONS.length
  });
});

// GET /api/modules/:slug - Get specific module info
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const module = CORE_APPLICATIONS.find(a => a.slug === slug || a.id === slug);
  if (!module) {
    const upcoming = FUTURE_APPLICATIONS.find(a => a.id === slug);
    if (upcoming) {
      return res.json({ success: true, module: upcoming, isUpcoming: true });
    }
    return res.status(404).json({ success: false, message: 'Application module not found' });
  }

  res.json({
    success: true,
    module: {
      ...module,
      isDbConnected: connectionStatus[module.id] ?? true
    }
  });
});

export default router;

