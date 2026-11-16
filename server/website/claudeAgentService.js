// server/website/claudeAgentService.js - Real Anthropic Claude Coding Agent
const { Anthropic } = require('@anthropic-ai/sdk');
const vm = require('vm');
const path = require('path');
const { updateProject, getProjectById } = require('./projectsStorage');

/**
 * Model Pricing Rates (per million tokens in USD)
 */
const MODEL_PRICING = {
  'claude-3-7-sonnet-20250219': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-latest': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
};

function calculateCostUSD(model, promptTokens, completionTokens) {
  const rates = MODEL_PRICING[model] || MODEL_PRICING['claude-3-5-sonnet-20241022'];
  const inputCost = (promptTokens / 1_000_000) * rates.input;
  const outputCost = (completionTokens / 1_000_000) * rates.output;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Sanitize and validate file path to prevent directory traversal
 */
function sanitizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;
  let normalized = rawPath.trim().replace(/\\/g, '/');
  // Strip leading slashes and drive letters
  normalized = normalized.replace(/^[a-zA-Z]:[\\/]/, '').replace(/^\/+/, '');
  // Disallow dot-dot traversal
  const segments = normalized.split('/').filter(Boolean);
  if (segments.some(seg => seg === '..' || seg === '.')) {
    return null;
  }
  return segments.join('/');
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.js':
      return 'javascript';
    case '.json':
      return 'json';
    case '.svg':
      return 'svg';
    case '.md':
      return 'markdown';
    default:
      return 'text';
  }
}

/**
 * Agent Tool Specifications for Anthropic Claude
 */
const AGENT_TOOLS = [
  {
    name: 'create_file',
    description: 'Create a new project file (e.g. index.html, styles.css, script.js, about.html, components/header.html, data.json) with complete source code.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative file path (e.g. "index.html", "styles.css", "script.js")'
        },
        content: {
          type: 'string',
          description: 'Complete source code content for the file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of an existing project file before modifying it, ensuring full contextual understanding.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to inspect'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'update_file',
    description: 'Update or modify an existing file with targeted changes or updated source code while preserving working sections.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to update'
        },
        content: {
          type: 'string',
          description: 'Updated source code content for the entire file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete an obsolete or unused file from the project workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to delete'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_project_files',
    description: 'List all files currently in the project workspace with their path, byte size, and language.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'run_build',
    description: 'Run comprehensive syntax verification and build diagnostics across all HTML, CSS, and JS files in the project workspace.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_build_errors',
    description: 'Retrieve any pending syntax errors, broken tag mismatches, or script execution issues in the project.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'fix_build_errors',
    description: 'Automatically attempt to resolve known syntax errors or missing tags in project files.',
    input_schema: {
      type: 'object',
      properties: {
        targetFile: {
          type: 'string',
          description: 'Optional path of file to auto-fix'
        }
      }
    }
  },
  {
    name: 'preview_website',
    description: 'Signal that project files are updated and trigger live website preview reload in the user workspace.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Brief, clear summary of what was generated, modified, or fixed'
        }
      }
    }
  }
];

