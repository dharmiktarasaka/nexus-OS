require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

async function testModel(model) {
  const start = Date.now();
  console.log(`Testing ${model}...`);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(35000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with valid JSON: {"status": "ok", "brand": "KINETIX", "tagline": "Run the city"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const elapsed = Date.now() - start;
    console.log(`${model}: status ${res.status} in ${elapsed}ms`);
    if (res.ok) {
      const data = await res.json();
      console.log(`${model} response text:`, data?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 100));
    } else {
      console.log(`${model} error:`, (await res.text()).slice(0, 100));
    }
  } catch (err) {
    console.log(`${model} failed:`, err.message);
  }
}

async function main() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-3.8-flash');
  await testModel('gemini-flash-latest');
}
main();
