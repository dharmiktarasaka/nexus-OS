// server/website/claudeService.js - Real Anthropic Claude Integration
const { SYSTEM_GENERATION_PROMPT, SYSTEM_REFINEMENT_PROMPT } = require('./prompts');

/**
 * Strips code fences and parses JSON safely from Claude's response
 */
function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.includes('```json')) {
    const match = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) cleaned = match[1];
  } else if (cleaned.includes('```')) {
    const match = cleaned.match(/```\s*([\s\S]*?)\s*```/);
    if (match) cleaned = match[1];
  }

  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Call official Anthropic Messages API
 */
async function callClaude(activeKey, systemInstruction, userPrompt, model = 'claude-3-5-sonnet-20241022', timeoutMs = 70000) {
  if (!activeKey || typeof activeKey !== 'string' || !activeKey.startsWith('sk-ant-')) {
    throw new Error('Valid Anthropic API key starting with "sk-ant-" is required');
  }

  const models = [
    model,
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];

  // Remove duplicates while preserving order
  const uniqueModels = [...new Set(models)];
  let lastError = null;

  for (const currentModel of uniqueModels) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': activeKey.trim(),
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model: currentModel,
          max_tokens: 8192,
          system: systemInstruction,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`[ClaudeService] Model ${currentModel} returned ${response.status}: ${errBody.slice(0, 120)}`);
        lastError = new Error(`Claude API ${response.status}: ${errBody}`);
        if (response.status === 401) {
          throw new Error('Invalid Anthropic API Key (401 Unauthorized)');
        }
        continue; // Try next model
      }

      const data = await response.json();
      const textOutput = data?.content?.[0]?.text;
      if (!textOutput) {
        throw new Error('Empty response content received from Claude');
      }

      const parsed = cleanAndParseJSON(textOutput);
      return {
        ...parsed,
        _modelUsed: currentModel
      };
    } catch (err) {
      lastError = err;
      if (err.message.includes('401')) throw err;
    }
  }

  throw lastError || new Error('Failed to generate response from Anthropic Claude');
}

/**
 * Generate complete website with real Anthropic Claude
 */
async function generateWebsiteWithClaude({ prompt, category = 'general', stylePreferences = '', customKey = null }) {
  const activeKey = customKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';

  const userInstruction = `
USER WEBSITE PROMPT:
${prompt}

PREFERRED CATEGORY:
${category}

STYLE & BRAND SPECIFICATIONS:
${stylePreferences || 'High-end aesthetic, responsive typography, modern CSS variables, interactive widgets.'}

Synthesize a complete, production-grade website with full multi-page architecture, high-res Unsplash photography, and interactive JS tools. Respond strictly in the required JSON format.
`;

  const site = await callClaude(activeKey, SYSTEM_GENERATION_PROMPT, userInstruction, 'claude-3-5-sonnet-20241022', 80000);
  return {
    name: site.name || 'Claude Generated Studio',
    category: site.category || category,
    tagline: site.tagline || 'Engineered with Anthropic Claude 3.5 Sonnet',
    html: site.html,
    css: site.css,
    js: site.js,
    seo: site.seo,
    provider: `Real Claude (${site._modelUsed || 'Claude 3.5 Sonnet'})`
  };
}

/**
 * Refine website with real Anthropic Claude
 */
async function refineWebsiteWithClaude({ currentCode, prompt, customKey = null }) {
  const activeKey = customKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';

  const userInstruction = `
EXISTING WEBSITE CODE:
--- HTML ---
${currentCode.html || ''}

--- CSS ---
${currentCode.css || ''}

--- JAVASCRIPT ---
${currentCode.js || ''}

USER MODIFICATION REQUEST:
${prompt}

Apply the requested refinements while maintaining code cleanliness and responsiveness. Respond strictly in the required JSON format.
`;

  const refined = await callClaude(activeKey, SYSTEM_REFINEMENT_PROMPT, userInstruction, 'claude-3-5-sonnet-20241022', 80000);
  return {
    name: refined.name,
    category: refined.category,
    tagline: refined.tagline,
    html: refined.html,
    css: refined.css,
    js: refined.js,
    seo: refined.seo,
    changeSummary: refined.changeSummary || 'Refined using Anthropic Claude 3.5 Sonnet',
    provider: `Real Claude (${refined._modelUsed || 'Claude 3.5 Sonnet'})`
  };
}

module.exports = {
  callClaude,
  generateWebsiteWithClaude,
  refineWebsiteWithClaude
};

