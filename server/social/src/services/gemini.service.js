// server/social/src/services/gemini.service.js
// High-performance AI Social Caption Generator via Google Gemini Flash

export async function generateCaptionWithGemini(imageUrl, tone = 'attractive', prompt = '') {
  const activeKey = process.env.GEMINI_API_KEY || '';
  if (!activeKey) return null;
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const systemInstruction = `
You are an elite Social Media Copywriter and Growth Strategist for Mediamation.
Create high-engagement social media copy matching this tone: "${tone}".
User custom prompt or focus: "${prompt || 'Highlight value, brand appeal and community engagement'}".
Image URL being shared: "${imageUrl}".

Return ONLY a valid JSON object matching this schema:
{
  "description": "Visual summary of the creative asset",
  "caption": "Punchy, engaging multi-line caption body formatted with relevant emojis",
  "cta": "Engaging call-to-action line (e.g. 'Drop a comment below 👇 or tap link in bio to learn more!')",
  "hashtags": ["growth", "innovation", "trending", "brand", "community"]
}
`;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemInstruction }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (e) {
      // Continue to next model
    }
  }

  // Graceful bespoke fallback
  return {
    description: 'High-engagement social media visual asset',
    caption: `Transforming visions into reality ✨ Elevate your social presence and connect with what matters most. ${prompt ? `\n\n${prompt}` : ''}`,
    cta: 'Double-tap if you agree and share your thoughts in the comments! 👇',
    hashtags: ['growth', 'innovation', 'digitaltrends', 'brandstrategy', 'creativity']
  };
}

