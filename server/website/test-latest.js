require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

async function test(model) {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with valid JSON: {"status": "ok"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    console.log(`${model}: status ${res.status} in ${Date.now() - start}ms`);
  } catch (err) {
    console.log(`${model} error:`, err.message);
  }
}

async function main() {
  await test('gemini-flash-latest');
  await test('gemini-flash-lite-latest');
  await test('gemini-pro-latest');
}
main();
