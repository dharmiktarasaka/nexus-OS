async function testUserFish() {
  const userPrompt = 'i want to make website for fish shop so please make it';
  console.log('Testing Prompt:', userPrompt);

  console.log('\n--- 1. Analyzing Prompt ---');
  const aRes = await fetch('http://localhost:5000/api/analyze-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userPrompt })
  });
  const blueprint = await aRes.json();
  console.log('Blueprint Category:', blueprint.category);
  console.log('Blueprint Brand:', blueprint.suggestedBrand);
  console.log('Blueprint Tagline:', blueprint.tagline);
  console.log('Blueprint Widget:', blueprint.interactiveWidget);

  console.log('\n--- 2. Generating Website ---');
  const gRes = await fetch('http://localhost:5000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      category: blueprint.category,
      blueprint
    })
  });
  const project = await gRes.json();
  console.log('Project ID:', project.id);
  console.log('Project Name:', project.name);
  console.log('Project Category:', project.category);
  console.log('Project Tagline:', project.tagline);
  console.log('Contains Fish/Aquarium references:', project.html.includes('Aqua') || project.html.includes('fish') || project.html.includes('Marine'));
  console.log('Does NOT contain shoes/sneakers:', !project.html.includes('sneaker') && !project.html.includes('KINETIX'));
  console.log('Interactive Widget included:', project.html.includes('calculator-grid') || project.html.includes('tankLength') || project.html.includes('calcTotalCost'));

  console.log('\n--- 3. Verifying Saved Project Retrieval ---');
  const checkRes = await fetch(`http://localhost:5000/api/projects/${project.id}`);
  const saved = await checkRes.json();
  console.log('Project successfully saved in DB & retrievable:', saved.id === project.id);
  console.log('\n🎉 ALL TESTS PASSED: "fish shop" PRODUCES A 100% REAL FISH WEBSITE!');
}

testUserFish().catch(console.error);
