// server/projectsStorage.js - Unified MongoDB & Persistent Store for Websites
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Project = require('./models/Project');
const { isMongoConnected } = require('./db');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

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

// GET all projects (summaries for dashboard)
async function getAllProjects(userId) {
  if (isMongoConnected()) {
    try {
      const query = userId && userId !== 'all' ? { $or: [{ userId }, { ownerId: userId }] } : {};
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

  // Fallback to local JSON file
  const projects = readProjectsFromFile();
  const filtered = userId && userId !== 'all'
    ? projects.filter(p => p.userId === userId || p.ownerId === userId)
    : projects;
  return filtered.map(p => ({
    id: p.id,
    ownerId: p.ownerId || p.userId || 'anonymous',
    userId: p.userId || p.ownerId || 'anonymous',
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

// GET project by ID
async function getProjectById(id) {
  if (isMongoConnected()) {
    try {
      const doc = await Project.findOne({ id }).lean();
      if (doc) return doc;
    } catch (err) {
      console.warn('[Storage] MongoDB get failed, checking file backup:', err.message);
    }
  }

  const projects = readProjectsFromFile();
  return projects.find(p => p.id === id) || null;
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

  return projectPayload;
}

// UPDATE existing project
async function updateProject(id, updateData) {
  const now = new Date();
  let updatedDoc = null;

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
        { id },
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
  const index = projects.findIndex(p => p.id === id);

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

    return updatedDoc || updated;
  }

  return updatedDoc;
}

// DELETE project
async function deleteProject(id) {
  let deletedFromMongo = false;

  // 1. Delete from MongoDB
  if (isMongoConnected()) {
    try {
      const res = await Project.findOneAndDelete({ id });
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
  const filtered = projects.filter(p => p.id !== id);
  const deletedFromFile = filtered.length !== projects.length;

  if (deletedFromFile) {
    writeProjectsToFile(filtered);
  }

  return deletedFromMongo || deletedFromFile;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  migrateFileProjectsToMongo
};