const SYSTEM_PROMPT = `You are an elite AI Full-Stack Coding Agent inside the PulseStudio AI Website Builder, powered by the Anthropic Claude API.
You act like an expert autonomous software engineer (similar to Cursor or Bolt.new).
Your role is to understand user requirements, plan architecture, and write production-quality frontend code by directly creating and updating files in the project workspace.

AVAILABLE TOOLS:
- create_file: Create a new file (e.g. index.html, styles.css, script.js)
- read_file: Read file content before editing to preserve existing code
- update_file: Modify existing file content with targeted improvements
- delete_file: Remove unwanted files
- list_project_files: View all workspace files
- run_build: Run syntax validation on HTML, CSS, and JS
- get_build_errors: Check for any syntax errors
- fix_build_errors: Fix syntax errors
- preview_website: Trigger live preview update

CORE RULES:
1. Always build full, production-ready, beautiful websites with modern aesthetic design.
2. For initial generation:
   - Create 'index.html' with semantic HTML5, responsive meta tag, modern typography fonts (Inter, Plus Jakarta Sans), FontAwesome / Lucide icons CDN, high-res Unsplash photos (https://images.unsplash.com/...), complete hero section, features grid, interactive sections, testimonials, and footer.
   - Create 'styles.css' with CSS custom properties (variables), fluid typography (clamp), responsive flexbox and CSS grid layouts, smooth transitions, mobile media queries, and polished light/dark theme styling.
   - Create 'script.js' with interactive capabilities (mobile navigation toggles, smooth scroll, tabs, modal dialogs, interactive calculators or forms).
   - Link 'styles.css' using <link rel="stylesheet" href="styles.css"> and 'script.js' using <script src="script.js" defer></script> in 'index.html'.
   - Call run_build to verify code syntax.
   - Call preview_website to display the live site.
3. For conversational editing (multi-turn prompts like "Change primary color to blue", "Add WhatsApp button", "Add patient testimonials"):
   - Read the relevant existing files first or examine their structure.
   - Make targeted, surgical updates using update_file without destroying existing functionality or sections.
   - Preserve existing styling and components unless explicitly asked to redesign.
   - Call preview_website once updates are complete.
4. Never generate placeholder comments like "// rest of code here" or "...code continues...". Always provide complete, working code.
5. Provide a concise, professional explanation of your changes in your final response.`;

/**
 * Validate syntax across project files
 */
function validateProjectWorkspace(filesMap) {
  const errors = [];

  for (const [filePath, fileObj] of filesMap.entries()) {
    const content = fileObj.content || '';
    const lang = fileObj.language || detectLanguage(filePath);

    if (lang === 'html') {
      if (!content.includes('<!DOCTYPE') && !content.includes('<html')) {
        errors.push({
          file: filePath,
          line: 1,
          message: 'Missing standard HTML5 <!DOCTYPE html> declaration or <html> root tag',
          severity: 'warning'
        });
      }
      // Check for unclosed head or body tags
      if (content.includes('<head>') && !content.includes('</head>')) {
        errors.push({
          file: filePath,
          line: 1,
          message: 'Unclosed <head> tag detected in HTML structure',
          severity: 'error'
        });
      }
      if (content.includes('<body>') && !content.includes('</body>')) {
        errors.push({
          file: filePath,
          line: 1,
          message: 'Unclosed <body> tag detected in HTML structure',
          severity: 'error'
        });
      }
    } else if (lang === 'css') {
      // Check balanced braces
      let openBraces = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') openBraces++;
        if (content[i] === '}') openBraces--;
      }
      if (openBraces !== 0) {
        errors.push({
          file: filePath,
          line: 1,
          message: `CSS brace mismatch: ${Math.abs(openBraces)} unclosed or extra curly brace(s)`,
          severity: 'error'
        });
      }
    } else if (lang === 'javascript') {
      // Check JavaScript syntax via Node vm.Script compilation
      try {
        new vm.Script(content);
      } catch (jsErr) {
        errors.push({
          file: filePath,
          line: jsErr.lineNumber || 1,
          message: `JavaScript Syntax Error: ${jsErr.message}`,
          severity: 'error'
        });
      }
    }
  }

  return errors;
}

/**
 * Main Claude Agent Execution Engine with SSE Streaming
 */
