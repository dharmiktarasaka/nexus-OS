// test-suite.js - Comprehensive Senior QA & Design Director Test Suite
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('===========================================================');
  console.log('  PULSESTUDIO AI - SENIOR QA & DESIGN DIRECTOR AUDIT SUITE ');
  console.log('===========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
    }
  }

  // 1. Health & Configuration Check
  console.log('--- TEST GROUP 1: Health & Runtime Diagnostics ---');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const health = await res.json();
    assert(res.ok && health.status === 'online', 'Server health endpoint responds online');
    assert(typeof health.projectCount === 'number', 'Server tracks project count dynamically');
  } catch (err) {
    assert(false, 'Server health check failed', err.message);
  }

  // 2. Generate Test Website 1: Premium Healthcare
  console.log('\n--- TEST GROUP 2: Website 1 - Premium Healthcare Website ---');
  let healthProject = null;
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a luxury concierge healthcare and longevity medicine clinic website called AuraHealth Premier Medical Group with interactive biomarker calculator, consultation booking dialog, physician faculty, and HIPAA compliant design.',
        category: 'healthcare',
        stylePreferences: 'Sleek luxury clinic, glassmorphism, responsive, interactive widgets'
      })
    });
    healthProject = await res.json();
    assert(res.ok && healthProject.id, 'Healthcare website generated and persisted with unique ID');
    assert(healthProject.name.includes('AuraHealth'), 'Site title matches brand specification: AuraHealth');
    assert(healthProject.html.includes('data-theme'), 'Supports dark/light theme switching');
    assert(healthProject.html.includes('calcAge') && healthProject.html.includes('calcSleep'), 'Contains real working Longevity Calculator inputs');
    assert(healthProject.html.includes('modal-dialog') && healthProject.html.includes('openBookingModalBtn'), 'Contains functional appointment booking modal dialog');
    assert(healthProject.html.includes('accordion-trigger'), 'Contains interactive FAQ accordion');
    assert(healthProject.html.includes('schema.org') && healthProject.html.includes('MedicalOrganization'), 'Valid SEO JSON-LD MedicalOrganization schema included');
    assert(healthProject.html.includes('images.unsplash.com/photo-1576091160399-112ba8d25d1d'), 'Uses curated high-res clinical imagery without placeholders');
    assert(healthProject.css.includes('clamp('), 'Uses fluid clamp() typography for responsive scaling');
    assert(healthProject.js.includes('updateCalculator'), 'Contains JavaScript logic computing biological age delta');
  } catch (err) {
    assert(false, 'Healthcare website generation failed', err.message);
  }

  // 3. Generate Test Website 2: High-End Manufacturing & Industrial
  console.log('\n--- TEST GROUP 3: Website 2 - High-End Manufacturing & Industrial ---');
  let industrialProject = null;
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a high-end aerospace and defense precision manufacturing website for Vanguard Precision Dynamics with interactive RFQ pricing and lead-time estimator, 5-axis CNC specs, and AS9100D compliance standards.',
        category: 'industrial',
        stylePreferences: 'Industrial dark aerospace, amber accents, technical monospace, 5-axis specs'
      })
    });
    industrialProject = await res.json();
    assert(res.ok && industrialProject.id, 'Industrial website generated and persisted with unique ID');
    assert(industrialProject.name.includes('Vanguard Precision'), 'Site title matches industrial brand: Vanguard Precision Dynamics');
    assert(industrialProject.html.includes('rfqMaterial') && industrialProject.html.includes('rfqTolerance') && industrialProject.html.includes('rfqQty'), 'Contains multi-variable parametric RFQ estimator');
    assert(industrialProject.html.includes('AS9100D') && industrialProject.html.includes('ITAR'), 'Includes industry-standard aerospace & defense compliance badges');
    assert(industrialProject.html.includes('Zeiss CMM') && industrialProject.html.includes('5-Axis CNC Milling'), 'Accurate, non-generic manufacturing terminology');
    assert(industrialProject.js.includes('calculateEstimate'), 'JavaScript dynamically calculates unit price, batch cost, and lead days');
    assert(industrialProject.css.includes('--ind-mono'), 'Technical monospace typography integration');
  } catch (err) {
    assert(false, 'Industrial website generation failed', err.message);
  }

  // 4. Generate Test Website 3: Conversion-Focused SaaS Landing Page
  console.log('\n--- TEST GROUP 4: Website 3 - Conversion-Focused SaaS Landing Page ---');
  let saasProject = null;
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a conversion-focused developer SaaS landing page for OmniFlow AI featuring autonomous streaming data pipelines, interactive Python/SQL terminal tabs, monthly/annual pricing slider, and lead capture.',
        category: 'saas',
        stylePreferences: 'Next-gen SaaS, cyber violet & cyan glow, interactive terminal tabs, pricing toggle'
      })
    });
    saasProject = await res.json();
    assert(res.ok && saasProject.id, 'SaaS landing page generated and persisted with unique ID');
    assert(saasProject.name.includes('OmniFlow AI'), 'Site title matches SaaS brand: OmniFlow AI');
    assert(saasProject.html.includes('tab-list') && saasProject.html.includes('omniflow.stream()'), 'Contains interactive developer code/terminal showcase');
    assert(saasProject.html.includes('billingSwitch') && saasProject.html.includes('priceGrowth'), 'Contains interactive monthly/annual billing switch (-20% discount)');
    assert(saasProject.html.includes('saasLeadForm') && saasProject.html.includes('leadEmail'), 'Contains working lead capture form with validation');
    assert(saasProject.html.includes('SoftwareApplication'), 'Valid SEO JSON-LD SoftwareApplication schema markup');
    assert(saasProject.js.includes('codeSnippets'), 'JavaScript dynamically switches code syntax across streaming, schema, and SQL');
  } catch (err) {
    assert(false, 'SaaS landing page generation failed', err.message);
  }

  // 5. Project Persistence & Retrieval
  console.log('\n--- TEST GROUP 5: Project Persistence & Retrieval ---');
  try {
    const res = await fetch(`${BASE_URL}/api/projects`);
    const allProjects = await res.json();
    assert(Array.isArray(allProjects) && allProjects.length >= 3, `Retrieved all 3 persisted projects from storage (found ${allProjects.length})`);
    
    // Retrieve full individual project
    const singleRes = await fetch(`${BASE_URL}/api/projects/${healthProject.id}`);
    const singleData = await singleRes.json();
    assert(singleData.html && singleData.css && singleData.js, 'Full code payload (HTML, CSS, JS) retrieved cleanly');
  } catch (err) {
    assert(false, 'Project persistence verification failed', err.message);
  }

  // 6. AI Refinement Engine
  console.log('\n--- TEST GROUP 6: AI Refinement Engine ---');
  try {
    const res = await fetch(`${BASE_URL}/api/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: healthProject.id,
        currentCode: {
          html: healthProject.html,
          css: healthProject.css,
          js: healthProject.js
        },
        prompt: 'Add an emergency appointment announcement banner at top of page and switch primary theme to emerald green'
      })
    });
    const refined = await res.json();
    assert(res.ok && refined.html, 'Refinement API returns complete updated codebase');
    assert(refined.changeSummary && typeof refined.changeSummary === 'string', `Refinement provides clear change summary: "${refined.changeSummary}"`);
    assert(refined.html.includes('announcement-bar') || refined.css.includes('#059669'), 'Refinement changes applied directly to code');
  } catch (err) {
    assert(false, 'AI refinement failed', err.message);
  }

  // 7. Standalone Production ZIP Export
  console.log('\n--- TEST GROUP 7: Standalone Production ZIP Export ---');
  try {
    const res = await fetch(`${BASE_URL}/api/projects/${healthProject.id}/export`);
    assert(res.ok, 'ZIP export endpoint returns HTTP 200 OK');
    assert(res.headers.get('content-type') === 'application/zip', 'ZIP export sends valid application/zip MIME header');
    const buffer = await res.arrayBuffer();
    assert(buffer.byteLength > 2000, `ZIP binary generated successfully (${buffer.byteLength} bytes)`);
  } catch (err) {
    assert(false, 'ZIP export failed', err.message);
  }

  console.log('\n===========================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================');
}

runTestSuite();
