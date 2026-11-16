// server/models/Project.js - MongoDB Website/Project Model
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ownerId: {
      type: String,
      default: 'anonymous',
      index: true
    },
    userId: {
      type: String,
      default: 'anonymous',
      index: true
    },
    userEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'general',
      index: true
    },
    tagline: {
      type: String,
      default: ''
    },
    prompt: {
      type: String,
      default: ''
    },
    html: {
      type: String,
      default: '<!DOCTYPE html><html><body><h1>Empty Project</h1></body></html>'
    },
    css: {
      type: String,
      default: '/* Empty CSS */'
    },
    js: {
      type: String,
      default: '// Empty JS'
    },
    // Multi-file project workspace (e.g. index.html, styles.css, script.js, about.html, etc.)
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, default: '' },
        language: { type: String, default: 'html' },
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    // Conversational multi-turn history with Claude agent
    conversation: [
      {
        id: { type: String },
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, default: '' },
        toolCalls: { type: Array, default: [] },
        toolResults: { type: Array, default: [] },
        tokens: {
          inputTokens: { type: Number, default: 0 },
          outputTokens: { type: Number, default: 0 }
        },
        filesModified: { type: [String], default: [] },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    // Model used for project generation & editing
    model: {
      type: String,
      default: 'claude-3-5-sonnet-20241022'
    },
    // Cumulative token usage & estimated API cost tracking
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUSD: { type: Number, default: 0 }
    },
    // Build and diagnostic status
    buildErrors: [
      {
        file: { type: String, default: '' },
        line: { type: Number, default: 0 },
        message: { type: String, default: '' },
        severity: { type: String, default: 'error' }
      }
    ],
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      schemaType: { type: String, default: 'Organization' }
    },
    promptHistory: [
      {
        prompt: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changeSummary: { type: String, default: '' }
      }
    ],
    provider: {
      type: String,
      default: 'default'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure files and legacy html/css/js stay synchronized
projectSchema.pre('save', function (next) {
  // 1. If files array exists and has entries, synchronize to html, css, js
  if (Array.isArray(this.files) && this.files.length > 0) {
    const htmlFile = this.files.find(f => f.path === 'index.html') || this.files.find(f => f.path.endsWith('.html'));
    const cssFile = this.files.find(f => f.path === 'styles.css') || this.files.find(f => f.path.endsWith('.css'));
    const jsFile = this.files.find(f => f.path === 'script.js' || f.path === 'app.js') || this.files.find(f => f.path.endsWith('.js'));

    if (htmlFile && htmlFile.content) this.html = htmlFile.content;
    if (cssFile && cssFile.content) this.css = cssFile.content;
    if (jsFile && jsFile.content) this.js = jsFile.content;
  } else {
    // 2. If files array is empty but legacy html/css/js exists, initialize files array
    const initialFiles = [];
    if (this.html) {
      initialFiles.push({ path: 'index.html', content: this.html, language: 'html', updatedAt: new Date() });
    }
    if (this.css) {
      initialFiles.push({ path: 'styles.css', content: this.css, language: 'css', updatedAt: new Date() });
    }
    if (this.js) {
      initialFiles.push({ path: 'script.js', content: this.js, language: 'javascript', updatedAt: new Date() });
    }
    if (initialFiles.length > 0) {
      this.files = initialFiles;
    }
  }
  next();
});

// Method to format summary for dashboard listings
projectSchema.methods.toSummary = function () {
  return {
    id: this.id,
    userId: this.userId,
    userEmail: this.userEmail,
    name: this.name,
    category: this.category,
    tagline: this.tagline,
    prompt: this.prompt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    seo: this.seo,
    provider: this.provider,
    model: this.model || 'claude-3-5-sonnet-20241022',
    fileCount: Array.isArray(this.files) ? this.files.length : 3,
    tokenUsage: this.tokenUsage || { totalTokens: 0, estimatedCostUSD: 0 },
    codeLength: {
      html: this.html ? this.html.length : 0,
      css: this.css ? this.css.length : 0,
      js: this.js ? this.js.length : 0
    }
  };
};

module.exports = mongoose.model('Project', projectSchema);
