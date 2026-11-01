// server/ecommerceGenerator.js - High-fidelity footwear & e-commerce generator
function generateEcommerceSite(prompt = '', blueprint = null) {
  const brand = blueprint?.suggestedBrand || 'KINETIX Footwear';
  const tagline = blueprint?.tagline || 'Engineered for Pavement, Sculpted for Street Elegance';
  const primaryColor = blueprint?.colorPalette?.primary || '#0f172a';
  const accentColor = blueprint?.colorPalette?.accent || '#e11d48';

  return {
    name: brand,
    category: 'ecommerce',
    tagline,
    seo: {
      title: `${brand} | Performance Footwear & Sneaker Boutique`,
      description: `Discover ${brand}. ${tagline}. Featuring precision cushioning, limited seasonal colorways, and bespoke fit architecture.`,
      keywords: ['sneakers', 'footwear', 'athletic shoes', 'streetwear', 'limited edition drops', 'designer kicks'],
      schemaType: 'Store'
    },
    html: `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand} | Performance Footwear & Sneaker Boutique</title>
  <meta name="description" content="Discover ${brand}. ${tagline}. Limited edition drops and bespoke ergonomics.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "${brand}",
    "description": "${tagline}",
    "priceRange": "$$$",
    "currenciesAccepted": "USD"
  }
  </script>
</head>
<body>
  <!-- Announcement Bar -->
  <aside class="announcement-bar" role="region" aria-label="Announcement">
    <div class="announcement-content">
      <span>🔥 Worldwide Express Shipping On Orders Over $150 • Free 30-Day Returns</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="site-header" id="header">
    <div class="nav-container">
      <a href="#" class="brand-logo" aria-label="${brand} Home">
        <span class="logo-symbol">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 17l10 5 10-5M2 12l10 5 10-5M12 2l10 5-10 5L2 7l10-5z"/></svg>
        </span>
        <span class="brand-text"><strong>${brand}</strong></span>
      </a>

      <nav class="main-nav" id="mainNav" aria-label="Primary navigation">
        <a href="#featured" class="nav-link">New Releases</a>
        <a href="#customizer" class="nav-link">360° Studio</a>
        <a href="#technology" class="nav-link">Sole Ergonomics</a>
        <a href="#reviews" class="nav-link">Community</a>
        <a href="#faq" class="nav-link">Fit Guide & FAQ</a>
      </nav>

      <div class="nav-actions">
        <button id="themeToggleBtn" class="icon-btn" aria-label="Toggle theme" title="Toggle theme">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="cart-trigger-btn" id="openCartBtn" aria-label="Open Shopping Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="cart-badge" id="cartCountBadge">0</span>
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
      <span class="brand-text"><strong>${brand}</strong></span>
      <button class="drawer-close-btn" id="closeDrawerBtn" aria-label="Close menu">&times;</button>
    </div>
    <div class="drawer-links">
      <a href="#featured" class="drawer-link">New Drops</a>
      <a href="#customizer" class="drawer-link">360° Studio</a>
      <a href="#technology" class="drawer-link">Sole Ergonomics</a>
      <a href="#reviews" class="drawer-link">Lookbook</a>
      <a href="#faq" class="drawer-link">FAQ</a>
    </div>
  </div>

  <!-- Slide-out Shopping Cart Drawer -->
  <div class="cart-overlay" id="cartOverlay"></div>
  <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
    <div class="cart-header">
      <h3>Your Bag (<span id="cartDrawerCount">0</span>)</h3>
      <button class="drawer-close-btn" id="closeCartBtn" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-items" id="cartItemsList">
      <div class="cart-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Your shopping bag is currently empty.</p>
        <a href="#featured" class="btn btn-outline btn-sm" id="shopNowCartBtn">Explore New Drops</a>
      </div>
    </div>
    <div class="cart-footer" id="cartFooter" style="display:none;">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span id="cartSubtotal">$0.00</span>
      </div>
      <div class="cart-summary-row">
        <span>Estimated Shipping</span>
        <span class="free-shipping">FREE</span>
      </div>
      <button class="btn btn-primary btn-block" id="cartCheckoutBtn">Proceed to Checkout</button>
    </div>
  </aside>

  <main>
    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="badge-pill">
            <span class="pulse-dot"></span>
            <span>Series 04 • Limited Release</span>
          </div>
          <h1 class="hero-title">${tagline}</h1>
          <p class="hero-subtitle">
            Engineered with dual-density nitrogen foam, ballistic-grade ripstop, and precision anatomical heel lock for effortless daily propulsion.
          </p>

          <div class="hero-cta-group">
            <a href="#customizer" class="btn btn-primary btn-lg">Launch 360° Studio</a>
            <a href="#featured" class="btn btn-outline btn-lg">View Lookbook</a>
          </div>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">285g</span>
              <span class="stat-label">Ultra-Light Chassis</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">42%</span>
              <span class="stat-label">Higher Energy Return</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">4.97★</span>
              <span class="stat-label">From 3,400+ Runners</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-img-card">
            <img id="heroSneakerImage" src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80" alt="Flagship high-performance sneaker in crimson colorway" class="hero-shoe-img">
            <div class="hero-tag-badge">
              <span class="badge-dot"></span>
              <span>KINETIX V1 Stealth</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive 360° Colorway & Size Customizer Studio (Widget) -->
    <section class="customizer-section" id="customizer">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Interactive Studio</span>
          <h2>Customize Your Silhouette</h2>
          <p class="section-sub">Select dynamic colorways, your true size, and test the real-time fit configuration.</p>
        </div>

        <div class="customizer-card">
          <div class="customizer-preview">
            <div class="preview-badge-row">
              <span class="pill-tag" id="activeColorTag">Colorway: Hyper Crimson</span>
              <span class="pill-tag stock-tag" id="activeStockTag">✓ In Stock • Ships Today</span>
            </div>
            <div class="shoe-display-stage">
              <img id="customizerShoeImg" src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80" alt="Interactive footwear customizer view" class="customizer-shoe-render">
            </div>
            <div class="studio-hints">
              <span>✦ High-Rebound Kinetic Midsole</span>
              <span>✦ Water-Repellent Nano Coating</span>
            </div>
          </div>

          <div class="customizer-controls">
            <div class="control-block">
              <label class="control-label">1. Choose Colorway</label>
              <div class="colorway-selector" role="radiogroup" aria-label="Colorway options">
                <button class="color-btn active" data-color="crimson" data-name="Hyper Crimson" data-price="198" data-img="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80" style="background:#e11d48;" aria-label="Hyper Crimson"></button>
                <button class="color-btn" data-color="stealth" data-name="Onyx Stealth" data-price="210" data-img="https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=1000&q=80" style="background:#18181b;" aria-label="Onyx Stealth"></button>
                <button class="color-btn" data-color="polar" data-name="Polar Glacier" data-price="198" data-img="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80" style="background:#0284c7;" aria-label="Polar Glacier"></button>
                <button class="color-btn" data-color="solar" data-name="Solar Amber" data-price="205" data-img="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80" style="background:#f59e0b;" aria-label="Solar Amber"></button>
              </div>
            </div>

            <div class="control-block">
              <div class="size-header">
                <label class="control-label">2. Select US Size</label>
                <button class="size-guide-trigger" id="sizeGuideBtn">📏 Fit Quiz</button>
              </div>
              <div class="size-selector" id="sizeSelectorGrid">
                <button class="size-chip" data-size="7">US 7</button>
                <button class="size-chip" data-size="8">US 8</button>
                <button class="size-chip active" data-size="9">US 9</button>
                <button class="size-chip" data-size="10">US 10</button>
                <button class="size-chip" data-size="11">US 11</button>
                <button class="size-chip" data-size="12">US 12</button>
                <button class="size-chip" data-size="13">US 13</button>
              </div>
            </div>

            <div class="price-and-action-box">
              <div class="price-stack">
                <span class="price-label">Price</span>
                <span class="price-value" id="customizerPrice">$198.00</span>
              </div>
              <button class="btn btn-primary btn-lg" id="addCustomizerToCartBtn">
                <span>Add to Shopping Bag</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
            
            <div class="guarantee-list">
              <div class="guar-item">✓ 30-Day In-Hand Trial</div>
              <div class="guar-item">✓ Carbon Neutral Craftsmanship</div>
              <div class="guar-item">✓ Lifetime Arch Warranty</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Drops Grid -->
    <section class="featured-section" id="featured">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Curated Collection</span>
          <h2>Trending Silhouettes</h2>
          <p class="section-sub">Tested on asphalt, curated for modern streetwear connoisseurs.</p>
        </div>

        <div class="products-grid">
          <article class="product-card">
            <div class="prod-badge">Limited 250 Pairs</div>
            <div class="prod-img-box">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" alt="KINETIX Velocity Racer" class="prod-img">
            </div>
            <div class="prod-info">
              <h3>KINETIX Velocity Racer</h3>
              <p class="prod-desc">Dual-density nitrogen infused running silhouette.</p>
              <div class="prod-meta">
                <span class="prod-price">$198.00</span>
                <button class="btn btn-outline btn-sm quick-add-btn" data-name="KINETIX Velocity Racer" data-price="198" data-color="Crimson" data-size="9.5">Add to Bag</button>
              </div>
            </div>
          </article>

          <article class="product-card">
            <div class="prod-badge">Best Seller</div>
            <div class="prod-img-box">
              <img src="https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=600&q=80" alt="AeroGrip Trail Hybrid" class="prod-img">
            </div>
            <div class="prod-info">
              <h3>AeroGrip Trail Hybrid</h3>
              <p class="prod-desc">All-weather Vibram outsole with Cordura upper.</p>
              <div class="prod-meta">
                <span class="prod-price">$215.00</span>
                <button class="btn btn-outline btn-sm quick-add-btn" data-name="AeroGrip Trail Hybrid" data-price="215" data-color="Stealth" data-size="10">Add to Bag</button>
              </div>
            </div>
          </article>

          <article class="product-card">
            <div class="prod-badge">New Arrival</div>
            <div class="prod-img-box">
              <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80" alt="Apex Minimalist Court" class="prod-img">
            </div>
            <div class="prod-info">
              <h3>Apex Minimalist Court</h3>
              <p class="prod-desc">Italian calfskin leather with memory foam insole.</p>
              <div class="prod-meta">
                <span class="prod-price">$225.00</span>
                <button class="btn btn-outline btn-sm quick-add-btn" data-name="Apex Minimalist Court" data-price="225" data-color="Glacier White" data-size="9">Add to Bag</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section class="faq-section" id="faq">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Assistance & Specifications</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div class="faq-accordion" id="faqAccordion">
          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How does the KINETIX sizing compare to traditional running brands?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Our silhouettes fit true-to-size for US standard measurements. If you are between sizes or prefer an ultra-snug race fit, we recommend ordering a half size down.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>What is your return and trial policy?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>We provide a 30-day wear-and-test guarantee. Run in them, test them on the street, and if you are not completely satisfied, return them for a 100% full refund with prepaid postage.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How do you handle sustainability and materials?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>85% of our knit uppers are manufactured from recycled ocean plastics, and our midsoles utilize bio-based sugarcane EVA foam, reducing manufacturing carbon footprints by 62%.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter Intake -->
    <section class="newsletter-section">
      <div class="container newsletter-box">
        <h2>Join the Priority Drop Access</h2>
        <p>Subscribers receive 15-minute early access to limited edition colorways and private member sales.</p>
        <form class="newsletter-form" id="newsletterForm">
          <input type="email" placeholder="Enter your email address" id="newsEmailInput" required>
          <button type="submit" class="btn btn-primary">Subscribe</button>
        </form>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-content">
      <p>© 2026 ${brand}. All rights reserved. Designed for peak human motion.</p>
      <div class="footer-links">
        <a href="#featured">Collection</a>
        <a href="#customizer">Studio</a>
        <a href="#faq">Support</a>
      </div>
    </div>
  </footer>

  <!-- Toast Notification Container -->
  <div class="toast-container" id="toastContainer" aria-live="polite"></div>

  <script src="script.js"></script>
</body>
</html>`,
    css: `/* styles.css - E-Commerce & Sneaker Boutique */
:root {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-subtle: #e2e8f0;
  --primary: ${primaryColor};
  --primary-hover: #1e293b;
  --accent: ${accentColor};
  --accent-hover: #be123c;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 28px rgba(0,0,0,0.12);
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
}

[data-theme="dark"] {
  --bg-app: #090d16;
  --bg-surface: #111827;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border-subtle: #1e293b;
  --primary: #ffffff;
  --primary-hover: #f1f5f9;
  --accent: #f43f5e;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.4);
  --shadow-lg: 0 12px 28px rgba(0,0,0,0.5);
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

/* Announcement Bar */
.announcement-bar {
  background: var(--primary);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.6rem 1rem;
  text-align: center;
}

/* Header */
.site-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 99;
}
[data-theme="dark"] .site-header {
  background: rgba(17, 24, 39, 0.85);
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
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.logo-symbol {
  width: 34px;
  height: 34px;
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
  transition: color 0.2s ease;
}
.nav-link:hover {
  color: var(--accent);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.icon-btn, .cart-trigger-btn {
  background: none;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.2s, transform 0.2s;
}
.icon-btn:hover, .cart-trigger-btn:hover {
  background: var(--border-subtle);
  transform: translateY(-1px);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
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
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--accent);
  color: #ffffff;
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
}
.btn-outline {
  border-color: var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-main);
}
.btn-outline:hover {
  border-color: var(--text-main);
  background: var(--border-subtle);
}
.btn-lg {
  padding: 0.9rem 1.8rem;
  font-size: 1.05rem;
}
.btn-sm {
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
}
.btn-block {
  width: 100%;
}

/* Hero */
.hero-section {
  padding: 4.5rem 0;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 3.5rem;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1.25rem;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--accent);
  animation: pulse 1.6s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.hero-title {
  font-family: var(--font-heading);
  font-size: clamp(2.3rem, 4.5vw, 3.6rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}
.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 520px;
  margin-bottom: 2rem;
}

.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.hero-stats {
  display: flex;
  gap: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}
.stat-number {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--text-main);
}
.stat-label {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.hero-img-card {
  position: relative;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
  display: flex;
  justify-content: center;
  align-items: center;
}
.hero-shoe-img {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  border-radius: var(--radius-md);
  transition: transform 0.4s ease;
}
.hero-shoe-img:hover {
  transform: rotate(-3deg) scale(1.04);
}
.hero-tag-badge {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--accent);
}

/* 360 Customizer Studio */
.customizer-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.section-head {
  margin-bottom: 3rem;
}
.text-center {
  text-align: center;
}
.eyebrow {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 0.5rem;
}
.section-head h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3.2vw, 2.5rem);
  letter-spacing: -0.02em;
}
.section-sub {
  color: var(--text-muted);
  max-width: 600px;
  margin: 0.5rem auto 0;
}

.customizer-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
}

.customizer-preview {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.preview-badge-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.pill-tag {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
}
.stock-tag {
  color: #10b981;
}

.shoe-display-stage {
  padding: 2rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.customizer-shoe-render {
  max-width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: var(--radius-md);
  transition: transform 0.3s ease;
}

.studio-hints {
  display: flex;
  gap: 1.5rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.customizer-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.75rem;
}
.control-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.6rem;
  display: block;
}

.colorway-selector {
  display: flex;
  gap: 0.85rem;
}
.color-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.color-btn.active {
  box-shadow: 0 0 0 3px var(--bg-surface), 0 0 0 5px var(--accent);
  transform: scale(1.1);
}

.size-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.size-guide-trigger {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.size-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.size-chip {
  padding: 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.size-chip:hover {
  border-color: var(--accent);
}
.size-chip.active {
  background: var(--text-main);
  color: var(--bg-surface);
  border-color: var(--text-main);
}

.price-and-action-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.price-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  display: block;
}
.price-value {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-main);
}

.guarantee-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* Featured Products */
.featured-section {
  padding: 5rem 0;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.product-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  position: relative;
  transition: transform 0.25s, box-shadow 0.25s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.prod-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--text-main);
  color: var(--bg-surface);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-full);
  z-index: 2;
}
.prod-img-box {
  height: 240px;
  overflow: hidden;
  background: #f1f5f9;
}
.prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.product-card:hover .prod-img {
  transform: scale(1.06);
}
.prod-info {
  padding: 1.5rem;
}
.prod-info h3 {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  margin-bottom: 0.35rem;
}
.prod-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
}
.prod-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.prod-price {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
}

/* FAQ */
.faq-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
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
  background: var(--bg-app);
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

/* Newsletter */
.newsletter-section {
  padding: 5rem 0;
}
.newsletter-box {
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-lg);
  padding: 3.5rem 2rem;
  text-align: center;
}
[data-theme="dark"] .newsletter-box {
  background: #1e293b;
}
.newsletter-box h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  margin-bottom: 0.75rem;
}
.newsletter-box p {
  color: #cbd5e1;
  max-width: 540px;
  margin: 0 auto 2rem;
}
.newsletter-form {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  max-width: 500px;
  margin: 0 auto;
}
.newsletter-form input {
  flex: 1;
  padding: 0.85rem 1.2rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: #fff;
  outline: none;
}
.newsletter-form input::placeholder {
  color: #94a3b8;
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

/* Shopping Cart Drawer */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s;
}
.cart-overlay.open {
  opacity: 1;
  visibility: visible;
}
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100%;
  background: var(--bg-surface);
  z-index: 1001;
  box-shadow: -4px 0 24px rgba(0,0,0,0.2);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}
.cart-drawer.open {
  transform: translateX(0);
}
.cart-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cart-header h3 {
  font-family: var(--font-heading);
}
.drawer-close-btn {
  background: none;
  border: none;
  font-size: 1.7rem;
  cursor: pointer;
  color: var(--text-main);
}
.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cart-empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.cart-line-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-app);
}
.cart-item-img {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}
.cart-item-details {
  flex: 1;
}
.cart-item-name {
  font-weight: 600;
  font-size: 0.9rem;
}
.cart-item-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
}
.cart-item-price {
  font-weight: 700;
  color: var(--accent);
}
.cart-item-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px;
}
.cart-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-app);
}
.cart-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}
.free-shipping {
  color: #10b981;
  font-weight: 700;
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

@media (max-width: 900px) {
  .hero-grid, .customizer-card {
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
}
`,
    js: `// script.js - E-Commerce & Sneaker Boutique Logic
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const htmlRoot = document.documentElement;

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlRoot.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', nextTheme);
  });

  // Mobile Drawer
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  mobileToggle?.addEventListener('click', () => mobileDrawer?.classList.add('open'));
  closeDrawerBtn?.addEventListener('click', () => mobileDrawer?.classList.remove('open'));
  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => mobileDrawer?.classList.remove('open'));
  });

  // Toast System
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

  // Cart Management
  let cart = [];
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartDrawerCount = document.getElementById('cartDrawerCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartFooter = document.getElementById('cartFooter');
  const cartSubtotal = document.getElementById('cartSubtotal');

  function openCart() {
    cartDrawer?.classList.add('open');
    cartOverlay?.classList.add('open');
  }

  function closeCart() {
    cartDrawer?.classList.remove('open');
    cartOverlay?.classList.remove('open');
  }

  openCartBtn?.addEventListener('click', openCart);
  closeCartBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  function renderCart() {
    const totalCount = cart.length;
    cartCountBadge.textContent = totalCount;
    cartDrawerCount.textContent = totalCount;

    if (totalCount === 0) {
      cartItemsList.innerHTML = \`
        <div class="cart-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Your shopping bag is currently empty.</p>
          <a href="#featured" class="btn btn-outline btn-sm" id="shopNowCartBtn">Explore New Drops</a>
        </div>
      \`;
      document.getElementById('shopNowCartBtn')?.addEventListener('click', closeCart);
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    let subtotal = 0;

    cartItemsList.innerHTML = cart.map((item, idx) => {
      subtotal += item.price;
      return \`
        <div class="cart-line-item">
          <img src="\${item.img}" alt="\${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-name">\${item.name}</div>
            <div class="cart-item-meta">Color: \${item.color} • Size: US \${item.size}</div>
            <div class="cart-item-price">$\${item.price.toFixed(2)}</div>
          </div>
          <button class="cart-item-remove" data-index="\${idx}" aria-label="Remove item">✕</button>
        </div>
      \`;
    }).join('');

    cartSubtotal.textContent = '$' + subtotal.toFixed(2);

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        cart.splice(index, 1);
        renderCart();
        showToast('Item removed from bag');
      });
    });
  }

  function addToCart(item) {
    cart.push(item);
    renderCart();
    openCart();
    showToast('✨ Added to Bag: ' + item.name);
  }

  // 360 Customizer Studio Logic
  let selectedColorName = 'Hyper Crimson';
  let selectedPrice = 198;
  let selectedShoeImg = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80';
  let selectedSize = '9';

  const colorButtons = document.querySelectorAll('.color-btn');
  const customizerShoeImg = document.getElementById('customizerShoeImg');
  const activeColorTag = document.getElementById('activeColorTag');
  const customizerPrice = document.getElementById('customizerPrice');

  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      colorButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      selectedColorName = btn.getAttribute('data-name');
      selectedPrice = parseFloat(btn.getAttribute('data-price'));
      selectedShoeImg = btn.getAttribute('data-img');

      customizerShoeImg.src = selectedShoeImg;
      activeColorTag.textContent = 'Colorway: ' + selectedColorName;
      customizerPrice.textContent = '$' + selectedPrice.toFixed(2);

      // Micro animation
      customizerShoeImg.style.transform = 'scale(0.96)';
      setTimeout(() => { customizerShoeImg.style.transform = 'scale(1)'; }, 150);
    });
  });

  const sizeChips = document.querySelectorAll('.size-chip');
  sizeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sizeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedSize = chip.getAttribute('data-size');
      showToast('Selected size: US ' + selectedSize);
    });
  });

  document.getElementById('addCustomizerToCartBtn')?.addEventListener('click', () => {
    addToCart({
      name: '${brand} Studio Edition',
      color: selectedColorName,
      size: selectedSize,
      price: selectedPrice,
      img: selectedShoeImg
    });
  });

  // Quick Add from Grid
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));
      const color = btn.getAttribute('data-color');
      const size = btn.getAttribute('data-size');
      const card = btn.closest('.product-card');
      const img = card?.querySelector('.prod-img')?.src || selectedShoeImg;

      addToCart({ name, price, color, size, img });
    });
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

  // Size Quiz Modal Trigger
  document.getElementById('sizeGuideBtn')?.addEventListener('click', () => {
    showToast('💡 Recommendation: If you wear standard Nike or Adidas US 9, select US 9 for optimal lock-in.');
  });

  // Checkout Button
  document.getElementById('cartCheckoutBtn')?.addEventListener('click', () => {
    showToast('🎉 Checkout initiated! Connecting to secure payment gateway...');
    setTimeout(() => {
      cart = [];
      renderCart();
      closeCart();
      showToast('✅ Order confirmed! Receipt dispatched to your email.');
    }, 2000);
  });

  // Newsletter Form
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsEmailInput').value;
    showToast('🎉 Welcome to Priority Access! VIP code dispatched to ' + email);
    e.target.reset();
  });
});
`
  };
}

module.exports = { generateEcommerceSite };
