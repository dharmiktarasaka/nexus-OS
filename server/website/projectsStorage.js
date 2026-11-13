// server/projectsStorage.js - Unified MongoDB & Persistent Store for Websites
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const Project = require('./models/Project');
const { isMongoConnected } = require('./db');

class ProjectEventsEmitter extends EventEmitter {}
const projectEvents = new ProjectEventsEmitter();
projectEvents.setMaxListeners(100);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

let lastMtime = 0;
try {
  ensureDataFile();
  if (fs.existsSync(DATA_FILE)) {
    lastMtime = fs.statSync(DATA_FILE).mtimeMs;
  }
} catch (e) {}

// Watch file changes from external Claude MCP processes (e.g. Claude Code CLI or Claude Desktop)
fs.watchFile(DATA_FILE, { interval: 800 }, (curr, prev) => {
  if (curr.mtimeMs > lastMtime) {
    lastMtime = curr.mtimeMs;
    try {
      const projects = readProjectsFromFile();
      if (projects.length > 0) {
        const latest = projects[0];
        projectEvents.emit('change', {
          action: 'update',
          projectId: latest.id,
          project: latest,
          source: 'claude_external_mcp',
          timestamp: Date.now()
        });
      }
    } catch (e) {}
  }
});

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readProjectsFromFile() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Error reading projects.json:', err.message);
    return [];
  }
}

function writeProjectsToFile(projects) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error writing projects.json:', err.message);
  }
}

// Migrate existing file projects to MongoDB on startup
async function migrateFileProjectsToMongo() {
  if (!isMongoConnected()) return;
  try {
    const count = await Project.countDocuments();
    if (count === 0) {
      const fileProjects = readProjectsFromFile();
      if (fileProjects.length > 0) {
        console.log(`[Storage] Migrating ${fileProjects.length} existing projects from JSON file into MongoDB...`);
        for (const p of fileProjects) {
          await Project.findOneAndUpdate(
            { id: p.id },
            {
              ...p,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
            },
            { upsert: true, new: true }
          );
        }
        console.log(`[Storage] Migration to MongoDB complete!`);
      }
    }
  } catch (err) {
    console.warn('[Storage] Migration notice:', err.message);
  }
}

// GET all projects (summaries for dashboard strictly isolated to logged-in user)
async function getAllProjects(userId) {
  if (!userId || userId === 'anonymous' || userId === 'null' || userId === 'undefined') {
    return [];
  }

  const query = {
    $or: [{ userId: String(userId) }, { ownerId: String(userId) }]
  };

  if (isMongoConnected()) {
    try {
      const docs = await Project.find(query).sort({ updatedAt: -1 }).lean();
      return docs.map(p => ({
        id: p.id,
        ownerId: p.ownerId || p.userId,
        userId: p.userId || p.ownerId,
        userEmail: p.userEmail,
        name: p.name,
        category: p.category,
        tagline: p.tagline,
        prompt: p.prompt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        seo: p.seo,
        provider: p.provider,
        codeLength: {
          html: p.html ? p.html.length : 0,
          css: p.css ? p.css.length : 0,
          js: p.js ? p.js.length : 0
        }
      }));
    } catch (err) {
      console.warn('[Storage] MongoDB query failed, using local file backup:', err.message);
    }
  }

  // Fallback to local JSON file strictly filtered by user
  const projects = readProjectsFromFile();
  const filtered = projects.filter(p => p.userId === userId || p.ownerId === userId);
  return filtered.map(p => ({
    id: p.id,
    ownerId: p.ownerId || p.userId,
    userId: p.userId || p.ownerId,
    userEmail: p.userEmail || '',
    name: p.name,
    category: p.category,
    tagline: p.tagline,
    prompt: p.prompt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    seo: p.seo,
    provider: p.provider,
    codeLength: {
      html: p.html ? p.html.length : 0,
      css: p.css ? p.css.length : 0,
      js: p.js ? p.js.length : 0
    }
  }));
}

// GET project by ID (strictly isolated to owner if userId provided)
async function getProjectById(id, userId) {
  const query = { id };
  if (userId && userId !== 'all') {
    query.$or = [{ userId: String(userId) }, { ownerId: String(userId) }];
  }

  if (isMongoConnected()) {
    try {
      const doc = await Project.findOne(query).lean();
      if (doc) return doc;
    } catch (err) {
      console.warn('[Storage] MongoDB get failed, checking file backup:', err.message);
    }
  }

  const projects = readProjectsFromFile();
  return projects.find(p => p.id === id && (!userId || p.userId === userId || p.ownerId === userId)) || null;
}

