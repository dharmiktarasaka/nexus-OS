const axios = require('axios');

/**
 * Clean & normalize API keys
 */
const cleanApiKey = (key) => {
  if (!key) return '';
  return String(key).trim().replace(/^['"\s]+|['"\s]+$/g, '');
};

/**
 * Determine API Endpoint & Provider for DeepSeek / NVIDIA / OpenRouter / Groq
 */
const resolveProviderAndModel = (apiKey, rawModel = '', customBaseUrl = '') => {
  const key = cleanApiKey(apiKey);
  let endpoint = customBaseUrl ? customBaseUrl.replace(/\/+$/, '') + '/chat/completions' : '';
  let model = (rawModel || '').trim();

  let candidateModels = [];

  if (key.startsWith('nvapi-') || key.startsWith('nvapi_') || key.toLowerCase().includes('nvapi') || key.toLowerCase().includes('nvidia')) {
    // NVIDIA NIM Hosted API (integrate.api.nvidia.com)
    endpoint = endpoint || 'https://integrate.api.nvidia.com/v1/chat/completions';
    candidateModels = [
      'deepseek-ai/deepseek-v4-pro-0813',
      'deepseek-ai/deepseek-v4-flash-0731',
      'deepseek-ai/deepseek-r1'
    ];

    if (model && candidateModels.includes(model)) {
      // keep selected
    } else if (model.includes('flash')) {
      model = 'deepseek-ai/deepseek-v4-flash-0731';
    } else if (model.includes('r1') || model.includes('reason')) {
      model = 'deepseek-ai/deepseek-r1';
    } else {
      model = 'deepseek-ai/deepseek-v4-pro-0813';
    }
  } else if (key.startsWith('sk-or-') || key.toLowerCase().includes('openrouter')) {
    // OpenRouter API
    endpoint = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
    candidateModels = ['deepseek/deepseek-chat', 'deepseek/deepseek-r1'];
    if (model.includes('r1') || model.includes('reasoner')) {
      model = 'deepseek/deepseek-r1';
    } else {
      model = 'deepseek/deepseek-chat';
    }
  } else if (key.startsWith('gsk_') || key.toLowerCase().includes('groq')) {
    // Groq Cloud API
    endpoint = endpoint || 'https://api.groq.com/openai/v1/chat/completions';
    candidateModels = ['deepseek-r1-distill-llama-70b'];
    model = 'deepseek-r1-distill-llama-70b';
  } else {
    // Official DeepSeek API (api.deepseek.com)
    endpoint = endpoint || 'https://api.deepseek.com/chat/completions';
    candidateModels = ['deepseek-chat', 'deepseek-reasoner'];
    if (model.includes('reasoner') || model.includes('r1')) {
      model = 'deepseek-reasoner';
    } else {
      model = 'deepseek-chat';
    }
  }

  return { endpoint, model, candidateModels, key };
};

/**
 * Test DeepSeek / NVIDIA / OpenRouter API Key connectivity
 */
const testDeepSeekApiKey = async (apiKey, model = '', customBaseUrl = '') => {
  const cleanedKey = cleanApiKey(apiKey);
  if (!cleanedKey) {
    throw new Error('Please provide an API key.');
  }

  const { endpoint, model: resolvedModel, candidateModels, key } = resolveProviderAndModel(cleanedKey, model, customBaseUrl);
  const targetModel = (model && model.trim()) ? model.trim() : resolvedModel;
  
  let modelsToTry = [
    targetModel,
    'deepseek-ai/deepseek-r1',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'deepseek-chat',
    'deepseek-reasoner',
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1',
    ...candidateModels
  ];

  // Remove duplicates
  modelsToTry = [...new Set(modelsToTry.filter(Boolean))];

  // Attempt dynamic model discovery if using NVIDIA / OpenAI-compatible endpoint
  try {
    const modelsUrl = endpoint.replace(/\/chat\/completions\/?$/, '/models');
    const modelsRes = await axios.get(modelsUrl, {
      headers: { 'Authorization': `Bearer ${key}` },
      timeout: 8000
    });
    if (Array.isArray(modelsRes.data?.data) && modelsRes.data.data.length > 0) {
      const activeIds = modelsRes.data.data.map(m => m.id).filter(Boolean);
      // Prepend active models found in account
      modelsToTry = [...new Set([targetModel, ...activeIds, ...modelsToTry])];
    }
  } catch (mErr) {
    // If /models endpoint is not available, proceed with static list
  }

  const pingModel = async (modelToTry) => {
    const payload = {
      model: modelToTry,
      messages: [
        {
          role: 'user',
          content: 'Hello, reply with "ok" to verify API connection.'
        }
      ],
      temperature: 1,
      max_tokens: 50
    };

    return await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        timeout: 25000
      }
    );
  };

  let lastError = null;
  for (const currentModel of modelsToTry) {
    try {
      const response = await pingModel(currentModel);
      return {
        success: true,
        endpoint,
        model: currentModel,
        data: response.data
      };
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.title || '';
      // If 401, key is invalid -> stop immediately
      if (status === 401) {
        break;
      }
      // If 403 with "Authorization failed" -> key might be expired or invalid -> stop
      if (status === 403 && typeof detail === 'string' && detail.toLowerCase().includes('authorization')) {
        break;
      }
      // For 404, 410, 400, try next model
      continue;
    }
  }

  // Parse error details
  const errData = lastError?.response?.data;
  const status = lastError?.response?.status;
  const rawApiMsg = errData?.error?.message || errData?.detail || errData?.title || errData?.message || lastError?.message;

  let friendlyMessage = rawApiMsg || 'API verification failed.';
  if (status === 401) {
    friendlyMessage = 'Invalid API Key. Please verify your key from your AI provider dashboard.';
  } else if (status === 403) {
    friendlyMessage = 'API Key authorization failed. Please check your API key permissions and balance.';
  } else if (status === 404) {
    friendlyMessage = 'API endpoint or model not found. Please verify your API key and provider URL.';
  }

  const customErr = new Error(friendlyMessage);
  customErr.status = status;
  customErr.apiError = rawApiMsg;
  throw customErr;
};

