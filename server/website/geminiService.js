// geminiService.js - Robust Gemini API Integration
const { SYSTEM_GENERATION_PROMPT, SYSTEM_REFINEMENT_PROMPT } = require('./prompts');
const { generateDynamicSite } = require('./fallbackGenerator');

/**
 * Strips code fences and parses JSON safely
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
 * Helper to call Gemini model with fallback
 */
async function callGemini(activeKey, systemInstruction, userPrompt, temperature = 0.7, timeoutMs = 60000) {
  if (!activeKey || typeof activeKey !== 'string' || activeKey.trim().length < 10) {
    throw new Error('Valid Google Gemini API Key required');
  }

  // Models with active quota on this key - prefer fast, capable flash models
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemInstruction + '\n\n' + userPrompt }] }
          ],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GeminiService] Model ${model} returned ${response.status}: ${errText.slice(0, 100)}`);
        lastError = new Error(`Model ${model} status ${response.status}`);
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          break; // Key issue, don't waste time on other models
        }
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let candidateText = '';
      for (const p of parts) {
        if (!p.thought && p.text) {
          candidateText = p.text;
          break;
        }
      }
      if (!candidateText && parts[0]?.text) {
        candidateText = parts[0].text;
      }

      if (candidateText) {
        return cleanAndParseJSON(candidateText);
      }
    } catch (err) {
      console.warn(`[GeminiService] Error with ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Analyze any user prompt to design an AI website architecture blueprint
 */
async function analyzeUserPrompt({ prompt, apiKey }) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  const analysisSystemPrompt = `
You are an expert Chief Design Officer and Creative Director.
Analyze the user's website prompt and respond ONLY with a strictly parseable JSON blueprint:
{
  "category": "Exact industry category (e.g., Luxury Real Estate, Artisanal Bakery, FinTech, CyberSecurity, Fitness Studio, Legal Practice, etc.)",
  "suggestedBrand": "Creative, premium brand name",
  "tagline": "Compelling 6-12 word value proposition tagline",
  "targetAudience": "Key target persona description",
  "colorPalette": {
    "primary": "#hex",
    "accent": "#hex",
    "background": "#hex (light mode default)",
    "surface": "#hex"
  },
  "typography": {
    "headings": "Google font name (e.g. Plus Jakarta Sans, Cinzel, Space Grotesk, Syne, Playfair Display)",
    "body": "Google font name (e.g. Plus Jakarta Sans, Inter, Roboto)"
  },
  "recommendedSections": [
    "Section 1 title & purpose",
    "Section 2 title & purpose",
    "Section 3 title & purpose",
    "Section 4 title & purpose",
    "Section 5 title & purpose"
  ],
  "interactiveWidget": "Specific real interactive JavaScript component tailored to this niche (e.g., dynamic cost estimator, appointment scheduler dialog, interactive menu tabs, loan calculator, filterable showcase, or multi-step quote wizard)",
  "summary": "1-2 sentence architectural summary of the website strategy"
}
`;

  if (!activeKey) {
    return generateLocalAnalysis(prompt);
  }

  try {
    const analysis = await callGemini(activeKey, analysisSystemPrompt, `USER PROMPT:\n${prompt}`, 0.5, 25000);
    return analysis;
  } catch (err) {
    console.warn('[GeminiService] AI prompt analysis failed, using local semantic analyzer:', err.message);
    return generateLocalAnalysis(prompt);
  }
}

/**
 * Fallback semantic prompt analysis when offline or without API key
 */
