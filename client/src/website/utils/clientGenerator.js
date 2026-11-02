// client/src/website/utils/clientGenerator.js
// Ultra-Comprehensive Multi-Page Real Website Synthesizer
// Generates full-scale production-grade websites with complete multi-page architecture:
// Top Announcement Bar, Sticky Glassmorphism Navbar, Hero, About Us & Executive Team,
// Services Grid, Domain Interactive Studio, Curated Photo Gallery with Lightbox,
// Pricing with Monthly/Annual switch, Verified Testimonials & Social Proof,
// Latest Insights/Blog, FAQ Accordion, Contact Booking Form, and Full Comprehensive Footer.

export function createClientFallbackProject(prompt = '', category = 'general', blueprint = null, user = null) {
  const p = (prompt || 'Modern Enterprise').toLowerCase().trim();
  const now = new Date();
  const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 1. Topic Resolution & Multi-Asset Library
  let topic = 'general';
  let defaultBrand = 'Vanguard & Co.';
  let defaultTagline = 'Crafting Exceptional Digital Realities for Modern Visionaries';
  let defaultCategory = 'Digital Innovation & Creative Web';
  let primaryColor = '#0f172a';
  let accentColor = '#4f46e5';

  // Photography suite (at least 12 distinct curated Unsplash images)
  let heroImage = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
  let aboutImage = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';
  
  let teamMembers = [
    { name: 'Dr. Marcus Vance', role: 'Chief Executive & Founder', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Over 15 years leading industry transformation and strategic design.' },
    { name: 'Elena Rostova', role: 'Principal Creative Director', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Award-winning architect of responsive, human-centered experiences.' },
    { name: 'Sophia Chen', role: 'Head of Client Partnerships', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Championing end-to-end client success and bespoke delivery workflows.' }
  ];

  let services = [
    { title: 'Bespoke Strategy & Architecture', tag: 'Core Strategy', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', desc: 'Precision planning tailored to competitive landscape and growth objectives.', check: ['Comprehensive Audit', 'Tailored Roadmap', 'Milestone Tracking'] },
    { title: 'High-Performance Engineering', tag: 'Technology', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', desc: 'Zero-latency architecture built with modern responsive standards.', check: ['Sub-second Load Times', 'Full Accessibility', 'Cross-Platform Testing'] },
    { title: 'Bespoke Creative Direction', tag: 'Design', img: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', desc: 'Visual identity and immersive interfaces sculpted for brand distinction.', check: ['Typography Systems', 'Ambient Glassmorphism', 'Micro-Interactions'] },
    { title: 'Interactive Tool Development', tag: 'Interactivity', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80', desc: 'Custom estimators, configurators, and widgets engineered in Vanilla JavaScript.', check: ['Real-time Calculations', 'Data Validation', 'Instant Toast Feedback'] },
    { title: 'Concierge Advisory & Support', tag: 'Concierge', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80', desc: '24/7 priority guidance and continuous iteration for mission-critical operations.', check: ['Dedicated Account Lead', '24/7 SLA Guarantee', 'Quarterly Reviews'] },
    { title: 'Scalable Enterprise Delivery', tag: 'Enterprise', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', desc: 'Future-proof structures designed to handle expanding traffic effortlessly.', check: ['Cloud CDN Deployment', 'SEO Optimization', 'Zero-Dependency Code'] }
  ];

  let gallery = [
    { title: 'Flagship Showcase', cat: 'Featured', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
    { title: 'Minimalist Workspace', cat: 'Signature', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80' },
    { title: 'Creative Atelier', cat: 'Featured', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
    { title: 'Modern Architecture', cat: 'Signature', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
    { title: 'Data Analytics Matrix', cat: 'Recent', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
    { title: 'Executive Presentation', cat: 'Recent', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' }
  ];

  let widgetTitle = 'Interactive Service Scope & Investment Estimator';
  let widgetSub = 'Customize your deliverables to compute estimated turnaround, hours, and investment in real-time.';
  let widgetType = 'estimator';

  // Topic specific overrides
  if (p.includes('fish') || p.includes('aquarium') || p.includes('marine') || p.includes('seafood') || p.includes('ocean') || p.includes('angler') || p.includes('reef')) {
    topic = 'fish';
    defaultBrand = 'AquaVibe Marine & Living Reefs';
    defaultTagline = 'Pristine Living Reefs, Rare Marine Species & High-Tech Aquaria';
    defaultCategory = 'Aquatic Ecosystems & Rare Marine Life';
    primaryColor = '#003366';
    accentColor = '#06b6d4';
    heroImage = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80';
    
    teamMembers = [
      { name: 'Dr. Arthur Sterling', role: 'Marine Biologist & Founder', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: '20+ years propagating captive coral colonies and oceanic reef systems.' },
      { name: 'Dr. Kai Tanaka', role: 'Aquatic Life Support Engineer', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Specialist in automated ozone filtration, reef chemistry, and biological bioload.' },
      { name: 'Miriam Vance', role: 'Aquascape Master Designer', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'International award winner for living nature aquascapes and biotopes.' }
    ];

    services = [
      { title: 'Living Coral Reef Engineering', tag: 'Custom Reefs', img: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80', desc: 'Turnkey architectural living reef aquariums built with precision biological filtration.', check: ['SPS & LPS Coral Compatibility', 'Computerized Dosing Systems', 'Automated Spectrum Lighting'] },
      { title: 'Rare Marine Quarantine & Acclimation', tag: 'Specimens', img: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?auto=format&fit=crop&w=800&q=80', desc: 'Medical-grade 30-day quarantine protocols for exotic tropical species.', check: ['Prophylactic Treatments', 'Parasite-Free Guarantee', 'Certified Healthy Feeding'] },
      { title: 'High-Tech Automated Life Support', tag: 'Filtration', img: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=800&q=80', desc: 'Remote-monitored protein skimming, titanium chilling, and ozone purification.', check: ['Smartphone Telemetry Alerts', 'Automatic Water Change Valves', 'Triple Backup Power'] },
      { title: 'Commercial & Hospitality Displays', tag: 'Architectural', img: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?auto=format&fit=crop&w=800&q=80', desc: 'Epic glass and acrylic installations for luxury hotels, penthouses, and venues.', check: ['Structural Engineering Analysis', 'Seismic Anchor Framing', 'Acoustic Soundproofing'] },
      { title: 'Comprehensive Water Chemistry Lab', tag: 'Diagnostics', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', desc: 'ICP-OES elemental mass testing to calibrate calcium, alkalinity, and trace minerals.', check: ['Trace Metal Balancing', 'Nutrient Zero-Phosphorus Tuning', 'Microbiome Health Analysis'] },
      { title: '24/7 Emergency Life Support Concierge', tag: 'Maintenance', img: 'https://images.unsplash.com/photo-1518877593221-1f28d84a147e?auto=format&fit=crop&w=800&q=80', desc: 'Dedicated biologist dispatch team on standby for rapid on-site emergency care.', check: ['1-Hour Urban Response', 'Emergency Water Delivery', 'Backup Filter Deployment'] }
    ];

    gallery = [
      { title: 'Living Coral Barrier Reef', cat: 'Featured', img: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80' },
      { title: 'Nature Aquascape Biotope', cat: 'Signature', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80' },
      { title: 'SPS Coral Acropora Garden', cat: 'Featured', img: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80' },
      { title: 'Boutique Marine Exhibition', cat: 'Signature', img: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?auto=format&fit=crop&w=800&q=80' },
      { title: 'Seahorse & Mangrove Lagoon', cat: 'Recent', img: 'https://images.unsplash.com/photo-1516683037151-9a17603a8dc7?auto=format&fit=crop&w=800&q=80' },
      { title: 'Custom Acrylic In-Wall Installation', cat: 'Recent', img: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Interactive Aquarium Dimension & Volume Estimator';
    widgetSub = 'Calculate recommended water volume, filtration flow rate, and safe biological fish capacity in real time.';
    widgetType = 'fish';
  } else if (p.includes('pet') || p.includes('dog') || p.includes('cat') || p.includes('puppy') || p.includes('vet') || p.includes('veterinary')) {
    topic = 'pet';
    defaultBrand = 'PawHaven Wellness & Nutrition';
    defaultTagline = 'Holistic Nutrition, Preventive Healthcare & Loving Concierge Pet Care';
    defaultCategory = 'Premium Pet Wellness & Veterinary Care';
    primaryColor = '#0f766e';
    accentColor = '#f59e0b';
    heroImage = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Dr. Sarah Jenkins, DVM', role: 'Chief Veterinary Officer', photo: 'https://images.unsplash.com/photo-1594824813633-890f848a6056?auto=format&fit=crop&w=400&q=80', bio: 'Board-certified veterinarian specializing in integrative canine and feline medicine.' },
      { name: 'Liam Montgomery', role: 'Lead Clinical Nutritionist', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Formulating organic, bioavailable raw and gently-cooked meal regimens.' },
      { name: 'Chloe Delacroix', role: 'Director of Canine Enrichment', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Certified behaviorist dedicated to fear-free socialization and rehabilitation.' }
    ];

    services = [
      { title: 'Personalized Clinical Nutrition Plans', tag: 'Nutrition', img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80', desc: 'Bespoke calorie and macro-balanced meal regimens for allergy relief and longevity.', check: ['Allergy Elimination Testing', 'Organic Whole-Food Recipes', 'Gut Microbiome Profiling'] },
      { title: 'Comprehensive Wellness Diagnostics', tag: 'Clinical', img: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', desc: 'Early disease detection, full-body ultrasonography, and comprehensive blood panels.', check: ['Full Chemistry & CBC Panel', 'Cardiac & Abdominal Ultrasounds', 'Comprehensive Dental Scans'] },
      { title: 'Luxury Concierge Boarding & Spa', tag: 'Hospitality', img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80', desc: 'Private climate-controlled suites, organic grooming spa baths, and continuous cameras.', check: ['24/7 Live Stream Access', 'Calming Hydro-Therapy Baths', '1-on-1 Play Sessions'] },
      { title: 'Behavioral Coaching & Fear-Free Care', tag: 'Training', img: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80', desc: 'Gentle positive-reinforcement conditioning for anxious or reactive companions.', check: ['Separation Anxiety Relief', 'Leash Reactivity Resolution', 'Puppy Foundation Mastery'] },
      { title: 'Senior Companion Longevity Programs', tag: 'Longevity', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', desc: 'Cold laser joint therapy, mobility rehabilitation, and cognitive enrichment.', check: ['Class IV Cold Laser Therapy', 'Joint Mobility Formulations', 'Cognitive Vitality Games'] },
      { title: '24/7 Tele-Triage & Urgent Care Line', tag: 'Emergency', img: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80', desc: 'Instant video telemedicine and immediate on-call triage with licensed clinicians.', check: ['Under 2-Minute Response', 'Digital Prescription Dispatch', 'Emergency Hospital Escort'] }
    ];

    gallery = [
      { title: 'Happy Golden Companion', cat: 'Featured', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80' },
      { title: 'Gentle Clinical Consultation', cat: 'Signature', img: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80' },
      { title: 'French Bulldog Vitality', cat: 'Featured', img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80' },
      { title: 'Curated Organic Nutrition Bar', cat: 'Signature', img: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80' },
      { title: 'Feline Holistic Spa & Suite', cat: 'Recent', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
      { title: 'Agility & Hydrotherapy Park', cat: 'Recent', img: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Personalized Pet Calorie & Daily Nutrition Planner';
    widgetSub = 'Input your pet’s weight and activity profile to compute target daily calories, portion sizes, and hydration.';
    widgetType = 'pet';
  } else if (p.includes('coffee') || p.includes('bakery') || p.includes('cafe') || p.includes('bread') || p.includes('restaurant') || p.includes('food') || p.includes('dining')) {
    topic = 'food';
    defaultBrand = 'Velvet & Crumb Artisan Roasters';
    defaultTagline = 'Single-Origin Specialty Roasts & Heirloom Sourdough Bakes';
    defaultCategory = 'Artisan Hospitality & Dining';
    primaryColor = '#78350f';
    accentColor = '#d97706';
    heroImage = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Mateo Rossi', role: 'Master Roaster & Q-Grader', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Certified Q-Grader sourcing micro-lots directly from high-altitude grower cooperatives.' },
      { name: 'Camille Laurent', role: 'Executive Pastry Chef', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Parisian-trained baker specializing in 72-hour wild fermentation sourdoughs.' },
      { name: 'Julian Hayes', role: 'Head of Culinary & Hospitality', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Creating warm, sensory tasting menus harmonized with vintage natural wines.' }
    ];

    services = [
      { title: 'Single-Origin Micro-Lot Roasting', tag: 'Specialty Coffee', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', desc: 'Direct-trade Ethiopian, Colombian, and Panamanian Geisha beans roasted weekly.', check: ['SCA 88+ Cup Score Guaranteed', 'Weekly Fresh Roast Dispatch', 'Full Traceability to Farm'] },
      { title: 'Heirloom 72-Hour Sourdough Bakes', tag: 'Patisserie', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', desc: 'Slow-fermented country boules, crisp baguettes, and layered butter viennoiserie.', check: ['100% Organic Heritage Grains', 'Natural Wild Levain Culture', 'Hand-Laminated Flaky Pastries'] },
      { title: 'Chef’s Evening Tasting Table', tag: 'Dining', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', desc: 'An intimate 7-course seasonal tasting menu celebrating regional organic harvest.', check: ['Sommelier Beverage Pairings', 'Seasonal Farm-to-Table Menu', 'Seats Just 14 Guests Nightly'] },
      { title: 'Private Boutique Catering & Events', tag: 'Catering', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', desc: 'Mobile espresso bars, artisanal charcuterie tables, and wedding celebrations.', check: ['Full Barista Station On-Site', 'Custom Grazing Displays', 'Dedicated Event Captain'] },
      { title: 'Curated Coffee Connoisseur Club', tag: 'Subscription', img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80', desc: 'Monthly drops of rare experimental fermentations and unreleased harvest roasts.', check: ['Tasting Cards & Brew Guides', 'Complimentary Worldwide Shipping', 'Exclusive Access to Geishas'] },
      { title: 'Barista Sensory & Cupping Academy', tag: 'Education', img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80', desc: 'Hands-on workshops mastering pour-over technique, water chemistry, and latte art.', check: ['Small Groups of 6 Students', 'Hands-on La Marzocco Machines', 'Official Certificate of Mastery'] }
    ];

    gallery = [
      { title: 'Golden Croissants & Bakes', cat: 'Featured', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
      { title: 'Velvety Flat White Art', cat: 'Signature', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80' },
      { title: 'Artisan Sourdough Boule', cat: 'Featured', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' },
      { title: 'Sunlit Roastery & Cafe', cat: 'Signature', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80' },
      { title: 'Fine Table Setting Experience', cat: 'Recent', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80' },
      { title: 'Single-Origin Cupping Flight', cat: 'Recent', img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Interactive Coffee Flavor Profiler & Table Reservation';
    widgetSub = 'Select roast preference, origin altitude, and reserve your curated culinary experience.';
    widgetType = 'food';
  } else if (p.includes('shoe') || p.includes('sneaker') || p.includes('footwear') || p.includes('fashion') || p.includes('clothing') || p.includes('apparel')) {
    topic = 'footwear';
    defaultBrand = 'KINETIX Footwear Atelier';
    defaultTagline = 'Engineered for Movement, Sculpted for High-Street Elegance';
    defaultCategory = 'Footwear & Streetwear Boutique';
    primaryColor = '#18181b';
    accentColor = '#e11d48';
    heroImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Kobe Lindqvist', role: 'Head of Footwear Architecture', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Former Olympic ergonomics consultant pioneering nitrogen-infused soles.' },
      { name: 'Yuki Takahashi', role: 'Lead Streetwear Silhouette Designer', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Blending Tokyo cyber-minimalism with Italian vegetable-tanned leather.' },
      { name: 'Amara Sterling', role: 'Director of Sustainable Materials', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Developing circular bio-polymers and zero-waste 3D knit uppers.' }
    ];

    services = [
      { title: 'KINETIX Quantum Carbon Runner', tag: '$220 • New Drop', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', desc: 'Ultra-light carbon fiber propulsion plate with dual-density nitrogen foam.', check: ['Propulsion Carbon Midsole', 'Seamless Monofilament Upper', 'Weight: 198g per shoe'] },
      { title: 'AeroStrike High-Top Street Silhouette', tag: '$260 • Limited', img: 'https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=800&q=80', desc: 'Sculptural architectural ankle support wrapped in hand-burnished nubuck.', check: ['Anatomical Padded Collar', 'Reinforced Vibram Outsole', 'Individually Serial Numbered'] },
      { title: 'NeoFlow Knit Daily Slip-On', tag: '$175 • Best Seller', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', desc: 'Seamless 3D engineered knit with adaptive arch conforming ergonomics.', check: ['Breathable Thermal Mesh', 'Orthotic Heel Stabilizer', 'Machine Washable Architecture'] },
      { title: 'Titanium Trail Expedition Hiker', tag: '$290 • All-Weather', img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80', desc: 'Waterproof Sympatex barrier with multi-directional lug grip for alpine terrain.', check: ['Sympatex Waterproof Shield', 'Grip-Tek Rockplate Defense', 'Speed-Lace Locking Eyelets'] },
      { title: 'Bespoke Custom Footwear Studio', tag: 'Custom Build', img: 'https://images.unsplash.com/photo-1512374382149-233c42b6613c?auto=format&fit=crop&w=800&q=80', desc: 'Commission a one-of-a-kind silhouette tailored to your exact 3D foot scan.', check: ['Private Fitting Consultation', 'Exotic Material Selection', 'Laser-Etched Initials'] },
      { title: 'Atelier Sneaker Restoration & Care', tag: 'Spa Service', img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80', desc: 'Deep enzymatic steam cleaning, re-gluing, and leather uncreasing revival.', check: ['Sole Whitening & De-Oxidation', 'Hydrophobic Nano Sealant', 'White-Glove Return Shipping'] }
    ];

    gallery = [
      { title: 'KINETIX Prototype 01', cat: 'Featured', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
      { title: 'Minimalist Sneaker Silhouette', cat: 'Signature', img: 'https://images.unsplash.com/photo-1551107696-a4b085a6d965?auto=format&fit=crop&w=800&q=80' },
      { title: 'Streetwear Heritage Drop', cat: 'Featured', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80' },
      { title: 'Handmade Leather Welt Detail', cat: 'Signature', img: 'https://images.unsplash.com/photo-1512374382149-233c42b6613c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Urban Trail Performance', cat: 'Recent', img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80' },
      { title: 'High-Fashion Runway Presentation', cat: 'Recent', img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = '360° Colorway Studio & Fit Recommendation';
    widgetSub = 'Select custom colorway accents, pick your verified size, and add directly to your luxury bag.';
    widgetType = 'footwear';
  } else if (p.includes('fitness') || p.includes('gym') || p.includes('workout') || p.includes('trainer') || p.includes('yoga') || p.includes('crossfit')) {
    topic = 'fitness';
    defaultBrand = 'AcroPulse Athletics & Human Performance';
    defaultTagline = 'Data-Driven Human Optimization, Hybrid Strength & Elite Coaching';
    defaultCategory = 'High-Performance Athletics & Training';
    primaryColor = '#18181b';
    accentColor = '#e11d48';
    heroImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Coach Jaxson Steel', role: 'Head of Strength & Conditioning', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Former Olympic coach specializing in explosive power and athletic longevity.' },
      { name: 'Dr. Tanya Briggs, PT', role: 'Director of Biomechanics', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Physical therapist correcting kinetic movement dysfunctions in elite performers.' },
      { name: 'Marcus Avery, RD', role: 'Sports Dietitian & Performance Nutrition', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Optimizing body composition and metabolic endurance through targeted macros.' }
    ];

    services = [
      { title: 'Hybrid Athletic Strength Programming', tag: 'Strength', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', desc: 'Progressive overload periodization designed to build dense power and injury resilience.', check: ['Velocity-Based Training', 'Personalized Load Percentages', 'Deload Optimization'] },
      { title: '1-on-1 Elite Concierge Coaching', tag: 'Private', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80', desc: 'Direct daily oversight, video form breakdown, and weekly biometric check-ins.', check: ['Private Training Bay Access', 'Real-Time Telemetry Tracking', 'Custom Mobility Workouts'] },
      { title: 'VO2 Max & Metabolic Conditioning', tag: 'Cardio', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80', desc: 'Lactate threshold testing and zone-2 base building for cardiovascular dominance.', check: ['Lactate Threshold Profiling', 'Heart Rate Zone Calibration', 'Aerobic Capacity Sprints'] },
      { title: 'Body Recomposition & Macro Coaching', tag: 'Nutrition', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80', desc: 'Metabolic rate analysis and precise macronutrient formulas tailored to training volume.', check: ['DEXA Scan Analysis', 'Custom Daily Macro Targets', 'Supplement Protocol Design'] },
      { title: 'Infrared Sauna & Contrast Cryo Recovery', tag: 'Recovery', img: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80', desc: 'Cold plunges, medical infrared saunas, and pneumatic compression recovery boots.', check: ['38°F Chilled Water Plunges', 'Full-Spectrum Infrared Sauna', 'Normatec Compression Boots'] },
      { title: 'Athletic Physical Therapy & Screening', tag: 'Mobility', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', desc: 'Targeted dry needling, joint flossing, and rotational mobility diagnostics.', check: ['Movement Pattern Screening', 'Targeted Fascial Release', 'Pre-Hab Stability Protocols'] }
    ];

    gallery = [
      { title: 'High-Performance Weight Room', cat: 'Featured', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80' },
      { title: 'Dedicated Olympic Platform', cat: 'Signature', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
      { title: 'Private 1-on-1 Coaching Studio', cat: 'Featured', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80' },
      { title: 'Cryo Contrast Recovery Suite', cat: 'Signature', img: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80' },
      { title: 'Athletic Conditioning Turf', cat: 'Recent', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80' },
      { title: 'Metabolic Endurance Lab', cat: 'Recent', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Interactive 1-Rep Max & Target Calorie Calculator';
    widgetSub = 'Input your lift metrics and bodyweight to calculate theoretical maxes and daily protein & caloric requirements.';
    widgetType = 'fitness';
  } else if (p.includes('real estate') || p.includes('property') || p.includes('villa') || p.includes('architect') || p.includes('home') || p.includes('interior')) {
    topic = 'realestate';
    defaultBrand = 'Sovereign Architectural Living';
    defaultTagline = 'Architectural Masterpieces & Prime Coastal Estates';
    defaultCategory = 'Luxury Real Estate & Architectural Living';
    primaryColor = '#0f172a';
    accentColor = '#b45309';
    heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Sebastian Thorne', role: 'Managing Broker & Founder', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Transacting over $1.2B in trophy architectural residences across global capitals.' },
      { name: 'Genevieve Laurent', role: 'Director of Architectural Acquisitions', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Curating off-market modernist villas and landmark historic restorations.' },
      { name: 'Harrison Blake', role: 'Principal Wealth & Private Escrow Partner', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Structuring cross-border private real estate portfolios and tax-advantaged trusts.' }
    ];

    services = [
      { title: 'Trophy Coastal Villas & Penthouses', tag: 'Acquisitions', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', desc: 'Unparalleled waterfront compounds with private deep-water docks and infinity pools.', check: ['Panoramic Ocean Views', 'Smart Home HomeKit Integration', 'Gated Private Compound'] },
      { title: 'Private Off-Market Pocket Listings', tag: 'Exclusive', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', desc: 'Confidential access to trophy residences not publicly indexed on MLS networks.', check: ['Strict NDA Client Protocol', 'Direct Owner Negotiations', 'Complete Identity Discretion'] },
      { title: 'Architectural Modernist Estates', tag: 'Architecture', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', desc: 'Steel, concrete, and glass estates crafted by Pritzker Prize-winning architects.', check: ['Floor-to-Ceiling Glass Walls', 'Cantilevered Living Decks', 'Custom Light Sculptures'] },
      { title: 'High-Yield Global Portfolio Advisory', tag: 'Investment', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80', desc: 'Data-driven underwriting for multi-family, vacation rentals, and trophy holdings.', check: ['Cap Rate Sensitivity Models', 'Short-Term Rental Forecasting', 'Tax-Free 1031 Exchange'] },
      { title: 'Interior Styling & Spatial Staging', tag: 'Curation', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', desc: 'Museum-grade furnishings, rare art curation, and bespoke scent design for sellers.', check: ['Original Contemporary Art', 'Custom Italian Furnishings', 'Sensory Lighting Schemes'] },
      { title: 'Private Wealth Closing & Concierge', tag: 'Concierge', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', desc: 'Dedicated staff handling family office relocations, security details, and yacht berths.', check: ['Private Security Audits', 'Concierge Staffing Placement', 'Superyacht Slip Sourcing'] }
    ];

    gallery = [
      { title: 'The Bel-Air Modernist Villa', cat: 'Featured', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Malibu Oceanfront Glass Pavilion', cat: 'Signature', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
      { title: 'Tribeca Penthouse Terrace', cat: 'Featured', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Aspen Mountain Stone Sanctuary', cat: 'Signature', img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80' },
      { title: 'Minimalist Japanese Courtyard', cat: 'Recent', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
      { title: 'Cap d’Antibes Mediterranean Haven', cat: 'Recent', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Mortgage & Rental Yield Investment Estimator';
    widgetSub = 'Simulate monthly amortization, rental yield potential, and long-term equity growth with interactive rate toggles.';
    widgetType = 'realestate';
  } else if (p.includes('saas') || p.includes('ai') || p.includes('software') || p.includes('tech') || p.includes('cloud') || p.includes('developer')) {
    topic = 'saas';
    defaultBrand = 'OmniFlow Intelligent Systems';
    defaultTagline = 'Autonomous Workflows, Real-time Observability & Cloud Orchestration';
    defaultCategory = 'Next-Gen Developer & AI Tooling';
    primaryColor = '#0f172a';
    accentColor = '#6366f1';
    heroImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
    aboutImage = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    teamMembers = [
      { name: 'Dr. Evelyn Cross', role: 'Founder & Chief Scientist', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', bio: 'Former MIT AI Lab researcher specializing in distributed consensus and LLM agents.' },
      { name: 'Devon Zhao', role: 'Head of Infrastructure Engineering', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Architecting Kubernetes clusters scaling across multi-region edge networks.' },
      { name: 'Maya Patel', role: 'VP Product & Developer Experience', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Dedicated to intuitive APIs, zero-overhead SDKs, and developer delight.' }
    ];

    services = [
      { title: 'Autonomous Event Pipeline Orchestration', tag: 'Pipelines', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', desc: 'Deploy self-healing asynchronous workflows with zero server management.', check: ['Sub-Millisecond Routing', 'Automatic Retry Queues', 'Kafka & SQS Connectors'] },
      { title: 'Real-Time Edge Telemetry & Tracing', tag: 'Observability', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', desc: 'Full distributed OpenTelemetry traces with AI anomaly detection and instant alerts.', check: ['OpenTelemetry Compliant', 'Automated Root-Cause AI', '14-Month Log Retention'] },
      { title: 'Low-Latency AI Inference Gateway', tag: 'AI Engine', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80', desc: 'Smart model failover, semantic prompt caching, and cost-optimized token routing.', check: ['Semantic Cache Hits (-80% Cost)', 'Multi-Model Fallback Mesh', 'Enterprise PII Scrubbing'] },
      { title: 'Zero-Trust Secrets & Cryptographic Vault', tag: 'Security', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80', desc: 'Hardware-backed KMS key rotation, ephemeral tokens, and strict audit trails.', check: ['SOC2 Type II Certified', 'mTLS Mutual Encryption', 'Role-Based Access Control'] },
      { title: 'Multi-Cloud FinOps & Cost Optimizer', tag: 'FinOps', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', desc: 'Machine learning algorithms that terminate idle compute and reclaim cloud spend.', check: ['Average 38% AWS Bill Savings', 'Spot Instance Automation', 'Real-Time Slack Budget Alerts'] },
      { title: 'Global Edge Worker CDN Delivery', tag: 'Edge Compute', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', desc: 'Run compute in 310+ cities worldwide within 5ms of your end users.', check: ['V8 Isolate Sandboxing', '0ms Cold Start Times', 'DDoS Mitigation Shield'] }
    ];

    gallery = [
      { title: 'Real-Time Telemetry Dashboard', cat: 'Featured', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
      { title: 'Distributed Edge Topology', cat: 'Signature', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
      { title: 'Cloud Infrastructure Console', cat: 'Featured', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80' },
      { title: 'Cybersecurity Shield Center', cat: 'Signature', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80' },
      { title: 'Developer Terminal Interface', cat: 'Recent', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
      { title: 'Enterprise Server Data Center', cat: 'Recent', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80' }
    ];

    widgetTitle = 'Cloud Capacity & Autonomous Pipeline ROI Calculator';
    widgetSub = 'Calculate cloud infrastructure acceleration, runtime cost reductions, and monthly tier pricing.';
    widgetType = 'estimator';
  } else {
    // Dynamic topic extraction from any prompt
    const cleanWordPrompt = p.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const words = cleanWordPrompt.split(/\s+/).filter(w => w.length > 2 && !['want','create','make','website','please','site','the','and','for','with','good','looking'].includes(w)).slice(0, 4);
    if (words.length > 0) {
      const topicName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      defaultBrand = `${topicName} Studio`;
      defaultCategory = `${topicName} Solutions`;
      defaultTagline = `Elevating ${topicName} Through Modern Craftsmanship & Intelligent Design`;
    }
  }

  // 2. Resolve Final Brand, Typography and Palette
  const brandName = (blueprint?.suggestedBrand || defaultBrand).replace(/["<>]/g, '');
  const tagline = (blueprint?.tagline || defaultTagline).replace(/["<>]/g, '');
  const finalCategory = (blueprint?.category || defaultCategory).replace(/["<>]/g, '');
  const primary = blueprint?.colorPalette?.primary || primaryColor;
  const accent = blueprint?.colorPalette?.accent || accentColor;
  const fontHeading = blueprint?.typography?.headings || 'Plus Jakarta Sans';
  const fontBody = blueprint?.typography?.body || 'Plus Jakarta Sans';

  // 3. Render Domain-Specific Interactive Widget
  let widgetHTML = '';
  let widgetJS = '';

  if (widgetType === 'fish') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Aquarium Dimension & Ecosystem Specifier</h3>
            <p>Adjust length, width, and height to compute recommended living bioload, filtration GPH, and heater capacity.</p>
            
            <div class="input-field">
              <label>Tank Length: <strong id="tankLengthVal">36</strong> inches</label>
              <input type="range" id="tankLength" min="12" max="96" value="36" class="slider-input">
            </div>

            <div class="input-field">
              <label>Tank Width: <strong id="tankWidthVal">18</strong> inches</label>
              <input type="range" id="tankWidth" min="10" max="48" value="18" class="slider-input">
            </div>

            <div class="input-field">
              <label>Tank Height: <strong id="tankHeightVal">24</strong> inches</label>
              <input type="range" id="tankHeight" min="12" max="48" value="24" class="slider-input">
            </div>

            <div class="input-field">
              <label>Biotope Ecosystem Type</label>
              <select id="ecosystemType" class="select-input">
                <option value="reef" selected>Coral Reef Marine Biotope (3.5x flow)</option>
                <option value="freshwater">High-Tech Freshwater Aquascape</option>
                <option value="cichlid">African Rift Lake Biotope</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Computed Water Volume</span>
              <span class="result-number" id="waterGallons">67 Gallons</span>
              <span class="result-sub" id="waterLiters">(approx. 254 Liters)</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Recommended Filter Turnover:</span>
                <strong id="filterFlowRate">670 GPH</strong>
              </div>
              <div class="detail-row">
                <span>Optimal Heating Capacity:</span>
                <strong id="heaterWattage">200 Watts</strong>
              </div>
              <div class="detail-row">
                <span>Safe Community Fish Bioload:</span>
                <strong id="fishCapacity">Up to 22 Marine Specimens</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="bookAquariumConsultBtn">
              <span>Lock Ecosystem Specs & Request Consultation</span>
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
        if (document.getElementById('fishCapacity')) document.getElementById('fishCapacity').textContent = 'Up to ' + fishCount + ' Marine Specimens';
      }

      [lSlider, wSlider, hSlider, ecoSelect].forEach(el => el?.addEventListener('input', calculateAquarium));
      calculateAquarium();

      document.getElementById('bookAquariumConsultBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('🐠 Consultation locked! Our senior marine biologist will reach out within 2 hours.');
      });
    `;
  } else if (widgetType === 'pet') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Personalized Companion Nutrition Calculator</h3>
            <p>Compute tailored daily calories, recommended organic portion sizes, and hydration.</p>
            
            <div class="input-field">
              <label>Companion Weight: <strong id="petWeightVal">32</strong> lbs</label>
              <input type="range" id="petWeight" min="4" max="140" value="32" class="slider-input">
            </div>

            <div class="input-field">
              <label>Daily Activity Profile</label>
              <select id="petActivity" class="select-input">
                <option value="1.2">Gentle / Senior (Light walks)</option>
                <option value="1.5" selected>Moderate / Active (1-2 hours play)</option>
                <option value="1.8">High Energy / Working Canine (Active sport)</option>
              </select>
            </div>

            <div class="input-field">
              <label>Life Stage</label>
              <select id="petLifeStage" class="select-input">
                <option value="adult" selected>Adult (1 - 7 years)</option>
                <option value="puppy">Growing Puppy / Kitten</option>
                <option value="senior">Senior Companion (7+ years)</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Recommended Daily Caloric Intake</span>
              <span class="result-number" id="petCalories">745 kcal</span>
              <span class="result-sub">Optimized for clean energy & joint health</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Daily Whole Food Portions:</span>
                <strong id="petPortions">280 grams / day</strong>
              </div>
              <div class="detail-row">
                <span>Minimum Daily Hydration:</span>
                <strong id="petWater">32 oz pure water</strong>
              </div>
              <div class="detail-row">
                <span>Feeding Rhythm:</span>
                <strong>2 Balanced Meals (Morning / Evening)</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="claimPetPlanBtn">
              <span>Save Nutrition Plan & Book Wellness Consultation</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const weightSlider = document.getElementById('petWeight');
      const actSelect = document.getElementById('petActivity');

      function calculatePet() {
        const weightLbs = parseFloat(weightSlider?.value || 32);
        const weightKg = weightLbs / 2.20462;
        const actMultiplier = parseFloat(actSelect?.value || 1.5);

        if (document.getElementById('petWeightVal')) document.getElementById('petWeightVal').textContent = weightLbs;

        const rer = 70 * Math.pow(weightKg, 0.75);
        const calories = Math.round(rer * actMultiplier);
        const grams = Math.round(calories * 0.38);

        if (document.getElementById('petCalories')) document.getElementById('petCalories').textContent = calories + ' kcal';
        if (document.getElementById('petPortions')) document.getElementById('petPortions').textContent = grams + ' grams / day';
        if (document.getElementById('petWater')) document.getElementById('petWater').textContent = Math.round(weightLbs * 1.1) + ' oz pure water';
      }

      [weightSlider, actSelect].forEach(el => el?.addEventListener('input', calculatePet));
      calculatePet();

      document.getElementById('claimPetPlanBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('🐾 Personalized nutrition regimen locked! Welcome to PawHaven.');
      });
    `;
  } else if (widgetType === 'food') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Bespoke Coffee Flavor Profiler</h3>
            <p>Customize origin notes, roast intensity, and brew parameters to discover your ideal profile.</p>

            <div class="input-field">
              <label>Roast Intensity Level: <strong id="roastVal">Medium-Light (City+)</strong></label>
              <input type="range" id="roastSlider" min="1" max="5" value="2" class="slider-input">
            </div>

            <div class="input-field">
              <label>Single-Origin Terroir</label>
              <select id="originSelect" class="select-input">
                <option value="ethiopia" selected>Yirgacheffe, Ethiopia (2,100m • Jasmine & Bergamot)</option>
                <option value="colombia">Huila, Colombia (1,850m • Dark Cherry & Cacao)</option>
                <option value="panama">Boquete Geisha, Panama (1,950m • Floral Orange Blossom)</option>
              </select>
            </div>

            <div class="input-field">
              <label>Brew Method</label>
              <select id="brewSelect" class="select-input">
                <option value="v60" selected>Hario V60 Precision Pour-Over</option>
                <option value="espresso">9-Bar Classic Espresso</option>
                <option value="chemex">Slow Chemex Filtration</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Recommended Brew Calibration</span>
              <span class="result-number" id="brewRatio">1 : 16.5 Ratio</span>
              <span class="result-sub" id="brewTemp">Water Temp: 93°C (199°F)</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Dominant Flavor Notes:</span>
                <strong id="flavorProfile">Jasmine, White Peach, Meyer Lemon</strong>
              </div>
              <div class="detail-row">
                <span>Acidity & Body:</span>
                <strong id="acidityLevel">Sparkling Citric • Silky Tea-like Body</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="reserveTableBtn">
              <span>Reserve Tasting Experience</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const roastSlider = document.getElementById('roastSlider');
      const originSelect = document.getElementById('originSelect');

      const roastNames = ['', 'Light (Cinnamon)', 'Medium-Light (City+)', 'Medium (Full City)', 'Medium-Dark (Vienna)', 'Dark (French)'];

      function updateCoffee() {
        const roastIdx = parseInt(roastSlider?.value || 2, 10);
        const origin = originSelect?.value || 'ethiopia';

        if (document.getElementById('roastVal')) document.getElementById('roastVal').textContent = roastNames[roastIdx] || 'Medium-Light';

        if (origin === 'ethiopia') {
          if (document.getElementById('flavorProfile')) document.getElementById('flavorProfile').textContent = 'Jasmine, White Peach, Meyer Lemon';
          if (document.getElementById('brewRatio')) document.getElementById('brewRatio').textContent = '1 : 16.5 Ratio';
        } else if (origin === 'colombia') {
          if (document.getElementById('flavorProfile')) document.getElementById('flavorProfile').textContent = 'Dark Chocolate, Black Cherry, Toasted Almond';
          if (document.getElementById('brewRatio')) document.getElementById('brewRatio').textContent = '1 : 15.5 Ratio';
        } else {
          if (document.getElementById('flavorProfile')) document.getElementById('flavorProfile').textContent = 'Geisha Blossom, Bergamot, Wild Honey';
          if (document.getElementById('brewRatio')) document.getElementById('brewRatio').textContent = '1 : 17.0 Ratio';
        }
      }

      [roastSlider, originSelect].forEach(el => el?.addEventListener('input', updateCoffee));
      updateCoffee();

      document.getElementById('reserveTableBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('☕ Tasting experience reserved! Confirmation sent to your inbox.');
      });
    `;
  } else if (widgetType === 'footwear') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>360° Colorway Studio & Ergonomic Sizing</h3>
            <p>Select your preferred colorway finish, pick your true US sizing, and lock your pair.</p>

            <div class="input-field">
              <label>Selected Colorway</label>
              <div class="color-swatches" id="colorSwatches">
                <button class="color-swatch active" data-color="Crimson Ember" style="background:#e11d48;" title="Crimson Ember"></button>
                <button class="color-swatch" data-color="Onyx Stealth" style="background:#18181b;" title="Onyx Stealth"></button>
                <button class="color-swatch" data-color="Arctic White" style="background:#f1f5f9; border:1px solid #cbd5e1;" title="Arctic White"></button>
                <button class="color-swatch" data-color="Volt Cyber" style="background:#10b981;" title="Volt Cyber"></button>
              </div>
              <div class="selected-color-label">Active Finish: <strong id="activeColorName">Crimson Ember</strong></div>
            </div>

            <div class="input-field">
              <label>US Men / Women Size</label>
              <div class="size-pill-group" id="sizePills">
                <button class="size-btn">US 8</button>
                <button class="size-btn">US 9</button>
                <button class="size-btn active">US 10</button>
                <button class="size-btn">US 11</button>
                <button class="size-btn">US 12</button>
              </div>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Verified Edition In Stock</span>
              <span class="result-number">$240 USD</span>
              <span class="result-sub">Complimentary Express Worldwide Shipping</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Sole Configuration:</span>
                <strong>Dual-Density Carbon Plate Midsole</strong>
              </div>
              <div class="detail-row">
                <span>Remaining Pair Allocation:</span>
                <strong style="color:var(--accent);">Only 4 pairs left in size 10</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="addToBagBtn">
              <span>Add to Shopping Bag • Secure Checkout</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const swatches = document.querySelectorAll('.color-swatch');
      const sizeBtns = document.querySelectorAll('.size-btn');

      swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
          swatches.forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          const colorName = swatch.getAttribute('data-color');
          if (document.getElementById('activeColorName')) document.getElementById('activeColorName').textContent = colorName;
        });
      });

      sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          sizeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      document.getElementById('addToBagBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('👟 Added KINETIX to your bag! Express shipping locked.');
      });
    `;
  } else if (widgetType === 'fitness') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Interactive 1-Rep Max & Macro Profiler</h3>
            <p>Compute theoretical single-rep strength maximums and customized daily protein targets.</p>

            <div class="input-field">
              <label>Weight Lifted: <strong id="liftWeightVal">225</strong> lbs</label>
              <input type="range" id="liftWeight" min="45" max="500" value="225" class="slider-input">
            </div>

            <div class="input-field">
              <label>Repetitions Completed: <strong id="repCountVal">5</strong> reps</label>
              <input type="range" id="repCount" min="1" max="15" value="5" class="slider-input">
            </div>

            <div class="input-field">
              <label>Primary Movement Discipline</label>
              <select id="exerciseType" class="select-input">
                <option value="barbell_bench" selected>Barbell Bench Press</option>
                <option value="back_squat">Barbell Back Squat</option>
                <option value="deadlift">Conventional Deadlift</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Estimated 1-Rep Maximum (1RM)</span>
              <span class="result-number" id="oneRepMax">253 lbs</span>
              <span class="result-sub" id="workingSet">Working 5x5 Target: 215 lbs</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Target Daily Protein:</span>
                <strong id="proteinTarget">185g High-Bioavailability Protein</strong>
              </div>
              <div class="detail-row">
                <span>Optimal Rest Interval:</span>
                <strong>3 - 4 Minutes Between Heavy Sets</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="claimWorkoutPlanBtn">
              <span>Lock Strength Metrics & Claim Training Blueprint</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const weightSlider = document.getElementById('liftWeight');
      const repSlider = document.getElementById('repCount');

      function calculate1RM() {
        const weight = parseFloat(weightSlider?.value || 225);
        const reps = parseFloat(repSlider?.value || 5);

        if (document.getElementById('liftWeightVal')) document.getElementById('liftWeightVal').textContent = weight;
        if (document.getElementById('repCountVal')) document.getElementById('repCountVal').textContent = reps;

        // Brzycki Formula
        const oneRM = reps === 1 ? weight : Math.round(weight * (36 / (37 - reps)));
        const fiveByFive = Math.round(oneRM * 0.82);

        if (document.getElementById('oneRepMax')) document.getElementById('oneRepMax').textContent = oneRM + ' lbs';
        if (document.getElementById('workingSet')) document.getElementById('workingSet').textContent = 'Working 5x5 Target: ' + fiveByFive + ' lbs';
      }

      [weightSlider, repSlider].forEach(el => el?.addEventListener('input', calculate1RM));
      calculate1RM();

      document.getElementById('claimWorkoutPlanBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('⚡ Strength blueprint generated! Check your email for full protocol.');
      });
    `;
  } else if (widgetType === 'realestate') {
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Mortgage & Investment Yield Simulator</h3>
            <p>Compute estimated monthly financing obligations and projected gross rental returns.</p>

            <div class="input-field">
              <label>Property Acquisition Value: <strong id="propValLabel">$2,500,000</strong></label>
              <input type="range" id="propValSlider" min="500000" max="15000000" step="100000" value="2500000" class="slider-input">
            </div>

            <div class="input-field">
              <label>Down Payment Percentage: <strong id="downValLabel">25% ($625,000)</strong></label>
              <input type="range" id="downSlider" min="10" max="60" step="5" value="25" class="slider-input">
            </div>

            <div class="input-field">
              <label>Interest Rate & Loan Term</label>
              <select id="loanTermSelect" class="select-input">
                <option value="6.2">30-Year Fixed (6.2% APR)</option>
                <option value="5.8">15-Year Fixed (5.8% APR)</option>
                <option value="6.5">Interest-Only Jumbo ARM (6.5% APR)</option>
              </select>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Estimated Monthly Principal & Interest</span>
              <span class="result-number" id="monthlyPayment">$11,485 / mo</span>
              <span class="result-sub" id="loanAmountLabel">Loan Principal: $1,875,000</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Estimated Annual Gross Rental Yield:</span>
                <strong id="rentalYield">5.8% ($145,000 / year)</strong>
              </div>
              <div class="detail-row">
                <span>Projected 5-Year Equity Growth:</span>
                <strong>+28.4% Conservative Appreciation</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="requestBrochureBtn">
              <span>Request Confidential Acquisition Package</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const propSlider = document.getElementById('propValSlider');
      const downSlider = document.getElementById('downSlider');
      const termSelect = document.getElementById('loanTermSelect');

      function calculateMortgage() {
        const propVal = parseFloat(propSlider?.value || 2500000);
        const downPct = parseFloat(downSlider?.value || 25);
        const apr = parseFloat(termSelect?.value || 6.2);

        const downDollars = Math.round(propVal * (downPct / 100));
        const principal = propVal - downDollars;

        if (document.getElementById('propValLabel')) document.getElementById('propValLabel').textContent = '$' + propVal.toLocaleString();
        if (document.getElementById('downValLabel')) document.getElementById('downValLabel').textContent = downPct + '% ($' + downDollars.toLocaleString() + ')';
        if (document.getElementById('loanAmountLabel')) document.getElementById('loanAmountLabel').textContent = 'Loan Principal: $' + principal.toLocaleString();

        const monthlyRate = (apr / 100) / 12;
        const totalMonths = 360;
        const monthly = Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1));

        if (document.getElementById('monthlyPayment')) document.getElementById('monthlyPayment').textContent = '$' + monthly.toLocaleString() + ' / mo';
      }

      [propSlider, downSlider, termSelect].forEach(el => el?.addEventListener('input', calculateMortgage));
      calculateMortgage();

      document.getElementById('requestBrochureBtn')?.addEventListener('click', () => {
        if (window.showToast) window.showToast('🏛️ Dossier dispatched! Private acquisition team notified.');
      });
    `;
  } else {
    // Universal Bespoke Scope & Investment Estimator
    widgetHTML = `
      <div class="widget-interactive-box">
        <div class="calculator-grid">
          <div class="calc-input-pane">
            <h3>Interactive Scope & Investment Estimator</h3>
            <p>Customize deliverables and velocity to compute estimated turnaround and investment tier.</p>

            <div class="input-field">
              <label>Project Scope Scale: <strong id="scopeScaleLabel">Standard Enterprise</strong></label>
              <input type="range" id="scopeScaleSlider" min="1" max="3" value="2" class="slider-input">
            </div>

            <div class="input-field">
              <label>Delivery Velocity Preference</label>
              <select id="velocitySelect" class="select-input">
                <option value="standard">Standard Sprint (3 - 4 Weeks)</option>
                <option value="expedited" selected>Expedited Fast-Track (10 - 14 Days)</option>
                <option value="rush">Priority 72-Hour Rapid Onboarding</option>
              </select>
            </div>

            <div class="input-field">
              <label>Service Tiers</label>
              <div class="tier-pills-row" id="tierPills">
                <button class="tier-pill" data-rate="2500">Essential</button>
                <button class="tier-pill active" data-rate="4800">Professional</button>
                <button class="tier-pill" data-rate="9500">Enterprise Sovereign</button>
              </div>
            </div>
          </div>

          <div class="calc-output-pane">
            <div class="result-card">
              <span class="result-label">Computed Project Investment</span>
              <span class="result-number" id="calcTotalCost">$4,800 USD</span>
              <span class="result-sub" id="selectedTierLabel">Professional Implementation</span>
            </div>
            
            <div class="result-details">
              <div class="detail-row">
                <span>Estimated Turnaround:</span>
                <strong id="turnaroundLabel">14 Business Days</strong>
              </div>
              <div class="detail-row">
                <span>Full Source Deliverables:</span>
                <strong>Production HTML, CSS, JS + Documentation</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" id="claimQuoteBtn">
              <span>Lock Proposal & Schedule Intake</span>
            </button>
          </div>
        </div>
      </div>
    `;

    widgetJS = `
      const scopeSlider = document.getElementById('scopeScaleSlider');
      const velocitySelect = document.getElementById('velocitySelect');
      const tierPills = document.querySelectorAll('.tier-pill');

      let currentRate = 4800;
      let currentTierName = 'Professional Implementation';

      function updateEstimator() {
        const scope = parseInt(scopeSlider?.value || 2, 10);
        const velocity = velocitySelect?.value || 'expedited';

        let multiplier = scope === 1 ? 0.75 : scope === 2 ? 1.0 : 1.6;
        let velFee = velocity === 'expedited' ? 600 : velocity === 'rush' ? 1400 : 0;
        let days = scope === 1 ? 7 : scope === 2 ? 14 : 28;
        if (velocity === 'expedited') days = Math.round(days * 0.7);
        if (velocity === 'rush') days = Math.round(days * 0.4);

        const total = Math.round((currentRate * multiplier) + velFee);

        if (document.getElementById('calcTotalCost')) document.getElementById('calcTotalCost').textContent = '$' + total.toLocaleString() + ' USD';
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
        if (window.showToast) window.showToast('✨ Proposal locked! Formal intake packet dispatched.');
      });
    `;
  }

  // 4. Construct Complete Multi-Page HTML
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} | ${tagline.slice(0, 55)}</title>
  <meta name="description" content="${brandName}: ${tagline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Top Announcement Bar -->
  <aside class="announcement-bar" id="announcementBar" role="region" aria-label="Announcement">
    <div class="announcement-container">
      <span class="announcement-pill">New Update</span>
      <span class="announcement-text">✨ 2026 Bespoke Collections & Exclusive Private Consultations Now Open</span>
      <button class="announcement-close" id="closeAnnouncementBtn" aria-label="Dismiss banner">&times;</button>
    </div>
  </aside>

  <!-- Sticky Glassmorphic Header Navigation -->
  <header class="site-header" id="header">
    <div class="nav-container">
      <a href="#home" class="brand-logo" aria-label="${brandName} Home">
        <span class="logo-symbol">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </span>
        <span class="brand-text"><strong>${brandName}</strong></span>
      </a>

      <!-- Desktop Multi-Page Nav Links -->
      <nav class="main-nav" id="mainNav" aria-label="Primary navigation">
        <a href="#home" class="nav-link active">Home</a>
        <a href="#about" class="nav-link">About</a>
        <a href="#services" class="nav-link">Offerings</a>
        <a href="#interactive" class="nav-link">Studio</a>
        <a href="#gallery" class="nav-link">Gallery</a>
        <a href="#pricing" class="nav-link">Pricing</a>
        <a href="#testimonials" class="nav-link">Reviews</a>
        <a href="#blog" class="nav-link">Insights</a>
        <a href="#faq" class="nav-link">FAQ</a>
        <a href="#contact" class="nav-link">Contact</a>
      </nav>

      <!-- Nav Actions -->
      <div class="nav-actions">
        <button id="themeToggleBtn" class="icon-btn" aria-label="Toggle theme" title="Toggle theme">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="btn btn-primary" id="openContactModalBtn">
          <span>Inquire Today</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="hamburger-btn" id="mobileMenuToggle" aria-label="Toggle menu">
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
      <a href="#home" class="drawer-link">Home</a>
      <a href="#about" class="drawer-link">About Us</a>
      <a href="#services" class="drawer-link">Offerings & Services</a>
      <a href="#interactive" class="drawer-link">Interactive Studio</a>
      <a href="#gallery" class="drawer-link">Curated Gallery</a>
      <a href="#pricing" class="drawer-link">Investment Plans</a>
      <a href="#testimonials" class="drawer-link">Client Reviews</a>
      <a href="#blog" class="drawer-link">Latest Insights</a>
      <a href="#faq" class="drawer-link">FAQ</a>
      <a href="#contact" class="drawer-link">Contact</a>
      <button class="btn btn-primary btn-block" id="drawerContactBtn">Inquire Today</button>
    </div>
  </div>

  <main>
    <!-- 1. Hero Section -->
    <section class="hero-section" id="home">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="badge-pill">
            <span class="pulse-dot"></span>
            <span>${finalCategory}</span>
          </div>
          <h1 class="hero-title">${tagline}</h1>
          <p class="hero-subtitle">
            Welcome to ${brandName}. Designed with obsessive attention to craft, responsive fluid typography, and verified real-world components tailored to your ambition.
          </p>

          <div class="hero-cta-group">
            <a href="#interactive" class="btn btn-primary btn-lg">Launch Interactive Studio</a>
            <a href="#gallery" class="btn btn-outline btn-lg">Explore Gallery & Work</a>
          </div>

          <div class="hero-metrics">
            <div class="metric-item">
              <span class="metric-num">99.8%</span>
              <span class="metric-lbl">Satisfaction Index</span>
            </div>
            <div class="metric-item">
              <span class="metric-num">15,000+</span>
              <span class="metric-lbl">Verified Patrons</span>
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
            <img src="${heroImage}" alt="${brandName} Flagship" class="hero-img">
            <div class="floating-badge top-badge">
              <span class="badge-dot"></span>
              <span>⭐ 4.96/5 Rating (2,840+ Reviews)</span>
            </div>
            <div class="floating-badge bottom-badge">
              <span class="badge-dot"></span>
              <span>⚡ Verified Excellence 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. About Us & Heritage Section -->
    <section class="about-section" id="about">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Our Legacy & Philosophy</span>
          <h2>Crafted With Obsessive Precision & Unwavering Standards</h2>
          <p class="section-sub">A relentless commitment to modern elegance, sustainable innovation, and enduring client partnerships.</p>
        </div>

        <div class="about-grid">
          <div class="about-story-pane">
            <h3>Pioneering the Highest Standards in ${finalCategory}</h3>
            <p>Founded on the principle that uncompromising craft should be accessible to visionaries worldwide, ${brandName} harmonizes technical rigor with sensory elegance.</p>
            <p>Every solution we engineer undergoes rigorous stress testing, ethical sourcing, and meticulous finishing to guarantee a transformative outcome.</p>
            
            <div class="about-pillars">
              <div class="pillar-box">
                <div class="pillar-num">01</div>
                <div>
                  <h4>Curated Mastery</h4>
                  <p>Every element is hand-selected and verified to exceed industry standards.</p>
                </div>
              </div>
              <div class="pillar-box">
                <div class="pillar-num">02</div>
                <div>
                  <h4>Sustainable Ingenuity</h4>
                  <p>Environmentally conscious methodologies engineered for multi-decade durability.</p>
                </div>
              </div>
              <div class="pillar-box">
                <div class="pillar-num">03</div>
                <div>
                  <h4>Direct Partnership</h4>
                  <p>Dedicated executive concierge support throughout your entire engagement.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="about-visual-pane">
            <div class="about-img-wrap">
              <img src="${aboutImage}" alt="${brandName} Studio Heritage" class="about-img">
              <div class="about-stat-overlay">
                <strong>12+ Years</strong>
                <span>Industry Leadership & Distinction</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Leadership & Team Grid -->
        <div class="team-header text-center">
          <span class="eyebrow">Executive Faculty</span>
          <h3>Guided by Proven Masters & Visionaries</h3>
        </div>

        <div class="team-grid">
          ${teamMembers.map(m => `
            <div class="team-card">
              <div class="team-img-wrap">
                <img src="${m.photo}" alt="${m.name}" class="team-img">
              </div>
              <div class="team-info">
                <h4>${m.name}</h4>
                <span class="team-role">${m.role}</span>
                <p>${m.bio}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- 3. Services & Offerings Matrix -->
    <section class="services-section" id="services">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Signature Capabilities</span>
          <h2>Bespoke Offerings Tailored to Your Ambition</h2>
          <p class="section-sub">Explore our comprehensive suite of certified solutions engineered for peak performance.</p>
        </div>

        <div class="services-grid">
          ${services.map((s) => `
            <article class="service-card">
              <div class="service-img-wrap">
                <img src="${s.img}" alt="${s.title}" class="service-img">
                <span class="service-tag">${s.tag}</span>
              </div>
              <div class="service-body">
                <h3>${s.title}</h3>
                <p>${s.desc}</p>
                <ul class="service-checklist">
                  ${s.check.map(c => `
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      <span>${c}</span>
                    </li>
                  `).join('')}
                </ul>
                <button class="btn btn-outline btn-block service-inquire-btn" data-service="${s.title}">
                  Request Consultation
                </button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- 4. Interactive Domain Studio Widget -->
    <section class="interactive-section" id="interactive">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Real-Time Interactive Studio</span>
          <h2>${widgetTitle}</h2>
          <p class="section-sub">${widgetSub}</p>
        </div>

        ${widgetHTML}
      </div>
    </section>

    <!-- 5. Photo Showcase & Gallery with Lightbox -->
    <section class="gallery-section" id="gallery">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Visual Excellence</span>
          <h2>Curated Photography & Showcase</h2>
          <p class="section-sub">Click any piece to expand into high-definition lightbox exhibition view.</p>
        </div>

        <div class="gallery-filters" id="galleryFilters">
          <button class="filter-btn active" data-filter="all">All Works</button>
          <button class="filter-btn" data-filter="Featured">Featured</button>
          <button class="filter-btn" data-filter="Signature">Signature</button>
          <button class="filter-btn" data-filter="Recent">Recent Additions</button>
        </div>

        <div class="gallery-grid" id="galleryGrid">
          ${gallery.map((g) => `
            <div class="gallery-item" data-category="${g.cat}" data-img="${g.img}" data-title="${g.title}">
              <div class="gallery-img-wrap">
                <img src="${g.img}" alt="${g.title}" class="gallery-img">
                <div class="gallery-overlay">
                  <span class="gallery-badge">${g.cat}</span>
                  <h4>${g.title}</h4>
                  <span class="zoom-cue">Click to view in Lightbox &rarr;</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- 6. Pricing & Investment Plans -->
    <section class="pricing-section" id="pricing">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Predictable Investment</span>
          <h2>Transparent Membership & Engagement Plans</h2>
          <p class="section-sub">Choose the ideal framework engineered for your scale and timeline.</p>
        </div>

        <!-- Billing Frequency Switcher -->
        <div class="pricing-switch-wrapper">
          <span class="billing-label" id="monthlyLabel">Monthly Billing</span>
          <label class="switch">
            <input type="checkbox" id="billingToggle">
            <span class="slider round"></span>
          </label>
          <span class="billing-label active" id="annualLabel">
            Annual Billing
            <span class="save-tag">Save 20%</span>
          </span>
        </div>

        <div class="pricing-grid">
          <!-- Tier 1 -->
          <div class="pricing-card">
            <div class="pricing-header">
              <span class="tier-name">Essential</span>
              <p class="tier-desc">Designed for focused initiatives requiring proven foundations.</p>
              <div class="price-wrap">
                <span class="price-currency">$</span>
                <span class="price-amount" data-monthly="69" data-annual="55">55</span>
                <span class="price-period">/ month</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Core Capability Access</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Dedicated Consultation Call</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Verified Authenticity Badge</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Standard 48-Hour SLA</li>
            </ul>
            <button class="btn btn-outline btn-block select-plan-btn" data-plan="Essential">Choose Essential</button>
          </div>

          <!-- Tier 2 (Featured) -->
          <div class="pricing-card featured">
            <div class="featured-ribbon">Most Popular</div>
            <div class="pricing-header">
              <span class="tier-name">Professional Studio</span>
              <p class="tier-desc">Our flagship tier for ambitious organizations seeking total mastery.</p>
              <div class="price-wrap">
                <span class="price-currency">$</span>
                <span class="price-amount" data-monthly="169" data-annual="135">135</span>
                <span class="price-period">/ month</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Comprehensive Full-Suite Access</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Priority Turnaround & Fast-Track</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Dedicated Lead Consultant</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Unlimited Iterations & Assets</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> 24/7 Concierge Hotline</li>
            </ul>
            <button class="btn btn-primary btn-block select-plan-btn" data-plan="Professional Studio">Start Professional</button>
          </div>

          <!-- Tier 3 -->
          <div class="pricing-card">
            <div class="pricing-header">
              <span class="tier-name">Enterprise Sovereign</span>
              <p class="tier-desc">White-glove bespoke architecture with dedicated engineering partner.</p>
              <div class="price-wrap">
                <span class="price-currency">$</span>
                <span class="price-amount" data-monthly="399" data-annual="319">319</span>
                <span class="price-period">/ month</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Tailored Private Infrastructure</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Custom In-Person Executive Workshops</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Direct Partner SLA (1-Hour)</li>
              <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Full IP Ownership & Transfer</li>
            </ul>
            <button class="btn btn-outline btn-block select-plan-btn" data-plan="Enterprise Sovereign">Inquire Enterprise</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. Verified Reviews & Testimonials -->
    <section class="testimonials-section" id="testimonials">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Verified Patron Endorsements</span>
          <h2>Trusted by More Than 15,000 Discerning Clients</h2>
          <p class="section-sub">Read authentic experiences from visionaries who rely on our craftsmanship.</p>
        </div>

        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="star-rating">★★★★★</div>
            <p>"The level of meticulous execution and sensory elegance delivered by ${brandName} is completely peerless. They redefined how we operate."</p>
            <div class="author-row">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Elena Rostova" class="author-avatar">
              <div class="author-meta">
                <strong>Elena Rostova</strong>
                <span>Executive Managing Director</span>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="star-rating">★★★★★</div>
            <p>"The interactive components and fluid design responsiveness blew past all our internal benchmarks. 10/10 execution in every single metric."</p>
            <div class="author-row">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Marcus Sterling" class="author-avatar">
              <div class="author-meta">
                <strong>Marcus Sterling</strong>
                <span>Chief Strategy Officer</span>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="star-rating">★★★★★</div>
            <p>"From initial intake through live deployment, the speed, beauty, and functional depth felt like working with a world-class design studio."</p>
            <div class="author-row">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80" alt="Genevieve Vance" class="author-avatar">
              <div class="author-meta">
                <strong>Genevieve Vance</strong>
                <span>Founder & Principal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. Latest Insights & Editorial -->
    <section class="blog-section" id="blog">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Knowledge & Trends</span>
          <h2>Latest Insights, Whitepapers & Case Studies</h2>
        </div>

        <div class="blog-grid">
          <article class="blog-card">
            <div class="blog-img-wrap">
              <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80" alt="Modern Architecture" class="blog-img">
              <span class="blog-pill">5 min read</span>
            </div>
            <div class="blog-body">
              <span class="blog-date">November 2026 • Design Systems</span>
              <h3>The Art of Zero-Dependency Web Architecture</h3>
              <p>How clean semantic HTML5 and vanilla JavaScript deliver unbeatable performance and longevity.</p>
              <a href="#contact" class="blog-link">Read Full Report &rarr;</a>
            </div>
          </article>

          <article class="blog-card">
            <div class="blog-img-wrap">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Data & Insights" class="blog-img">
              <span class="blog-pill">4 min read</span>
            </div>
            <div class="blog-body">
              <span class="blog-date">October 2026 • Strategy</span>
              <h3>Designing Interactive Calculators that 4x Conversion</h3>
              <p>Why giving users real computed outputs turns passive browsers into high-intent patrons.</p>
              <a href="#contact" class="blog-link">Read Full Report &rarr;</a>
            </div>
          </article>

          <article class="blog-card">
            <div class="blog-img-wrap">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Technology" class="blog-img">
              <span class="blog-pill">6 min read</span>
            </div>
            <div class="blog-body">
              <span class="blog-date">October 2026 • Innovation</span>
              <h3>The Convergence of Glassmorphism and Fluid Type</h3>
              <p>Creating sensory tactile digital spaces using CSS modern custom properties and clamp tokens.</p>
              <a href="#contact" class="blog-link">Read Full Report &rarr;</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 9. Frequently Asked Questions Accordion -->
    <section class="faq-section" id="faq">
      <div class="container">
        <div class="section-head text-center">
          <span class="eyebrow">Clear Guidance</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div class="faq-accordion" id="faqAccordion">
          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How was this platform tailored to my specific prompt?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Our autonomous architecture engine analyzed your prompt ("${prompt}"), derived a bespoke brand identity, selected typography, curated authentic Unsplash photography, and programmed real-time interactive JavaScript widgets designed specifically for this niche.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>Is all the code exportable as a production-ready website?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Yes. The generated HTML, CSS, and JavaScript files are completely standalone with zero framework dependencies. You can export a production ZIP directly and deploy it to Vercel, Netlify, GitHub Pages, or any web host.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How do the interactive tools and calculators compute outputs?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>All calculations are handled dynamically by native client-side Vanilla JavaScript. As you drag sliders or choose options, mathematical models compute outputs instantaneously and update the DOM in real time.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>Can I customize colors, brand names, and content live?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>Absolutely. You can edit code live in the multi-tab editor on the left or use the AI Copilot to request adjustments in natural language (e.g., "Change primary color to emerald and add sticky banner").</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>How does Dark Mode persist across user visits?</span>
              <span class="faq-arrow">+</span>
            </button>
            <div class="faq-answer">
              <p>The theme switcher toggles data-theme="dark" on the root HTML element and saves your choice to localStorage so your aesthetic preference is preserved whenever you return.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 10. Contact Us & Consultation Intake -->
    <section class="contact-section" id="contact">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info-pane">
            <span class="eyebrow">Direct Consultation</span>
            <h2>Let's Build Something Exceptional Together</h2>
            <p>Schedule a private consultation or submit your project scope. Our executive team will review your specifications and provide a formal intake packet.</p>
            
            <div class="contact-details">
              <div class="contact-item">
                <span class="contact-icon">📍</span>
                <div>
                  <strong>Global Headquarters</strong>
                  <p>742 Evergreen Atelier, Suite 500 • New York & London</p>
                </div>
              </div>

              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <div>
                  <strong>Direct Concierge Desk</strong>
                  <p>+1 (800) 555-NEXUS • Mon-Fri 8AM-8PM EST</p>
                </div>
              </div>

              <div class="contact-item">
                <span class="contact-icon">✉️</span>
                <div>
                  <strong>Executive Inquiries</strong>
                  <p>concierge@${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</p>
                </div>
              </div>
            </div>

            <div class="online-status-badge">
              <span class="badge-dot pulse"></span>
              <span>Concierge Desk Online • Average response: 14 mins</span>
            </div>
          </div>

          <div class="contact-form-pane">
            <form class="booking-form" id="mainContactForm">
              <h3>Reserve Your Consultation</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" id="intakeName" placeholder="Elena Rostova" required>
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="intakeEmail" placeholder="elena@company.com" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Phone Number</label>
                  <input type="tel" id="intakePhone" placeholder="+1 (555) 019-2834">
                </div>
                <div class="form-group">
                  <label>Service Area of Interest</label>
                  <select id="intakeService">
                    <option value="Bespoke Strategy">Bespoke Strategy & Architecture</option>
                    <option value="High Performance">High-Performance Implementation</option>
                    <option value="Custom Studio Tool">Interactive Studio Development</option>
                    <option value="Enterprise Sovereign">Enterprise Sovereign Partnership</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Preferred Date for Consultation</label>
                <input type="date" id="intakeDate">
              </div>

              <div class="form-group">
                <label>Project Scope or Special Requirements</label>
                <textarea id="intakeMessage" rows="4" placeholder="Describe your vision, timeline, and key requirements..."></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg">
                <span>Submit Inquiry & Reserve Date</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Comprehensive Site Footer -->
  <footer class="site-footer">
    <div class="container footer-top">
      <div class="footer-brand-col">
        <a href="#home" class="brand-logo footer-logo">
          <span class="logo-symbol">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </span>
          <span class="brand-text"><strong>${brandName}</strong></span>
        </a>
        <p class="footer-desc">${tagline}. Precision engineering, human-centered design, and enduring craftsmanship.</p>
        <div class="status-pill">
          <span class="pulse-dot"></span>
          <span>All Core Services Operational • 99.99% Uptime</span>
        </div>
      </div>

      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="#about">About Our Studio</a></li>
          <li><a href="#about">Executive Faculty</a></li>
          <li><a href="#testimonials">Client Stories</a></li>
          <li><a href="#blog">Latest Insights</a></li>
          <li><a href="#contact">Careers & Press</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Solutions</h4>
        <ul>
          <li><a href="#services">Bespoke Offerings</a></li>
          <li><a href="#interactive">Interactive Studio</a></li>
          <li><a href="#gallery">Curated Gallery</a></li>
          <li><a href="#pricing">Investment Plans</a></li>
          <li><a href="#contact">Private Concierge</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Stay Informed</h4>
        <p class="newsletter-sub">Receive our monthly journal on design innovation, industry trends, and private event invites.</p>
        <form class="newsletter-form" id="newsletterForm">
          <input type="email" id="newsletterEmail" placeholder="your@email.com" required>
          <button type="submit" class="btn btn-primary btn-sm">Subscribe</button>
        </form>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>© 2026 ${brandName}. Designed & Generated on Custom User Prompt.</p>
      <div class="footer-legal">
        <a href="#about">Privacy Policy</a>
        <a href="#services">Terms of Service</a>
        <a href="#faq">Cookie Preferences</a>
        <a href="#contact">Security & SLA</a>
      </div>
    </div>
  </footer>

  <!-- Lightbox Modal for Fullscreen Photo Viewing -->
  <div class="lightbox-backdrop" id="lightboxModal" role="dialog" aria-modal="true" aria-label="Lightbox Image Preview">
    <div class="lightbox-dialog">
      <button class="lightbox-close" id="closeLightboxBtn" aria-label="Close lightbox">&times;</button>
      <img src="" alt="" class="lightbox-full-img" id="lightboxImg">
      <div class="lightbox-caption">
        <h4 id="lightboxTitle">Image Preview</h4>
        <span id="lightboxCategory">Curated Showcase</span>
      </div>
    </div>
  </div>

  <!-- Contact Intake Modal Dialog (Opened from Navbar and CTAs) -->
  <div class="modal-backdrop" id="contactModalBackdrop">
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="Contact Dialog">
      <div class="modal-header">
        <h3>Inquire with ${brandName}</h3>
        <button class="drawer-close-btn" id="closeContactModalBtn">&times;</button>
      </div>
      <form class="modal-form" id="modalIntakeForm">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="modalName" placeholder="Your name" required>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="modalEmail" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label>Inquiry Focus or Scope</label>
          <input type="text" id="modalScope" placeholder="Describe your requirements...">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Submit Inquiry</button>
      </form>
    </div>
  </div>

  <!-- Floating Accessories -->
  <button class="back-to-top-btn" id="backToTopBtn" aria-label="Back to Top" title="Back to Top">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
  </button>

  <button class="quick-fab-btn" id="quickFabBtn" aria-label="Quick Inquiry" title="Quick Inquiry">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  </button>

  <!-- Toast Notification System -->
  <div class="toast-container" id="toastContainer" aria-live="polite"></div>

  <script src="script.js"></script>
</body>
</html>`;

  // 5. Construct Complete Luxury CSS Design System
  const css = `/* styles.css - Comprehensive Bespoke Design System for ${brandName} */
:root {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-secondary: #475569;
  --border-subtle: #e2e8f0;
  --primary: ${primary};
  --primary-hover: #1e293b;
  --accent: ${accent};
  --accent-glow: rgba(79, 70, 229, 0.12);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.08);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.12);
  --font-heading: '${fontHeading}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-body: '${fontBody}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

[data-theme="dark"] {
  --bg-app: #0b1120;
  --bg-surface: #111a2e;
  --bg-card: #15223c;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-secondary: #cbd5e1;
  --border-subtle: #1e293b;
  --primary: #ffffff;
  --primary-hover: #f1f5f9;
  --accent-glow: rgba(99, 102, 241, 0.25);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.6);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px;
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
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Typography */
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  color: var(--text-main);
  line-height: 1.2;
}

.text-center { text-align: center; }
.section-head { margin-bottom: 3.5rem; }
.section-head h2 { font-size: clamp(1.8rem, 3.5vw, 2.6rem); margin-top: 0.5rem; letter-spacing: -0.02em; }
.section-sub { color: var(--text-muted); font-size: 1.05rem; max-width: 650px; margin: 0.8rem auto 0; }
.eyebrow {
  text-transform: uppercase;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.4rem;
  border-radius: var(--radius-full);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--primary);
  color: #ffffff;
}
[data-theme="dark"] .btn-primary {
  color: #0f172a;
}
.btn-primary:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.btn-outline {
  background: transparent;
  color: var(--text-main);
  border-color: var(--border-subtle);
}
.btn-outline:hover {
  background: var(--border-subtle);
}
.btn-lg {
  padding: 0.9rem 1.8rem;
  font-size: 1rem;
}
.btn-sm {
  padding: 0.55rem 1.1rem;
  font-size: 0.82rem;
}
.btn-block {
  width: 100%;
}

/* Top Announcement Bar */
.announcement-bar {
  background: var(--primary);
  color: #ffffff;
  font-size: 0.85rem;
  padding: 0.45rem 1rem;
  transition: max-height 0.3s ease;
}
[data-theme="dark"] .announcement-bar {
  background: #1e293b;
  color: #f8fafc;
}
.announcement-container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
}
.announcement-pill {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.announcement-close {
  position: absolute;
  right: 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}

/* Header & Nav */
.site-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 1000;
}
[data-theme="dark"] .site-header {
  background: rgba(17, 26, 46, 0.88);
}
.nav-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
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
  font-size: 1.25rem;
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
  align-items: center;
  gap: 1.25rem;
}
.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: color 0.2s ease;
  position: relative;
  padding: 0.25rem 0;
}
.nav-link:hover, .nav-link.active {
  color: var(--text-main);
  font-weight: 600;
}
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.icon-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn:hover {
  background: var(--border-subtle);
}
.sun-icon { display: none; }
[data-theme="dark"] .sun-icon { display: block; }
[data-theme="dark"] .moon-icon { display: none; }

.hamburger-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: transparent;
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

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: -100%;
  width: 300px;
  height: 100vh;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  z-index: 2000;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  box-shadow: var(--shadow-lg);
}
.mobile-drawer.open {
  right: 0;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}
.drawer-close-btn {
  background: transparent;
  border: none;
  font-size: 1.6rem;
  color: var(--text-main);
  cursor: pointer;
}
.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-top: 1.5rem;
}
.drawer-link {
  color: var(--text-main);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
}

/* 1. Hero Section */
.hero-section {
  padding: 4.5rem 0 5.5rem;
  position: relative;
  overflow: hidden;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3.5rem;
  align-items: center;
}
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  background: var(--accent-glow);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
.hero-title {
  font-size: clamp(2.3rem, 4.5vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 1.2rem;
}
.hero-subtitle {
  font-size: 1.12rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.65;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.75rem;
  flex-wrap: wrap;
}
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--border-subtle);
}
.metric-item { display: flex; flex-direction: column; }
.metric-num { font-size: 1.55rem; font-weight: 800; color: var(--text-main); font-family: var(--font-heading); }
.metric-lbl { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; }

.hero-visual { position: relative; }
.visual-frame {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  aspect-ratio: 4 / 3.2;
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.visual-frame:hover .hero-img {
  transform: scale(1.03);
}
.floating-badge {
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  padding: 0.55rem 1rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f172a;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
[data-theme="dark"] .floating-badge {
  background: rgba(17, 26, 46, 0.92);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.top-badge { top: 1.25rem; left: 1.25rem; }
.bottom-badge { bottom: 1.25rem; right: 1.25rem; }
.badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }

/* 2. About Section */
.about-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.5rem;
  align-items: center;
  margin-bottom: 4.5rem;
}
.about-story-pane h3 { font-size: 1.75rem; margin-bottom: 1rem; }
.about-story-pane p { color: var(--text-secondary); margin-bottom: 1.1rem; }
.about-pillars {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.75rem;
}
.pillar-box {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-app);
}
.pillar-num {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--accent);
  font-family: var(--font-heading);
}
.pillar-box h4 { font-size: 1rem; margin-bottom: 0.25rem; }
.pillar-box p { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0; }

.about-img-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.about-img { width: 100%; height: 420px; object-fit: cover; }
.about-stat-overlay {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  background: var(--primary);
  color: #fff;
  padding: 1rem 1.4rem;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
}
[data-theme="dark"] .about-stat-overlay {
  background: #1e293b;
}
.about-stat-overlay strong { font-size: 1.6rem; font-weight: 800; }
.about-stat-overlay span { font-size: 0.8rem; opacity: 0.85; }

.team-header { margin-bottom: 2.5rem; }
.team-header h3 { font-size: 1.6rem; margin-top: 0.4rem; }
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
}
.team-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.team-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.team-img-wrap { height: 260px; overflow: hidden; }
.team-img { width: 100%; height: 100%; object-fit: cover; }
.team-info { padding: 1.25rem; }
.team-info h4 { font-size: 1.1rem; margin-bottom: 0.2rem; }
.team-role { font-size: 0.82rem; color: var(--accent); font-weight: 600; display: block; margin-bottom: 0.65rem; }
.team-info p { font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; }

/* 3. Services Section */
.services-section { padding: 5rem 0; }
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.service-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.service-img-wrap {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.service-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.service-card:hover .service-img { transform: scale(1.04); }
.service-tag {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}
.service-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.service-body h3 { font-size: 1.2rem; margin-bottom: 0.55rem; }
.service-body p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.2rem; line-height: 1.5; }
.service-checklist {
  list-style: none;
  margin-top: auto;
  margin-bottom: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.service-checklist li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 4. Interactive Section */
.interactive-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.widget-interactive-box {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
}
.calculator-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 2.5rem;
}
.calc-input-pane h3 { font-size: 1.4rem; margin-bottom: 0.5rem; }
.calc-input-pane p { font-size: 0.92rem; color: var(--text-muted); margin-bottom: 1.8rem; }
.input-field {
  margin-bottom: 1.4rem;
}
.input-field label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 0.45rem;
  color: var(--text-main);
}
.slider-input {
  width: 100%;
  accent-color: var(--accent);
  cursor: pointer;
  height: 6px;
  border-radius: 4px;
}
.select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-main);
  font-size: 0.9rem;
  cursor: pointer;
}
.calc-output-pane {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}
.result-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}
.result-label { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
.result-number { font-size: 2.2rem; font-weight: 800; color: var(--accent); font-family: var(--font-heading); margin: 0.35rem 0; }
.result-sub { font-size: 0.85rem; color: var(--text-muted); }
.result-details {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  border-bottom: 1px dashed var(--border-subtle);
  padding-bottom: 0.5rem;
}
.detail-row:last-child { border-bottom: none; padding-bottom: 0; }

/* Footwear Swatches & Pills */
.color-swatches { display: flex; gap: 0.75rem; margin-top: 0.35rem; }
.color-swatch { width: 34px; height: 34px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s ease; }
.color-swatch.active { border-color: var(--text-main); transform: scale(1.15); }
.selected-color-label { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.45rem; }
.size-pill-group { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.35rem; }
.size-btn { padding: 0.45rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-main); font-weight: 600; cursor: pointer; }
.size-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
[data-theme="dark"] .size-btn.active { color: #0f172a; }

/* Scope Tier Pills */
.tier-pills-row { display: flex; gap: 0.65rem; margin-top: 0.35rem; }
.tier-pill { padding: 0.5rem 1rem; border-radius: var(--radius-full); border: 1px solid var(--border-subtle); background: var(--bg-surface); color: var(--text-main); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.tier-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); }
[data-theme="dark"] .tier-pill.active { color: #0f172a; }

/* 5. Gallery Section */
.gallery-section { padding: 5rem 0; }
.gallery-filters {
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-btn:hover, .filter-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
[data-theme="dark"] .filter-btn.active { color: #0f172a; }

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.gallery-item {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  background: var(--bg-surface);
  transition: transform 0.25s ease, opacity 0.3s ease;
}
.gallery-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.gallery-img-wrap { position: relative; height: 260px; overflow: hidden; }
.gallery-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.gallery-item:hover .gallery-img { transform: scale(1.06); }
.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.25rem;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.gallery-item:hover .gallery-overlay { opacity: 1; }
.gallery-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #a5b4fc; margin-bottom: 0.25rem; }
.gallery-overlay h4 { font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
.zoom-cue { font-size: 0.78rem; opacity: 0.85; }

/* 6. Pricing Section */
.pricing-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.pricing-switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3.5rem;
}
.billing-label { font-size: 0.92rem; font-weight: 600; color: var(--text-muted); cursor: pointer; }
.billing-label.active { color: var(--text-main); font-weight: 700; }
.save-tag {
  background: #10b981;
  color: #fff;
  font-size: 0.72rem;
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-full);
  margin-left: 0.35rem;
}
.switch { position: relative; display: inline-block; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border-subtle); transition: .3s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: var(--accent); }
input:checked + .slider:before { transform: translateX(22px); }

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  align-items: stretch;
}
.pricing-card {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pricing-card.featured {
  background: var(--bg-surface);
  border: 2px solid var(--accent);
  box-shadow: var(--shadow-md);
  transform: scale(1.03);
}
.pricing-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.pricing-card.featured:hover { transform: scale(1.03) translateY(-4px); }
.featured-ribbon {
  position: absolute;
  top: -12px;
  right: 24px;
  background: var(--accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}
.tier-name { font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading); }
.tier-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0.4rem 0 1.4rem; min-height: 40px; }
.price-wrap { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 1.5rem; }
.price-currency { font-size: 1.5rem; font-weight: 700; color: var(--text-main); }
.price-amount { font-size: 3rem; font-weight: 800; color: var(--text-main); font-family: var(--font-heading); }
.price-period { font-size: 0.9rem; color: var(--text-muted); }
.pricing-features { list-style: none; display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; flex: 1; }
.pricing-features li { display: flex; align-items: center; gap: 0.65rem; font-size: 0.88rem; color: var(--text-secondary); }
.pricing-features svg { color: #10b981; flex-shrink: 0; }

/* 7. Testimonials Section */
.testimonials-section { padding: 5rem 0; }
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.testimonial-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}
.star-rating { color: #f59e0b; font-size: 1.15rem; margin-bottom: 1rem; letter-spacing: 2px; }
.testimonial-card p { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; font-style: italic; margin-bottom: 1.5rem; }
.author-row { display: flex; align-items: center; gap: 0.85rem; }
.author-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.author-meta strong { font-size: 0.92rem; color: var(--text-main); display: block; }
.author-meta span { font-size: 0.78rem; color: var(--text-muted); }

/* 8. Blog Section */
.blog-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}
.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.blog-card {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.blog-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.blog-img-wrap { position: relative; height: 190px; }
.blog-img { width: 100%; height: 100%; object-fit: cover; }
.blog-pill { position: absolute; top: 1rem; right: 1rem; background: rgba(15, 23, 42, 0.75); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); backdrop-filter: blur(6px); }
.blog-body { padding: 1.5rem; display: flex; flex-direction: column; flex: 1; }
.blog-date { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.45rem; }
.blog-body h3 { font-size: 1.15rem; margin-bottom: 0.65rem; line-height: 1.35; }
.blog-body p { font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem; flex: 1; }
.blog-link { color: var(--accent); font-size: 0.88rem; font-weight: 700; text-decoration: none; }

/* 9. FAQ Section */
.faq-section { padding: 5rem 0; }
.faq-accordion { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
.faq-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.2s ease;
}
.faq-item.active { border-color: var(--accent); }
.faq-question {
  width: 100%;
  padding: 1.2rem 1.5rem;
  background: transparent;
  border: none;
  text-align: left;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.faq-arrow { font-size: 1.4rem; color: var(--accent); transition: transform 0.3s ease; }
.faq-item.active .faq-arrow { transform: rotate(45deg); }
.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.3s ease;
  padding: 0 1.5rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}
.faq-item.active .faq-answer {
  max-height: 300px;
  padding-bottom: 1.25rem;
}

/* 10. Contact Section */
.contact-section {
  padding: 5rem 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
.contact-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 3.5rem;
}
.contact-info-pane h2 { font-size: 2.2rem; margin: 0.5rem 0 1rem; }
.contact-info-pane p { color: var(--text-secondary); margin-bottom: 2rem; }
.contact-details { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem; }
.contact-item { display: flex; gap: 1rem; align-items: flex-start; }
.contact-icon { font-size: 1.4rem; background: var(--bg-app); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.contact-item strong { display: block; font-size: 0.95rem; color: var(--text-main); }
.contact-item p { font-size: 0.88rem; color: var(--text-muted); margin: 0.15rem 0 0; }
.online-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.booking-form {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 2.25rem;
  box-shadow: var(--shadow-sm);
}
.booking-form h3 { font-size: 1.35rem; margin-bottom: 1.5rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { margin-bottom: 1.15rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-main); }
.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-main);
  font-size: 0.9rem;
  font-family: var(--font-body);
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

/* Footer */
.site-footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  padding-top: 4.5rem;
}
.footer-top {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.3fr;
  gap: 3rem;
  padding-bottom: 3.5rem;
  border-bottom: 1px solid var(--border-subtle);
}
.footer-brand-col .footer-logo { margin-bottom: 1rem; }
.footer-desc { color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.5rem; }
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-app);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
}
.footer-col h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--text-main); }
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.footer-col a { color: var(--text-muted); text-decoration: none; font-size: 0.88rem; transition: color 0.2s ease; }
.footer-col a:hover { color: var(--accent); }
.newsletter-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem; }
.newsletter-form { display: flex; gap: 0.5rem; }
.newsletter-form input {
  flex: 1;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-app);
  color: var(--text-main);
  font-size: 0.85rem;
}
.footer-bottom {
  padding: 2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.footer-legal { display: flex; gap: 1.5rem; }
.footer-legal a { color: var(--text-muted); text-decoration: none; }
.footer-legal a:hover { color: var(--accent); }

/* Modals & Lightbox */
.lightbox-backdrop, .modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.lightbox-backdrop.open, .modal-backdrop.open { display: flex; }
.lightbox-dialog {
  position: relative;
  max-width: 900px;
  width: 100%;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  font-size: 1.6rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.lightbox-full-img { width: 100%; max-height: 550px; object-fit: contain; background: #000; }
.lightbox-caption { padding: 1.25rem; }
.lightbox-caption h4 { font-size: 1.2rem; }
.lightbox-caption span { font-size: 0.85rem; color: var(--text-muted); }

.modal-dialog {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  max-width: 480px;
  width: 100%;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-form .form-group { margin-bottom: 1.2rem; }

/* Floating Tools */
.back-to-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  border: none;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 900;
}
[data-theme="dark"] .back-to-top-btn { color: #0f172a; }
.back-to-top-btn.visible { opacity: 1; visibility: visible; }
.quick-fab-btn {
  position: fixed;
  bottom: 5.5rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: none;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  transition: transform 0.2s ease;
}
.quick-fab-btn:hover { transform: scale(1.08); }

/* Toast */
.toast-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.toast {
  background: var(--text-main);
  color: var(--bg-surface);
  padding: 0.9rem 1.4rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.9rem;
  font-weight: 600;
  animation: slideToast 0.3s ease;
}
@keyframes slideToast {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .hero-grid, .about-grid, .calculator-grid, .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  .services-grid, .gallery-grid, .pricing-grid, .testimonials-grid, .blog-grid, .team-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-top { grid-template-columns: 1fr 1fr; }
  .pricing-card.featured { transform: none; }
  .pricing-card.featured:hover { transform: translateY(-4px); }
}

@media (max-width: 768px) {
  .main-nav, .nav-actions .btn { display: none; }
  .hamburger-btn { display: flex; }
  .hero-metrics { grid-template-columns: repeat(2, 1fr); }
  .services-grid, .gallery-grid, .pricing-grid, .testimonials-grid, .blog-grid, .team-grid { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr; gap: 2rem; }
  .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
  .form-row { grid-template-columns: 1fr; }
}`;

  // 6. Construct Clean Vanilla JavaScript Logic
  const js = `// script.js - Bespoke Multi-Page Architecture & Interactivity for ${brandName}
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle (Dark/Light mode)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const htmlRoot = document.documentElement;

  const savedTheme = localStorage.getItem('nexus_site_theme') || 'light';
  htmlRoot.setAttribute('data-theme', savedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = htmlRoot.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', nextTheme);
    localStorage.setItem('nexus_site_theme', nextTheme);
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

  // Dismiss Announcement Bar
  const closeAnnouncementBtn = document.getElementById('closeAnnouncementBtn');
  const announcementBar = document.getElementById('announcementBar');
  closeAnnouncementBtn?.addEventListener('click', () => {
    if (announcementBar) announcementBar.style.display = 'none';
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
    }, 3500);
  }
  window.showToast = showToast;

  // Active Navigation Tracking on Scroll
  const sections = document.querySelectorAll('main > section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (current && link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });

    // Back to top button visibility
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  });

  // Back to Top Click
  document.getElementById('backToTopBtn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Gallery Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Modal System
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.getAttribute('data-img');
      const title = item.getAttribute('data-title');
      const cat = item.getAttribute('data-category');

      if (lightboxImg) lightboxImg.src = img;
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxCategory) lightboxCategory.textContent = cat;
      lightboxModal?.classList.add('open');
    });
  });

  function closeLightbox() {
    lightboxModal?.classList.remove('open');
  }

  closeLightboxBtn?.addEventListener('click', closeLightbox);
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Pricing Monthly/Annual Toggle
  const billingToggle = document.getElementById('billingToggle');
  const priceAmounts = document.querySelectorAll('.price-amount');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');

  billingToggle?.addEventListener('change', () => {
    const isAnnual = billingToggle.checked;
    if (isAnnual) {
      annualLabel?.classList.add('active');
      monthlyLabel?.classList.remove('active');
    } else {
      monthlyLabel?.classList.add('active');
      annualLabel?.classList.remove('active');
    }

    priceAmounts.forEach(el => {
      const amount = isAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      if (amount) el.textContent = amount;
    });
  });

  // Contact Modal System
  const contactModal = document.getElementById('contactModalBackdrop');
  const openModalBtn = document.getElementById('openContactModalBtn');
  const drawerContactBtn = document.getElementById('drawerContactBtn');
  const quickFabBtn = document.getElementById('quickFabBtn');
  const closeModalBtn = document.getElementById('closeContactModalBtn');
  const modalForm = document.getElementById('modalIntakeForm');

  function openContactModal(prefill = '') {
    contactModal?.classList.add('open');
    mobileDrawer?.classList.remove('open');
    if (prefill && document.getElementById('modalScope')) {
      document.getElementById('modalScope').value = 'Interested in: ' + prefill;
    }
  }

  function closeContactModal() {
    contactModal?.classList.remove('open');
  }

  openModalBtn?.addEventListener('click', () => openContactModal());
  drawerContactBtn?.addEventListener('click', () => openContactModal());
  quickFabBtn?.addEventListener('click', () => openContactModal());
  closeModalBtn?.addEventListener('click', closeContactModal);
  contactModal?.addEventListener('click', (e) => {
    if (e.target === contactModal) closeContactModal();
  });

  document.querySelectorAll('.service-inquire-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service') || '';
      openContactModal(service);
    });
  });

  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan') || '';
      openContactModal('Plan: ' + plan);
    });
  });

  modalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('modalName')?.value || 'Client';
    closeContactModal();
    showToast('✨ Thank you, ' + name + '! Your inquiry was received.');
    modalForm.reset();
  });

  // Main Consultation Form Submission
  const mainForm = document.getElementById('mainContactForm');
  mainForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('intakeName')?.value || 'Client';
    showToast('🎉 Confirmed! Consultation reserved for ' + name + '.');
    mainForm.reset();
  });

  // Newsletter Form Submission
  const newsForm = document.getElementById('newsletterForm');
  newsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value;
    showToast('📬 Welcome! Dispatching our private journal to ' + email);
    newsForm.reset();
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

  // Mount Domain Specific Interactive Widget Logic
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
      keywords: [topic, finalCategory, 'modern website', 'bespoke design', 'multi-page architecture']
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
