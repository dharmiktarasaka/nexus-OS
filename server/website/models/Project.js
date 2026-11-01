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
    codeLength: {
      html: this.html ? this.html.length : 0,
      css: this.css ? this.css.length : 0,
      js: this.js ? this.js.length : 0
    }
  };
};

module.exports = mongoose.model('Project', projectSchema);
