// client/src/website/utils/clientGenerator.js
// Universal Bespoke Website Synthesizer
// Produces visually stunning, production-ready, interactive modern websites with
// curated photography, responsive glassmorphic layouts, and working JavaScript widgets.

export function createClientFallbackProject(prompt = '', category = 'general', blueprint = null, user = null) {
  const p = (prompt || '').toLowerCase().trim();
  const now = new Date();
  const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 1. Intelligent Topic & Visual Hierarchy Resolution
  let topic = 'general';
  let defaultBrand = 'Vanguard Studio';
  let defaultTagline = 'Crafting Exceptional Digital Realities for Modern Visionaries';
  let defaultCategory = 'Digital Innovation & Creative Web';
  let primaryColor = '#0f172a';
  let accentColor = '#4f46e5';
  let heroImage = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
  let featureImage1 = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
  let featureImage2 = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80';

  let widgetTitle = 'Interactive Service Scope & Investment Estimator';
  let widgetSub = 'Customize your requirements to compute estimated turnaround, deliverables, and investment.';
  let widgetType = 'estimator'; // estimator | fish | pet | food | fitness | realestate | footwear | saas | jewelry | medical

  if (p.includes('fish') || p.includes('aquarium') || p.includes('marine') || p.includes('seafood') || p.includes('ocean') || p.includes('angler') || p.includes('reef')) {
    topic = 'fish';
    defaultBrand = 'AquaVibe Marine & Aquatics';
    defaultTagline = 'Pristine Living Reefs, Rare Tropical Species & Custom Living Aquariums';
    defaultCategory = 'Aquatic Ecosystems & Rare Marine Life';
    primaryColor = '#003366';
    accentColor = '#06b6d4';
    heroImage = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Interactive Aquarium Dimension & Volume Estimator';
    widgetSub = 'Calculate recommended biological filtration, water volume, and safe fish stocking capacity in real-time.';
    widgetType = 'fish';
  } else if (p.includes('pet') || p.includes('dog') || p.includes('cat') || p.includes('puppy') || p.includes('vet') || p.includes('veterinary')) {
    topic = 'pet';
    defaultBrand = 'PawHaven Wellness & Nutrition';
    defaultTagline = 'Organic Nutrition, Preventive Healthcare & Loving Concierge Pet Care';
    defaultCategory = 'Premium Pet Wellness & Veterinary Care';
    primaryColor = '#0f766e';
    accentColor = '#f59e0b';
    heroImage = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Personalized Pet Calorie & Daily Nutrition Planner';
    widgetSub = 'Input your pet’s weight and activity level to compute daily caloric intake and portion sizes.';
    widgetType = 'pet';
  } else if (p.includes('coffee') || p.includes('bakery') || p.includes('cafe') || p.includes('bread') || p.includes('restaurant') || p.includes('food') || p.includes('dining')) {
    topic = 'food';
    defaultBrand = 'Velvet & Crumb Artisan Roasters';
    defaultTagline = 'Heirloom Sourdough Bakes & Micro-Lot Specialty Single-Origin Roasts';
    defaultCategory = 'Artisan Hospitality & Dining';
    primaryColor = '#78350f';
    accentColor = '#d97706';
    heroImage = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Interactive Coffee Flavor Profiler & Table Reservation';
    widgetSub = 'Select roast preferences, origin notes, and reserve your artisanal tasting experience.';
    widgetType = 'food';
  } else if (p.includes('fitness') || p.includes('gym') || p.includes('workout') || p.includes('trainer') || p.includes('yoga') || p.includes('crossfit')) {
    topic = 'fitness';
    defaultBrand = 'AcroPulse High-Performance Athletics';
    defaultTagline = 'Data-Driven Human Optimization, Hybrid Strength & Elite Coaching';
    defaultCategory = 'High-Performance Athletics & Training';
    primaryColor = '#18181b';
    accentColor = '#e11d48';
    heroImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Interactive 1-Rep Max & Target Calorie Calculator';
    widgetSub = 'Calculate your estimated maximum strength and daily macronutrient requirements.';
    widgetType = 'fitness';
  } else if (p.includes('real estate') || p.includes('property') || p.includes('villa') || p.includes('architect') || p.includes('home') || p.includes('interior')) {
    topic = 'realestate';
    defaultBrand = 'Sovereign Architectural Living';
    defaultTagline = 'Masterpiece Coastal Villas and Prime Estates in Exclusive Global Locations';
    defaultCategory = 'Luxury Real Estate & Architectural Living';
    primaryColor = '#0f172a';
    accentColor = '#b45309';
    heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Mortgage & Rental Yield Investment Estimator';
    widgetSub = 'Simulate monthly amortization, rental yield potential, and long-term equity growth.';
    widgetType = 'realestate';
  } else if (p.includes('shoe') || p.includes('sneaker') || p.includes('footwear') || p.includes('clothing') || p.includes('fashion') || p.includes('apparel')) {
    topic = 'footwear';
    defaultBrand = 'KINETIX Footwear Atelier';
    defaultTagline = 'Engineered for Movement, Sculpted for High-Street Elegance';
    defaultCategory = 'Footwear & Streetwear Boutique';
    primaryColor = '#18181b';
    accentColor = '#e11d48';
    heroImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80';
    widgetTitle = '360° Colorway Studio & Fit Recommendation';
    widgetSub = 'Test colorways, choose your true US size, and add directly to your shopping bag.';
    widgetType = 'footwear';
  } else if (p.includes('saas') || p.includes('ai') || p.includes('software') || p.includes('tech') || p.includes('developer') || p.includes('workflow')) {
    topic = 'saas';
    defaultBrand = 'OmniFlow Intelligent Systems';
    defaultTagline = 'Autonomous Workflows, Real-time Observability & Next-Gen Cloud Orchestration';
    defaultCategory = 'Next-Gen Developer & AI Tooling';
    primaryColor = '#0f172a';
    accentColor = '#6366f1';
    heroImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Cloud Capacity & Autonomous Pipeline ROI Calculator';
    widgetSub = 'Estimate cloud resource savings, runtime acceleration, and monthly API tier pricing.';
    widgetType = 'estimator';
  } else if (p.includes('watch') || p.includes('jewelry') || p.includes('diamond') || p.includes('luxury')) {
    topic = 'jewelry';
    defaultBrand = 'Aura Timepieces & Haute Horlogerie';
    defaultTagline = 'Bespoke Mechanical Masterpieces and Rare Certified Diamonds';
    defaultCategory = 'Haute Horlogerie & Fine Jewels';
    primaryColor = '#09090b';
    accentColor = '#d4af37';
    heroImage = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80';
    featureImage1 = 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80';
    featureImage2 = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80';
    widgetTitle = 'Bespoke Diamond & Case Material Customizer';
    widgetSub = 'Configure precious metals, bezel finishes, and reserve your private boutique viewing.';
    widgetType = 'estimator';
  } else {
    // Intelligently extract meaningful brand name from user prompt
    const words = p.split(/\s+/).filter(w => w.length > 2 && !['want','create','make','website','please','site','the','and','for','with'].includes(w));
    if (words.length > 0) {
      const topicName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      defaultBrand = `${topicName} Studio`;
      defaultCategory = `${topicName} Solutions`;
      defaultTagline = `Elevating ${topicName} Through Modern Craftsmanship & Intelligent Design`;
    }
  }

  // 2. Resolve Brand, Colors & Typography
  const brandName = blueprint?.suggestedBrand || defaultBrand;
  const tagline = blueprint?.tagline || defaultTagline;
  const finalCategory = blueprint?.category || defaultCategory;
  const primary = blueprint?.colorPalette?.primary || primaryColor;
  const accent = blueprint?.colorPalette?.accent || accentColor;
  const fontHeading = blueprint?.typography?.headings || 'Plus Jakarta Sans';
  const fontBody = blueprint?.typography?.body || 'Plus Jakarta Sans';

  // 3. Render Bespoke Interactive Widget Based on Topic
  let widgetHTML = '';
  let widgetJS = '';

  if (widgetType === 'fish') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Aquarium Dimension & Volume Estimator</h3>
            <p>Calculate water capacity, filtration flow rate, and bioload balance.</p>
            
            <div class="input-field">
              <label>Tank Length (Inches): <span id="tankLengthVal">36</span> in</label>
              <input type="range" id="tankLength" min="12" max="96" value="36" class="slider-input">
            </div>

            <div class="input-field">
              <label>Tank Width (Inches): <span id="tankWidthVal">18</span> in</label>
              <input type="range" id="tankWidth" min="10" max="48" value="18" class="slider-input">
            </div>

            <div class="input-field">
              <label>Tank Height (Inches): <span id="tankHeightVal">24</span> in</label>
              <input type="range" id="tankHeight" min="12" max="48" value="24" class="slider-input">
            </div>

            <div class="input-field">
              <label>Ecosystem Type</label>
              <select id="ecosystemType" class="select-input">
                <option value="tropical">Freshwater Planted Aquascape</option>
                <option value="reef" selected>Coral Reef Marine Habitat</option>
                <option value="cichlid">African Rift Lake Cichlids</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Estimated Water Capacity</span>
              <span class="result-number" id="waterGallons">67 Gallons</span>
              <span class="result-sub" id="waterLiters">(approx. 254 Liters)</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Recommended Flow Rate:</span>
                <strong id="filterFlowRate">670 GPH</strong>
              </div>
              <div class="detail-row">
                <span>Recommended Heater Wattage:</span>
                <strong id="heaterWattage">200 Watts</strong>
              </div>
              <div class="detail-row">
                <span>Safe Fish Bioload Capacity:</span>
                <strong id="fishCapacity">Up to 22 community fish</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="bookAquariumConsultBtn">
              <span>Schedule Free Aquascaping Consultation</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const lSlider = document.getElementById('tankLength');
      const wSlider = document.getElementById('tankWidth');
      const hSlider = document.getElementById('tankHeight');
      const ecoSelect = document.getElementById('ecosystemType');

      function calculateAquarium() {
        const l = parseFloat(lSlider?.value || 36);
        const w = parseFloat(wSlider?.value || 18);
        const h = parseFloat(hSlider?.value || 24);

        if (document.getElementById('tankLengthVal')) document.getElementById('tankLengthVal').textContent = l;
        if (document.getElementById('tankWidthVal')) document.getElementById('tankWidthVal').textContent = w;
        if (document.getElementById('tankHeightVal')) document.getElementById('tankHeightVal').textContent = h;

        const gallons = Math.round((l * w * h) / 231);
        const liters = Math.round(gallons * 3.78541);
        const flowGPH = gallons * 10;
        const watts = Math.round(gallons * 3);
        const fishCount = Math.round(gallons / 3);

        if (document.getElementById('waterGallons')) document.getElementById('waterGallons').textContent = gallons + ' Gallons';
        if (document.getElementById('waterLiters')) document.getElementById('waterLiters').textContent = '(' + liters + ' Liters)';
        if (document.getElementById('filterFlowRate')) document.getElementById('filterFlowRate').textContent = flowGPH + ' GPH';
        if (document.getElementById('heaterWattage')) document.getElementById('heaterWattage').textContent = watts + ' Watts';
        if (document.getElementById('fishCapacity')) document.getElementById('fishCapacity').textContent = 'Up to ' + fishCount + ' community fish';
      }

      [lSlider, wSlider, hSlider, ecoSelect].forEach(el => el?.addEventListener('input', calculateAquarium));
      calculateAquarium();

      document.getElementById('bookAquariumConsultBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('🐠 Consultation request logged! An aquatic biologist will contact you within 24h.');
      });
    `;
  } else {
    // Universal Interactive Service Scope & Investment Estimator
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Project Scope & Estimation Configurator</h3>
            <p>Customize your requirements to compute estimated turnaround and deliverables.</p>

            <div class="input-field">
              <label>Service Tier</label>
              <div class="pill-selector" id="serviceTierGroup">
                <button type="button" class="tier-pill active" data-rate="1">Essential</button>
                <button type="button" class="tier-pill" data-rate="1.6">Executive</button>
                <button type="button" class="tier-pill" data-rate="2.4">Signature Bespoke</button>
              </div>
            </div>

            <div class="input-field">
              <label>Scale / Scope Units: <span id="scopeUnitsVal">3</span> units</label>
              <input type="range" id="scopeSlider" min="1" max="10" value="3" class="slider-input">
            </div>

            <div class="input-field">
              <label>Delivery Velocity</label>
              <select id="velocitySelect" class="select-input">
                <option value="standard" selected>Standard Timeline (2-3 Weeks)</option>
                <option value="express">Priority Rush (5-7 Business Days)</option>
                <option value="instant">Dedicated Sprint (48-72 Hours)</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Estimated Investment</span>
              <span class="result-number" id="calcTotalCost">$2,450</span>
              <span class="result-sub">All-inclusive fixed quote guarantee</span>
            </div>

            <div class="result-details">
              <div class="detail-row">
                <span>Selected Package:</span>
                <strong id="selectedTierLabel">Essential</strong>
              </div>
              <div class="detail-row">
                <span>Estimated Turnaround:</span>
                <strong id="turnaroundLabel">14 Business Days</strong>
              </div>
              <div class="detail-row">
                <span>Revision Guarantee:</span>
                <strong>Unlimited during sprint</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="claimQuoteBtn">
              <span>Lock-In This Tailored Package</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      let currentRate = 1;
      let currentTierName = 'Essential';
      const tierPills = document.querySelectorAll('.tier-pill');
      const scopeSlider = document.getElementById('scopeSlider');
      const velocitySelect = document.getElementById('velocitySelect');

      function updateEstimator() {
        const units = parseInt(scopeSlider?.value || 3);
        if (document.getElementById('scopeUnitsVal')) document.getElementById('scopeUnitsVal').textContent = units;

        let velocityMultiplier = 1;
        let days = 14;
        const vel = velocitySelect?.value || 'standard';
        if (vel === 'express') {
          velocityMultiplier = 1.35;
          days = 6;
        } else if (vel === 'instant') {
          velocityMultiplier = 1.75;
          days = 3;
        }

        const basePrice = 850;
        const total = Math.round(basePrice * currentRate * units * velocityMultiplier);

        if (document.getElementById('calcTotalCost')) document.getElementById('calcTotalCost').textContent = '$' + total.toLocaleString();
        if (document.getElementById('selectedTierLabel')) document.getElementById('selectedTierLabel').textContent = currentTierName;
        if (document.getElementById('turnaroundLabel')) document.getElementById('turnaroundLabel').textContent = days + ' Business Days';
      }

      tierPills.forEach(pill => {
        pill.addEventListener('click', () => {
          tierPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          currentRate = parseFloat(pill.getAttribute('data-rate'));
          currentTierName = pill.textContent.trim();
          updateEstimator();
        });
      });

      scopeSlider?.addEventListener('input', updateEstimator);
      velocitySelect?.addEventListener('change', updateEstimator);
      updateEstimator();

      document.getElementById('claimQuoteBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('✨ Proposal locked! Our director will deliver your formal intake packet within 2 hours.');
      });
    `;
  }

  // 4. Construct Complete, Ultra-Modern HTML
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} | ${tagline.slice(0, 55)}</title>
  <meta name="description" content="${brandName}: ${tagline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Header / Navigation Bar -->
  <header class="site-header" id="header">
    <div class="nav-container">
      <a href="#" class="brand-logo" aria-label="${brandName} Home">
        <span class="logo-symbol">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </span>
        <span class="brand-text"><strong>${brandName}</strong></span>
      </a>

      <nav class="main-nav" id="mainNav" aria-label="Primary navigation">
        <a href="#about" class="nav-link">Overview</a>
        <a href="#interactive" class="nav-link">Interactive Studio</a>
        <a href="#showcase" class="nav-link">Highlights</a>
        <a href="#testimonials" class="nav-link">Reviews</a>
        <a href="#faq" class="nav-link">FAQ</a>
      </nav>

      <div class="nav-actions">
        <button id="themeToggleBtn" class="icon-btn" aria-label="Toggle visual theme" title="Toggle theme">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="btn btn-primary" id="openContactModalBtn">
          <span>Get Started</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="hamburger-btn" id="mobileMenuToggle" aria-label="Open mobile menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer -->
  <div class="mobile-drawer" id="mobileDrawer">
    <div class="drawer-header">
      <span class="brand-text"><strong>${brandName}</strong></span>
      <button class="drawer-close-btn" id="closeDrawerBtn" aria-label="Close menu">&times;</button>
    </div>
    <div class="drawer-links">
      <a href="#about" class="drawer-link">Overview</a>
      <a href="#interactive" class="drawer-link">Interactive Studio</a>
      <a href="#showcase" class="drawer-link">Highlights</a>
      <a href="#testimonials" class="drawer-link">Reviews</a>
      <a href="#faq" class="drawer-link">FAQ</a>
      <button class="btn btn-primary btn-block" id="drawerContactBtn">Inquire Today</button>
    </div>
  </div>

  <main>
    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="badge-pill">
            <span class="pulse-dot"></span>
            <span>${finalCategory}</span>
          </div>
          <h1 class="hero-title">${tagline}</h1>
          <p class="hero-subtitle">
            Designed with accessible fluid layouts, verified credentials, and real interactive components tailored to your vision.
          </p>

          <div class="hero-cta-group">
            <a href="#interactive" class="btn btn-primary btn-lg">Launch Interactive Studio</a>
            <a href="#showcase" class="btn btn-outline btn-lg">Explore Showcase</a>
          </div>

          <div class="hero-metrics">
            <div class="metric-item">
              <span class="metric-num">99.8%</span>
              <span class="metric-lbl">Satisfaction Index</span>
            </div>
            <div class="metric-item">
              <span class="metric-num">24/7</span>
              <span class="metric-lbl">Concierge Support</span>
            </div>
            <div class="metric-item">
              <span class="metric-num">100%</span>
              <span class="metric-lbl">Bespoke Quality</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-frame">
            <img src="${heroImage}" alt="${brandName} showcase" class="hero-img">
            <div class="floating-badge">
              <span class="badge-dot"></span>
              <span>Verified Authenticity 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Widget Studio Section -->
    <section class="interactive-section" id="interactive">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Interactive Feature Suite</span>
          <h2>${widgetTitle}</h2>
          <p class="section-sub">${widgetSub}</p>
        </div>

        ${widgetHTML}
      </div>
    </section>

    <!-- Curated Showcase Section -->
    <section class="showcase-section" id="showcase">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Signature Excellence</span>
          <h2>Curated Highlights & Capabilities</h2>
          <p class="section-sub">Experience precision craftsmanship built around your distinct needs.</p>
        </div>

        <div class="showcase-grid">
          <article class="showcase-card">
            <div class="card-img-wrap">
              <img src="${featureImage1}" alt="${brandName} pillar one" class="card-img">
            </div>
            <div class="card-body">
              <span class="card-tag">Pillar 01</span>
              <h3>Exceptional Standards & Precision</h3>
              <p>Every element is curated and tested for durability, seamless performance, and aesthetic delight.</p>
            </div>
          </article>

          <article class="showcase-card">
            <div class="card-img-wrap">
              <img src="${featureImage2}" alt="${brandName} pillar two" class="card-img">
            </div>
            <div class="card-body">
              <span class="card-tag">Pillar 02</span>
              <h3>Modern Sustainable Craftsmanship</h3>
              <p>Eco-conscious sourcing and rigorous quality protocols engineered for peak longevity.</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section" id="testimonials">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Verified Reviews</span>
          <h2>Loved by Discerning Clients</h2>
        </div>

        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="star-rating">★★★★★</div>
            <p>"The level of detail and responsiveness exceeded all our expectations. Truly a state-of-the-art experience."</p>
            <div class="author-meta">
              <strong>Elena Rostova</strong>
              <span>Executive Director</span>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="star-rating">★★★★★</div>
            <p>"The interactive features and clean aesthetics made this an absolute pleasure to explore. 10/10 execution."</p>
            <div class="author-meta">
              <strong>Marcus Sterling</strong>
              <span>Verified Patron</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section" id="faq">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Clear Answers</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div class="faq-accordion" id="faqAccordion">
          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How was this platform tailored to my prompt?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Our autonomous synthesis engine architected a bespoke color palette, selected typography, and programmed interactive JavaScript widgets tailored to your specific niche.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>Is all the code standalone and exportable?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Yes. The HTML, CSS, and JS files have zero framework bloat and can be exported as a production ZIP and deployed directly to Vercel, Netlify, or any web host.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>Can I customize colors, brand names, and content?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Yes! You can edit code live in the multi-tab code editor or use the AI Copilot on the left to request modifications in natural language.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact & Lead Intake Modal Dialog -->
    <div class="modal-backdrop" id="contactModalBackdrop">
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="Contact Dialog">
        <div class="modal-header">
          <h3>Inquire with ${brandName}</h3>
          <button class="drawer-close-btn" id="closeContactModalBtn">&times;</button>
        </div>
        <form class="modal-form" id="contactIntakeForm">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="contactName" placeholder="Your name" required>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="contactEmail" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>Special Requests or Scope Details</label>
            <textarea id="contactNotes" rows="3" placeholder="Describe your inquiry..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Inquiry</button>
        </form>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-content">
      <p>© 2026 ${brandName}. Designed & Generated on Custom Prompt.</p>
      <div class="footer-links">
        <a href="#about">About</a>
        <a href="#interactive">Studio</a>
        <a href="#faq">FAQ</a>
      </div>
    </div>
  </footer>

  <!-- Toast Notification System -->
  <div class="toast-container" id="toastContainer" aria-live="polite"></div>

  <script src="script.js"></script>
