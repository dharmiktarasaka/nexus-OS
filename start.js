import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to kill orphaned processes holding platform ports on Windows
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING') || line.includes('ESTABLISHED')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && parseInt(pid, 10) > 0 && pid !== String(process.pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`[Port Manager] Freed stale process ${pid} on port ${port}`);
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {}
}

// Load root .env if present
const rootEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(rootEnvPath); } catch (e) {}
}

const UNIFIED_MONGODB_URI = process.env.MONGODB_URI || process.env.CENTRAL_MONGODB_URI || '';

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || Boolean(process.env.RAILWAY_ENVIRONMENT);
const GATEWAY_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (isProduction ? 10000 : 5000);

console.log('===============================================================');
console.log(`🚀 Launching Nexus OS • All-in-One Platform Services [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log(`📦 Database: Single Unified MongoDB Cluster [nexus_os]`);
console.log('===============================================================');

// Clean up any stale/orphaned processes holding ports on Windows
if (!isProduction) {
  [5000, 5001, 5002, 5003, 5004, 5050, 5180, 5182].forEach(p => freePort(p));
}

let isShuttingDown = false;
const processes = [];

function startProcess(name, cmd, args, cwd, colorCode, extraEnv = {}) {
  const reset = '\x1b[0m';
  const color = `\x1b[${colorCode}m`;
  const prefix = `${color}[${name}]${reset} `;

  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    env: { ...process.env, ...extraEnv, FORCE_COLOR: '1' }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`${prefix}${line}`));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.error(`${prefix}${line}`));
  });

  proc.on('close', (code) => {
    console.log(`${prefix}Process exited with code ${code}`);
    if (code !== 0 && !isShuttingDown) {
      console.log(`${prefix}Auto-restarting in 2.5 seconds...`);
      setTimeout(() => {
        if (!isShuttingDown) {
          startProcess(name, cmd, args, cwd, colorCode, extraEnv);
        }
      }, 2500);
    }
  });

  processes.push(proc);
  return proc;
}

const UNIFIED_JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
const UNIFIED_CRM_SECRET = process.env.CRM_JWT_SECRET || 'Tarasaka_supersecrectKey$2028';

// 1. Start Central Platform Server (Fixed Internal Port 5050)
const centralServerPath = path.join(__dirname, 'server');
startProcess('Central:5050', 'node', ['src/index.js'], centralServerPath, '34', {
  PORT: '5050',
  MONGODB_URI: UNIFIED_MONGODB_URI,
  CENTRAL_MONGODB_URI: UNIFIED_MONGODB_URI,
  CRM_MONGODB_URI: UNIFIED_MONGODB_URI,
  WEBSITE_MONGODB_URI: UNIFIED_MONGODB_URI,
  ANALYTICS_MONGODB_URI: UNIFIED_MONGODB_URI,
  JWT_SECRET: UNIFIED_JWT_SECRET,
  CENTRAL_JWT_SECRET: UNIFIED_JWT_SECRET,
  CRM_JWT_SECRET: UNIFIED_CRM_SECRET
});

// 2. Start CRM Backend Server (Fixed Internal Port 5001)
const crmServerPath = path.join(__dirname, 'server', 'crm');
startProcess('CRM:5001', 'node', ['server.js'], crmServerPath, '32', {
  PORT: '5001',
  MONGODB_URI: UNIFIED_MONGODB_URI,
  JWT_SECRET: UNIFIED_CRM_SECRET,
  CENTRAL_JWT_SECRET: UNIFIED_JWT_SECRET,
  CRM_JWT_SECRET: UNIFIED_CRM_SECRET
});

// 3. Start Website Builder Backend Server (Fixed Internal Port 5002)
const websiteServerPath = path.join(__dirname, 'server', 'website');
startProcess('Website:5002', 'node', ['index.js'], websiteServerPath, '36', {
  PORT: '5002',
  MONGODB_URI: UNIFIED_MONGODB_URI,
  JWT_SECRET: UNIFIED_JWT_SECRET,
  CENTRAL_JWT_SECRET: UNIFIED_JWT_SECRET,
  CRM_JWT_SECRET: UNIFIED_CRM_SECRET
});

// 3b. Start Social Media (Mediamation) Backend Server (Fixed Internal Port 5003)
const socialServerPath = path.join(__dirname, 'server', 'social');
if (fs.existsSync(socialServerPath)) {
  startProcess('Social:5003', 'node', ['src/index.js'], socialServerPath, '35', {
    PORT: '5003',
    MONGODB_URI: UNIFIED_MONGODB_URI,
    JWT_SECRET: UNIFIED_JWT_SECRET,
    CENTRAL_JWT_SECRET: UNIFIED_JWT_SECRET,
    CRM_JWT_SECRET: UNIFIED_CRM_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    CLIENT_URL: process.env.CLIENT_URL || (isProduction ? '' : 'http://localhost:5180'),
    BACKEND_URL: process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || (isProduction ? '' : `http://localhost:${GATEWAY_PORT}`)
  });
}

// 3c. Start Business Analytics (STRATIQ) Backend Server (Fixed Internal Port 5004)
const analyticsServerPath = path.join(__dirname, 'server', 'analytics');
if (fs.existsSync(analyticsServerPath)) {
  startProcess('Analytics:5004', 'node', ['dist/index.js'], analyticsServerPath, '33', {
    PORT: '5004',
    MONGODB_URI: UNIFIED_MONGODB_URI,
    CENTRAL_MONGODB_URI: UNIFIED_MONGODB_URI,
    JWT_SECRET: UNIFIED_JWT_SECRET,
    CENTRAL_JWT_SECRET: UNIFIED_JWT_SECRET,
    CRM_JWT_SECRET: UNIFIED_CRM_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
  });
}

