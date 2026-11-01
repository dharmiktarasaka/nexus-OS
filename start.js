import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.PORT) || Boolean(process.env.RENDER) || Boolean(process.env.RAILWAY_ENVIRONMENT);
const GATEWAY_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (isProduction ? 10000 : 5000);

console.log('===============================================================');
console.log(`🚀 Launching Nexus OS • All-in-One Platform Services [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('===============================================================');

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
  });

  processes.push(proc);
  return proc;
}

// 1. Start Central Platform Server (Fixed Internal Port 5050)
const centralServerPath = path.join(__dirname, 'server');
startProcess('Central:5050', 'node', ['src/index.js'], centralServerPath, '34', { PORT: '5050' });

// 2. Start CRM Backend Server (Fixed Internal Port 5001)
const crmServerPath = path.join(__dirname, 'server', 'crm');
startProcess('CRM:5001', 'node', ['server.js'], crmServerPath, '32', { PORT: '5001' });

// 3. Start Website Builder Backend Server (Fixed Internal Port 5002)
const websiteServerPath = path.join(__dirname, 'server', 'website');
startProcess('Website:5002', 'node', ['index.js'], websiteServerPath, '36', { PORT: '5002' });

// 4. Start Client Vite Dev Server (Only in local development)
if (!isProduction) {
  const clientPath = path.join(__dirname, 'client');
  startProcess('Client:5180', 'npm', ['run', 'dev'], clientPath, '35');
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
        website: 'http://127.0.0.1:5002'
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
  } else {
    targetPort = 5050;
    targetPath = urlPath;
  }

  // Forward request to internal target service
  const forwardHeaders = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  
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
  console.log('\n🛑 Shutting down all Nexus OS services...');
  try { gateway.close(); } catch (e) {}
  processes.forEach(p => {
    try { p.kill(); } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