</body>
</html>`;

  // 5. Construct Luxury CSS Design System
  const css = `/* styles.css - Bespoke Design System for ${brandName} */
:root {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-secondary: #475569;
  --border-subtle: #e2e8f0;
  --primary: ${primary};
  --primary-hover: #1e293b;
  --accent: ${accent};
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 6px 18px rgba(0,0,0,0.08);
  --shadow-lg: 0 16px 36px rgba(0,0,0,0.12);
  --font-heading: '${fontHeading}', sans-serif;
  --font-body: '${fontBody}', sans-serif;
}

[data-theme="dark"] {
  --bg-app: #0b1120;
  --bg-surface: #131d31;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-secondary: #cbd5e1;
  --border-subtle: #1e293b;
  --primary: #ffffff;
  --primary-hover: #f1f5f9;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 6px 18px rgba(0,0,0,0.5);
  --shadow-lg: 0 16px 36px rgba(0,0,0,0.6);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background: var(--bg-app);
  color: var(--text-main);
  line-height: 1.6;
  overflow-x: hidden;
  transition: background 0.3s ease, color 0.3s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Header */
.site-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
}
[data-theme="dark"] .site-header {
  background: rgba(19, 29, 49, 0.88);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.3rem;
  letter-spacing: -0.02em;
}

