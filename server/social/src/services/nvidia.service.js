import axios from 'axios';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/**
 * Validates a string to ensure it is a valid URL starting with http or https.
 * @param {string} urlStr 
 * @returns {boolean}
 */
function isValidUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

/**
 * Parses response text to extract valid JSON data.
 * @param {string} text 
 * @returns {object}
 */
function parseJSONResponse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON blocks if the model wrapped it in markdown code blocks
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err) {
        throw new Error('Failed to parse JSON content from NVIDIA model output');
      }
    }
    throw new Error('No valid JSON block found in NVIDIA response');
  }
}

/**
 * Normalizes hashtags to always be a list of non-empty strings.
 * @param {any} hashtags 
 * @returns {string[]}
 */
function normalizeHashtags(hashtags) {
  if (Array.isArray(hashtags)) {
    return hashtags
      .map(h => String(h).trim())
      .filter(h => h.length > 0);
  }
  if (typeof hashtags === 'string') {
    if (hashtags.includes(',')) {
      return hashtags
        .split(',')
        .map(h => h.trim())
        .filter(h => h.length > 0);
    } else {
      return hashtags
        .split(/\s+/)
        .map(h => h.trim())
        .filter(h => h.length > 0);
    }
  }
  return [];
}


/**
 * Generates structured social media post data from an image URL using NVIDIA VLM.
 * 
 * @param {string} imageUrl Cloudinary or public image URL.
 * @param {string} tone Requested social media tone.
 * @returns {Promise<{success: boolean, description: string, caption: string, cta: string, hashtags: string[]}>}
 */
export async function generateCaptionFromImage(imageUrl, tone = 'attractive', prompt = '') {
  // 1. Validation for image URL
  if (!isValidUrl(imageUrl)) {
    throw new Error('Invalid image URL provided. Must be a valid HTTP or HTTPS link.');
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in the server environment.');
  }

  // Map incoming frontend tone dropdown values to standardized values
  const toneMap = {
    attractive: 'Attractive',
    professional: 'Professional',
    funny: 'Funny',
    personal: 'Personal',
    joy: 'Joyful',
    joyful: 'Joyful',
    advertisement: 'Advertisement',
    marketing: 'Marketing'
  };
  const safeTone = toneMap[tone?.toLowerCase()] || 'Attractive';

  // Request Logging
  console.log(`[NVIDIA Service] Initiating caption generation. Tone: ${safeTone}, Image URL: ${imageUrl}`);

  // 2. Fetch remote image and convert to Base64 to ensure API compatibility
  let dataUrl;
  try {
    console.log(`[NVIDIA Service] Fetching image array buffer...`);
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const base64 = Buffer.from(imgRes.data).toString('base64');
    const mime = imgRes.headers['content-type'] || 'image/jpeg';
    dataUrl = `data:${mime};base64,${base64}`;
    console.log(`[NVIDIA Service] Image fetched successfully. Size: ${imgRes.data.byteLength} bytes.`);
  } catch (err) {
    console.error(`[NVIDIA Service] Failed to fetch remote image:`, err.message);
    throw new Error(`Failed to download image from the provided URL: ${err.message}`);
  }

  const systemPrompt = `
You are an expert social media strategist and visual content analyst.

Your job is to first understand the image, then create a natural human-written caption.

STEP 1: Analyze the image.

Identify:
- Image type (logo, product, person, event, office, food, travel, nature, marketing banner, infographic, screenshot, etc.)
- Visible text
- Brand names
- Colors
- Main objects
- Mood
- Context

STEP 2: Generate content.

Rules:

1. Use ONLY information visible in the image.
2. Never invent products, services, locations, people, achievements, or events.
3. If the image is a logo:
   - Introduce the brand professionally.
   - Do not invent services.
   - Focus on branding, identity, and company presence.
4. If the image is a product:
   - Focus on product visibility and presentation.
5. If the image is a person:
   - Focus on activity and atmosphere.
6. Write naturally like a real human social media manager.
7. Avoid robotic marketing phrases.
8. Avoid words such as:
   - Unlock
   - Unleash
   - Revolutionize
   - Cutting-edge
   - Industry-leading
   unless clearly justified.
9. Create captions that feel authentic.
10. Optimize for engagement and readability.

Tone:
Professional
Marketing
Advertisement
Attractive
Funny
Personal
Joyful

Return ONLY JSON:

{
  "imageType":"",
  "description":"",
  "caption":"",
  "cta":"",
  "hashtags":[]
}
`;

  const userPrompt = (tone?.toLowerCase() === 'custom' && prompt)
    ? `Generate a social media post for this image based on these custom instructions: "${prompt}"`
    : `Generate a social media post for this image in a "${safeTone}" tone.`;

  const requestedModel = process.env.NVIDIA_MODEL;
  const fallbackModels = [
    'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
    'meta/llama-3.2-11b-vision-instruct',
    'meta/llama-3.2-90b-vision-instruct'
  ];

  const modelsToTry = [];
  if (requestedModel) {
    modelsToTry.push(requestedModel);
  }
  for (const m of fallbackModels) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError = null;

  for (const currentModel of modelsToTry) {
    console.log(`[NVIDIA Service] Trying model: ${currentModel}`);
    const payload = {
      model: currentModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.7
    };

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let result = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`[NVIDIA Service] Sending payload to NVIDIA completions API using ${currentModel} (Attempt ${attempt}/${maxRetries})...`);

        const apiResponse = await axios.post(
          `${NVIDIA_BASE_URL}/chat/completions`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000 // 45 seconds timeout handling
          }
        );

        const content = apiResponse.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('NVIDIA completions API returned an empty message payload.');
        }

        console.log(`[NVIDIA Service] Response received successfully from ${currentModel}. Parsing output JSON...`);
        const parsed = parseJSONResponse(content);

        result = {
          success: true,
          description: parsed.description || '',
          caption: parsed.caption || '',
          cta: parsed.cta || '',
          hashtags: normalizeHashtags(parsed.hashtags)
        };
        success = true;
        break; // break retry loop

      } catch (error) {
        const statusCode = error.response?.status;
        const errorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message;
        console.error(`[NVIDIA Service] Model ${currentModel} - Attempt ${attempt} failed (Status: ${statusCode || 'N/A'}):`, errorMsg);

        lastError = error;

        // If the API returns a 404 (model not found) or 400 indicating model unknown/invalid,
        // immediately skip retrying this model and switch to the next model.
        const isModelNotFoundError = statusCode === 404 ||
          (statusCode === 400 && (errorMsg.toLowerCase().includes('model') || errorMsg.toLowerCase().includes('unknown')));

        if (isModelNotFoundError) {
          console.warn(`[NVIDIA Service] Model ${currentModel} is not hosted/available (404/400). Skipping further retries for this model.`);
          break; // break retry loop to try the next model
        }

        if (attempt >= maxRetries) {
          console.warn(`[NVIDIA Service] Model ${currentModel} failed after ${maxRetries} attempts.`);
          break; // break retry loop to try the next model
        }

        // Exponential backoff wait: 1s, 2s
        const delay = attempt * 1000;
        console.log(`[NVIDIA Service] Waiting ${delay}ms before retrying ${currentModel}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (success && result) {
      return result;
    }
  }

  // If we reach here, all models failed
  const finalErrorMsg = lastError?.response?.data?.message || lastError?.response?.data?.error?.message || lastError?.message;
  throw new Error(`NVIDIA API call failed for all models. Last error: ${finalErrorMsg}`);
}
