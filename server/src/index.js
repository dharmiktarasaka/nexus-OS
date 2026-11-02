import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabases, connectionStatus } from './config/db.js';
import dashboardRoutes from './routes/dashboard.js';
import searchRoutes from './routes/search.js';
import modulesRoutes from './routes/modules.js';
import authRoutes from './routes/auth.js';
import crmRoutes from './routes/crm.js';
import websiteRoutes from './routes/website.js';
import analyticsRoutes from './routes/analytics.js';
import socialRoutes from './routes/social.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Register API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/social', socialRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'All-in-One Business Management & AI Tools Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    databases: connectionStatus,
    endpoints: [
      '/api/dashboard/stats',
      '/api/dashboard/activity',
      '/api/search',
      '/api/modules',
      '/api/auth/bridge',
      '/api/crm/leads',
      '/api/website/projects',
      '/api/analytics/reports',
      '/api/social/posts'
    ]
  });
});

// Initialize server and connect databases in background
async function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 All-in-One Business Platform Server running on port ${PORT}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Unified Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`=======================================================`);
  });

  // Connect to databases asynchronously without blocking server readiness
  initDatabases().catch(err => {
    console.warn('[DB] Deferred initialization:', err.message);
  });

  return server;
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