/**
 * DeepSeek AI Lead Contact Extractor & Outreach Pitch Generator
 */
const enrichLeadWithDeepSeek = async ({
  apiKey,
  model = '',
  customBaseUrl = '',
  businessName,
  niche,
  city,
  rawText = '',
  websiteUrl = '',
  initialPhone = '',
  initialEmail = ''
}) => {
  const cleanedKey = cleanApiKey(apiKey);
  if (!cleanedKey) return null;

  try {
    const { endpoint, model: targetModel, candidateModels, key } = resolveProviderAndModel(cleanedKey, model, customBaseUrl);
    let modelsToTry = [
      targetModel,
      'deepseek-ai/deepseek-r1',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'meta/llama-3.1-70b-instruct',
      'meta/llama-3.1-8b-instruct',
      'deepseek-chat',
      ...candidateModels
    ];
    modelsToTry = [...new Set(modelsToTry.filter(Boolean))];

    const prompt = `You are an elite B2B Lead Contact Finder and Corporate Email Discovery Agent.
Your primary mission is to find or determine the official business email address, corporate domain, and decision-maker contact for this business:

Business Name: "${businessName}"
Niche/Industry: "${niche || 'General Business'}"
Location: "${city || ''}"
Existing Website: "${websiteUrl || ''}"
Known Phone: "${initialPhone || ''}"
Known Email: "${initialEmail || ''}"

Web Context / Scraped Search Snippets:
"""
${rawText ? rawText.substring(0, 4000) : 'No raw text provided. Use your knowledge base to deduce the official website domain and email for this company.'}
"""

CRITICAL INSTRUCTIONS:
1. BUSINESS EMAIL (MANDATORY):
   - Find or accurately derive the official corporate email address for "${businessName}".
   - If a specific person's email is not in the text, identify their official website domain (e.g. for "${businessName}", determine their real domain e.g. "companyname.com" or "companyname.ca") and provide the primary business email on that domain (e.g. "info@domain.com", "contact@domain.com", "hello@domain.com", "sales@domain.com", or "support@domain.com").
   - You MUST ALWAYS provide a valid corporate business email. Do NOT leave the email field empty or null.
2. OFFICIAL WEBSITE URL (MANDATORY):
   - Provide the official website URL (e.g. "https://www.companydomain.com").
3. DECISION MAKER / OWNER:
   - Identify the Founder, CEO, Owner, General Manager, or Director (e.g. "Full Name - Founder & Owner").
4. PHONE NUMBER:
   - Provide the primary business phone number.
5. LINKEDIN URL:
   - Provide the company's LinkedIn profile URL if known.
6. OUTREACH PITCH:
   - Write a sharp 1-sentence personalized B2B outreach pitch tailored specifically to "${businessName}".

Return ONLY valid JSON matching this exact structure:
{
  "email": "verified_or_corporate_email@domain.com",
  "websiteUrl": "https://www.companydomain.com",
  "decisionMaker": "Full Name - Title",
  "phone": "business phone number",
  "linkedinUrl": "https://www.linkedin.com/company/...",
  "outreachPitch": "Personalized 1-sentence outreach pitch",
  "leadScore": 95
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an elite B2B data extraction agent. Always return clean JSON only without markdown formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    let rawContent = '';
    const limitedModels = modelsToTry.slice(0, 4);
    for (const currentModel of limitedModels) {
      try {
        const payload = {
          model: currentModel,
          messages,
          temperature: 0.2,
          top_p: 0.95,
          max_tokens: 2500
        };

        const response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            timeout: 30000
          }
        );

        rawContent = response.data?.choices?.[0]?.message?.content || '';
        if (rawContent && rawContent.trim()) {
          break; // successfully got content
        }
      } catch (postErr) {
        // If candidate model fails, move quietly to the next working candidate
      }
    }
    if (!rawContent || !rawContent.trim()) return null;

    let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (cleaned.includes('<think>')) {
      cleaned = cleaned.substring(cleaned.lastIndexOf('</think>') > -1 ? cleaned.lastIndexOf('</think>') + 8 : cleaned.indexOf('<think>')).trim();
    }
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          try {
            const sanitized = jsonMatch[0]
              .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n')
              .replace(/,\s*([\}\]])/g, '$1');
            return JSON.parse(sanitized);
          } catch (e3) {
            return null;
          }
        }
      }
      return null;
    }
  } catch (err) {
    console.error('[DeepSeek Enrichment Error]:', err.response?.data || err.message);
    return null;
  }
};

/**
 * DeepSeek AI Email & Follow-Up Sequence Generator
 */
const generateEmailSequenceWithDeepSeek = async ({
  apiKey,
  model = '',
  customBaseUrl = '',
  goal = 'Cold Outreach & Value Pitch',
  tone = 'Persuasive & High Converting',
  offerDescription = '',
  customPrompt = '',
  headers = [],
  followUpCount = 2,
  sampleRecord = {}
}) => {
  const cleanedKey = cleanApiKey(apiKey);
  if (!cleanedKey) {
    throw new Error('DeepSeek / NVIDIA API Key is required.');
  }

  const { endpoint, model: targetModel, candidateModels, key } = resolveProviderAndModel(cleanedKey, model, customBaseUrl);
  const modelsToTry = [targetModel, ...candidateModels.filter(m => m !== targetModel)];

  const availableTags = headers && headers.length > 0
    ? headers.map(h => `{{${h.key}}}`).join(', ')
    : '{{name}}, {{company}}, {{service}}, {{email}}, {{phone}}, {{city}}';

  const count = Math.max(1, Math.min(5, parseInt(followUpCount, 10) || 2));

  const userOffer = (offerDescription && offerDescription.trim())
    ? offerDescription.trim()
    : 'B2B Web Development & Digital Solutions';

  const userTone = tone || 'Professional & Conversational';
  const userGoal = goal || 'Cold Outreach & Value Pitch';

  const prompt = `You are Tarasaka Digital Solutions' cold outreach email specialist.

Your mission: Deeply analyze what the user provided in their OFFER / VALUE PROPOSITION ("${userOffer}"), their CAMPAIGN GOAL ("${userGoal}"), and their requested TONE ("${userTone}"), and synthesize them with Tarasaka's cold outreach principles to write a bespoke, highly personalized cold outreach email sequence.

=== USER INPUT DETAILS (ANALYZE THOROUGHLY & INCORPORATE DEEPLY) ===
1. USER'S SPECIFIC OFFER / VALUE PROPOSITION (Field 4):
   "${userOffer}"
   * MANDATORY: The entire email value proposition, subject lines, and observations MUST be specifically focused on "${userOffer}" (e.g. if the user says "${userOffer}", craft observations, problems, and solutions specifically relevant to ${userOffer}).
2. CAMPAIGN OBJECTIVE / GOAL:
   "${userGoal}"
3. TONE OF VOICE:
   "${userTone}" (Adapt your vocabulary, phrasing, sentence length, and warmth to match this tone precisely)
4. AVAILABLE RECIPIENT MERGE TAGS:
   [${availableTags}]
${customPrompt ? `5. ADDITIONAL CUSTOM USER INSTRUCTIONS:\n   "${customPrompt}"` : ''}

=== TARASAKA COLD EMAIL PRINCIPLES ===
1. Keep emails short and concise (under 80-100 words for the body).
2. Avoid generic sales language and empty buzzwords (do NOT use phrases like "I hope you are doing well", "I came across your amazing company", "scaling fast", "revolutionize your business", "game-changing", "cutting-edge solutions", "no hassle", "I'd love to pick your brain").
3. Never make unsupported claims about a prospect's revenue, expansion, or internal problems.
4. Personalize naturally using available merge tags (e.g. {{name}}, {{company}}, etc.).
5. The email must feel authentic, human, and conversational—like it was written individually for one person.
6. CTA: Use a simple, low-friction next step (e.g., asking for a 5-minute conversation or checking if exploring ${userOffer} is on their radar).
7. Do not explain every single feature in the first email. Focus on the prospect's perspective regarding "${userOffer}".

=== STRUCTURE ===
- Subject Line: Short (3-6 words), punchy, specific to "${userOffer}" and {{company}}.
- Opening: Natural, genuine observation about {{company}} connected to "${userOffer}".
- Value: 1-2 clear sentences explaining how Tarasaka Digital Solutions helps with "${userOffer}".
- CTA: Simple, low-friction 5-minute chat request.
- Signature (Must be exact):
Samkav
Business Growth Consultant | Tarasaka Digital Solutions
🌐 tarasaka.com
📞 +91-7600583156

=== AUTOMATED FOLLOW-UP EMAILS (${count} Step(s)) ===
Write exactly ${count} follow-up email(s) that continue the conversation about "${userOffer}" in the "${userTone}" tone:
- Follow-Up #1 (2 days): Gentle nudge referencing the previous note about "${userOffer}" with a quick check-in.
- Follow-Up #2 (4-5 days): Share a relevant insight, concise angle, or case perspective related to "${userOffer}".
- Follow-Up #3 / #4 (7-8 days): Courteous close/break-up note with zero pressure.
- Include the exact signature for Samkav | Tarasaka Digital Solutions in all follow-ups.

=== SILENT PRE-GENERATION CHECK ===
* Is the email clearly and specifically about "${userOffer}"?
* Does it reflect the "${userTone}" tone?
* Is it concise, natural, and low-pressure?
* If it looks like a generic mass template, rewrite it to be specific and tailored to "${userOffer}".

CRITICAL OUTPUT FORMAT:
- Output pure raw JSON only. Do NOT include thinking tags, markdown explanations, or commentary.
- Start your response IMMEDIATELY with '{' and end with '}'.
- Format structure:
{
  "initialEmail": {
    "subject": "<Subject line tailored to ${userOffer} and {{company}}>",
    "body": "<Body text tailored to ${userOffer} in ${userTone} tone with Samkav signature>"
  },
  "followUps": [
    {
      "sequenceNumber": 1,
      "delayDays": "2",
      "subject": "<Follow-up subject line>",
      "body": "<Follow-up body text tailored to ${userOffer} with Samkav signature>"
    }
  ]
}`;

  try {
    let rawContent = '';
    for (const currentModel of modelsToTry) {
      try {
        const payload = {
          model: currentModel,
          messages: [
            {
              role: 'system',
              content: `You are Tarasaka Digital Solutions' elite cold outreach email specialist. You analyze the user's specific offer and requested tone to write custom, human, B2B emails. Output pure raw JSON only.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 2000
        };

        const response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            timeout: 25000
          }
        );

        rawContent = response.data?.choices?.[0]?.message?.content || '';
        if (rawContent && rawContent.trim()) {
          break;
        }
      } catch (err) {
        console.warn(`[DeepSeek Email Gen] Model ${currentModel} failed, trying next candidate...`);
      }
    }

    // Robust AI JSON parser & fallback extractor
    const sanitizeAndExtractJson = (text) => {
      if (!text || typeof text !== 'string') return null;

      // 1. Strip <think> tags (including multiline or unclosed)
      let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (cleaned.includes('<think>')) {
        const afterClose = cleaned.substring(cleaned.lastIndexOf('</think>') + 8).trim();
        if (afterClose) cleaned = afterClose;
      }

      // 2. Strip code fences
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();

      // 3. If there is reasoning chatter before the JSON, find where the actual JSON object starts
      const firstCurly = cleaned.indexOf('{"initialEmail"') > -1 ? cleaned.indexOf('{"initialEmail"') : (cleaned.indexOf('{\n  "initialEmail"') > -1 ? cleaned.indexOf('{\n  "initialEmail"') : cleaned.indexOf('{'));
      const lastCurly = cleaned.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        cleaned = cleaned.substring(firstCurly, lastCurly + 1);
      }

      // 4. Try standard JSON.parse
      try {
        const obj = JSON.parse(cleaned);
        if (obj && typeof obj === 'object') return obj;
      } catch (e) {}

      // 5. Try extracting from curly braces with regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const obj = JSON.parse(jsonMatch[0]);
          if (obj && typeof obj === 'object') return obj;
        } catch (e2) {
          try {
            const sanitized = jsonMatch[0]
              .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n')
              .replace(/,\s*([\}\]])/g, '$1');
            const obj = JSON.parse(sanitized);
            if (obj && typeof obj === 'object') return obj;
          } catch (e3) {}
        }
      }

      return null;
    };

    const parsedJson = sanitizeAndExtractJson(rawContent);

    // Normalize different AI JSON key structures
    let initialEmail = null;
    let followUps = [];

    if (parsedJson) {
      // Find initial email in various common keys
      const rawInitial = parsedJson.initialEmail || parsedJson.initial_email || parsedJson.email1 || parsedJson.firstEmail || (parsedJson.subject && parsedJson.body ? parsedJson : null);
      if (rawInitial && (rawInitial.body || rawInitial.subject)) {
        initialEmail = {
          subject: rawInitial.subject || rawInitial.Subject || rawInitial.title || `Quick question regarding {{company}}`,
          body: rawInitial.body || rawInitial.Body || rawInitial.content || rawInitial.message || ''
        };
      }

      // Find follow-ups in various common keys
      const rawFollowUps = parsedJson.followUps || parsedJson.follow_ups || parsedJson.followups || parsedJson.followUpEmails || parsedJson.sequences || [];
      if (Array.isArray(rawFollowUps) && rawFollowUps.length > 0) {
        followUps = rawFollowUps.map((f, idx) => ({
          sequenceNumber: idx + 1,
          delayDays: String(f.delayDays || f.delay_days || f.delay || (idx + 1) * 2),
          subject: f.subject || f.Subject || f.title || `Following up - {{company}}`,
          body: f.body || f.Body || f.content || f.message || ''
        }));
      }
    }

    const cleanEmailText = (text) => {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^We need to[\s\S]*?(?=Hi |Hey |Dear |Hello )/i, '')
        .replace(/^I need to[\s\S]*?(?=Hi |Hey |Dear |Hello )/i, '')
        .replace(/^Let's write:[\s\S]*?(?=Hi |Hey |Dear |Hello )/i, '')
        .replace(/```[a-z]*\s*/gi, '')
        .trim();
    };

    // If initialEmail is still missing, build a personalized template adhering strictly to Tarasaka guidelines and user's offer
    if (!initialEmail || !initialEmail.body) {
      const offerPhrase = userOffer.toLowerCase().includes('web') ? 'website and digital presence' : userOffer;
      initialEmail = {
        subject: `Quick question regarding {{company}}'s ${offerPhrase}`,
        body: `Hi {{name}},\n\nI was looking into {{company}} and had a quick observation regarding your ${offerPhrase}.\n\nWould you be open to a quick 5-minute conversation sometime this week to see if this is relevant for you?\n\nBest,\n\nSamkav\nBusiness Growth Consultant | Tarasaka Digital Solutions\n🌐 tarasaka.com\n📞 +91-7600583156`
      };
    }

    if (!followUps || followUps.length === 0) {
      const count = Math.max(1, Math.min(4, parseInt(followUpCount, 10) || 2));
      const offerPhrase = userOffer.toLowerCase().includes('web') ? 'website and digital presence' : userOffer;
      followUps = [
        {
          sequenceNumber: 1,
          delayDays: '2',
          subject: `Following up - {{company}}`,
          body: `Hi {{name}},\n\nJust following up briefly on my previous note. Wanted to check if exploring ${offerPhrase} for {{company}} is something on your radar right now?\n\nNo pressure either way—happy to connect for 5 minutes if it makes sense.\n\nBest,\n\nSamkav\nBusiness Growth Consultant | Tarasaka Digital Solutions\n🌐 tarasaka.com\n📞 +91-7600583156`
        },
        {
          sequenceNumber: 2,
          delayDays: '5',
          subject: `Quick thought on {{company}}'s ${offerPhrase}`,
          body: `Hi {{name}},\n\nThought I'd share a quick perspective: we recently helped a B2B partner with their ${offerPhrase}, which streamlined their response pipeline.\n\nIf you'd be open to seeing what that could look like for {{company}}, let me know!\n\nBest,\n\nSamkav\nBusiness Growth Consultant | Tarasaka Digital Solutions\n🌐 tarasaka.com\n📞 +91-7600583156`
        },
        {
          sequenceNumber: 3,
          delayDays: '7',
          subject: `Final note for {{name}}`,
          body: `Hi {{name}},\n\nI don't want to clutter your inbox. If now isn't the right time for {{company}}, no worries at all.\n\nFeel free to reach back out whenever it makes sense.\n\nBest,\n\nSamkav\nBusiness Growth Consultant | Tarasaka Digital Solutions\n🌐 tarasaka.com\n📞 +91-7600583156`
        }
      ].slice(0, count);
    }

    initialEmail.subject = cleanEmailText(initialEmail.subject);
    initialEmail.body = cleanEmailText(initialEmail.body);
    followUps = followUps.map(f => ({
      ...f,
      subject: cleanEmailText(f.subject),
      body: cleanEmailText(f.body)
    }));

    return {
      success: true,
      modelUsed: targetModel,
      initialEmail,
      followUps
    };
  } catch (err) {
    console.error('[DeepSeek Email Generator Error]:', err.response?.data || err.message);
    const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || err.response?.data?.message || err.message;
    throw new Error(`DeepSeek AI generation failed: ${errMsg}`);
  }
};

module.exports = {
  testDeepSeekApiKey,
  enrichLeadWithDeepSeek,
  generateEmailSequenceWithDeepSeek,
  resolveProviderAndModel,
  cleanApiKey
};
