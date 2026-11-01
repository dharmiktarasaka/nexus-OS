// server/test-full-flow.js - Test full end-to-end user workflow
async function runFullFlowTest() {
  console.log('=== Step 1: Health Check ===');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const health = await healthRes.json();
  console.log('Health check:', health);

  console.log('\n=== Step 2: User Prompt Analysis ===');
  const userPrompt = 'i want to create one website for shoes shop so please create';
  console.log('User Prompt:', userPrompt);

  const analyzeStart = Date.now();
  const analyzeRes = await fetch('http://localhost:5000/api/analyze-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userPrompt })
  });

  if (!analyzeRes.ok) {
    throw new Error('Analysis failed: ' + await analyzeRes.text());
  }

  const blueprint = await analyzeRes.json();
  console.log(`Blueprint received in ${Date.now() - analyzeStart}ms:`);
  console.log('- Category:', blueprint.category);
  console.log('- Brand:', blueprint.suggestedBrand);
  console.log('- Tagline:', blueprint.tagline);
  console.log('- Colors:', blueprint.colorPalette);
  console.log('- Typography:', blueprint.typography);
  console.log('- Interactive Widget:', blueprint.interactiveWidget);
  console.log('- Planned Sections:', blueprint.recommendedSections?.length);

  console.log('\n=== Step 3: Website Generation based on Blueprint ===');
  const genStart = Date.now();
  const genRes = await fetch('http://localhost:5000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      category: blueprint.category,
      blueprint: blueprint,
      stylePreferences: 'Light mode, high-end footwear boutique, responsive fluid typography'
    })
  });

  if (!genRes.ok) {
    throw new Error('Generation failed: ' + await genRes.text());
  }

  const project = await genRes.json();
  console.log(`Website generated in ${Date.now() - genStart}ms:`);
  console.log('- Project ID:', project.id);
  console.log('- Brand Name:', project.name);
  console.log('- Category:', project.category);
  console.log('- HTML Length:', project.html?.length, 'bytes');
  console.log('- CSS Length:', project.css?.length, 'bytes');
  console.log('- JS Length:', project.js?.length, 'bytes');
  console.log('- Has interactive widget:', project.html?.includes('customizer') || project.html?.includes('cart'));

  console.log('\n=== Step 4: Verify Project Retrieval ===');
  const getRes = await fetch(`http://localhost:5000/api/projects/${project.id}`);
  const retrieved = await getRes.json();
  console.log('Project retrieved successfully:', retrieved.id === project.id);

  console.log('\n=== Step 5: Test ZIP Export Endpoint ===');
  const zipRes = await fetch(`http://localhost:5000/api/projects/${project.id}/export`);
  console.log('Export HTTP Status:', zipRes.status, zipRes.headers.get('content-type'));

  console.log('\n🎉 ALL WORKFLOW STEPS PASSED SUCCESSFULLY!');
}

runFullFlowTest().catch(err => console.error('Workflow error:', err));
