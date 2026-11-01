// test-analyze.js
async function test() {
  const prompt = "i want to create one webiste for shoes shop so please create";
  console.log('Sending prompt to /api/analyze-prompt:', prompt);
  try {
    const res = await fetch('http://localhost:5000/api/analyze-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('AI Analysis Result:\n', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
