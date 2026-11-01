// client/src/website/utils/clientGenerator.js
// Client-side resilient synthesis engine that guarantees generation never fails

export function createClientFallbackProject(prompt = '', category = 'general', blueprint = null, user = null) {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const now = new Date();
  const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Extract or generate brand and category
  let brand = blueprint?.suggestedBrand;
  let cat = blueprint?.category || category;
  let tagline = blueprint?.tagline;
  let primaryColor = blueprint?.colorPalette?.primary || '#4f46e5';
  let accentColor = blueprint?.colorPalette?.accent || '#06b6d4';
  let widgetName = blueprint?.interactiveWidget || 'Interactive Cost & Schedule Estimator';

  if (!brand) {
    if (lower.includes('coffee') || lower.includes('bakery') || lower.includes('cafe')) {
      brand = 'Velvet & Crumb Artisan Roasters';
      cat = 'Artisan Hospitality & Dining';
      tagline = 'Single-Origin Roasts & Heirloom Sourdough Bakes';
      primaryColor = '#78350f';
      accentColor = '#d97706';
      widgetName = 'Interactive Coffee Flavor Profiler & Table Booking';
    } else if (lower.includes('pet') || lower.includes('vet') || lower.includes('dog') || lower.includes('cat')) {
      brand = 'PawHaven Wellness & Care';
      cat = 'Premium Pet Wellness & Veterinary';
      tagline = 'Organic Nutrition & Loving Concierge Pet Care';
      primaryColor = '#0f766e';
      accentColor = '#f59e0b';
      widgetName = 'Personalized Pet Calorie & Daily Nutrition Calculator';
    } else if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('clothing') || lower.includes('store')) {
      brand = 'KINETIX Footwear Atelier';
      cat = 'Footwear & Streetwear Boutique';
      tagline = 'Engineered for Movement, Sculpted for High-Street Elegance';
      primaryColor = '#18181b';
      accentColor = '#e11d48';
      widgetName = 'Interactive 360° Customizer & Sizing Studio';
    } else if (lower.includes('aquarium') || lower.includes('fish') || lower.includes('marine')) {
      brand = 'AquaVibe Marine & Aquatics';
      cat = 'Aquatic Ecosystems & Rare Marine Life';
      tagline = 'Pristine Living Reefs, Rare Tropical Species & Custom Tanks';
      primaryColor = '#003366';
      accentColor = '#06b6d4';
      widgetName = 'Interactive Aquarium Ecosystem & Volume Calculator';
    } else if (lower.includes('real estate') || lower.includes('villa') || lower.includes('home') || lower.includes('property')) {
      brand = 'Sovereign Estates & Villas';
      cat = 'Luxury Real Estate & Architectural Living';
      tagline = 'Architectural Masterpieces in the World’s Most Coveted Locations';
      primaryColor = '#0f172a';
      accentColor = '#b45309';
      widgetName = 'Interactive Mortgage & Rental Yield Investment Calculator';
    } else {
      const words = p.split(/\s+/).filter(w => w.length > 2 && !['create','make','website','please','site','the','and','for','with'].includes(w.toLowerCase()));
      const mainWord = words.length > 0 ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() : 'Modern';
      brand = `${mainWord} Studio`;
      cat = `${mainWord} Solutions`;
      tagline = `Elevating ${mainWord} Through Intelligent Design & Modern Craftsmanship`;
    }
  }

  if (!tagline) {
    tagline = `The Premier Digital Platform for ${brand}`;
  }

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand} | ${tagline}</title>
  <meta name="description" content="Welcome to ${brand}. ${tagline}. Fully responsive, interactive modern web platform.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Header Navigation -->
  <header class="site-header">
    <div class="nav-container">
      <a href="#" class="brand-logo">
        <span class="logo-dot"></span>
        <span class="brand-title">${brand}</span>
      </a>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="#interactive-tool">Interactive Studio</a>
        <a href="#reviews">Testimonials</a>
        <a href="#contact" class="btn-nav">Get Started</a>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-content">
      <div class="hero-badge">
        <span>✨ Next-Gen Web Experience</span>
      </div>
      <h1 class="hero-title">${brand}</h1>
      <p class="hero-tagline">${tagline}</p>
      <div class="hero-actions">
        <a href="#interactive-tool" class="btn-primary">Launch Interactive Studio</a>
        <a href="#features" class="btn-secondary">Explore Capabilities</a>
      </div>
      <div class="hero-social-proof">
        <div class="rating-stars">★★★★★</div>
        <p>Trusted by over 10,000+ happy clients & modern enterprises</p>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="features-section">
    <div class="section-header">
      <h2>Engineered for Excellence</h2>
      <p>Precision-crafted components and intelligent design built specifically for your needs.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="card-icon">⚡</div>
        <h3>Ultra Performance</h3>
        <p>Lightning-fast execution, zero bloat, and sub-second load times engineered with modern best practices.</p>
      </div>
      <div class="feature-card">
        <div class="card-icon">🛡️</div>
        <h3>Enterprise Security</h3>
        <p>End-to-end data privacy, strict access isolation, and hardened security standards right out of the box.</p>
      </div>
      <div class="feature-card">
        <div class="card-icon">🎨</div>
        <h3>Dynamic Customization</h3>
        <p>Fluid, responsive design that seamlessly adapts across mobile, tablet, and 4K desktop displays.</p>
      </div>
    </div>
  </section>

  <!-- Interactive Widget Section -->
  <section id="interactive-tool" class="widget-section">
    <div class="widget-box">
      <div class="widget-header">
        <h3>${widgetName}</h3>
        <p>Adjust the sliders below to calculate live estimates in real-time.</p>
      </div>
      <div class="widget-controls">
        <div class="control-group">
          <label for="volumeSlider">Capacity & Scope: <span id="volumeValue">50 units</span></label>
          <input type="range" id="volumeSlider" min="10" max="250" value="50" class="slider-input">
        </div>
        <div class="control-group">
          <label for="tierSelect">Service Tier</label>
          <select id="tierSelect" class="select-input">
            <option value="1">Standard Tier (Essential)</option>
            <option value="1.5" selected>Professional Tier (Recommended)</option>
            <option value="2.2">Enterprise Concierge (Full Support)</option>
          </select>
        </div>
        <div class="calculator-result-card">
          <span class="result-label">Calculated Estimate:</span>
          <span id="calculatedOutput" class="result-amount">$1,450 / mo</span>
        </div>
        <button id="bookConsultBtn" class="btn-widget-action">Reserve My Allocation</button>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="reviews" class="testimonials-section">
    <div class="section-header">
      <h2>What Our Clients Say</h2>
    </div>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <p>"${brand} completely transformed our operations. The interface is intuitive, beautiful, and our conversion rate jumped by 42% in the first month."</p>
        <div class="author-info">
          <strong>Sarah Jenkins</strong>
          <span>Managing Director, Apex Global</span>
        </div>
      </div>
      <div class="testimonial-card">
        <p>"The level of detail and responsiveness is extraordinary. Everything feels bespoke, fast, and remarkably polished."</p>
        <div class="author-info">
          <strong>David Miller</strong>
          <span>Founder & CEO, Horizon Studio</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer id="contact" class="site-footer">
    <div class="footer-container">
      <div class="footer-brand">
        <h3>${brand}</h3>
        <p>${tagline}</p>
      </div>
      <div class="footer-copy">
        <p>&copy; ${now.getFullYear()} ${brand}. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

  const css = `/* Stylesheet for ${brand} */
:root {
  --primary: ${primaryColor};
  --primary-hover: #3730a3;
  --accent: ${accentColor};
  --bg-main: #f8fafc;
  --bg-surface: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-subtle: #e2e8f0;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-heading: 'Outfit', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background: var(--bg-main);
  color: var(--text-main);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Header */
.site-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
  padding: 1rem 2rem;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.25rem;
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.8rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.15s ease;
}

.nav-links a:hover {
  color: var(--primary);
}

.btn-nav {
  padding: 0.5rem 1.2rem;
  background: var(--primary);
  color: #fff !important;
  border-radius: var(--radius-sm);
  font-weight: 700 !important;
  transition: transform 0.15s ease;
}

.btn-nav:hover {
  transform: translateY(-1px);
}

/* Hero Section */
.hero-section {
  padding: 6rem 2rem 5rem;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, var(--bg-main) 100%);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.2);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1.2rem;
}

.hero-tagline {
  font-size: 1.15rem;
  color: var(--text-muted);
  max-width: 650px;
  margin: 0 auto 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.btn-primary {
  padding: 0.9rem 2rem;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.btn-secondary {
  padding: 0.9rem 2rem;
  background: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease;
}

.btn-secondary:hover {
  background: #f1f5f9;
}

.hero-social-proof {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.rating-stars {
  color: #f59e0b;
  letter-spacing: 2px;
  font-size: 1.1rem;
}

/* Features */
.features-section {
  padding: 5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.section-header h2 {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 0.6rem;
}

.section-header p {
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2.2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 1.2rem;
}

.feature-card h3 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  margin-bottom: 0.6rem;
}

.feature-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Interactive Widget */
.widget-section {
  padding: 5rem 2rem;
  background: #ffffff;
}

.widget-box {
  max-width: 700px;
  margin: 0 auto;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 3rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
}

.widget-header {
  text-align: center;
  margin-bottom: 2rem;
}

.widget-header h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}

.widget-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.widget-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-group label {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.slider-input {
  width: 100%;
  accent-color: var(--primary);
  height: 6px;
  cursor: pointer;
}

.select-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
}

.calculator-result-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.result-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.result-amount {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
}

.btn-widget-action {
  padding: 1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-widget-action:hover {
  opacity: 0.9;
}

/* Testimonials */
.testimonials-section {
  padding: 5rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.testimonial-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 2rem;
}

.testimonial-card p {
  font-style: italic;
  color: var(--text-main);
  margin-bottom: 1.2rem;
}

.author-info strong {
  display: block;
  font-size: 0.9rem;
}

.author-info span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Footer */
.site-footer {
  padding: 3rem 2rem;
  background: var(--text-main);
  color: #fff;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.footer-brand h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.3rem;
}

.footer-brand p {
  color: #94a3b8;
  font-size: 0.85rem;
}

.footer-copy p {
  color: #64748b;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .hero-section { padding: 4rem 1.5rem 3rem; }
  .widget-box { padding: 1.5rem; }
}
`;

  const js = `// Interactive Logic for ${brand}
document.addEventListener('DOMContentLoaded', () => {
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const tierSelect = document.getElementById('tierSelect');
  const calculatedOutput = document.getElementById('calculatedOutput');
  const bookConsultBtn = document.getElementById('bookConsultBtn');

  function updateCalculation() {
    if (!volumeSlider || !tierSelect || !calculatedOutput) return;
    const units = parseInt(volumeSlider.value, 10);
    const tierMultiplier = parseFloat(tierSelect.value);

    if (volumeValue) {
      volumeValue.textContent = units + ' units';
    }

    const baseRate = 20;
    const total = Math.round(units * baseRate * tierMultiplier);
    calculatedOutput.textContent = '$' + total.toLocaleString() + ' / mo';
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', updateCalculation);
  }
  if (tierSelect) {
    tierSelect.addEventListener('change', updateCalculation);
  }

  if (bookConsultBtn) {
    bookConsultBtn.addEventListener('click', () => {
      bookConsultBtn.textContent = '✓ Allocation Confirmed!';
      bookConsultBtn.style.backgroundColor = '#10b981';
      setTimeout(() => {
        bookConsultBtn.textContent = 'Reserve My Allocation';
        bookConsultBtn.style.backgroundColor = '';
      }, 3000);
    });
  }

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
`;

  const resolvedOwner = user?.uid || user?.id || 'anonymous';
  const resolvedEmail = user?.email || '';

  return {
    id: projectId,
    ownerId: resolvedOwner,
    userId: resolvedOwner,
    userEmail: resolvedEmail,
    name: brand,
    category: cat,
    tagline,
    prompt: p,
    html,
    css,
    js,
    seo: {
      metaTitle: `${brand} | ${tagline}`,
      metaDescription: `Discover ${brand}. ${tagline}. Built with autonomous AI web synthesis.`,
      keywords: [cat.toLowerCase(), 'bespoke web design', 'interactive app'],
      schemaType: 'Organization'
    },
    promptHistory: [
      { prompt: p, timestamp: now.toISOString(), changeSummary: 'Initial generation' }
    ],
    provider: 'Autonomous Synthesis Engine',
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

