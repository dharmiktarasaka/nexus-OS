#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) Server for Nexus OS • PulseStudio Website Builder
 * Specification: Anthropic MCP 2024-11-05
 * 
 * Allows users in Claude (Claude Desktop, Claude Code CLI, Cursor, etc.) to prompt Claude
 * to generate, refine, list, preview, and update full-stack websites directly inside
 * the Nexus OS Website Builder.
 */

const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Load environment variables from server/website/.env and root .env
const localEnv = path.join(__dirname, '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
}
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

const { connectDB, isMongoConnected } = require('./db');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('./projectsStorage');
const { generateWebsite, refineWebsite } = require('./geminiService');
const { generateWebsiteWithClaude, refineWebsiteWithClaude } = require('./claudeService');

const SERVER_NAME = 'nexus-website-builder-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

const CLIENT_BASE_URL = process.env.CLIENT_URL || 'http://localhost:5180';
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

let dbInitPromise = null;
function ensureDatabase() {
  if (!dbInitPromise) {
    dbInitPromise = connectDB().catch(err => {
      // Running in resilient mode, projects.json is always available
      return false;
    });
  }
  return dbInitPromise;
}

// Ensure database is connecting in background
ensureDatabase();

/**
 * Available MCP Tools exposed to Claude
 */
const TOOLS = [
  {
    name: 'generate_website',
    description: 'Generate a complete, modern, responsive website directly inside Nexus OS Website Builder. Claude can synthesize the semantic HTML5, modern CSS3 variables, and interactive JS components and pass them in html, css, and js to build a 100% Claude-authored website. If html/css/js are omitted, the engine synthesizes them automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the website to build.'
        },
        name: {
          type: 'string',
          description: 'Brand or business name.'
        },
        category: {
          type: 'string',
          description: 'Website category (landing, saas, restaurant, portfolio, real-estate, ecommerce, fitness, agency, healthcare, consulting).'
        },
        tagline: {
          type: 'string',
          description: 'Compelling brand tagline.'
        },
        html: {
          type: 'string',
          description: 'Complete HTML5 code authored by Claude with full multi-page sections, hero, about, offerings, gallery, and contact.'
        },
        css: {
          type: 'string',
          description: 'Complete modern CSS3 code authored by Claude with CSS variables, fluid responsive layout, and styling.'
        },
        js: {
          type: 'string',
          description: 'Complete interactive JavaScript code authored by Claude for widgets, sliders, calculators, and modals.'
        },
        stylePreferences: {
          type: 'string',
          description: 'Styling aesthetic instructions.'
        },
        anthropicKey: {
          type: 'string',
          description: 'Optional Anthropic API Key (sk-ant-...) to generate using Claude 3.5 Sonnet.'
        },
        userId: {
          type: 'string',
          description: 'Optional user identifier in Nexus OS.'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'refine_website',
    description: 'Refine, customize, or redesign an existing website project in Nexus OS Website Builder using Claude. Claude can provide the modified html, css, and js directly, or give natural language change instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique ID of the website project to modify.'
        },
        prompt: {
          type: 'string',
          description: 'Specific change instructions.'
        },
        html: {
          type: 'string',
          description: 'Updated HTML5 code authored by Claude.'
        },
        css: {
          type: 'string',
          description: 'Updated modern CSS3 code authored by Claude.'
        },
        js: {
          type: 'string',
          description: 'Updated JavaScript code authored by Claude.'
        },
        anthropicKey: {
          type: 'string',
          description: 'Optional Anthropic API Key (sk-ant-...).'
        }
      },
      required: ['projectId', 'prompt']
    }
  },
  {
    name: 'list_websites',
    description: 'List all website projects stored in the user\'s Nexus OS Website Builder workspace with their project IDs, names, categories, last updated timestamps, and preview URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of projects to return (default: 20).'
        }
      }
    }
  },
  {
    name: 'get_website',
    description: 'Get the full source code (HTML, CSS, JavaScript) and metadata for a specific website project in Nexus OS Website Builder.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique ID of the project to retrieve.'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'update_website_code',
    description: 'Directly update the HTML, CSS, JavaScript, or name of an existing website project in Nexus OS Website Builder. Allows Claude to inject custom code directly into the project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique ID of the website project to update.'
        },
        html: {
          type: 'string',
          description: 'Updated HTML markup for the website.'
        },
        css: {
          type: 'string',
          description: 'Updated CSS styles for the website.'
        },
        js: {
          type: 'string',
          description: 'Updated JavaScript code for the website.'
        },
        name: {
          type: 'string',
          description: 'Updated website title/name.'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'preview_website',
    description: 'Get live preview links and editor URLs for a website project in Nexus OS Website Builder.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique ID of the website project.'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'export_website',
    description: 'Export a website project from Nexus OS Website Builder with full deployable files and direct download link.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The unique ID of the website project to export.'
        }
      },
      required: ['projectId']
    }
  }
];

