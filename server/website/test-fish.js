require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

async function testFish() {
  const model = 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const prompt = 'The user wants: "fish website". Respond ONLY with valid JSON: {"category": "Aquarium & Marine Life", "brand": "string", "tagline": "string", "widget": "string"}';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Result:', data?.candidates?.[0]?.content?.parts?.[0]?.text);
}

testFish();