.logo-symbol {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-theme="dark"] .logo-symbol {
  color: #0f172a;
}

.main-nav {
  display: flex;
  gap: 1.75rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.nav-link:hover {
  color: var(--accent);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.icon-btn {
  background: none;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: var(--border-subtle);
  transform: translateY(-1px);
}

.sun-icon { display: none; }
.moon-icon { display: block; }
[data-theme="dark"] .sun-icon { display: block; }
[data-theme="dark"] .moon-icon { display: none; }

.hamburger-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.hamburger-btn .bar {
  width: 22px;
  height: 2px;
  background: var(--text-main);
  border-radius: 2px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.4rem;
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}
[data-theme="dark"] .btn-primary {
  color: #0f172a;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.btn-outline {
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
}
.btn-outline:hover {
  background: var(--bg-surface);
  border-color: var(--text-muted);
}
.btn-lg {
  padding: 0.9rem 1.8rem;
  font-size: 1.05rem;
}
.btn-block {
  width: 100%;
}

/* Hero Section */
.hero-section {
  padding: 5rem 0 4rem;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3.5rem;
  align-items: center;
}
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
  animation: pulseDot 2s infinite;
}
@keyframes pulseDot {
  0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
  100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
}

.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2.4rem, 4vw, 3.8rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}
.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 2.25rem;
  max-width: 580px;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.hero-metrics {
  display: flex;
  gap: 2.5rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 1.75rem;
}
.metric-item {
  display: flex;
  flex-direction: column;
}
.metric-num {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
}
.metric-lbl {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.visual-frame {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
}
.hero-img {
  width: 100%;
  height: 480px;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.visual-frame:hover .hero-img {
  transform: scale(1.03);
}
.floating-badge {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

/* Sections */
.interactive-section, .showcase-section, .testimonials-section, .faq-section {
  padding: 5rem 0;
}
.section-head {
  max-width: 650px;
  margin: 0 auto 3.5rem;
}
.text-center { text-align: center; }
.eyebrow {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: 0.6rem;
  display: inline-block;
}
.section-head h2 {
  font-family: var(--font-heading);
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.8rem;
}
.section-sub {
  color: var(--text-muted);
  font-size: 1.05rem;
}

/* Interactive Calculator Box */
.widget-interactive-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
}
.calculator-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
}
.calc-input-pane h3 {
  font-size: 1.4rem;
  margin-bottom: 0.4rem;
}
.calc-input-pane p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 1.75rem;
}
.input-field {
  margin-bottom: 1.5rem;
}
.input-field label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.slider-input {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
}
.select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.95rem;
}
.pill-selector {
  display: flex;
  gap: 0.5rem;
}
.tier-pill {
  flex: 1;
  padding: 0.6rem 0.8rem;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.tier-pill.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
[data-theme="dark"] .tier-pill.active {
  color: #0f172a;
}

.calc-output-pane {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.result-card {
  margin-bottom: 1.5rem;
}
.result-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: block;
}
.result-number {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--accent);
  display: block;
  margin: 0.2rem 0;
}
.result-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.result-details {
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 1.25rem 0;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

/* Showcase Grid */
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
}
.showcase-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.showcase-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.card-img-wrap {
  height: 220px;
  overflow: hidden;
}
.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.showcase-card:hover .card-img {
  transform: scale(1.05);
}
.card-body {
  padding: 1.75rem;
}
.card-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.4rem;
}
.card-body h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
}
.card-body p {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
.testimonial-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 2.25rem;
  box-shadow: var(--shadow-sm);
}
.star-rating {
  color: #f59e0b;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.testimonial-card p {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--text-main);
  margin-bottom: 1.5rem;
}
.author-meta strong {
  display: block;
  font-size: 0.95rem;
}
.author-meta span {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* FAQ Accordion */
.faq-accordion {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.faq-item {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  overflow: hidden;
}
.faq-question {
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.faq-arrow {
  font-size: 1.3rem;
  transition: transform 0.25s;
}
.faq-item.active .faq-arrow {
  transform: rotate(45deg);
}
.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 1.5rem;
  color: var(--text-muted);
  font-size: 0.92rem;
}
.faq-item.active .faq-answer {
  max-height: 200px;
  padding: 0 1.5rem 1.25rem;
}

/* Modal Dialog */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  padding: 1.5rem;
}
.modal-backdrop.open {
  opacity: 1;
  visibility: visible;
}
.modal-dialog {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: 2.25rem;
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.modal-header h3 {
  font-family: var(--font-heading);
}
.drawer-close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: var(--text-main);
}
.form-group {
  margin-bottom: 1.2rem;
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-family: inherit;
}

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  inset: 0;
  background: var(--bg-surface);
  z-index: 1002;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}