/**
 * Available MCP Prompt Templates
 */
const PROMPTS = [
  {
    name: 'build_landing_page',
    description: 'Prompt Claude to generate a high-converting landing page inside Nexus OS Website Builder.',
    arguments: [
      { name: 'business_name', description: 'Name of the business or product', required: true },
      { name: 'offer_description', description: 'What the business offers and target audience', required: true },
      { name: 'style', description: 'Preferred design style (e.g. minimalist, dark luxury, vibrant SaaS)', required: false }
    ]
  },
  {
    name: 'redesign_website',
    description: 'Prompt Claude to take an existing website project and transform its design and features.',
    arguments: [
      { name: 'project_id', description: 'Existing Project ID to redesign', required: true },
      { name: 'aesthetic', description: 'New visual style and components to add', required: true }
    ]
  }
];

/**
 * Tool Execution Handlers
 */
async function executeTool(name, args) {
  await ensureDatabase();
  const defaultUser = args.userId || 'usr_claude_mcp';

  switch (name) {
    case 'generate_website': {
      const prompt = args.prompt;
      const category = args.category || 'landing';
      const stylePreferences = args.stylePreferences || 'Modern high-converting design, crisp responsive typography, interactive JS components';

      let generated;

      // 1. If Claude in Claude Desktop / CLI authored the code directly:
      if (args.html && args.html.trim().length > 20) {
        generated = {
          name: args.name || 'Claude Generated Website',
          category: args.category || category,
          tagline: args.tagline || 'Directly synthesized by Anthropic Claude 3.5 Sonnet',
          html: args.html,
          css: args.css || '/* Modern responsive layout */',
          js: args.js || '',
          seo: { metaTitle: args.name || 'Claude Website', metaDescription: args.tagline || '' },
          provider: 'Real Claude 3.5 Sonnet'
        };
      } else {
        // 2. Check if Anthropic API key is available
        const anthropicKey = args.anthropicKey || args.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
          try {
            generated = await generateWebsiteWithClaude({
              prompt,
              category,
              stylePreferences,
              customKey: anthropicKey
            });
          } catch (claudeErr) {
            console.warn('[MCP Server] Claude API call failed, using secondary engine:', claudeErr.message);
            generated = await generateWebsite({ prompt, category, stylePreferences });
          }
        } else {
          // 3. Secondary engine
          generated = await generateWebsite({
            prompt,
            category,
            stylePreferences
          });
        }
      }

      // 2. Persist project into Nexus OS store
      const projectName = args.name || generated.name || 'AI Generated Website';
      const created = await createProject({
        name: projectName,
        category: generated.category || category,
        tagline: generated.tagline || '',
        prompt,
        ownerId: defaultUser,
        userId: defaultUser,
        userEmail: 'claude@nexus-os.com',
        html: generated.html,
        css: generated.css,
        js: generated.js,
        seo: generated.seo,
        provider: generated.provider || 'Real Claude 3.5 Sonnet'
      });

      const editorUrl = `${CLIENT_BASE_URL}/apps/website-builder/editor/${created.id}`;
      const previewUrl = `${API_BASE_URL}/api/preview/${created.id}`;

      return {
        project: created,
        content: [
          {
            type: 'text',
            text: [
              `🎉 **Website Generated Successfully in Nexus OS Website Builder!**`,
              ``,
              `• **Project Name:** ${created.name}`,
              `• **Project ID:** \`${created.id}\``,
              `• **Category:** ${created.category}`,
              `• **Tagline:** *${created.tagline || 'Modern responsive web experience'}*`,
              ``,
              `🔗 **Live Links:**`,
              `• **Interactive Studio Editor:** [Open in Nexus OS Editor](${editorUrl})`,
              `• **Full Standalone Preview:** [Open Live Preview](${previewUrl})`,
              ``,
              `📦 **Code Summary:**`,
              `• HTML: ${created.html ? created.html.length : 0} characters (Semantic HTML5)`,
              `• CSS: ${created.css ? created.css.length : 0} characters (Fluid clamp layout & CSS variables)`,
              `• JS: ${created.js ? created.js.length : 0} characters (Native interactive widgets & handlers)`,
              ``,
              `The website has been saved directly to your Nexus OS dashboard. You can ask Claude to refine it anytime using the project ID \`${created.id}\`.`
            ].join('\n')
          }
        ]
      };
    }

    case 'refine_website': {
      const { projectId, prompt } = args;
      const existing = await getProjectById(projectId, defaultUser);
      if (!existing) {
        throw new Error(`Website project with ID "${projectId}" was not found in Nexus OS store.`);
      }

      let refined;
      if (args.html && args.html.trim().length > 20) {
        refined = {
          html: args.html,
          css: args.css || existing.css,
          js: args.js || existing.js,
          changeSummary: 'Applied refinements directly via Claude 3.5 Sonnet'
        };
      } else {
        const anthropicKey = args.anthropicKey || args.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        const currentCode = {
          html: existing.html,
          css: existing.css,
          js: existing.js
        };

        if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
          try {
            refined = await refineWebsiteWithClaude({
              currentCode,
              prompt,
              customKey: anthropicKey
            });
          } catch (claudeErr) {
            console.warn('[MCP Server] Claude refinement failed, using secondary engine:', claudeErr.message);
            refined = await refineWebsite({ currentCode, prompt });
          }
        } else {
          refined = await refineWebsite({
            currentCode,
            prompt
          });
        }
      }

      const updated = await updateProject(projectId, {
        html: refined.html,
        css: refined.css,
        js: refined.js,
        prompt: prompt,
        changeSummary: refined.changeSummary || 'Refined via Claude MCP'
      }, defaultUser);

      const editorUrl = `${CLIENT_BASE_URL}/apps/website-builder/editor/${projectId}`;
      const previewUrl = `${API_BASE_URL}/api/preview/${projectId}`;

      return {
        project: updated || existing,
        content: [
          {
            type: 'text',
            text: [
              `✨ **Website Updated Successfully in Nexus OS Website Builder!**`,
              ``,
              `• **Project Name:** ${updated.name}`,
              `• **Project ID:** \`${projectId}\``,
              `• **Change Summary:** ${refined.changeSummary || 'Applied requested styling and component refinements.'}`,
              ``,
              `🔗 **Updated Links:**`,
              `• **Studio Editor:** [Open in Nexus OS Editor](${editorUrl})`,
              `• **Live Preview:** [Open Live Preview](${previewUrl})`
            ].join('\n')
          }
        ]
      };
    }

    case 'list_websites': {
      const limit = args.limit || 20;
      let projects = await getAllProjects('all');
      if (!projects || projects.length === 0) {
        projects = await getAllProjects(defaultUser);
      }

      if (!projects || projects.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No website projects found in your Nexus OS Website Builder. You can ask Claude to build one now by saying: *"Build a modern landing page for my business"*\!'
            }
          ]
        };
      }

      const list = projects.slice(0, limit).map((p, idx) => {
        const editorUrl = `${CLIENT_BASE_URL}/apps/website-builder/editor/${p.id}`;
        return `${idx + 1}. **${p.name}** (\`${p.id}\`)\n   - Category: \`${p.category}\`\n   - Tagline: ${p.tagline || 'Custom Web Application'}\n   - Editor: ${editorUrl}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `📁 **Nexus OS Website Builder Projects (${projects.length} Total):**\n\n${list}`
          }
        ]
      };
    }

    case 'get_website': {
      const { projectId } = args;
      const project = await getProjectById(projectId, defaultUser);
      if (!project) {
        throw new Error(`Project "${projectId}" not found.`);
      }

      return {
        project: project,
        content: [
          {
            type: 'text',
            text: [
              `### ${project.name} (\`${project.id}\`)`,
              `**Category:** ${project.category} | **Tagline:** ${project.tagline || ''}`,
              ``,
              `#### --- HTML ---`,
              `\`\`\`html`,
              project.html || '',
              `\`\`\``,
              ``,
              `#### --- CSS ---`,
              `\`\`\`css`,
              project.css || '',
              `\`\`\``,
              ``,
              `#### --- JavaScript ---`,
              `\`\`\`javascript`,
              project.js || '',
              `\`\`\``
            ].join('\n')
          }
        ]
      };
    }

    case 'update_website_code': {
      const { projectId, html, css, js, name } = args;
      const patch = {};
      if (typeof html === 'string') patch.html = html;
      if (typeof css === 'string') patch.css = css;
      if (typeof js === 'string') patch.js = js;
      if (typeof name === 'string' && name.trim()) patch.name = name.trim();

      const updated = await updateProject(projectId, patch, defaultUser);
      if (!updated) {
        throw new Error(`Project "${projectId}" not found or unauthorized to update.`);
      }

      const editorUrl = `${CLIENT_BASE_URL}/apps/website-builder/editor/${projectId}`;
      const previewUrl = `${API_BASE_URL}/api/preview/${projectId}`;

      return {
        content: [
          {
            type: 'text',
            text: `✅ **Direct Code Update Applied to "${updated.name}" (\`${projectId}\`)**\n\n• [Open in Editor](${editorUrl})\n• [View Live Preview](${previewUrl})`
          }
        ]
      };
    }

    case 'preview_website': {
      const { projectId } = args;
      const editorUrl = `${CLIENT_BASE_URL}/apps/website-builder/editor/${projectId}`;
      const previewUrl = `${API_BASE_URL}/api/preview/${projectId}`;
      return {
        content: [
          {
            type: 'text',
            text: `🌐 **Live Preview Links for Project \`${projectId}\`:**\n\n• **Studio Editor:** ${editorUrl}\n• **Standalone Preview:** ${previewUrl}`
          }
        ]
      };
    }

    case 'export_website': {
      const { projectId } = args;
      const exportUrl = `${API_BASE_URL}/api/projects/${projectId}/export`;
      return {
        content: [
          {
            type: 'text',
            text: `📦 **Production Website Export for Project \`${projectId}\`:**\n\n• **Download ZIP Package:** [Click here to download](${exportUrl})\n• Package includes \`index.html\`, \`styles.css\`, \`script.js\`, and \`README.md\` ready to deploy directly to Netlify, Vercel, or GitHub Pages.`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Handle incoming MCP JSON-RPC Request
 */
async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false }
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        }
      };
    }

    case 'notifications/initialized': {
      return null; // Notifications do not have responses
    }

    case 'ping': {
      return {
        jsonrpc: '2.0',
        id,
        result: {}
      };
    }

    case 'tools/list': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS
        }
      };
    }

    case 'tools/call': {
      const { name, arguments: toolArgs = {} } = params || {};
      try {
        const result = await executeTool(name, toolArgs);
        return {
          jsonrpc: '2.0',
          id,
          result
        };
      } catch (toolError) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `❌ **Error in tool "${name}":** ${toolError.message}`
              }
            ],
            isError: true
          }
        };
      }
    }

    case 'resources/list': {
      await ensureDatabase();
      let projects = await getAllProjects('all');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: (projects || []).map(p => ({
            uri: `website://projects/${p.id}`,
            name: p.name,
            mimeType: 'text/html',
            description: `${p.category} website: ${p.tagline || p.name}`
          }))
        }
      };
    }

    case 'resources/read': {
      const uri = params?.uri || '';
      const match = uri.match(/^website:\/\/projects\/([a-zA-Z0-9_-]+)$/);
      if (!match) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Invalid resource URI: ${uri}` }
        };
      }
      const projectId = match[1];
      await ensureDatabase();
      const project = await getProjectById(projectId, 'usr_claude_mcp');
      if (!project) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Project ${projectId} not found` }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/html',
              text: project.html || ''
            }
          ]
        }
      };
    }

    case 'prompts/list': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: PROMPTS
        }
      };
    }

    case 'prompts/get': {
      const promptName = params?.name;
      if (promptName === 'build_landing_page') {
        const { business_name = 'My Business', offer_description = 'Professional services', style = 'Modern clean' } = params.arguments || {};
        return {
          jsonrpc: '2.0',
          id,
          result: {
            description: 'Generate high-converting landing page in Nexus OS',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please use the "generate_website" tool to build a modern landing page for "${business_name}". It should feature: ${offer_description}. Style aesthetic: ${style}. Store it in Nexus OS Website Builder and give me the preview link.`
                }
              }
            ]
          }
        };
      }
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Prompt template not found: ${promptName}` }
      };
    }

    default: {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method "${method}" not found`
        }
      };
    }
  }
}

/**
 * Main stdio JSON-RPC loop (Native Claude Desktop / Claude Code transport)
 */
function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed);
      const response = await handleRequest(request);
      if (response !== null) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (parseError) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${parseError.message}`
        }
      }) + '\n');
    }
  });

  // Diagnostic stderr note (Claude Desktop ignores stderr so this is clean)
  process.stderr.write(`[Nexus OS MCP Server] Running on stdio. Protocol: ${PROTOCOL_VERSION}\n`);
}

// Export executeTool and handleRequest for HTTP server embedding
module.exports = {
  TOOLS,
  PROMPTS,
  executeTool,
  handleRequest
};

// If invoked directly from terminal / Claude Desktop command
if (require.main === module) {
  startStdioServer();
}