async function runClaudeAgentStream({
  projectId,
  userId,
  userPrompt,
  model = 'claude-3-5-sonnet-20241022',
  customApiKey = null,
  res
}) {
  // 1. Resolve Anthropic API Key
  const activeKey = customApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!activeKey || typeof activeKey !== 'string' || !activeKey.trim()) {
    throw new Error('Anthropic API Key is required. Please set ANTHROPIC_API_KEY in server/.env or configure in Settings.');
  }

  const anthropic = new Anthropic({
    apiKey: activeKey.trim()
  });

  // 2. Fetch Project Context
  const project = await getProjectById(projectId, userId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found or access denied.`);
  }

  // 3. Initialize Workspace Files Map
  const filesMap = new Map();
  if (Array.isArray(project.files) && project.files.length > 0) {
    project.files.forEach(f => {
      const sanitized = sanitizePath(f.path);
      if (sanitized) {
        filesMap.set(sanitized, {
          path: sanitized,
          content: f.content || '',
          language: f.language || detectLanguage(sanitized),
          updatedAt: f.updatedAt || new Date()
        });
      }
    });
  }

  // If filesMap is still empty, populate from legacy html, css, js
  if (filesMap.size === 0) {
    if (project.html) {
      filesMap.set('index.html', {
        path: 'index.html',
        content: project.html,
        language: 'html',
        updatedAt: new Date()
      });
    }
    if (project.css) {
      filesMap.set('styles.css', {
        path: 'styles.css',
        content: project.css,
        language: 'css',
        updatedAt: new Date()
      });
    }
    if (project.js) {
      filesMap.set('script.js', {
        path: 'script.js',
        content: project.js,
        language: 'javascript',
        updatedAt: new Date()
      });
    }
  }

  const filesModified = new Set();
  let cumulativePromptTokens = 0;
  let cumulativeCompletionTokens = 0;
  let buildErrors = [];

  // Helper to send SSE event
  const sendSSE = (eventType, data) => {
    try {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch (_e) {}
  };

  sendSSE('start', {
    projectId,
    model,
    prompt: userPrompt,
    timestamp: new Date().toISOString()
  });

  // 4. Prepare Conversation History
  // Convert existing project.conversation into Anthropic messages format
  const messages = [];

  // Provide initial workspace manifest if files exist
  const existingFilesList = Array.from(filesMap.keys());
  let workspaceContextPrompt = '';
  if (existingFilesList.length > 0) {
    workspaceContextPrompt = `Current project files: ${existingFilesList.join(', ')}.\n\n`;
  }

  if (Array.isArray(project.conversation) && project.conversation.length > 0) {
    // Take recent messages up to 10 turns to avoid token overflow
    const recentConvo = project.conversation.slice(-10);
    for (const msg of recentConvo) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content || '' });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content || '' });
      }
    }
  }

  // Append new user prompt
  messages.push({
    role: 'user',
    content: `${workspaceContextPrompt}User instruction:\n${userPrompt}`
  });

  // 5. Agent Tool Execution Function
  const executeTool = async (name, input) => {
    switch (name) {
      case 'create_file': {
        const filePath = sanitizePath(input.path);
        if (!filePath) {
          return { error: 'Invalid or forbidden file path. Must be a relative path.' };
        }
        const content = input.content || '';
        const language = detectLanguage(filePath);
        filesMap.set(filePath, {
          path: filePath,
          content,
          language,
          updatedAt: new Date()
        });
        filesModified.add(filePath);
        sendSSE('file_changed', {
          action: 'create',
          path: filePath,
          language,
          size: Buffer.byteLength(content, 'utf8')
        });
        return {
          success: true,
          path: filePath,
          size: Buffer.byteLength(content, 'utf8'),
          message: `Successfully created ${filePath}`
        };
      }

      case 'read_file': {
        const filePath = sanitizePath(input.path);
        if (!filePath) return { error: 'Invalid file path' };
        const file = filesMap.get(filePath);
        if (!file) {
          return { error: `File '${filePath}' not found in project workspace.` };
        }
        return {
          path: filePath,
          language: file.language,
          content: file.content
        };
      }

      case 'update_file': {
        const filePath = sanitizePath(input.path);
        if (!filePath) return { error: 'Invalid file path' };
        const content = input.content || '';
        const language = detectLanguage(filePath);
        filesMap.set(filePath, {
          path: filePath,
          content,
          language,
          updatedAt: new Date()
        });
        filesModified.add(filePath);
        sendSSE('file_changed', {
          action: 'update',
          path: filePath,
          language,
          size: Buffer.byteLength(content, 'utf8')
        });
        return {
          success: true,
          path: filePath,
          size: Buffer.byteLength(content, 'utf8'),
          message: `Successfully updated ${filePath}`
        };
      }

      case 'delete_file': {
        const filePath = sanitizePath(input.path);
        if (!filePath) return { error: 'Invalid file path' };
        const deleted = filesMap.delete(filePath);
        if (deleted) {
          filesModified.add(filePath);
          sendSSE('file_changed', {
            action: 'delete',
            path: filePath
          });
          return { success: true, message: `Deleted ${filePath}` };
        }
        return { error: `File ${filePath} not found` };
      }

      case 'list_project_files': {
        const list = Array.from(filesMap.values()).map(f => ({
          path: f.path,
          language: f.language,
          bytes: Buffer.byteLength(f.content || '', 'utf8')
        }));
        return { files: list, total: list.length };
      }

      case 'run_build': {
        buildErrors = validateProjectWorkspace(filesMap);
        const status = buildErrors.length === 0 ? 'clean' : 'has_errors';
        sendSSE('build_status', {
          status,
          errors: buildErrors,
          totalFiles: filesMap.size
        });
        return {
          status,
          errorCount: buildErrors.length,
          errors: buildErrors,
          message: buildErrors.length === 0 ? 'Build passed with 0 errors' : `Build found ${buildErrors.length} errors`
        };
      }

      case 'get_build_errors': {
        return { errors: buildErrors, count: buildErrors.length };
      }

      case 'fix_build_errors': {
        const target = input.targetFile ? sanitizePath(input.targetFile) : null;
        let fixedCount = 0;
        for (const [fPath, fObj] of filesMap.entries()) {
          if (target && fPath !== target) continue;
          let content = fObj.content || '';
          if (fObj.language === 'html') {
            if (!content.includes('<!DOCTYPE html>')) {
              content = `<!DOCTYPE html>\n${content}`;
              fixedCount++;
            }
            if (content.includes('<head>') && !content.includes('</head>')) {
              content = content.replace('<body>', '</head>\n<body>');
              fixedCount++;
            }
            if (!content.includes('</body>')) {
              content = `${content}\n</body></html>`;
              fixedCount++;
            }
            filesMap.set(fPath, { ...fObj, content, updatedAt: new Date() });
          }
        }
        buildErrors = validateProjectWorkspace(filesMap);
        return {
          fixedCount,
          remainingErrors: buildErrors.length,
          message: `Applied ${fixedCount} structural fixes.`
        };
      }

      case 'preview_website': {
        sendSSE('preview_ready', {
          summary: input.summary || 'Preview updated with latest project files',
          timestamp: Date.now()
        });
        return {
          success: true,
          message: 'Live preview refresh triggered.'
        };
      }

      default:
        return { error: `Unknown tool '${name}'` };
    }
  };

  // 6. Multi-Turn Autonomous Tool Loop
  const MAX_TURNS = 10;
  let currentTurn = 0;
  let finalAssistantText = '';

  while (currentTurn < MAX_TURNS) {
    currentTurn++;

    // Call Anthropic Messages API
    let response;
    try {
      response = await anthropic.messages.create({
        model: model,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: messages,
        tools: AGENT_TOOLS
      });
    } catch (apiErr) {
      console.error(`[ClaudeAgent] Anthropic API Error (Turn ${currentTurn}):`, apiErr);
      sendSSE('error', {
        message: apiErr.message || 'Anthropic Claude API communication failed.'
      });
      throw apiErr;
    }

    if (response.usage) {
      cumulativePromptTokens += response.usage.input_tokens || 0;
      cumulativeCompletionTokens += response.usage.output_tokens || 0;
      sendSSE('stats', {
        promptTokens: cumulativePromptTokens,
        completionTokens: cumulativeCompletionTokens,
        totalTokens: cumulativePromptTokens + cumulativeCompletionTokens,
        estimatedCostUSD: calculateCostUSD(model, cumulativePromptTokens, cumulativeCompletionTokens)
      });
    }

    // Process Content Blocks (Text and Tool Uses)
    const contentBlocks = response.content || [];
    const toolCallsToExecute = [];
    let turnText = '';

    for (const block of contentBlocks) {
      if (block.type === 'text') {
        turnText += block.text;
        sendSSE('token', { text: block.text });
      } else if (block.type === 'tool_use') {
        toolCallsToExecute.push(block);
      }
    }

    if (turnText) {
      finalAssistantText += (finalAssistantText ? '\n' : '') + turnText;
    }

    // If Claude did not invoke any tools, turn is done
    if (toolCallsToExecute.length === 0 || response.stop_reason === 'end_turn') {
      break;
    }

    // Execute Tools and build tool_result blocks
    messages.push({
      role: 'assistant',
      content: contentBlocks
    });

    const toolResultBlocks = [];
    for (const toolUse of toolCallsToExecute) {
      sendSSE('tool_call', {
        id: toolUse.id,
        tool: toolUse.name,
        input: toolUse.input
      });

      let output;
      try {
        output = await executeTool(toolUse.name, toolUse.input || {});
      } catch (toolExecErr) {
        output = { error: toolExecErr.message };
      }

      sendSSE('tool_result', {
        id: toolUse.id,
        tool: toolUse.name,
        output
      });

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(output)
      });
    }

    messages.push({
      role: 'user',
      content: toolResultBlocks
    });
  }

  // 7. Persist Updated Project Files and Conversation into MongoDB
  const updatedFilesArray = Array.from(filesMap.values());
  const htmlFile = filesMap.get('index.html') || Array.from(filesMap.values()).find(f => f.language === 'html');
  const cssFile = filesMap.get('styles.css') || Array.from(filesMap.values()).find(f => f.language === 'css');
  const jsFile = filesMap.get('script.js') || Array.from(filesMap.values()).find(f => f.language === 'javascript');

  const newConversationItem = {
    id: require('crypto').randomUUID(),
    role: 'assistant',
    content: finalAssistantText || 'Website updated successfully.',
    tokens: {
      inputTokens: cumulativePromptTokens,
      outputTokens: cumulativeCompletionTokens
    },
    filesModified: Array.from(filesModified),
    timestamp: new Date()
  };

  const userConversationItem = {
    id: require('crypto').randomUUID(),
    role: 'user',
    content: userPrompt,
    timestamp: new Date()
  };

  const existingConvo = Array.isArray(project.conversation) ? project.conversation : [];
  const updatedConversation = [...existingConvo, userConversationItem, newConversationItem];

  const totalCost = calculateCostUSD(model, cumulativePromptTokens, cumulativeCompletionTokens);
  const prevTokens = project.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUSD: 0 };

  const updatedTokenUsage = {
    promptTokens: (prevTokens.promptTokens || 0) + cumulativePromptTokens,
    completionTokens: (prevTokens.completionTokens || 0) + cumulativeCompletionTokens,
    totalTokens: (prevTokens.totalTokens || 0) + cumulativePromptTokens + cumulativeCompletionTokens,
    estimatedCostUSD: Number(((prevTokens.estimatedCostUSD || 0) + totalCost).toFixed(6))
  };

  const updatedProject = await updateProject(
    projectId,
    {
      files: updatedFilesArray,
      html: htmlFile?.content || project.html,
      css: cssFile?.content || project.css,
      js: jsFile?.content || project.js,
      conversation: updatedConversation,
      model,
      tokenUsage: updatedTokenUsage,
      buildErrors,
      prompt: userPrompt,
      changeSummary: `Claude Agent updated: ${Array.from(filesModified).join(', ') || 'workspace'}`
    },
    userId
  );

  sendSSE('done', {
    projectId,
    message: finalAssistantText,
    filesModified: Array.from(filesModified),
    totalFiles: updatedFilesArray.length,
    tokenUsage: updatedTokenUsage,
    project: updatedProject
  });
}

module.exports = {
  runClaudeAgentStream,
  AGENT_TOOLS,
  SYSTEM_PROMPT,
  validateProjectWorkspace,
  calculateCostUSD
};
