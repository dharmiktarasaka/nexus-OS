require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

const candidates = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash'
];

async function testAll() {
  for (const m of candidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] })
      });
      console.log(`Model ${m}: ${res.status}`);
      if (res.status === 200) {
        console.log(`>>> SUCCESS WITH ${m}! <<<`);
      }
    } catch (e) {
      console.log(`Model ${m}: error ${e.message}`);
    }
  }
}

testAll();
