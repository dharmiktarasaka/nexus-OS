require('dotenv').config({ path: __dirname + '/.env' });
const key = process.env.GEMINI_API_KEY;

async function testModel(m) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
  const prompt = 'User wants a fish aquarium website. Return JSON: {"name": "Aquaria", "category": "Aquatics"}';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    console.log(`${m}: status ${res.status}`);
    if (res.ok) {
      console.log(`${m} output:`, await res.text());
    } else {
      console.log(`${m} err:`, (await res.text()).slice(0, 100));
    }
  } catch (err) {
    console.log(`${m} threw:`, err.message);
  }
}

async function main() {
  await testModel('gemini-3-flash-preview');
  await testModel('gemma-4-26b-a4b-it');
}
main();
