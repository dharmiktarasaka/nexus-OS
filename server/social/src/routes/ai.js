import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { generateCaptionFromImage } from '../services/nvidia.service.js';
import { generateCaptionWithGemini } from '../services/gemini.service.js';

const router = Router();

// Endpoint: POST /api/ai/generate-caption
router.post('/generate-caption', protect, async (req, res) => {
  const { imageUrl, tone, prompt } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'imageUrl is required in the request body.' });
  }

  let result = null;

  // 1. Try NVIDIA model if configured
  if (process.env.NVIDIA_API_KEY) {
    try {
      result = await generateCaptionFromImage(imageUrl, tone, prompt);
    } catch (nvErr) {
      console.warn('[AI Caption] NVIDIA error, falling back to Gemini:', nvErr.message);
    }
  }

  // 2. Fallback to Google Gemini
  if (!result) {
    try {
      result = await generateCaptionWithGemini(imageUrl, tone, prompt);
    } catch (gemErr) {
      console.warn('[AI Caption] Gemini error, generating smart fallback:', gemErr.message);
    }
  }

  // 3. Guaranteed failsafe response
  if (!result) {
    result = {
      description: 'Social Media Visual',
      caption: `Elevate your impact and inspire your community ✨ ${prompt || ''}`.trim(),
      cta: 'Tag a friend who needs to see this! 👇',
      hashtags: ['growth', 'socialmedia', 'inspiration', 'trending']
    };
  }

  // Format the combined caption for frontend textareas to include the caption body,
  // the call to action (CTA), and all the generated hashtags.
  const hashtagsArray = Array.isArray(result.hashtags) ? result.hashtags : [];
  const hashtagStr = hashtagsArray.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  const formattedCaption = `${result.caption}\n\n${result.cta}\n\n${hashtagStr}`.trim();

  res.json({
    success: true,
    description: result.description,
    caption: formattedCaption,
    hashtags: result.hashtags
  });
});

export default router;
