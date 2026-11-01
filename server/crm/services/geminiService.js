const axios = require('axios');

/**
 * Clean & normalize Gemini API keys
 */
const cleanApiKey = (key) => {
  if (!key) return '';
  return String(key).trim().replace(/^['"\s]+|['"\s]+$/g, '');
};

const DEFAULT_GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

/**
 * Fetch active available models directly from Google Generative Language API
 */
const fetchAvailableGeminiModels = async (key) => {
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      timeout: 8000
    });
    if (Array.isArray(res.data?.models)) {
      return res.data.models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));
    }
  } catch (e) {}
  return [];
};

/**
 * Test Google Gemini API Key connectivity
 */
const testGeminiApiKey = async (apiKey, model = 'gemini-1.5-flash') => {
  const key = cleanApiKey(apiKey);
  if (!key) {
    throw new Error('Please provide a Google Gemini API key.');
  }

  let targetModel = (model || '').trim().replace(/^models\//, '') || 'gemini-1.5-flash';
  
  // 1. Discover active models directly from user's Google API Key
  const discoveredModels = await fetchAvailableGeminiModels(key);

  let modelsToTry = [
    targetModel,
    ...discoveredModels,
    ...DEFAULT_GEMINI_MODELS
  ];
  modelsToTry = [...new Set(modelsToTry.filter(Boolean))];

  let lastError = null;
  for (const currentModel of modelsToTry) {
    for (const apiVersion of ['v1beta', 'v1']) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:generateContent?key=${key}`;
        const payload = {
          contents: [
            {
              parts: [
                { text: 'Hello, reply with "ok" to verify API connection.' }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 20
          }
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000
        });

        return {
          success: true,
          model: currentModel,
          apiVersion,
          data: response.data
        };
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        const errMsg = err.response?.data?.error?.message || '';
        // 400 with API_KEY_INVALID -> stop immediately
        if (errMsg.includes('API_KEY_INVALID') || status === 401) {
          throw new Error('Invalid Google Gemini API Key. Please verify your key from Google AI Studio (aistudio.google.com).');
        }
        if (status === 403) {
          throw new Error('Google Gemini API access forbidden. Please check your Google Cloud / AI Studio project status.');
        }
        continue;
      }
    }
  }

  const errData = lastError?.response?.data;
  const status = lastError?.response?.status;
  const rawMsg = errData?.error?.message || lastError?.message || 'Gemini API verification failed';

  let friendlyMessage = rawMsg;
  if (rawMsg.includes('API_KEY_INVALID') || status === 400 || status === 401) {
    friendlyMessage = 'Invalid Google Gemini API Key. Please verify your key from Google AI Studio (aistudio.google.com).';
  } else if (status === 403) {
    friendlyMessage = 'Google Gemini API access forbidden. Please check your Google Cloud / AI Studio project status.';
  } else if (status === 429) {
    friendlyMessage = 'Google Gemini rate limit exceeded. Please wait a moment or check your quota.';
  }

  const customErr = new Error(friendlyMessage);
  customErr.status = status;
  throw customErr;
};

/**
 * Google Gemini AI Lead Contact Extractor & Outreach Pitch Generator
 */
const enrichLeadWithGemini = async ({
  apiKey,
  model = 'gemini-1.5-flash',
  businessName,
  niche,
  city,
  rawText = '',
  websiteUrl = '',
  initialPhone = '',
  initialEmail = ''
}) => {
  const key = cleanApiKey(apiKey);
  if (!key) return null;

  let targetModel = (model || '').trim().replace(/^models\//, '') || 'gemini-1.5-flash';
  const discoveredModels = await fetchAvailableGeminiModels(key);

  let modelsToTry = [
    targetModel,
    ...discoveredModels,
    ...DEFAULT_GEMINI_MODELS
  ];
  modelsToTry = [...new Set(modelsToTry.filter(Boolean))];

  const prompt = `You are Google's elite B2B Lead Intelligence and Contact Data Extractor.
Extract the most authentic and verified business contact info for:

Company Name: "${businessName}"
Industry/Niche: "${niche || 'General Business'}"
Location: "${city || ''}"
Known Website URL: "${websiteUrl || ''}"
Known Phone: "${initialPhone || ''}"
Known Email: "${initialEmail || ''}"

Live Web Scraped Content & Search Context:
"""
${rawText ? rawText.substring(0, 5000) : 'No raw HTML available. Use your knowledge base to identify this business.'}
"""

INSTRUCTIONS:
1. Identify the official website domain (e.g. "https://www.companydomain.com").
2. Extract or identify the authentic primary corporate contact email (e.g. "info@domain.com", "contact@domain.com", "hello@domain.com", or the direct decision maker's email).
3. Identify the real Decision Maker / Founder / Owner / Executive (e.g. "Full Name - Title").
4. Extract the primary business phone number.
5. Extract official company LinkedIn URL.
6. Write a sharp, high-converting 1-sentence personalized outreach pitch tailored specifically to this business.

Return ONLY clean valid JSON matching this exact structure:
{
  "email": "verified_email@domain.com",
  "websiteUrl": "https://www.companydomain.com",
  "decisionMaker": "Full Name - Title",
  "phone": "verified phone number",
  "linkedinUrl": "https://www.linkedin.com/company/...",
  "outreachPitch": "Short 1-sentence personalized pitch idea",
  "leadScore": 95
}`;

  for (const currentModel of modelsToTry) {
    for (const apiVersion of ['v1beta', 'v1']) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:generateContent?key=${key}`;
        const payload = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json'
          }
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000
        });

        const rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawContent) continue;

        let cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (err) {
        // Try next model or version
      }
    }
  }

  return null;
};

