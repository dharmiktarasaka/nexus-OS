"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_js_1 = require("./config/env.js");
const connection_js_1 = require("./db/connection.js");
const index_js_1 = require("./routes/index.js");
const geminiService_js_1 = require("./services/geminiService.js");
const app = (0, express_1.default)();
// Parse allowed origins from environment variable (supports comma-separated list or wildcard)
const allowedOriginsList = (process.env.CORS_ORIGIN || env_js_1.config.corsOrigin || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
// Security and utility middleware
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // 1. Allow mobile apps, curl, server-to-server, or same-origin requests
        if (!origin) {
            return callback(null, true);
        }
        // 2. Allow local development on any port
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        // 3. Automatically allow all Vercel production & preview deployments
        if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
            return callback(null, true);
        }
        // 4. Allow explicit origins configured in CORS_ORIGIN or wildcard
        if (allowedOriginsList.length > 0 &&
            (allowedOriginsList.includes(origin) || allowedOriginsList.includes('*'))) {
            return callback(null, true);
        }
        // 5. In development mode or if no specific origins are locked, allow
        if (process.env.NODE_ENV !== 'production' || allowedOriginsList.length === 0) {
            return callback(null, true);
        }
        callback(new Error(`Origin [${origin}] is not authorized by STRATIQ CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-admin-key',
        'x-user-id',
        'x-user-email',
        'x-user-name'
    ]
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
// Service root landing endpoint (friendly verification for Render health inspection)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'STRATIQ Enterprise AI Advisory Backend API',
        environment: env_js_1.config.nodeEnv,
        database: (0, connection_js_1.isUsingFallbackStore)() ? 'in-memory-fallback' : 'mongodb-atlas',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            businesses: '/api/businesses',
            admin: '/api/admin'
        },
        message: 'Backend server is running live.'
    });
});
// Health check endpoint (exempt from rate limit)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        store: (0, connection_js_1.isUsingFallbackStore)() ? 'in-memory-fallback' : 'mongodb',
        geminiConfigured: geminiService_js_1.geminiService.isConfigured(),
        geminiModel: geminiService_js_1.geminiService.getModel(),
        firebaseConfigured: !!env_js_1.config.firebaseProjectId
    });
});
// Rate limiting for AI and API calls (relaxed for local development)
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 500 : 10000,
    skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
    message: { success: false, error: 'Too many requests from this IP, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', generalLimiter);
// Primary API Router
app.use('/api', index_js_1.apiRouter);
// Isolated Standalone Admin Portal (served directly from the admin folder)
let adminStaticPath = path_1.default.resolve(process.cwd(), '../admin');
if (!fs_1.default.existsSync(adminStaticPath)) {
    adminStaticPath = path_1.default.resolve(process.cwd(), 'admin');
}
app.use('/admin', express_1.default.static(adminStaticPath));
app.use('/admin-portal', express_1.default.static(adminStaticPath));
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        error: env_js_1.config.nodeEnv === 'production' ? 'An unexpected internal error occurred.' : err.message
    });
});
// Start Server
async function startServer() {
    await (0, connection_js_1.connectDB)();
    function listenOnPort(port, attempt = 1) {
        const srv = app.listen(port, '0.0.0.0', () => {
            console.log(`
========================================================================
🚀 AI Business Intelligence & Strategy Advisor Server
📡 Listening on: http://0.0.0.0:${port} (Port: ${port})
🌐 CORS Allowed Origin: ${env_js_1.config.corsOrigin}
🧠 Gemini Engine: ${env_js_1.config.geminiApiKey ? 'Configured (' + env_js_1.config.geminiModel + ')' : 'Heuristic Synthesizer Active'}
🔐 Authentication: AES-256-GCM Encrypted Passwords & Session Engine
========================================================================
`);
        });
        srv.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                if (attempt < 5) {
                    const nextPort = port + 1;
                    console.warn(`⚠️ Port ${port} is in use. Attempting fallback port ${nextPort}...`);
                    listenOnPort(nextPort, attempt + 1);
                }
                else {
                    console.error(`❌ Could not bind to ports ${port - attempt + 1} through ${port}. Please free the ports.`);
                }
            }
            else {
                console.error('Server error:', err);
            }
        });
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully.');
            srv.close(() => process.exit(0));
        });
    }
    listenOnPort(env_js_1.config.port);
}
startServer();
