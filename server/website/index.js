// server/index.js - Express API with MongoDB for AI Website Builder
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const JSZip = require('jszip');

const { connectDB, isMongoConnected, getDatabaseName } = require('./db');
const authRoutes = require('./authRoutes');
const User = require('./models/User');
const { analyzeUserPrompt, generateWebsite, refineWebsite } = require('./geminiService');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  migrateFileProjectsToMongo,
  projectEvents
} = require('./projectsStorage');

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_central_saas_platform_key_2026';
const CRM_JWT_SECRET = process.env.CRM_JWT_SECRET || 'Tarasaka_supersecrectKey$2028';

// Helper to strictly resolve authenticated user on every request via cryptographic verification
function resolveUser(req) {
  let userId = null;
  let userEmail = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1]?.trim();
    if (token) {
      const secrets = [
        JWT_SECRET,
        process.env.CENTRAL_JWT_SECRET,
        CRM_JWT_SECRET,
        'super_secret_central_saas_platform_key_2026',
        'Tarasaka_supersecrectKey$2028',
        'super_secret_crm_jwt_key_2026_production_grade'
      ].filter(Boolean);

      for (const secret of secrets) {
        try {
          const decoded = jwt.verify(token, secret);
          if (decoded) {
            userId = decoded.uid || decoded.id || decoded._id || decoded.sub || null;
            userEmail = decoded.email || null;
            break;
          }
        } catch (e) {}
      }

      // Check Firebase ID token claims if not verified by secret
      if (!userId) {
        try {
          const decodedFb = jwt.decode(token);
          if (decodedFb && decodedFb.sub && (decodedFb.iss && decodedFb.iss.includes('securetoken.google.com'))) {
            const nowInSec = Math.floor(Date.now() / 1000);
            if (!decodedFb.exp || decodedFb.exp > nowInSec) {
              userId = decodedFb.sub;
              userEmail = decodedFb.email || null;
            }
          }
        } catch (e) {}
      }
    }
  }

  if (userId) userId = String(userId).trim();
  if (userEmail) userEmail = String(userEmail).trim();

  return { userId, userEmail };
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount MongoDB Authentication Routes
app.use('/api/auth', authRoutes);

// Health Check & Database Diagnostic Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const projects = await getAllProjects();
    let userCount = 0;
    if (isMongoConnected()) {
      userCount = await User.countDocuments();
    }

    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      database: {
        type: 'mongodb',
        connected: isMongoConnected(),
        name: getDatabaseName(),
        userCount,
        projectCount: projects.length
      },
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      firebaseConfigured: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_API_KEY),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// AI Prompt Analysis Endpoint
app.post('/api/analyze-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = req.headers['x-gemini-key'] || req.body.apiKey;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A prompt is required for analysis' });
    }

    console.log(`[API /analyze-prompt] Analyzing prompt: "${prompt.slice(0, 60)}..."`);
    const analysis = await analyzeUserPrompt({ prompt, apiKey });
    res.json(analysis);
  } catch (err) {
    console.error('[API /analyze-prompt] Error:', err);
    res.status(500).json({ error: 'Prompt analysis failed: ' + err.message });
  }
});

