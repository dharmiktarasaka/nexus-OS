const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Database Connection
connectDB();

// Security and Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// Bulletproof CORS Configuration for Vercel Frontend & Localhost
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder for access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Registration
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/followups', require('./routes/followupRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/folders', require('./routes/folderRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/outlook', require('./routes/outlookRoutes'));
app.use('/api/lead-grab', require('./routes/leadGrabRoutes'));
app.use('/api/emails', require('./routes/emailRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/linkedin', require('./routes/linkedinRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Lead Management CRM Server is running smoothly', time: new Date() });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Global process error handlers to ensure 100% server uptime on cloud hosts
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Start background email scheduler for follow-up emails and anti-spam queuing
  const { startEmailScheduler } = require('./services/emailSchedulerService');
  startEmailScheduler();

  // WhatsApp sessions are initialized on-demand per user from the WhatsApp page
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is currently in use. Please wait or stop existing process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
