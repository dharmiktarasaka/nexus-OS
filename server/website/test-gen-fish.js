require('dotenv').config({ path: __dirname + '/.env' });
const { generateWebsite, analyzeUserPrompt } = require('./geminiService');

async function test() {
  console.log('Testing fish website generation with prompt: "fish website"...');
  const prompt = 'fish website';
  const blueprint = await analyzeUserPrompt({ prompt });
  console.log('Blueprint:', blueprint);

  const site = await generateWebsite({ prompt, category: blueprint.category, blueprint });
  console.log('Generated site name:', site.name);
  console.log('Provider:', site.provider);
  console.log('HTML preview:', site.html?.slice(0, 300));
}

test().catch(console.error);
