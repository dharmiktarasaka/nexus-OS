require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

async function checkKey() {
  console.log('Testing with key:', key.slice(0, 10) + '...');
  
  // Test gemini-2.5-flash, gemini-2.5-pro, gemini-flash-latest, etc.
  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-pro'];
  
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }]
        })
      });
      console.log(`Model ${m}: status ${res.status}`);
      if (!res.ok) {
        console.log(`  Details:`, await res.text());
      } else {
        const d = await res.json();
        console.log(`  Response:`, d?.candidates?.[0]?.content?.parts?.[0]?.text);
      }
    } catch (err) {
      console.log(`Model ${m} threw:`, err.message);
    }
  }
}

checkKey();