// CREATE new project
async function createProject(data) {
  const projectId = data.id || uuidv4();
  const now = new Date();
  const resolvedOwner = data.ownerId || data.userId || 'anonymous';

  const projectPayload = {
    id: projectId,
    ownerId: resolvedOwner,
    userId: resolvedOwner,
    userEmail: data.userEmail || '',
    name: data.name || 'Untitled Website',
    category: data.category || 'general',
    tagline: data.tagline || '',
    prompt: data.prompt || '',
    html: data.html || '<!DOCTYPE html><html><body><h1>Empty Project</h1></body></html>',
    css: data.css || '/* Empty CSS */',
    js: data.js || '// Empty JS',
    seo: data.seo || {
      metaTitle: data.name || 'Untitled Website',
      metaDescription: data.tagline || '',
      keywords: [],
      schemaType: 'Organization'
    },
    promptHistory: data.promptHistory || (data.prompt ? [{ prompt: data.prompt, timestamp: now, changeSummary: 'Initial generation' }] : []),
    provider: data.provider || 'default',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // 1. Save to MongoDB if connected
  if (isMongoConnected()) {
    try {
      const doc = await Project.create({
        ...projectPayload,
        createdAt: now,
        updatedAt: now
      });
      console.log(`[Storage] Saved project to MongoDB: "${doc.name}" (${doc.id})`);
    } catch (err) {
      console.error('[Storage] MongoDB create failed:', err.message);
    }
  }

  // 2. Always write to local JSON as resilient backup
  const projects = readProjectsFromFile();
  projects.unshift(projectPayload);
  writeProjectsToFile(projects);

  try {
    projectEvents.emit('change', {
      action: 'create',
      projectId: projectPayload.id,
      project: projectPayload,
      timestamp: Date.now()
    });
  } catch (e) {}

  return projectPayload;
}

// UPDATE existing project (strictly isolated to owner if userId provided)
async function updateProject(id, updateData, userId) {
  const now = new Date();
  let updatedDoc = null;

  const filter = { id };
  if (userId && userId !== 'all') {
    filter.$or = [{ userId: String(userId) }, { ownerId: String(userId) }];
  }

  // 1. Update in MongoDB
  if (isMongoConnected()) {
    try {
      const mongoUpdate = {
        ...updateData,
        updatedAt: now
      };

      if (updateData.prompt) {
        mongoUpdate.$push = {
          promptHistory: {
            prompt: updateData.prompt,
            timestamp: now,
            changeSummary: updateData.changeSummary || 'Applied AI refinements'
          }
        };
      }

      updatedDoc = await Project.findOneAndUpdate(
        filter,
        mongoUpdate,
        { new: true }
      ).lean();

      if (updatedDoc) {
        console.log(`[Storage] Updated project in MongoDB: "${updatedDoc.name}" (${id})`);
      }
    } catch (err) {
      console.error('[Storage] MongoDB update failed:', err.message);
    }
  }

  // 2. Update in local file backup
  const projects = readProjectsFromFile();
  const index = projects.findIndex(p => p.id === id && (!userId || p.userId === userId || p.ownerId === userId));

  if (index !== -1) {
    const current = projects[index];
    const updated = {
      ...current,
      ...updateData,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now.toISOString()
    };

    if (updateData.prompt) {
      updated.promptHistory = [
        ...(current.promptHistory || []),
        {
          prompt: updateData.prompt,
          timestamp: now.toISOString(),
          changeSummary: updateData.changeSummary || 'Applied AI refinements'
        }
      ];
    }

    projects[index] = updated;
    writeProjectsToFile(projects);

    const result = updatedDoc || updated;
    try {
      projectEvents.emit('change', {
        action: 'update',
        projectId: id,
        project: result,
        timestamp: Date.now()
      });
    } catch (e) {}

    return result;
  }

  if (updatedDoc) {
    try {
      projectEvents.emit('change', {
        action: 'update',
        projectId: id,
        project: updatedDoc,
        timestamp: Date.now()
      });
    } catch (e) {}
  }

  return updatedDoc;
}

// DELETE project (strictly isolated to owner if userId provided)
async function deleteProject(id, userId) {
  let deletedFromMongo = false;

  const filter = { id };
  if (userId && userId !== 'all') {
    filter.$or = [{ userId: String(userId) }, { ownerId: String(userId) }];
  }

  // 1. Delete from MongoDB
  if (isMongoConnected()) {
    try {
      const res = await Project.findOneAndDelete(filter);
      deletedFromMongo = Boolean(res);
      if (deletedFromMongo) {
        console.log(`[Storage] Deleted project from MongoDB: ${id}`);
      }
    } catch (err) {
      console.error('[Storage] MongoDB delete failed:', err.message);
    }
  }

  // 2. Delete from local file backup
  const projects = readProjectsFromFile();
  const filtered = projects.filter(p => !(p.id === id && (!userId || p.userId === userId || p.ownerId === userId)));
  const deletedFromFile = filtered.length !== projects.length;

  if (deletedFromFile) {
    writeProjectsToFile(filtered);
  }

  const success = deletedFromMongo || deletedFromFile;
  if (success) {
    try {
      projectEvents.emit('change', {
        action: 'delete',
        projectId: id,
        timestamp: Date.now()
      });
    } catch (e) {}
  }

  return success;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  migrateFileProjectsToMongo,
  projectEvents
};
