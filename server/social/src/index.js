import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from './utils/rateLimit.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import postRoutes from './routes/posts.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import { startScheduler } from './scheduler.js';

const app = express();
app.set('trust proxy', true);
const PORT = process.env.SOCIAL_PORT || (process.env.PORT && process.env.PORT !== '5000' ? process.env.PORT : 5003);
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Security Headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow media URLs to load cross-origin
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Exact allow-list only. *.vercel.app wildcard removed — an attacker
// could register their own Vercel project and make credentialed requests.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://mediamation.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean).map(url => url.replace(/\/$/, '').replace(/[\r\n\s\t]/g, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) or explicitly allowed origins
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    // Allow all Vercel and Netlify preview and production deployments
    if (/^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.netlify\.app$/.test(origin)) {
      return callback(null, true);
    }
    // Localhost is allowed for development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' })); // was 10mb — reduced; media is uploaded separately

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Auth routes: 20 requests per 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: () => !IS_PROD, // only enforce in production
  validate: { trustProxy: false },
});

// AI caption: 30 requests per 10 min per IP (expensive operation)
const captionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many caption requests, please slow down.' },
  skip: () => !IS_PROD,
  validate: { trustProxy: false },
});

// General API: 200 requests per min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: () => !IS_PROD,
  validate: { trustProxy: false },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const mountEndpoints = (prefix) => {
  app.use(`${prefix}/auth`, authLimiter, authRoutes);
  app.use(`${prefix}/accounts`, apiLimiter, accountRoutes);
  app.use(`${prefix}/posts`, apiLimiter, postRoutes);
  app.use(`${prefix}/upload`, captionLimiter, uploadRoutes);
  app.use(`${prefix}/ai`, captionLimiter, aiRoutes);
  app.use(`${prefix}/admin`, apiLimiter, adminRoutes);
  app.get(`${prefix}/health`, (req, res) => res.json({ status: 'ok', service: 'social' }));
};

mountEndpoints('/api');
mountEndpoints('/social-api');

// Serve uploaded files (static, no auth needed — files are keyed by random filename)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/social-api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'social' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// SECURITY: In production, never return raw error.message — it can leak
// internal paths, DB schema info, or stack traces.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Log full detail server-side
  console.error(`[Express Error] ${req.method} ${req.path} → ${status}:`, err.message);

  // Send sanitised message to client
  const clientMessage = IS_PROD && status === 500
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'Internal server error';

  res.status(status).json({ message: clientMessage });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const startServer = (port, retries = 3) => {
  const srv = app.listen(port, () => {
    console.log(`[Social Service] Server running on port ${port}`);
  });
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      console.log(`Port ${port} busy, retrying in 1s... (${retries} left)`);
      srv.close(() => setTimeout(() => startServer(port, retries - 1), 1000));
    } else {
      console.error(err);
      process.exit(1);
    }
  });
  return srv;
};

process.on('uncaughtException', (err) => {
  console.error('[Social Service Uncaught Exception]:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Social Service Unhandled Rejection]:', reason?.message || reason);
});

startServer(PORT);

// Also listen on port 5000 if in local development and port 5000 is available (ensures OAuth callbacks resolve directly)
if (!IS_PROD && String(PORT) !== '5000') {
  try {
    const srv5000 = app.listen(5000, () => {
      console.log(`[Social Service] Also listening on port 5000 for direct OAuth callback redirects`);
    });
    srv5000.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Social Service] Port 5000 is being handled by external Gateway/Proxy`);
      }
    });
  } catch (e) {}
}

connectDB().catch(err => console.warn('[Social DB]', err.message));
startScheduler();