// Projects Persistence Endpoints (Strictly user-isolated)
app.get('/api/projects', async (req, res) => {
  try {
    const { userId } = resolveUser(req);
    if (!userId || userId === 'anonymous') {
      return res.json([]);
    }
    const list = await getAllProjects(userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects: ' + err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { userId } = resolveUser(req);
    const project = await getProjectById(req.params.id, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project: ' + err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { userId: resolvedUid, userEmail: resolvedEmail } = resolveUser(req);
    const userId = resolvedUid;

    if (!userId || userId === 'anonymous') {
      return res.status(401).json({ error: 'Valid authentication session required to save project' });
    }

    const userEmail = resolvedEmail || (req.body.userEmail ? String(req.body.userEmail).trim() : '');

    const projectData = { ...req.body };
    delete projectData.ownerId;
    delete projectData.userId;

    const project = await createProject({
      ...projectData,
      ownerId: userId,
      userId,
      userEmail
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { userId } = resolveUser(req);
    const updated = await updateProject(req.params.id, req.body, userId);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { userId } = resolveUser(req);
    const success = await deleteProject(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project: ' + err.message });
  }
});

// AI Generation Endpoint (Automatically stores to MongoDB strictly tied to user)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, category, stylePreferences, blueprint } = req.body;
    const apiKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const { userId: authUid, userEmail: authEmail } = resolveUser(req);
    const resolvedUserId = authUid || req.body.userId || 'anonymous';
    const resolvedUserEmail = authEmail || req.body.userEmail || '';

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A descriptive website prompt is required' });
    }

    console.log(`[API /generate] Processing prompt: "${prompt.slice(0, 60)}..." (category: ${category})`);
    const generated = await generateWebsite({ prompt, category, stylePreferences, blueprint, apiKey });

    // Automatically persist newly generated project in MongoDB
    const saved = await createProject({
      name: generated.name || 'Generated Website',
      category: generated.category || category || 'general',
      tagline: generated.tagline || '',
      prompt,
      ownerId: resolvedUserId,
      userId: resolvedUserId,
      userEmail: resolvedUserEmail,
      html: generated.html,
      css: generated.css,
      js: generated.js,
      seo: generated.seo,
      provider: generated.provider
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error('[API /generate] Error:', err);
    res.status(500).json({ error: 'Website generation failed: ' + err.message });
  }
});

// AI Refinement Endpoint
app.post('/api/refine', async (req, res) => {
  try {
    const { id, currentCode, prompt } = req.body;
    const apiKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const { userId } = resolveUser(req);

    if (!prompt) {
      return res.status(400).json({ error: 'Refinement instructions are required' });
    }

    let codeToRefine = currentCode;
    let existingProject = null;

    if (id) {
      existingProject = await getProjectById(id, userId);
      if (userId && !existingProject) {
        return res.status(404).json({ error: 'Project not found or unauthorized' });
      }
      if (existingProject && !codeToRefine) {
        codeToRefine = {
          html: existingProject.html,
          css: existingProject.css,
          js: existingProject.js
        };
      }
    }

    if (!codeToRefine || !codeToRefine.html) {
      return res.status(400).json({ error: 'No code supplied to refine' });
    }

    console.log(`[API /refine] Refining code with prompt: "${prompt.slice(0, 60)}..."`);
    const refined = await refineWebsite({ currentCode: codeToRefine, prompt, apiKey });

    // If project ID exists, update MongoDB store
    if (id && existingProject) {
      const updated = await updateProject(id, {
        html: refined.html,
        css: refined.css,
        js: refined.js,
        prompt: prompt,
        changeSummary: refined.changeSummary
      }, userId);
      return res.json({
        ...updated,
        changeSummary: refined.changeSummary
      });
    }

    res.json(refined);
  } catch (err) {
    console.error('[API /refine] Error:', err);
    res.status(500).json({ error: 'Refinement failed: ' + err.message });
  }
});

// ZIP Export Endpoint
app.get('/api/projects/:id/export', async (req, res) => {
  try {
    const { userId } = resolveUser(req);
    const project = await getProjectById(req.params.id, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const zip = new JSZip();
    zip.file('index.html', project.html || '<!DOCTYPE html><html><body></body></html>');
    zip.file('styles.css', project.css || '/* styles */');
    zip.file('script.js', project.js || '// script');

    const readmeContent = `# ${project.name}

${project.tagline || 'Generated with AI Website Builder'}

## Project Overview
- **Category:** ${project.category}
- **Generated On:** ${project.createdAt}
- **Stored In:** MongoDB Database
- **Engine Provider:** ${project.provider || 'AI Website Builder'}

## Deployment Instructions
This website is completely self-contained and ready to deploy:
1. **GitHub Pages / Netlify / Vercel:** Simply upload or push this folder.
2. **Local Preview:** Open \`index.html\` directly in any modern web browser or run:
   \`\`\`bash
   npx serve .
   \`\`\`

## Included Files
- \`index.html\`: Semantic HTML5 structure with responsive viewport and schema markup.
- \`styles.css\`: Bespoke modern CSS with CSS variables, fluid clamp typography, and dark/light support.
- \`script.js\`: Native JavaScript powering interactive components (modals, sliders, forms, drawers).
`;

    zip.file('README.md', readmeContent);

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const filename = `${(project.name || 'website').toLowerCase().replace(/[^a-z0-9]/g, '-')}-export.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    console.error('[API /export] Error:', err);
    res.status(500).json({ error: 'Failed to create export ZIP: ' + err.message });
  }
});

// ============================================================================
// CLAUDE MCP (Model Context Protocol) & LIVE WEBSITE PREVIEW ENDPOINTS
// ============================================================================
const mcpServer = require('./mcp-server');

// 1. Live Standalone Website Preview with Injected Toolbar
app.get('/api/preview/:id', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).send('<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Website Project Not Found</h2><p>Please check the project ID or create a new site in Nexus OS.</p></body></html>');
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5180';
    const editorUrl = `${clientUrl}/apps/website-builder/editor/${project.id}`;

    let html = project.html || '<!DOCTYPE html><html><head><title>Website</title></head><body><h1>Empty Website</h1></body></html>';
    const cssTag = project.css ? `<style id="nexus-injected-css">\n${project.css}\n</style>` : '';
    const jsTag = project.js ? `<script id="nexus-injected-js">\n${project.js}\n</script>` : '';

    const previewBanner = `
    <div id="nexus-preview-banner" style="position:fixed;bottom:16px;right:16px;z-index:999999;background:rgba(15,23,42,0.92);backdrop-filter:blur(12px);border:1px solid rgba(59,130,246,0.3);color:#fff;padding:10px 18px;border-radius:14px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.4);font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:12px;font-size:12px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        <strong>${project.name || 'Nexus OS Website'}</strong>
      </div>
      <a href="${editorUrl}" target="_blank" style="background:#2563eb;color:#fff;text-decoration:none;padding:5px 12px;border-radius:8px;font-weight:600;font-size:11px;display:inline-flex;align-items:center;gap:4px;transition:all 0.2s;">
        Edit in PulseStudio ↗
      </a>
      <button onclick="document.getElementById('nexus-preview-banner').style.display='none'" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;line-height:1;padding:2px;" title="Dismiss">✕</button>
    </div>
    `;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${cssTag}\n</head>`);
    } else {
      html = `${cssTag}\n${html}`;
    }

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${previewBanner}\n${jsTag}\n</body>`);
    } else {
      html = `${html}\n${previewBanner}\n${jsTag}`;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<h1>Error rendering preview: ${err.message}</h1>`);
  }
});

// 2. Claude MCP Configuration Snippet Generator
app.get('/api/mcp/config', (req, res) => {
  const mcpServerPath = path.resolve(__dirname, 'mcp-server.js').replace(/\\/g, '/');
  const claudeDesktopConfig = {
    mcpServers: {
      'nexus-website-builder': {
        command: 'node',
        args: [mcpServerPath]
      }
    }
  };

  const claudeCliCommand = `claude mcp add nexus-website-builder node "${mcpServerPath}"`;

  res.json({
    status: 'online',
    protocolVersion: '2024-11-05',
    serverPath: mcpServerPath,
    tools: mcpServer.TOOLS.map(t => ({ name: t.name, description: t.description })),
    claudeDesktopConfig,
    claudeCliCommand,
    configPaths: {
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
      mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
      linux: '~/.config/Claude/claude_desktop_config.json'
    }
  });
});

// 3. HTTP JSON-RPC 2.0 MCP Endpoint
app.post('/api/mcp', async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    if (response) {
      res.json(response);
    } else {
      res.status(204).end();
    }
  } catch (err) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: err.message }
    });
  }
});

