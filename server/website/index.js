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
  migrateFileProjectsToMongo
} = require('./projectsStorage');

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

// Projects Persistence Endpoints (MongoDB backed)
app.get('/api/projects', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    const list = await getAllProjects(userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects: ' + err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project: ' + err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.ownerId || req.body.userId || 'anonymous';
    const userEmail = req.headers['x-user-email'] || req.body.userEmail || '';

    const project = await createProject({
      ...req.body,
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
    const updated = await updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const success = await deleteProject(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project: ' + err.message });
  }
});

// AI Generation Endpoint (Automatically stores to MongoDB)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, category, stylePreferences, blueprint, userId, userEmail } = req.body;
    const apiKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const resolvedUserId = req.headers['x-user-id'] || userId || 'anonymous';
    const resolvedUserEmail = req.headers['x-user-email'] || userEmail || '';

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

    if (!prompt) {
      return res.status(400).json({ error: 'Refinement instructions are required' });
    }

    let codeToRefine = currentCode;
    let existingProject = null;

    if (id) {
      existingProject = await getProjectById(id);
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
      });
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
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
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

// Start Server and Initialize MongoDB Connection
app.listen(PORT, async () => {
  console.log(`[Server] AI Website Builder API running on http://localhost:${PORT}`);
  const connected = await connectDB();
  if (connected) {
    await migrateFileProjectsToMongo();
  }
});