// 4. Start Client Vite Dev Server (Only in local development)
if (!isProduction) {
  const clientPath = path.join(__dirname, 'client');
  startProcess('Client:5180', 'npm', ['run', 'dev'], clientPath, '35');

  // 4b. Start Separate Admin Control Portal (Fixed Port 5182)
  const adminPath = path.join(__dirname, 'admin');
  if (fs.existsSync(adminPath)) {
    const distHtml = path.join(adminPath, 'dist', 'index.html');
    if (fs.existsSync(distHtml)) {
      // Use preview mode for production-built assets: 0 esbuild daemon crashes, instant load!
      startProcess('Admin:5182', 'npm', ['run', 'preview'], adminPath, '33');
    } else {
      startProcess('Admin:5182', 'npm', ['run', 'dev'], adminPath, '33');
    }
  }
}

// 5. Start Unified Cloud Gateway (Listens on process.env.PORT or 5000)
// This gateway allows deploying the entire multi-service backend as 1 single Web Service on Render / Railway
const gateway = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';

  // Global Permissive CORS
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range, x-user-id, x-user-email, x-gemini-key');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Root / Health Check
  const urlPath = req.url || '/';
  if (urlPath === '/' || urlPath === '/health' || urlPath === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      name: 'Nexus OS Unified Cloud Backend Gateway',
      status: 'ONLINE',
      mode: isProduction ? 'production' : 'development',
      services: {
        central: 'http://127.0.0.1:5050',
        crm: 'http://127.0.0.1:5001',
        website: 'http://127.0.0.1:5002',
        social: 'http://127.0.0.1:5003',
        analytics: 'http://127.0.0.1:5004'
      },
      timestamp: new Date().toISOString()
    }));
  }

  // Determine Destination Port & Rewritten Path
  let targetPort = 5050;
  let targetPath = urlPath;

  if (urlPath.startsWith('/crm-api/')) {
    targetPort = 5001;
    targetPath = urlPath.replace(/^\/crm-api/, '/api');
  } else if (urlPath.startsWith('/crm/')) {
    targetPort = 5001;
    targetPath = urlPath.replace(/^\/crm/, '/api');
  } else if (urlPath.startsWith('/uploads/')) {
    targetPort = 5001;
    targetPath = urlPath;
  } else if (
    urlPath.startsWith('/api/generate') ||
    urlPath.startsWith('/api/projects') ||
    urlPath.startsWith('/api/refine') ||
    urlPath.startsWith('/api/analyze-prompt') ||
    urlPath.startsWith('/api/database')
  ) {
    targetPort = 5002;
    targetPath = urlPath;
  } else if (urlPath.startsWith('/website-api/')) {
    targetPort = 5002;
    targetPath = urlPath.replace(/^\/website-api/, '/api');
  } else if (
    urlPath.startsWith('/social-api') ||
    urlPath.startsWith('/api/accounts') ||
    urlPath.startsWith('/api/posts') ||
    urlPath.startsWith('/api/upload') ||
    urlPath.startsWith('/api/ai') ||
    urlPath.startsWith('/api/social') ||
    urlPath.startsWith('/api/auth/instagram')
  ) {
    targetPort = 5003;
    targetPath = urlPath.replace(/^\/social-api/, '/api');
  } else if (
    urlPath.startsWith('/analytics-api') ||
    urlPath.startsWith('/api/businesses') ||
    urlPath.startsWith('/api/analyses') ||
    urlPath.startsWith('/api/conversations') ||
    urlPath.startsWith('/api/actions')
  ) {
    targetPort = 5004;
    targetPath = urlPath.replace(/^\/analytics-api/, '/api');
  } else {
    targetPort = 5050;
    targetPath = urlPath;
  }

  // Forward request to internal target service
  const rawClientHost = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${GATEWAY_PORT}`;
  const clientHost = String(rawClientHost).replace(/^(https?:\/\/)+/i, '');
  const clientProto = req.headers['x-forwarded-proto'] || (req.connection?.encrypted ? 'https' : 'http');
  const forwardHeaders = { 
    ...req.headers, 
    host: `127.0.0.1:${targetPort}`,
    'x-forwarded-host': clientHost,
    'x-forwarded-proto': clientProto
  };
  
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    path: targetPath,
    method: req.method,
    headers: forwardHeaders
  }, (targetRes) => {
    // Merge headers and prevent duplicate CORS
    const headers = { ...targetRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-credentials'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];

    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';

    res.writeHead(targetRes.statusCode || 200, headers);
    targetRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        status: 503,
        error: 'Service Temporarily Unavailable',
        message: `Target service on port ${targetPort} is booting or temporarily offline. Please retry in a few seconds.`,
        code: err.code
      }));
    }
  });

  req.pipe(proxyReq);
});

gateway.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`🌐 Nexus OS Unified Gateway running on http://0.0.0.0:${GATEWAY_PORT}`);
  console.log(`   ├── Routing /crm-api/*        -> http://127.0.0.1:5001/api/*`);
  console.log(`   ├── Routing /api/generate etc  -> http://127.0.0.1:5002/*`);
  console.log(`   └── Routing /api/*             -> http://127.0.0.1:5050/*\n`);
});

// Graceful shutdown on Ctrl+C or kill signal
function shutdown() {
  isShuttingDown = true;
  console.log('\n🛑 Shutting down all Nexus OS services...');
  try { gateway.close(); } catch (e) {}
  processes.forEach(p => {
    try { p.kill(); } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
