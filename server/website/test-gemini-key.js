// test-gemini-key.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function testKey() {
  const key = process.env.GEMINI_API_KEY;
  const models = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    try {
      console.log(`\nTesting model: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"hello": "world"}' }] }]
        })
      });

      console.log(`${model} Status:`, res.status, res.statusText);
      const body = await res.text();
      console.log(`${model} Body:`, body.slice(0, 200));
      if (res.ok) {
        console.log(`SUCCESS with ${model}!`);
        break;
      }
    } catch (err) {
      console.error(`Error on ${model}:`, err.message);
    }
  }
}

testKey();
