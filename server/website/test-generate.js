const { analyzeUserPrompt, generateWebsite } = require('./geminiService');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
  console.log('Testing analyzeUserPrompt with shoe shop...');
  const prompt = 'i want to create one website for shoes shop so please create';
  try {
    const blueprint = await analyzeUserPrompt({ prompt });
    console.log('Blueprint analysis success:\n', JSON.stringify(blueprint, null, 2));

    console.log('\nTesting generateWebsite with shoe shop...');
    const website = await generateWebsite({
      prompt,
      category: blueprint.category,
      blueprint
    });
    console.log('Generated website name:', website.name);
    console.log('Provider used:', website.provider);
    console.log('HTML length:', website.html?.length);
    console.log('CSS length:', website.css?.length);
    console.log('JS length:', website.js?.length);
  } catch (err) {
    console.error('Test error:', err);
  }
}

run();