.mobile-drawer.open {
  transform: translateY(0);
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}
.drawer-link {
  text-decoration: none;
  color: var(--text-main);
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.toast {
  background: var(--text-main);
  color: var(--bg-surface);
  padding: 0.9rem 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.9rem;
  font-weight: 500;
  animation: slideToast 0.3s ease;
}
@keyframes slideToast {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Footer */
.site-footer {
  border-top: 1px solid var(--border-subtle);
  padding: 2.5rem 0;
  background: var(--bg-surface);
  font-size: 0.88rem;
  color: var(--text-muted);
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-links {
  display: flex;
  gap: 1.5rem;
}
.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
}
.footer-links a:hover {
  color: var(--accent);
}

@media (max-width: 900px) {
  .hero-grid, .calculator-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .main-nav {
    display: none;
  }
  .hamburger-btn {
    display: flex;
  }
  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}`;

  // 6. Construct Clean Vanilla JavaScript Logic
  const js = `// script.js - Bespoke Interactivity for ${brandName}
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle (Dark/Light mode)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const htmlRoot = document.documentElement;

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = htmlRoot.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', nextTheme);
  });

  // Mobile Drawer Navigation
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  mobileToggle?.addEventListener('click', () => mobileDrawer?.classList.add('open'));
  closeDrawerBtn?.addEventListener('click', () => mobileDrawer?.classList.remove('open'));
  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => mobileDrawer?.classList.remove('open'));
  });

  // Toast Notification System
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
  window.showToast = showToast;

  // Contact Modal Dialog
  const modalBackdrop = document.getElementById('contactModalBackdrop');
  const openModalBtn = document.getElementById('openContactModalBtn');
  const drawerContactBtn = document.getElementById('drawerContactBtn');
  const closeModalBtn = document.getElementById('closeContactModalBtn');
  const contactForm = document.getElementById('contactIntakeForm');

  function openModal() {
    modalBackdrop?.classList.add('open');
    mobileDrawer?.classList.remove('open');
  }
  function closeModal() {
    modalBackdrop?.classList.remove('open');
  }

  openModalBtn?.addEventListener('click', openModal);
  drawerContactBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value || 'Client';
    closeModal();
    showToast('✨ Thank you, ' + name + '! Your inquiry was received.');
    contactForm.reset();
  });

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !isExpanded);
      item.classList.toggle('active');
    });
  });

  ${widgetJS}
});
`;

  return {
    id: projectId,
    name: brandName,
    category: finalCategory,
    tagline: tagline,
    prompt: prompt || tagline,
    userId: user?.id || user?.uid || 'anonymous',
    userEmail: user?.email || '',
    html,
    css,
    js,
    seo: {
      metaTitle: `${brandName} | ${tagline.slice(0, 55)}`,
      metaDescription: `${brandName} provides industry-leading solutions for ${finalCategory}. Explore our interactive suite.`,
      keywords: [topic, finalCategory, 'modern website', 'bespoke design']
    },
    provider: 'Universal Bespoke Synthesis Engine',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    codeLength: {
      html: html.length,
      css: css.length,
      js: js.length
    }
  };
}

export function saveOfflineProject(project) {
  try {
    const existing = JSON.parse(localStorage.getItem('pulse_offline_projects') || '[]');
    const filtered = existing.filter(p => p.id !== project.id);
    filtered.unshift(project);
    localStorage.setItem('pulse_offline_projects', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to save offline project:', err);
  }
}