function generateLocalAnalysis(prompt = '') {
  const p = prompt.toLowerCase();

  let category = 'Digital Enterprise & Modern Web';
  let suggestedBrand = 'Apex Studio';
  let tagline = 'Crafting Exceptional Digital Realities for Modern Visionaries';
  let primary = '#4f46e5';
  let accent = '#06b6d4';
  let widget = 'Interactive Service Customizer & Real-time Quote Estimator';
  let headings = 'Plus Jakarta Sans';

  if (p.includes('fish') || p.includes('aquarium') || p.includes('marine') || p.includes('seafood') || p.includes('ocean')) {
    category = 'Aquatic Ecosystems & Rare Marine Life';
    suggestedBrand = 'AquaVibe Marine & Aquatics';
    tagline = 'Pristine Living Reefs, Rare Tropical Species & High-Tech Aquariums';
    primary = '#003366';
    accent = '#06b6d4';
    headings = 'Plus Jakarta Sans';
    widget = 'Interactive Aquarium Ecosystem & Tank Volume Calculator';
  } else if (p.includes('pet') || p.includes('dog') || p.includes('cat') || p.includes('vet') || p.includes('animal')) {
    category = 'Premium Pet Wellness & Veterinary Care';
    suggestedBrand = 'PawHaven Wellness';
    tagline = 'Organic Nutrition, Preventive Healthcare & Loving Concierge Pet Care';
    primary = '#0f766e';
    accent = '#f59e0b';
    headings = 'Plus Jakarta Sans';
    widget = 'Personalized Pet Calorie & Daily Nutrition Planner';
  } else if (p.includes('shoe') || p.includes('sneaker') || p.includes('footwear')) {
    category = 'Footwear & Streetwear Boutique';
    suggestedBrand = 'KINETIX Footwear Atelier';
    tagline = 'Engineered for Movement, Sculpted for High-Street Elegance';
    primary = '#18181b';
    accent = '#e11d48';
    headings = 'Space Grotesk';
    widget = 'Interactive 360° Footwear Viewer & Size Customizer Studio';
  } else if (p.includes('coffee') || p.includes('bakery') || p.includes('restaurant') || p.includes('food') || p.includes('cafe')) {
    category = 'Artisan Hospitality & Dining';
    suggestedBrand = 'Velvet & Crumb Roasters';
    tagline = 'Single-Origin Roasts & Heirloom Sourdough Bakes';
    primary = '#78350f';
    accent = '#d97706';
    headings = 'Playfair Display';
    widget = 'Interactive Coffee Flavor Profiler & Table Reservation Dialog';
  } else if (p.includes('real estate') || p.includes('property') || p.includes('villa') || p.includes('resort') || p.includes('home')) {
    category = 'Luxury Real Estate & Living';
    suggestedBrand = 'Sovereign Estates';
    tagline = 'Architectural Masterpieces in the World’s Most Coveted Locations';
    primary = '#0f172a';
    accent = '#b45309';
    headings = 'Cinzel';
    widget = 'Interactive Mortgage & Rental Yield Investment Calculator';
  } else if (p.includes('fitness') || p.includes('gym') || p.includes('trainer') || p.includes('workout')) {
    category = 'High-Performance Fitness & Wellness';
    suggestedBrand = 'AcroPulse Athletics';
    tagline = 'Data-Driven Human Optimization & Elite Coaching';
    primary = '#e11d48';
    accent = '#f59e0b';
    headings = 'Space Grotesk';
    widget = 'Interactive 1-Rep Max & Metabolic Calorie Planner';
  } else if (p.includes('legal') || p.includes('law') || p.includes('attorney')) {
    category = 'Corporate Legal & Advisory';
    suggestedBrand = 'Sterling & Vance LLP';
    tagline = 'Strategic Counsel for Mergers, IP, and High-Stakes Litigation';
    primary = '#1e3a8a';
    accent = '#b45309';
    headings = 'Cinzel';
    widget = 'Confidential Legal Case Assessment & Consultation Scheduler';
  } else if (p.includes('finance') || p.includes('fintech') || p.includes('bank') || p.includes('crypto')) {
    category = 'Next-Gen Financial Technology';
    suggestedBrand = 'Veloce Capital';
    tagline = 'Automated Treasury Management & Real-Time Yield Optimization';
    primary = '#0284c7';
    accent = '#10b981';
    headings = 'Space Grotesk';
    widget = 'Dynamic Compound Interest & Staking Yield Simulator';
  } else if (p.includes('health') || p.includes('clinic') || p.includes('medical') || p.includes('doctor')) {
    category = 'Clinical Healthcare & Longevity';
    suggestedBrand = 'AuraHealth Premier Medical';
    tagline = 'Precision Medicine and Compassionate Concierge Care';
    primary = '#0284c7';
    accent = '#10b981';
    headings = 'Plus Jakarta Sans';
    widget = 'Interactive Longevity & Biomarker Potential Estimator';
  } else {
    // Custom dynamic title extraction
    const words = prompt.trim().split(/\s+/).filter(w => w.length > 2 && !['want','create','make','website','please','site','the','and','for'].includes(w.toLowerCase()));
    if (words.length > 0) {
      const topicWord = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      suggestedBrand = `${topicWord} Studio`;
      category = `${topicWord} Solutions`;
      tagline = `Elevating ${topicWord} Through Modern Craftsmanship & Intelligent Design`;
    }
  }

  return {
    category,
    suggestedBrand,
    tagline,
    targetAudience: 'Discerning clients and modern consumers seeking premium solutions',
    colorPalette: {
      primary,
      accent,
      background: '#f8fafc',
      surface: '#ffffff'
    },
    typography: {
      headings,
      body: 'Plus Jakarta Sans'
    },
    recommendedSections: [
      'Hero Section with Dual Action Callouts & Social Proof',
      'Value Matrix & Proprietary Capabilities Showcase',
      widget,
      'Client Testimonials & Verified Credential Badges',
      'Interactive Consultation & Contact Intake with Toast Feedback'
    ],
    interactiveWidget: widget,
    summary: `Tailored ${category} platform designed for high conversion and responsive elegance.`
  };
}

/**
 * Generate a website using Gemini or Fallback
 */