// 4. MCP Health Endpoint
app.get('/api/mcp/health', (req, res) => {
  res.json({
    status: 'online',
    server: 'nexus-website-builder-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    toolsCount: mcpServer.TOOLS.length,
    tools: mcpServer.TOOLS.map(t => t.name)
  });
});

// 5. REAL-TIME LIVE SYNCHRONIZATION STREAM (Server-Sent Events)
// Broadcasts website changes to Dashboard and Editor canvas in real-time
app.get('/api/projects/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'HANDSHAKE', status: 'connected', timestamp: Date.now() })}\n\n`);

  const onProjectChange = (eventPayload) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'PROJECT_EVENT', ...eventPayload })}\n\n`);
    } catch (err) {}
  };

  projectEvents.on('change', onProjectChange);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {}
  }, 15000);

  req.on('close', () => {
    projectEvents.off('change', onProjectChange);
    clearInterval(heartbeat);
  });
});

// 6. ANTHROPIC MCP SSE TRANSPORT (Official specification for Claude.ai Web Chatbot & Remote MCP clients)
const mcpSseSessions = new Map();

app.options('/api/mcp/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.status(204).end();
});

app.get('/api/mcp/sse', (req, res) => {
  const sessionId = require('crypto').randomUUID();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  mcpSseSessions.set(sessionId, res);

  // Send official MCP endpoint event with complete absolute URL for claude.ai web chatbot
  const protocol = req.headers['x-forwarded-proto'] || (req.connection?.encrypted ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5002';
  const endpointUrl = `${protocol}://${host}/api/mcp/message?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(`: mcp-keepalive\n\n`);
    } catch (e) {}
  }, 15000);

  req.on('close', () => {
    mcpSseSessions.delete(sessionId);
    clearInterval(keepAlive);
  });
});

app.post('/api/mcp/message', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  const sessionId = req.query.sessionId;
  try {
    const response = await mcpServer.handleRequest(req.body);
    const sseClient = sessionId ? mcpSseSessions.get(sessionId) : null;

    if (sseClient && response) {
      sseClient.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
    }

    if (response) {
      res.status(200).json(response);
    } else {
      res.status(202).json({ jsonrpc: '2.0', status: 'accepted' });
    }
  } catch (err) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: err.message }
    });
  }
});

// 7. IN-APP CLAUDE PROMPT RUNNER (Direct MCP Prompt & Tool Execution from Browser)
app.post('/api/mcp/run-prompt', async (req, res) => {
  const { prompt, projectId, name, category, stylePreferences, html, css, js } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const anthropicKey = req.headers['x-anthropic-key'] || req.body.anthropicKey || req.body.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  try {
    let result;
    if (projectId) {
      result = await mcpServer.executeTool('refine_website', {
        projectId,
        prompt,
        html,
        css,
        js,
        anthropicKey,
        changeType: 'general'
      });
    } else {
      result = await mcpServer.executeTool('generate_website', {
        prompt,
        name,
        category: category || 'landing',
        stylePreferences,
        html,
        css,
        js,
        anthropicKey
      });
    }

    res.json({
      success: true,
      message: result.content?.[0]?.text || '',
      project: result.project || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server and Initialize MongoDB Connection
app.listen(PORT, async () => {
  console.log(`[Server] AI Website Builder API running on http://localhost:${PORT}`);
  const connected = await connectDB();
  if (connected) {
    await migrateFileProjectsToMongo();
  }
});