// list-models.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    console.log('List models status:', res.status);
    const data = await res.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(m => console.log(' -', m.name));
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