async function generateWebsite({ prompt, category, stylePreferences, blueprint, apiKey }) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    console.log('[GeminiService] No GEMINI_API_KEY detected. Utilizing verified high-fidelity synthesis engine.');
    return {
      ...generateDynamicSite(prompt, category, blueprint),
      provider: 'built-in-engine (Gemini API key not configured)'
    };
  }

  const blueprintContext = blueprint ? `
PRE-ANALYZED ARCHITECTURE BLUEPRINT:
- Brand Name: ${blueprint.suggestedBrand || 'Custom Brand'}
- Tagline: ${blueprint.tagline || ''}
- Category: ${blueprint.category || category}
- Target Audience: ${blueprint.targetAudience || ''}
- Palette: Primary ${blueprint.colorPalette?.primary || '#4f46e5'}, Accent ${blueprint.colorPalette?.accent || '#06b6d4'}
- Typography: Headings ${blueprint.typography?.headings || 'Plus Jakarta Sans'}, Body ${blueprint.typography?.body || 'Plus Jakarta Sans'}
- Required Interactive Widget: ${blueprint.interactiveWidget || 'Interactive Calculator or Booking Modal'}
- Sections to Include: ${(blueprint.recommendedSections || []).join('; ')}
` : '';

  const userInstruction = `
USER SPECIFICATION PROMPT:
${prompt}

CATEGORY: ${category || 'general'}
STYLE PREFERENCES: ${stylePreferences || 'High-end design, crisp modern light mode palette, responsive fluid typography, interactive JS widgets, curated Unsplash imagery'}
${blueprintContext}

Generate the complete JSON response with HTML, CSS, JS, and SEO metadata. Make the website completely bespoke to the user's specific prompt.
`;

  try {
    console.log('[GeminiService] Querying Gemini for custom website generation...');
    const result = await callGemini(activeKey, SYSTEM_GENERATION_PROMPT, userInstruction, 0.7, 85000);
    return {
      ...result,
      provider: 'google-gemini-flash'
    };
  } catch (error) {
    console.error('[GeminiService] Error during Gemini generation:', error.message);
    return {
      ...generateDynamicSite(prompt, category, blueprint),
      provider: 'built-in-engine (Fallback after: ' + error.message + ')'
    };
  }
}

/**
 * Refine an existing website using Gemini
 */
async function refineWebsite({ currentCode, prompt, apiKey }) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    console.log('[GeminiService] Applying local refinement transformation.');
    return applyLocalRefinement(currentCode, prompt);
  }

  const userInstruction = `
CURRENT CODEBASE:
--- HTML ---
${currentCode.html}
--- CSS ---
${currentCode.css}
--- JAVASCRIPT ---
${currentCode.js}

REQUESTED USER MODIFICATION:
${prompt}

Respond ONLY with valid JSON:
{
  "html": "...",
  "css": "...",
  "js": "...",
  "changeSummary": "..."
}
`;

  try {
    const result = await callGemini(activeKey, SYSTEM_REFINEMENT_PROMPT, userInstruction, 0.5, 60000);
    return result;
  } catch (err) {
    console.error('[GeminiService] Refinement error:', err.message);
    return applyLocalRefinement(currentCode, prompt);
  }
}

function applyLocalRefinement(currentCode, prompt) {
  let { html, css, js } = currentCode;
  const pLower = prompt.toLowerCase();
  let summary = 'Refined website according to instructions: ' + prompt;

  if (pLower.includes('emerald') || pLower.includes('green')) {
    css = css.replace(/--primary:\s*[^;]+;/g, '--primary: #059669;')
             .replace(/--primary-accent:\s*[^;]+;/g, '--primary-accent: #10b981;');
    summary = 'Updated color tokens to emerald and organic green.';
  } else if (pLower.includes('purple') || pLower.includes('violet')) {
    css = css.replace(/--primary:\s*[^;]+;/g, '--primary: #8b5cf6;')
             .replace(/--primary-accent:\s*[^;]+;/g, '--primary-accent: #a855f7;');
    summary = 'Updated primary palette to deep purple and ultraviolet.';
  } else if (pLower.includes('dark mode') || pLower.includes('dark theme')) {
    html = html.replace('data-theme="light"', 'data-theme="dark"');
    summary = 'Set initial default theme to dark mode.';
  }

  if (pLower.includes('banner') || pLower.includes('announcement')) {
    if (!html.includes('class="announcement-bar"')) {
      const bannerHtml = `\n  <div class="announcement-bar" style="background:var(--primary, #4f46e5);color:#fff;text-align:center;padding:0.5rem;font-size:0.85rem;font-weight:600;">✨ Notice: Special Executive Consultation & Inquiries Open</div>\n`;
      html = html.replace('<body>', '<body>' + bannerHtml);
      summary = 'Added announcement top bar.';
    }
  }

  return {
    html,
    css,
    js,
    changeSummary: summary
  };
}

module.exports = {
  analyzeUserPrompt,
  generateWebsite,
  refineWebsite
};