/**
 * Google Gemini AI Email Sequence Generator
 */
const generateEmailSequenceWithGemini = async ({
  apiKey,
  model = 'gemini-2.5-flash',
  goal = 'Cold Outreach & Value Pitch',
  tone = 'Persuasive & High Converting',
  offerDescription = '',
  customPrompt = '',
  headers = [],
  followUpCount = 2
}) => {
  const key = cleanApiKey(apiKey);
  if (!key) throw new Error('Google Gemini API Key is required.');

  const targetModel = (model || '').trim() || 'gemini-2.5-flash';
  const modelsToTry = [
    targetModel,
    ...DEFAULT_GEMINI_MODELS.filter(m => m !== targetModel)
  ];

  const availableTags = headers && headers.length > 0
    ? headers.map(h => `{{${h.key}}}`).join(', ')
    : '{{name}}, {{company}}, {{service}}, {{email}}, {{phone}}, {{city}}';

  const count = Math.max(1, Math.min(5, parseInt(followUpCount, 10) || 2));
  const userOffer = (offerDescription && offerDescription.trim()) || 'B2B Web Development & Digital Solutions';

  const prompt = `You are an elite cold outreach email specialist.
Write a bespoke, highly personalized cold outreach email sequence based on:

OFFER / VALUE PROPOSITION: "${userOffer}"
CAMPAIGN GOAL: "${goal}"
TONE OF VOICE: "${tone}"
AVAILABLE MERGE TAGS: [${availableTags}]
${customPrompt ? `ADDITIONAL INSTRUCTIONS: "${customPrompt}"` : ''}

RULES:
1. Keep emails short and concise (under 80-100 words).
2. Avoid generic sales clichés (no "I hope you are doing well", "revolutionize", "cutting-edge").
3. Personalize naturally with merge tags.
4. CTA: Simple low-friction 5-minute chat request.
5. Write exactly ${count} follow-up email(s).

OUTPUT FORMAT: Return ONLY clean valid JSON matching this exact structure:
{
  "initialEmail": {
    "subject": "<Subject line tailored to offer and {{company}}>",
    "body": "<Body text in requested tone with professional signature>"
  },
  "followUps": [
    {
      "sequenceNumber": 1,
      "delayDays": "2",
      "subject": "<Follow-up subject line>",
      "body": "<Follow-up body text with signature>"
    }
  ]
}`;

  for (const currentModel of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json'
        }
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawContent) continue;

      let cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      // Try next model
    }
  }

  throw new Error('Gemini failed to generate email sequence. Please verify your API key.');
};

module.exports = {
  cleanApiKey,
  testGeminiApiKey,
  enrichLeadWithGemini,
  generateEmailSequenceWithGemini,
  DEFAULT_GEMINI_MODELS
};
