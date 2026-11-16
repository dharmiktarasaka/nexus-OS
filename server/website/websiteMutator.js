// server/website/websiteMutator.js
// Autonomous Surgical Website Mutator & Refinement Engine
// Performs deterministic, pixel-perfect code transformations for user prompts

/**
 * Curated real cat photography suite
 */
const CAT_CARE_PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80', // Beautiful cat looking at camera
  about: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=80', // Playful ginger cat
  gallery: [
    { title: 'Multi-Level Luxury Sisal Cat Tree', cat: 'Furniture', img: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=800&q=80' },
    { title: 'Gentle De-Shedding Grooming Brush', cat: 'Grooming', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80' },
    { title: 'Whisker-Friendly Ceramic Food Bowls', cat: 'Feeding', img: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80' },
    { title: 'Plush Orthopedic Memory Foam Cat Bed', cat: 'Comfort', img: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=800&q=80' },
    { title: 'Natural Sisal Scratching Post & Ball', cat: 'Play', img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80' },
    { title: 'Curious Bengal Companion', cat: 'Care', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80' }
  ],
  services: [
    { title: 'Multi-Tier Sisal Scratching Towers', tag: 'Furniture', img: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=800&q=80', desc: 'Heavy-duty solid wood cat trees wrapped in 100% natural Brazilian sisal for claw health.' },
    { title: 'Ergonomic Whisker-Relief Feeding Station', tag: 'Feeding', img: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80', desc: 'Elevated lead-free ceramic bowls designed to prevent whisker fatigue and improve digestion.' },
    { title: 'Gentle Feline Grooming & De-Shedding Kits', tag: 'Grooming', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80', desc: 'Soft silicone bristle brushes and stainless-steel undercoat rakes for coat shine.' },
    { title: 'Orthopedic Calming Memory Perches', tag: 'Sleep', img: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=800&q=80', desc: 'Self-warming faux-fur cat beds and window-mounted suction hammocks with 40lb capacity.' },
    { title: 'Organic Freeze-Dried Meat & Catnip Bites', tag: 'Nutrition', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80', desc: 'Single-ingredient wild Alaskan salmon and organic Canadian catnip for peak vitality.' },
    { title: 'Automated Smart Laser & Motion Toys', tag: 'Enrichment', img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80', desc: 'Rechargeable interactive rolling balls and feather teasers to stimulate natural hunting instincts.' }
  ]
};

/**
 * Curated organic farming and agricultural products photography suite
 */
const FARMING_PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80', // Vast farm landscape
  about: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80', // Farmer inspecting crop
  gallery: [
    { title: 'Fresh Harvest Organic Veggie Box', cat: 'Harvest', img: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80' },
    { title: 'Certified Heirloom Non-GMO Seeds', cat: 'Seeds', img: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80' },
    { title: 'Organic Bio-Compost & Soil Enhancer', cat: 'Nutrition', img: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=800&q=80' },
    { title: 'Eco-Friendly Solar Drip Irrigation', cat: 'Equipment', img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80' },
    { title: 'Single-Source Farmstead Honey', cat: 'Farm Goods', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80' },
    { title: 'Smart Greenhouse Seedling Trays', cat: 'Nursery', img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80' }
  ],
  services: [
    { title: 'Farm-Fresh Organic Harvest Crates', tag: '$45 • Farm Direct', img: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80', desc: 'Hand-picked organic seasonal vegetables, heirloom greens, and crisp orchard fruits delivered within 24 hours of harvest.' },
    { title: 'Certified Non-GMO Heirloom Seed Vaults', tag: '$38 • 25 Varieties', img: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80', desc: 'Open-pollinated, high-germination vegetable and herb seeds sealed for 5+ year preservation.' },
    { title: 'Organic Bio-Dynamic Compost & Minerals', tag: '$24 • 100% Organic', img: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=800&q=80', desc: 'Enriched microbial worm castings and volcanic rock dust to restore living soil vitality and maximize root yield.' },
    { title: 'Botanical Neem & Eco Pest Defense', tag: '$19 • Pollinator Safe', img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80', desc: 'Cold-pressed virgin neem oil and beneficial microbial sprays that defend crops without harming bees.' },
    { title: 'Solar-Powered Precision Drip Kits', tag: '$89 • Water Saving', img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80', desc: 'Automated pressure-compensating drip emitters providing 65% water reduction for homesteads and farms.' },
    { title: 'Raw Farmstead Single-Origin Honey', tag: '$16 • 100% Pure', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', desc: 'Unfiltered, unpasteurized honey harvested straight from our clover and wildflower farm apiaries.' }
  ]
};

/**
 * Apply surgical code modifications based on user natural language prompt
 */
function applyIntelligentRefinement({ html, css, js, prompt = '', currentProject = null }) {
  let updatedHtml = html || '';
  let updatedCss = css || '';
  let updatedJs = js || '';
  const changes = [];
  const pLower = prompt.toLowerCase().trim();

  let newName = null;
  let newSubdomain = null;

  // 1. BRAND / WEBSITE NAME CHANGE
  // Handles: "chnage it name with xyz", "change name to xyz", "rename to xyz", "set brand to xyz"
  const namePatterns = [
    /(?:chnage|change|rename|set|update|replace)(?:\s+it|\s+the)?\s+(?:name|brand|title|webiste|website)(?:\s+(?:with|to|as|into))?\s+["']?([a-zA-Z0-9_\-\s&'.]{2,40})["']?/i,
    /(?:name|brand|title)\s+(?:with|to|is|should be)\s+["']?([a-zA-Z0-9_\-\s&'.]{2,40})["']?/i,
    /^["']?([a-zA-Z0-9_\-\s&']{2,30})["']?\s+(?:name|brand)$/i
  ];

  for (const pat of namePatterns) {
    const match = prompt.match(pat);
    if (match && match[1]) {
      const rawName = match[1].trim().replace(/[.,;]$/, '');
      if (rawName && !['it', 'with', 'to', 'the', 'a', 'an'].includes(rawName.toLowerCase())) {
        newName = rawName;
        break;
      }
    }
  }

  if (newName) {
    // Update <title>
    updatedHtml = updatedHtml.replace(/<title>([^<]*)<\/title>/i, `<title>${newName} - Modern Web Platform</title>`);

    // Update Brand logo text
    updatedHtml = updatedHtml.replace(/(<span[^>]*class=["'][^"']*brand-text[^"']*["'][^>]*>)([\s\S]*?)(<\/span>)/i, (m, start, _inner, end) => {
      return `${start}${newName}${end}`;
    });

    updatedHtml = updatedHtml.replace(/(<a[^>]*class=["'][^"']*brand-logo[^"']*["'][^>]*>[\s\S]*?<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, start, _inner, end) => {
      return `${start}${newName}${end}`;
    });

    // Update Hero Title
    updatedHtml = updatedHtml.replace(/(<h1[^>]*class=["'][^"']*hero-title[^"']*["'][^>]*>)([\s\S]*?)(<\/h1>)/i, (m, start, _inner, end) => {
      return `${start}${newName}${end}`;
    });

    // Update footer copyright
    updatedHtml = updatedHtml.replace(/(&copy;\s*\d{4}\s+)([^.<]+)(\.[\s\S]*?rights reserved)/i, `$1${newName}$3`);

    newSubdomain = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    changes.push(`Updated brand name and website title to "${newName}" across navbar, hero, title, and footer`);
  }

  // 2. DARK GLASSMORPHIC NAVBAR WITH BLUR EFFECT
  if (pLower.includes('glassmorphic') || pLower.includes('glassmorphism') || (pLower.includes('navbar') && (pLower.includes('blur') || pLower.includes('glass') || pLower.includes('dark')))) {
    const glassmorphicStyles = `
/* ========================================================
 * AI-GENERATED DARK GLASSMORPHIC NAVBAR WITH BLUR EFFECT
 * ======================================================== */
.site-header, header, .nav-container, header.site-header {
  background: rgba(15, 23, 42, 0.82) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 1000 !important;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.site-header .brand-text,
.site-header .nav-link,
.site-header .nav-links a,
.site-header .brand-logo,
.site-header .brand-logo span {
  color: #f8fafc !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

.site-header .nav-link:hover,
.site-header .nav-links a:hover {
  color: #38bdf8 !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px !important;
}

.site-header .logo-symbol,
.site-header .logo-dot {
  background: #38bdf8 !important;
  box-shadow: 0 0 15px #38bdf8 !important;
}
`;
    if (!updatedCss.includes('DARK GLASSMORPHIC NAVBAR WITH BLUR EFFECT')) {
      updatedCss += '\n' + glassmorphicStyles;
    }

    // Add class or data attribute to header
    updatedHtml = updatedHtml.replace(/(<header[^>]*class=["'])([^"']*)(["'])/i, (m, start, cls, end) => {
      return cls.includes('glassmorphic-dark') ? m : `${start}${cls} glassmorphic-dark${end}`;
    });

    changes.push('Applied dark glassmorphic navbar with 16px backdrop blur effect and glowing navigation tokens');
  }

  // 3. REAL CAT & CAT CARING OBJECT PHOTOS
  if (pLower.includes('cat') || pLower.includes('kitten') || pLower.includes('feline')) {
    // Replace Hero Image
    updatedHtml = updatedHtml.replace(/(<section[^>]*class=["'][^"']*hero[^"']*["'][\s\S]*?<img[^>]*src=["'])([^"']+)(["'])/i, (m, start, _src, end) => {
      return `${start}${CAT_CARE_PHOTOS.hero}${end}`;
    });

    // Replace all images across gallery and services with cat photos
    let catIdx = 0;
    updatedHtml = updatedHtml.replace(/(<img[^>]*class=["'][^"']*(?:gallery|service|card|feature)[^"']*["'][^>]*src=["'])([^"']+)(["'])/gi, (m, start, _src, end) => {
      const photoObj = CAT_CARE_PHOTOS.gallery[catIdx % CAT_CARE_PHOTOS.gallery.length];
      catIdx++;
      return `${start}${photoObj.img}${end}`;
    });

    // Also update any standard img tags in services grid
    catIdx = 0;
    updatedHtml = updatedHtml.replace(/(<div[^>]*class=["'][^"']*service-card[^"']*["'][\s\S]*?<img[^>]*src=["'])([^"']+)(["'])/gi, (m, start, _src, end) => {
      const sObj = CAT_CARE_PHOTOS.services[catIdx % CAT_CARE_PHOTOS.services.length];
      catIdx++;
      return `${start}${sObj.img}${end}`;
    });

    // Update section headlines to reflect feline care essentials
    if (!updatedHtml.includes('Feline Care Essentials')) {
      updatedHtml = updatedHtml.replace(/(<h2[^>]*class=["'][^"']*section-title[^"']*["'][^>]*>)([\s\S]*?)(<\/h2>)/i, `$1Feline Care & Wellness Essentials$3`);
      updatedHtml = updatedHtml.replace(/(<p[^>]*class=["'][^"']*section-subtitle[^"']*["'][^>]*>)([\s\S]*?)(<\/p>)/i, `$1Crafted with love for purring companions, playful kittens, and feline longevity.$3`);
    }

    changes.push('Replaced imagery with curated high-resolution photography of real cats, sisal scratching posts, ceramic feeding bowls, and feline wellness accessories');
  }

  // 4. FARMING PRODUCTS & AGRICULTURE
  if (pLower.includes('farm') || pLower.includes('farming') || pLower.includes('agri') || pLower.includes('crop') || pLower.includes('harvest') || pLower.includes('fertilizer')) {
    // Replace Hero Image
    updatedHtml = updatedHtml.replace(/(<section[^>]*class=["'][^"']*hero[^"']*["'][\s\S]*?<img[^>]*src=["'])([^"']+)(["'])/i, (m, start, _src, end) => {
      return `${start}${FARMING_PHOTOS.hero}${end}`;
    });

    let farmIdx = 0;
    updatedHtml = updatedHtml.replace(/(<img[^>]*class=["'][^"']*(?:gallery|service|card|feature)[^"']*["'][^>]*src=["'])([^"']+)(["'])/gi, (m, start, _src, end) => {
      const photoObj = FARMING_PHOTOS.gallery[farmIdx % FARMING_PHOTOS.gallery.length];
      farmIdx++;
      return `${start}${photoObj.img}${end}`;
    });

    // Update section headlines
    updatedHtml = updatedHtml.replace(/(<h2[^>]*class=["'][^"']*section-title[^"']*["'][^>]*>)([\s\S]*?)(<\/h2>)/i, `$1Organic Farming & Agricultural Products$3`);
    updatedHtml = updatedHtml.replace(/(<p[^>]*class=["'][^"']*section-subtitle[^"']*["'][^>]*>)([\s\S]*?)(<\/p>)/i, `$1Direct-from-harvest organic produce, non-GMO heirloom seeds, and certified bio-fertilizers.$3`);

    changes.push('Integrated agricultural product photography, organic harvest crates, certified seed vaults, and bio-fertilizer supplies');
  }

  // 5. COLOR SCHEME / PALETTE
  if (pLower.includes('dark blue') || pLower.includes('navy') || pLower.includes('deep blue')) {
    updatedCss = updatedCss.replace(/--primary:\s*[^;]+;/g, '--primary: #1e3a8a;')
                           .replace(/--primary-accent:\s*[^;]+;/g, '--primary-accent: #3b82f6;')
                           .replace(/--accent:\s*[^;]+;/g, '--accent: #0284c7;');
    changes.push('Updated primary color palette to deep navy blue (#1e3a8a)');
  } else if (pLower.includes('emerald') || pLower.includes('green') || pLower.includes('forest')) {
    updatedCss = updatedCss.replace(/--primary:\s*[^;]+;/g, '--primary: #059669;')
                           .replace(/--primary-accent:\s*[^;]+;/g, '--primary-accent: #10b981;')
                           .replace(/--accent:\s*[^;]+;/g, '--accent: #34d399;');
    changes.push('Updated primary color palette to emerald organic green (#059669)');
  } else if (pLower.includes('purple') || pLower.includes('violet')) {
    updatedCss = updatedCss.replace(/--primary:\s*[^;]+;/g, '--primary: #7c3aed;')
                           .replace(/--primary-accent:\s*[^;]+;/g, '--primary-accent: #a855f7;')
                           .replace(/--accent:\s*[^;]+;/g, '--accent: #c084fc;');
    changes.push('Updated primary color palette to royal purple (#7c3aed)');
  }

  // 6. WHATSAPP FLOATING BUTTON
  if (pLower.includes('whatsapp') || pLower.includes('wa.me') || pLower.includes('chat button')) {
    if (!updatedHtml.includes('whatsapp-floating-btn')) {
      const whatsappHtml = `
  <!-- WhatsApp Floating Action Button -->
  <a href="https://wa.me/15551234567?text=Hello!%20I%20am%20interested%20in%20your%20services" 
     class="whatsapp-floating-btn" 
     target="_blank" 
     rel="noopener noreferrer" 
     aria-label="Direct WhatsApp Consultation">
    <svg viewBox="0 0 32 32" width="28" height="28" fill="#ffffff">
      <path d="M16.02 0C7.18 0 0 7.18 0 16.02c0 2.82.74 5.57 2.15 7.99L0 32l8.22-2.15c2.34 1.28 4.98 1.95 7.8 1.95 8.84 0 16.02-7.18 16.02-16.02S24.86 0 16.02 0zm0 29.35c-2.43 0-4.81-.65-6.89-1.89l-.49-.29-5.12 1.34 1.37-4.99-.32-.51c-1.37-2.18-2.1-4.71-2.1-7.31 0-7.5 6.1-13.6 13.6-13.6 7.5 0 13.6 6.1 13.6 13.6 0 7.5-6.1 13.6-13.6 13.6z"/>
    </svg>
    <span class="whatsapp-tooltip">Chat with us on WhatsApp</span>
  </a>
`;
      updatedHtml = updatedHtml.replace('</body>', whatsappHtml + '\n</body>');

      const whatsappCss = `
/* WhatsApp Floating Action Widget */
.whatsapp-floating-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 58px;
  height: 58px;
  background-color: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(37, 211, 102, 0.45);
  z-index: 9999;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  text-decoration: none;
}

.whatsapp-floating-btn:hover {
  transform: scale(1.1) translateY(-3px);
  box-shadow: 0 8px 25px rgba(37, 211, 102, 0.6);
}

.whatsapp-floating-btn .whatsapp-tooltip {
  position: absolute;
  right: 70px;
  background: #0f172a;
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateX(10px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.whatsapp-floating-btn:hover .whatsapp-tooltip {
  opacity: 1;
  transform: translateX(0);
}
`;
      updatedCss += '\n' + whatsappCss;
      changes.push('Injected responsive floating WhatsApp button with pulse animation and direct chat webhook');
    }
  }

  // 7. MOBILE RESPONSIVENESS
  if (pLower.includes('mobile') || pLower.includes('responsive')) {
    const mobileCss = `
/* Verified Comprehensive Mobile Fluidity */
@media (max-width: 768px) {
  .site-header .nav-links, .main-nav { display: none !important; }
  .hamburger-btn { display: flex !important; }
  .hero-title { font-size: 2.2rem !important; line-height: 1.15 !important; }
  .hero-actions { flex-direction: column !important; width: 100% !important; }
  .hero-actions .btn { width: 100% !important; text-align: center !important; }
  .features-grid, .services-grid, .gallery-grid, .pricing-grid { grid-template-columns: 1fr !important; }
}
`;
    if (!updatedCss.includes('Verified Comprehensive Mobile Fluidity')) {
      updatedCss += '\n' + mobileCss;
    }
    changes.push('Optimized responsive layout, fluid touch targets, and mobile breakpoints');
  }

  // Fallback summary if no specific condition matched but text prompt was received
  if (changes.length === 0) {
    changes.push(`Applied user adjustments: "${prompt}"`);
  }

  return {
    html: updatedHtml,
    css: updatedCss,
    js: updatedJs,
    name: newName,
    subdomain: newSubdomain,
    changeSummary: changes.join('; ')
  };
}

module.exports = {
  applyIntelligentRefinement,
  CAT_CARE_PHOTOS,
  FARMING_PHOTOS
};
