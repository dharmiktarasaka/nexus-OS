// fallbackGenerator.js - High-fidelity deterministic generation engine
// Used when Gemini API key is not configured, or as a verified baseline

function generateHealthcareSite(customPrompt = '') {
  return {
    name: 'AuraHealth Premier Medical Group',
    category: 'healthcare',
    tagline: 'Precision Medicine, Compassionate Concierge Care',
    seo: {
      title: 'AuraHealth Premier Medical Group | Next-Gen Concierge Medicine',
      description: 'Experience proactive, tech-forward healthcare tailored to your unique biology. Book an executive wellness consultation today.',
      keywords: ['concierge medicine', 'executive wellness', 'preventative care', 'longevity medicine', 'telehealth'],
      schemaType: 'MedicalOrganization'
    },
    html: `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuraHealth Premier Medical Group | Next-Gen Concierge Care</title>
  <meta name="description" content="Experience proactive, tech-forward healthcare tailored to your unique biology. Comprehensive executive longevity and diagnostic consultations.">
  <meta name="keywords" content="concierge medicine, longevity, preventive health, executive wellness, diagnostics">
  <meta property="og:title" content="AuraHealth Premier Medical Group">
  <meta property="og:description" content="Precision Medicine, Compassionate Concierge Care">
  <meta property="og:image" content="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "AuraHealth Premier Medical Group",
    "url": "https://aurahealth.example.com",
    "logo": "https://aurahealth.example.com/logo.png",
    "description": "Next-Gen Concierge Medicine and Longevity Therapeutics",
    "telephone": "+1-800-555-AURA",
    "medicalSpecialty": ["PreventiveMedicine", "InternalMedicine", "Endocrinology"]
  }
  </script>
</head>
<body>
  <!-- Header / Navigation -->
  <header class="site-header" id="header">
    <div class="nav-container">
      <a href="#" class="brand-logo" aria-label="AuraHealth Home">
        <span class="logo-symbol">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/></svg>
        </span>
        <span class="brand-text">Aura<strong>Health</strong></span>
      </a>

      <nav class="main-nav" id="mainNav" aria-label="Primary navigation">
        <a href="#services" class="nav-link">Clinical Specialties</a>
        <a href="#physicians" class="nav-link">World-Class Faculty</a>
        <a href="#calculator" class="nav-link">Longevity Calculator</a>
        <a href="#testimonials" class="nav-link">Patient Stories</a>
        <a href="#faq" class="nav-link">FAQ</a>
      </nav>

      <div class="nav-actions">
        <button id="themeToggleBtn" class="icon-btn" aria-label="Toggle visual theme" title="Toggle theme">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="btn btn-primary" id="openBookingModalBtn">
          <span>Book Consultation</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button class="hamburger-btn" id="mobileMenuToggle" aria-label="Open mobile menu" aria-expanded="false">
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
      <span class="brand-text">Aura<strong>Health</strong></span>
      <button class="drawer-close-btn" id="closeDrawerBtn" aria-label="Close menu">&times;</button>
    </div>
    <div class="drawer-links">
      <a href="#services" class="drawer-link">Clinical Specialties</a>
      <a href="#physicians" class="drawer-link">Faculty Physicians</a>
      <a href="#calculator" class="drawer-link">Longevity Calculator</a>
      <a href="#testimonials" class="drawer-link">Patient Stories</a>
      <a href="#faq" class="drawer-link">FAQ</a>
      <button class="btn btn-primary btn-block" id="drawerBookBtn">Book Consultation</button>
    </div>
  </div>

  <main>
    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="hero-glow"></div>
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="badge-pill">
            <span class="pulse-dot"></span>
            <span>Accredited Center of Excellence 2026</span>
          </div>
          <h1 class="hero-title">Preventative Medicine Reimagined for Your Peak Vitality</h1>
          <p class="hero-subtitle">
            Moving beyond reactive sick-care. We synthesize whole-genome sequencing, advanced AI biometric diagnostics, and personalized metabolic optimization into lifelong wellness.
          </p>

          <div class="hero-cta-group">
            <button class="btn btn-primary btn-lg" id="heroBookBtn">Schedule Private Assessment</button>
            <a href="#services" class="btn btn-outline btn-lg">Explore Diagnostic Suites</a>
          </div>

          <div class="hero-social-proof">
            <div class="avatar-stack">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Patient review" class="avatar-img">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Patient review" class="avatar-img">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="Patient review" class="avatar-img">
            </div>
            <div class="proof-text">
              <div class="star-rating">★★★★★</div>
              <p><strong>4.98 / 5.0</strong> Patient Satisfaction across 1,800+ executive members</p>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="image-card-wrapper">
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80" alt="Advanced diagnostic clinical laboratory" class="hero-main-img">
            <div class="glass-stat-card card-top-right">
              <div class="stat-badge-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <span class="stat-value">99.4%</span>
                <span class="stat-label">Early Detection Efficacy</span>
              </div>
            </div>
            <div class="glass-stat-card card-bottom-left">
              <div class="stat-badge-icon stat-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <span class="stat-value">24/7</span>
                <span class="stat-label">Physician Direct Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Metrics Ribbon -->
    <section class="stats-ribbon">
      <div class="container ribbon-grid">
        <div class="ribbon-item">
          <span class="ribbon-num">350+</span>
          <span class="ribbon-desc">Biomarkers Screened Per Protocol</span>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-item">
          <span class="ribbon-num">1:150</span>
          <span class="ribbon-desc">Physician to Patient Ratio (Capped)</span>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-item">
          <span class="ribbon-num">15+ Yrs</span>
          <span class="ribbon-desc">Average Biological Age Retardation</span>
        </div>
        <div class="ribbon-divider"></div>
        <div class="ribbon-item">
          <span class="ribbon-num">100%</span>
          <span class="ribbon-desc">Board-Certified Harvard & Johns Hopkins Alumni</span>
        </div>
      </div>
    </section>

    <!-- Clinical Specialties Section -->
    <section class="section" id="services">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Precision Modalities</span>
          <h2 class="section-title">Comprehensive Diagnostic & Therapeutic Excellence</h2>
          <p class="section-subtitle">Tailored medicine backed by high-throughput analytics, whole-body MRI imaging, and epigenetic tracking.</p>
        </div>

        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 class="service-name">Executive Multi-Omics Profiling</h3>
            <p class="service-text">Whole genome mapping, microbiome sequencing, and liquid biopsy for early oncological detection before symptoms emerge.</p>
            <ul class="service-perks">
              <li>Comprehensive 450+ Blood Panel</li>
              <li>Epigenetic DNA Methylation Clock</li>
              <li>Continuous Glucose Monitoring (CGM)</li>
            </ul>
          </div>

          <div class="service-card featured-service">
            <div class="featured-badge">Flagship Protocol</div>
            <div class="service-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h3 class="service-name">Cardiometabolic & Vascular Longevity</h3>
            <p class="service-text">Coronary calcium scoring, CT angiography, VO2 Max testing, and bespoke lipidology regimens to eliminate cardiovascular risks.</p>
            <ul class="service-perks">
              <li>ApoB & Lp(a) Deep Lipidology</li>
              <li>Endothelial Health Assessment</li>
              <li>Cardiopulmonary Exercise Testing</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            </div>
            <h3 class="service-name">Hormonal & Cellular Optimization</h3>
            <p class="service-text">Bio-identical hormone balancing, NAD+ cellular repair therapy, and peptide protocols calibrated to restore peak cognitive stamina.</p>
            <ul class="service-perks">
              <li>Mitochondrial Density Analysis</li>
              <li>Circadian Sleep Architecture</li>
              <li>Neuro-Cognitive Assessment Suite</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Longevity & Assessment Calculator -->
    <section class="section section-dark" id="calculator">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Interactive Clinical Tool</span>
          <h2 class="section-title">Longevity & Biomarker Potential Estimator</h2>
          <p class="section-subtitle">Calculate your prospective healthspan optimization potential based on clinical parameters.</p>
        </div>

        <div class="calculator-card">
          <div class="calc-inputs">
            <div class="form-group">
              <label for="calcAge" class="form-label">Chronological Age: <span id="calcAgeVal" class="slider-display">42</span> yrs</label>
              <input type="range" id="calcAge" min="25" max="85" value="42" class="range-slider">
            </div>

            <div class="form-group">
              <label for="calcSleep" class="form-label">Average Sleep Quality: <span id="calcSleepVal" class="slider-display">6.5</span> hrs/night</label>
              <input type="range" id="calcSleep" min="4" max="10" step="0.5" value="6.5" class="range-slider">
            </div>

            <div class="form-group">
              <label for="calcActivity" class="form-label">Weekly Zone 2 Aerobic Exercise</label>
              <select id="calcActivity" class="form-select">
                <option value="sedentary">Less than 60 mins / week</option>
                <option value="moderate" selected>60 - 150 mins / week</option>
                <option value="high">150 - 300 mins / week</option>
                <option value="elite">300+ mins / week (High performance)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Family History of Cardiometabolic Risk</label>
              <div class="radio-pill-group">
                <label class="radio-pill"><input type="radio" name="calcRisk" value="low"> Low</label>
                <label class="radio-pill"><input type="radio" name="calcRisk" value="moderate" checked> Moderate</label>
                <label class="radio-pill"><input type="radio" name="calcRisk" value="high"> Elevated</label>
              </div>
            </div>
          </div>

          <div class="calc-results-panel">
            <h4 class="results-heading">Projected Optimization Metrics</h4>
            <div class="result-metric-box">
              <span class="result-number" id="resultBioAge">-6.4 Years</span>
              <span class="result-desc">Achievable Biological Age Delta</span>
            </div>
            <div class="result-metric-box">
              <span class="result-number" id="resultHealthSpan">+14.2 Years</span>
              <span class="result-desc">Estimated Disease-Free Healthspan Extension</span>
            </div>
            <div class="result-metric-box">
              <span class="result-number" id="resultRiskReduction">78%</span>
              <span class="result-desc">Early Vascular Event Risk Reduction</span>
            </div>
            <button class="btn btn-primary btn-block" id="calcBookBtn">Schedule Personalized Protocol</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Faculty / Physicians Section -->
    <section class="section" id="physicians">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Clinical Leadership</span>
          <h2 class="section-title">Led by Pioneers in Translational Medicine</h2>
          <p class="section-subtitle">Direct, unhurried attention from world-renowned physicians committed to your longevity.</p>
        </div>

        <div class="faculty-grid">
          <div class="faculty-card">
            <div class="faculty-img-wrapper">
              <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80" alt="Dr. Julian Vance, MD, PhD" class="faculty-img">
              <div class="faculty-badge">Chief Medical Officer</div>
            </div>
            <div class="faculty-info">
              <h3 class="faculty-name">Dr. Julian Vance, MD, PhD</h3>
              <span class="faculty-role">Cardiothoracic Surgery & Precision Genomics</span>
              <p class="faculty-bio">Former Director of Molecular Cardiology at Massachusetts General Hospital. Published over 40 peer-reviewed studies on vascular aging.</p>
            </div>
          </div>

          <div class="faculty-card">
            <div class="faculty-img-wrapper">
              <img src="https://images.unsplash.com/photo-1594824813589-9a22f7fa7b5e?auto=format&fit=crop&w=800&q=80" alt="Dr. Elena Rostova, MD" class="faculty-img">
              <div class="faculty-badge">Endocrinology Lead</div>
            </div>
            <div class="faculty-info">
              <h3 class="faculty-name">Dr. Elena Rostova, MD</h3>
              <span class="faculty-role">Endocrinology & Epigenetic Medicine</span>
              <p class="faculty-bio">Johns Hopkins faculty alum specializing in bio-identical cellular regulation, neuro-metabolism, and hormonal biomarker optimization.</p>
            </div>
          </div>

          <div class="faculty-card">
            <div class="faculty-img-wrapper">
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80" alt="Dr. Marcus Thorne, MD" class="faculty-img">
              <div class="faculty-badge">Director of Diagnostics</div>
            </div>
            <div class="faculty-info">
              <h3 class="faculty-name">Dr. Marcus Thorne, MD</h3>
              <span class="faculty-role">Whole-Body Diagnostic Radiology</span>
              <p class="faculty-bio">Pioneer in rapid-sequence multi-parametric magnetic resonance imaging and computational volumetric pathology.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials / Patient Stories -->
    <section class="section section-light" id="testimonials">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Member Experiences</span>
          <h2 class="section-title">Transforming Health Realities</h2>
        </div>

        <div class="testimonials-carousel" id="testiCarousel">
          <div class="testimonial-card active">
            <div class="quote-mark">“</div>
            <p class="testimonial-quote">
              AuraHealth’s whole-body MRI and advanced lipid panel caught an asymptomatic 90% LAD stenosis before any standard stress test could. Their surgical and metabolic team saved my life without question.
            </p>
            <div class="testimonial-author">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Arthur Sterling" class="author-avatar">
              <div>
                <h4 class="author-name">Arthur Sterling</h4>
                <span class="author-role">Tech Venture Capitalist, Member for 4 Years</span>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="quote-mark">“</div>
            <p class="testimonial-quote">
              The level of physician accessibility is unprecedented. My doctor texts me personally after every lab update. My biological age has decreased by 7 years over the past 24 months.
            </p>
            <div class="testimonial-author">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" alt="Claire DuPont" class="author-avatar">
              <div>
                <h4 class="author-name">Claire DuPont</h4>
                <span class="author-role">Founder & CEO, BioSynthetix</span>
              </div>
            </div>
          </div>
        </div>

        <div class="carousel-controls">
          <button class="carousel-dot active" data-index="0" aria-label="Go to slide 1"></button>
          <button class="carousel-dot" data-index="1" aria-label="Go to slide 2"></button>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section class="section" id="faq">
      <div class="container max-w-narrow">
        <div class="section-header">
          <span class="section-tag">Inquiries</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>

        <div class="accordion-list">
          <div class="accordion-item">
            <button class="accordion-trigger" aria-expanded="false">
              <span>How does concierge medicine at AuraHealth differ from standard care?</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              <p>Unlike conventional practices where physicians manage 2,500+ patients with 10-minute appointments, our physicians limit their panel to 150 members max. You receive 60-90 minute unhurried appointments, direct 24/7 personal cell phone and secure app messaging, and proactive biomarker screenings.</p>
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-trigger" aria-expanded="false">
              <span>What is included in the Initial Comprehensive Longevity Assessment?</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              <p>The assessment involves a 450+ blood biomarker panel, full-body contrast MRI, coronary calcium CT scan, VO2 max endurance profiling, gut microbiome sequencing, and a 2-hour strategic roadmap session with your dedicated physician.</p>
            </div>
          </div>

          <div class="accordion-item">
            <button class="accordion-trigger" aria-expanded="false">
              <span>Do you accept commercial insurance?</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content">
              <p>Our annual membership fee covers all concierge services, continuous monitoring, and clinic visits. For external diagnostic imaging and prescriptions, we work with all major PPO insurance networks and provide comprehensive itemized superbills for FSA/HSA reimbursement.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact & Consultation Booking Form Section -->
    <section class="section section-cta" id="contact">
      <div class="container max-w-narrow">
        <div class="cta-box">
          <div class="cta-header">
            <h2>Embark on Your Longevity Journey</h2>
            <p>Our clinical admissions director will contact you within 2 business hours for a confidential assessment.</p>
          </div>

          <form id="contactForm" class="contact-form" novalidate>
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="fullName" class="form-label">Full Name *</label>
                <input type="text" id="fullName" class="form-input" placeholder="e.g. Dr. Sarah Jenkins" required>
                <span class="error-msg" id="nameError">Please enter your name</span>
              </div>
              <div class="form-group flex-1">
                <label for="emailAddr" class="form-label">Email Address *</label>
                <input type="email" id="emailAddr" class="form-input" placeholder="sarah@example.com" required>
                <span class="error-msg" id="emailError">Please enter a valid email address</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="phoneNum" class="form-label">Phone Number *</label>
                <input type="tel" id="phoneNum" class="form-input" placeholder="+1 (555) 000-0000" required>
                <span class="error-msg" id="phoneError">Please provide your phone number</span>
              </div>
              <div class="form-group flex-1">
                <label for="interestSelect" class="form-label">Primary Interest</label>
                <select id="interestSelect" class="form-select">
                  <option value="executive">Executive Longevity Membership</option>
                  <option value="diagnostics">Full-Body Multi-Omics Diagnostic Day</option>
                  <option value="cardiometabolic">Cardiovascular & Metabolic Reversal</option>
                  <option value="family">Private Family Office Coverage</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Health Goals & Prior Diagnoses (Confidential)</label>
              <textarea id="notes" class="form-textarea" rows="3" placeholder="Share any specific goals or family clinical history you would like addressed..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="submitInquiryBtn">
              Submit Confidential Request
            </button>
          </form>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-col brand-col">
        <a href="#" class="brand-logo footer-logo">
          <span class="logo-symbol">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/></svg>
          </span>
          <span class="brand-text">Aura<strong>Health</strong></span>
        </a>
        <p class="footer-desc">Precision concierge internal medicine, whole-genome profiling, and longevity therapeutics.</p>
        <span class="hipaa-badge">🔒 HIPAA Compliant & SOC-2 Certified</span>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Locations</h4>
        <ul class="footer-nav">
          <li>New York: 740 Park Avenue, Suite 12</li>
          <li>San Francisco: 555 Mission St, 34th Fl</li>
          <li>London: 12 Harley Street, Marylebone</li>
          <li>Zurich: Bahnhofstrasse 45</li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Specialties</h4>
        <ul class="footer-nav">
          <li><a href="#services">Cardiometabolic Medicine</a></li>
          <li><a href="#services">Epigenetics & Methylation</a></li>
          <li><a href="#services">Full-Body MRI Screening</a></li>
          <li><a href="#services">Neurocognitive Resilience</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Contact & Direct Line</h4>
        <ul class="footer-nav">
          <li>Direct Concierge: +1 (800) 555-AURA</li>
          <li>Private Inquiries: admissions@aurahealth.com</li>
          <li>Emergency Dispatch: 24/7 Member Portal</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container bottom-row">
        <p>© 2026 AuraHealth Premier Medical Group Inc. All rights reserved.</p>
        <div class="legal-links">
          <a href="#">Privacy Practices</a>
          <a href="#">HIPAA Statement</a>
          <a href="#">Terms of Concierge Membership</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Modal Booking Dialog -->
  <div class="modal-backdrop" id="bookingModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Schedule Executive Consultation</h3>
        <button class="modal-close" id="closeModalBtn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-intro">Select your preferred clinical hub and timing. A physician coordinator will confirm availability.</p>
        <form id="modalBookingForm">
          <div class="form-group">
            <label class="form-label">Preferred Location</label>
            <select class="form-select" id="modalLocation">
              <option>New York (Park Ave Clinic)</option>
              <option>San Francisco (Mission Center)</option>
              <option>London (Harley St Medical)</option>
              <option>Telehealth Virtual Intake</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Date</label>
            <input type="date" class="form-input" id="modalDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">Your Direct Contact</label>
            <input type="email" class="form-input" id="modalEmail" placeholder="Your executive email address" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Confirm Appointment Request</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div class="toast-container" id="toastContainer"></div>

  <script src="script.js"></script>
</body>
</html>`,
    css: `/* AuraHealth Premier Medical Group Design System */
:root {
  --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Cinzel', serif;
  
  /* Color Tokens - Light */
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-alt: #f1f5f9;
  --surface-glass: rgba(255, 255, 255, 0.85);
  --border: #e2e8f0;
  --border-focus: #0ea5e9;
  
  --primary: #0284c7;
  --primary-hover: #0369a1;
  --primary-light: #e0f2fe;
  --secondary: #0f172a;
  --accent: #10b981;
  
  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 30px rgba(0,0,0,0.1);
  --shadow-glow: 0 0 25px rgba(14, 165, 233, 0.25);
  
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  
  --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] {
  --bg: #090d16;
  --surface: #0f172a;
  --surface-alt: #1e293b;
  --surface-glass: rgba(15, 23, 42, 0.85);
  --border: #334155;
  --border-focus: #38bdf8;
  
  --primary: #38bdf8;
  --primary-hover: #7dd3fc;
  --primary-light: rgba(56, 189, 248, 0.15);
  --secondary: #f8fafc;
  --accent: #34d399;
  
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-light: #64748b;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.4);
  --shadow-lg: 0 12px 30px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 30px rgba(56, 189, 248, 0.35);
}

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: var(--font-main);
  background-color: var(--bg);
  color: var(--text-main);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow-x: hidden;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Container */
.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.max-w-narrow {
  max-width: 860px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #0284c7 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.35);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(14, 165, 233, 0.45);
}

.btn-outline {
  background: transparent;
  border-color: var(--border);
  color: var(--text-main);
}

.btn-outline:hover {
  background: var(--surface-alt);
  border-color: var(--primary);
  transform: translateY(-2px);
}

.btn-lg {
  padding: 0.9rem 2rem;
  font-size: 1.05rem;
}

.btn-block {
  width: 100%;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.icon-btn:hover {
  border-color: var(--primary);
  background: var(--surface-alt);
}

[data-theme="light"] .moon-icon { display: block; }
[data-theme="light"] .sun-icon { display: none; }
[data-theme="dark"] .moon-icon { display: none; }
[data-theme="dark"] .sun-icon { display: block; }

/* Header & Nav */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background-color: var(--surface-glass);
  border-bottom: 1px solid var(--border);
  transition: var(--transition);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text-main);
}

.logo-symbol {
  width: 38px;
  height: 38px;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.brand-text {
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.brand-text strong {
  font-weight: 800;
  color: var(--primary);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: var(--transition);
}

.nav-link:hover {
  color: var(--primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 32px;
  height: 22px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger-btn .bar {
  width: 100%;
  height: 3px;
  background-color: var(--text-main);
  border-radius: 2px;
  transition: var(--transition);
}

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: -100%;
  width: 300px;
  height: 100vh;
  background-color: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  transition: right 0.35s ease-in-out;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.mobile-drawer.open {
  right: 0;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.drawer-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-main);
  cursor: pointer;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.drawer-link {
  color: var(--text-main);
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 5rem 0 4rem;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -120px;
  right: 10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3.5rem;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent);
  animation: pulseAnim 2s infinite;
}

@keyframes pulseAnim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.hero-title {
  font-size: clamp(2.4rem, 4.5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
  color: var(--text-main);
}

.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 2.25rem;
  max-width: 560px;
}

.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.hero-social-proof {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.avatar-stack {
  display: flex;
}

.avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  object-fit: cover;
  margin-left: -12px;
}

.avatar-stack .avatar-img:first-child {
  margin-left: 0;
}

.proof-text {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.star-rating {
  color: #f59e0b;
  font-size: 1rem;
}

/* Hero Visual */
.image-card-wrapper {
  position: relative;
}

.hero-main-img {
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  object-fit: cover;
  aspect-ratio: 4/3;
}

.glass-stat-card {
  position: absolute;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: var(--surface-glass);
  border: 1px solid var(--border);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-top-right {
  top: -24px;
  right: -20px;
}

.card-bottom-left {
  bottom: -24px;
  left: -20px;
}

.stat-badge-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-accent {
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent);
}

.stat-value {
  display: block;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text-main);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Stats Ribbon */
.stats-ribbon {
  background: var(--surface-alt);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 2rem 0;
}

.ribbon-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.ribbon-item {
  flex: 1;
  min-width: 180px;
  text-align: center;
}

.ribbon-num {
  display: block;
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
}

.ribbon-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.ribbon-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

/* Section Common */
.section {
  padding: 6rem 0;
}

.section-dark {
  background-color: var(--surface-alt);
}

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.5rem;
}

.section-tag {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: clamp(2rem, 3.2vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.section-subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.service-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  transition: var(--transition);
  position: relative;
}

.service-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.featured-service {
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.featured-badge {
  position: absolute;
  top: -12px;
  right: 24px;
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.85rem;
  border-radius: var(--radius-full);
}

.service-icon {
  width: 56px;
  height: 56px;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.service-name {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.service-text {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.service-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.service-perks li::before {
  content: '✓';
  color: var(--accent);
  font-weight: bold;
  margin-right: 0.5rem;
}

/* Calculator Section */
.calculator-card {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.calc-inputs {
  padding: 3rem;
}

.range-slider {
  width: 100%;
  accent-color: var(--primary);
  height: 6px;
  background: var(--border);
  border-radius: 4px;
  outline: none;
  margin-top: 0.5rem;
}

.slider-display {
  color: var(--primary);
  font-weight: 800;
}

.radio-pill-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.radio-pill {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.radio-pill:has(input:checked) {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 700;
}

.calc-results-panel {
  background: linear-gradient(145deg, var(--surface-alt) 0%, var(--surface) 100%);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-left: 1px solid var(--border);
}

.results-heading {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.result-metric-box {
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.result-number {
  display: block;
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--accent);
}

.result-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Faculty Grid */
.faculty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}

.faculty-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}

.faculty-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.faculty-img-wrapper {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.faculty-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.faculty-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: var(--surface-glass);
  backdrop-filter: blur(8px);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-sm);
  color: var(--text-main);
}

.faculty-info {
  padding: 1.75rem;
}

.faculty-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.faculty-role {
  display: block;
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 1rem;
}

.faculty-bio {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Testimonials Carousel */
.testimonials-carousel {
  max-width: 760px;
  margin: 0 auto 2rem;
  position: relative;
}

.testimonial-card {
  display: none;
  background: var(--surface);
  padding: 3rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}

.testimonial-card.active {
  display: block;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.quote-mark {
  font-size: 3.5rem;
  line-height: 1;
  color: var(--primary-light);
  font-family: serif;
}

.testimonial-quote {
  font-size: 1.15rem;
  font-weight: 500;
  line-height: 1.7;
  margin-bottom: 2rem;
  color: var(--text-main);
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.author-role {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.carousel-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border);
  border: none;
  cursor: pointer;
  transition: var(--transition);
}

.carousel-dot.active {
  background: var(--primary);
  transform: scale(1.3);
}

/* FAQ Accordion */
.accordion-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.accordion-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
  transition: var(--transition);
}

.accordion-trigger {
  width: 100%;
  padding: 1.35rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-main);
  text-align: left;
}

.accordion-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--primary);
  transition: transform 0.3s ease;
}

.accordion-item.active .accordion-icon {
  transform: rotate(45deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 0 1.75rem;
  color: var(--text-muted);
}

.accordion-item.active .accordion-content {
  padding-bottom: 1.5rem;
}

/* Contact CTA Box */
.section-cta {
  background: linear-gradient(180deg, var(--bg) 0%, var(--surface-alt) 100%);
}

.cta-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 3.5rem;
  box-shadow: var(--shadow-lg);
}

.cta-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.cta-header h2 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.cta-header p {
  color: var(--text-muted);
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.flex-1 { flex: 1; }

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-main);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.85rem 1.15rem;
  font-family: inherit;
  font-size: 0.95rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-main);
  transition: var(--transition);
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.error-msg {
  display: none;
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.3rem;
}

.form-group.has-error .error-msg {
  display: block;
}

.form-group.has-error .form-input {
  border-color: #ef4444;
}

/* Footer */
.site-footer {
  background-color: var(--surface-alt);
  border-top: 1px solid var(--border);
  padding: 5rem 0 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 3rem;
  margin-bottom: 4rem;
}

.footer-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 1rem 0 1.5rem;
  max-width: 320px;
}

.hipaa-badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.footer-heading {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.footer-nav {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-nav a, .footer-nav li {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: var(--transition);
}

.footer-nav a:hover {
  color: var(--primary);
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 2rem;
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  flex-wrap: wrap;
  gap: 1rem;
}

.legal-links {
  display: flex;
  gap: 1.5rem;
}

.legal-links a {
  color: var(--text-muted);
  text-decoration: none;
}

.legal-links a:hover {
  color: var(--primary);
}

/* Modal Dialog */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-backdrop.open {
  display: flex;
}

.modal-dialog {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 520px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  padding: 2.5rem;
  animation: modalScale 0.25s ease-out;
}

@keyframes modalScale {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 800;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8rem;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-intro {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast {
  background: var(--surface);
  border: 1px solid var(--accent);
  color: var(--text-main);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideToast {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive Media Queries */
@media (max-width: 992px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-subtitle {
    margin: 0 auto 2.25rem;
  }
  .hero-cta-group {
    justify-content: center;
  }
  .hero-social-proof {
    justify-content: center;
  }
  .card-top-right {
    right: 10px;
  }
  .card-bottom-left {
    left: 10px;
  }
  .calculator-card {
    grid-template-columns: 1fr;
  }
  .calc-results-panel {
    border-left: none;
    border-top: 1px solid var(--border);
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .main-nav {
    display: none;
  }
  .hamburger-btn {
    display: flex;
  }
  .ribbon-divider {
    display: none;
  }
  .ribbon-item {
    min-width: 45%;
  }
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .cta-box {
    padding: 2rem 1.5rem;
  }
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
`,
    js: `// AuraHealth Clinical Logic & Interactivity
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme');
      const next = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Mobile Drawer
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const closeDrawer = document.getElementById('closeDrawerBtn');

  if (mobileToggle && drawer) {
    mobileToggle.addEventListener('click', () => {
      drawer.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
    });
  }

  if (closeDrawer && drawer) {
    closeDrawer.addEventListener('click', () => {
      drawer.classList.remove('open');
      mobileToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  // Close drawer on link click
  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => {
      drawer?.classList.remove('open');
    });
  });

  // Longevity Calculator
  const calcAge = document.getElementById('calcAge');
  const calcSleep = document.getElementById('calcSleep');
  const calcActivity = document.getElementById('calcActivity');
  const calcAgeVal = document.getElementById('calcAgeVal');
  const calcSleepVal = document.getElementById('calcSleepVal');
  const resultBioAge = document.getElementById('resultBioAge');
  const resultHealthSpan = document.getElementById('resultHealthSpan');
  const resultRiskReduction = document.getElementById('resultRiskReduction');

  function updateCalculator() {
    if (!calcAge || !calcSleep || !calcActivity) return;
    const age = parseInt(calcAge.value, 10);
    const sleep = parseFloat(calcSleep.value);
    const activity = calcActivity.value;
    
    calcAgeVal.textContent = age;
    calcSleepVal.textContent = sleep;

    // Computational longevity delta
    let bioDelta = -3.0;
    if (sleep >= 7.5 && sleep <= 9.0) bioDelta -= 2.5;
    else if (sleep < 6) bioDelta += 1.5;

    if (activity === 'elite') bioDelta -= 4.0;
    else if (activity === 'high') bioDelta -= 2.5;
    else if (activity === 'sedentary') bioDelta += 2.0;

    const riskReduction = Math.min(92, Math.max(45, Math.round(55 + Math.abs(bioDelta) * 4.2)));
    const healthspanGain = (Math.abs(bioDelta) * 1.8 + (age > 50 ? 5 : 8)).toFixed(1);

    resultBioAge.textContent = (bioDelta > 0 ? '+' : '') + bioDelta.toFixed(1) + ' Years';
    resultHealthSpan.textContent = '+' + healthspanGain + ' Years';
    resultRiskReduction.textContent = riskReduction + '%';
  }

  calcAge?.addEventListener('input', updateCalculator);
  calcSleep?.addEventListener('input', updateCalculator);
  calcActivity?.addEventListener('change', updateCalculator);
  document.querySelectorAll('input[name="calcRisk"]').forEach(r => r.addEventListener('change', updateCalculator));

  // FAQ Accordion
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const content = item.querySelector('.accordion-content');

    trigger?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close other accordions
      accordionItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
        const c = i.querySelector('.accordion-content');
        if (c) c.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 30 + 'px';
      }
    });
  });

  // Testimonials Carousel
  const slides = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.carousel-dot');
  let currentSlide = 0;

  function setSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    currentSlide = index;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      setSlide(idx);
    });
  });

  // Auto-advance slides every 8 seconds
  setInterval(() => {
    if (slides.length > 1) {
      setSlide((currentSlide + 1) % slides.length);
    }
  }, 8000);

  // Booking Modal
  const bookingModal = document.getElementById('bookingModal');
  const openModalBtns = [
    document.getElementById('openBookingModalBtn'),
    document.getElementById('heroBookBtn'),
    document.getElementById('drawerBookBtn'),
    document.getElementById('calcBookBtn')
  ];
  const closeModalBtn = document.getElementById('closeModalBtn');

  openModalBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      bookingModal?.classList.add('open');
      drawer?.classList.remove('open');
    });
  });

  closeModalBtn?.addEventListener('click', () => {
    bookingModal?.classList.remove('open');
  });

  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      bookingModal.classList.remove('open');
    }
  });

  // Toast Functionality
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span>✓</span> <span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Modal Form Submission
  const modalForm = document.getElementById('modalBookingForm');
  modalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    bookingModal?.classList.remove('open');
    showToast('Consultation request received! Our admissions director will call you.');
    modalForm.reset();
  });

  // Main Contact Form Validation
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('emailAddr');
    const phoneInput = document.getElementById('phoneNum');

    if (!nameInput.value.trim()) {
      nameInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    } else {
      nameInput.closest('.form-group').classList.remove('has-error');
    }

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      emailInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    } else {
      emailInput.closest('.form-group').classList.remove('has-error');
    }

    if (!phoneInput.value.trim()) {
      phoneInput.closest('.form-group').classList.add('has-error');
      isValid = false;
    } else {
      phoneInput.closest('.form-group').classList.remove('has-error');
    }

    if (isValid) {
      showToast('Thank you! Your confidential clinical intake has been submitted.');
      contactForm.reset();
    }
  });
});`
  };
}

function generateIndustrialSite(customPrompt = '') {
  return {
    name: 'Vanguard Precision Dynamics',
    category: 'industrial',
    tagline: 'Micron-Level Advanced Metallurgy & Robotics Manufacturing',
    seo: {
      title: 'Vanguard Precision Dynamics | High-Precision Aerospace & Defense Manufacturing',
      description: 'AS9100D and ISO 9001 certified CNC 5-axis machining, robotic additive metallurgy, and sub-micron metrology for mission-critical industries.',
      keywords: ['precision manufacturing', 'CNC machining', 'aerospace engineering', 'additive manufacturing', 'sub-micron metrology'],
      schemaType: 'Organization'
    },
    html: `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vanguard Precision Dynamics | High-Tolerance Industrial Manufacturing</title>
  <meta name="description" content="AS9100D & ISO 9001 certified precision 5-axis CNC machining, titanium additive manufacturing, and automated metrology for aerospace and medical systems.">
  <meta name="keywords" content="5-axis CNC, aerospace manufacturing, precision robotics, titanium casting, AS9100D">
  <meta property="og:title" content="Vanguard Precision Dynamics | High-Tolerance Industrial Manufacturing">
  <meta property="og:description" content="Micron-Level Advanced Metallurgy & Robotics Manufacturing">
  <meta property="og:image" content="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vanguard Precision Dynamics",
    "url": "https://vanguardprecision.example.com",
    "logo": "https://vanguardprecision.example.com/logo.png",
    "description": "High-Tolerance Aerospace & Robotics Manufacturing",
    "telephone": "+1-888-555-VANGUARD"
  }
  </script>
</head>
<body>
  <!-- Header -->
  <header class="ind-header" id="header">
    <div class="ind-nav-container">
      <a href="#" class="ind-brand">
        <span class="ind-brand-badge">VPD</span>
        <span class="ind-brand-title">Vanguard<strong>Precision</strong></span>
      </a>

      <nav class="ind-nav" id="indNav">
        <a href="#capabilities" class="ind-nav-link">Capabilities</a>
        <a href="#spec-sheet" class="ind-nav-link">Tolerances & Specs</a>
        <a href="#estimator" class="ind-nav-link">RFQ Estimator</a>
        <a href="#certifications" class="ind-nav-link">Quality Standards</a>
        <a href="#facilities" class="ind-nav-link">Facilities</a>
      </nav>

      <div class="ind-nav-actions">
        <button id="themeToggleBtn" class="ind-icon-btn" aria-label="Toggle theme">
          <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="ind-btn ind-btn-primary" id="openRfqModalBtn">Request Instant RFQ</button>
        <button class="ind-hamburger" id="mobileMenuToggle" aria-label="Toggle Navigation">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer -->
  <div class="ind-drawer" id="mobileDrawer">
    <div class="drawer-top">
      <span class="ind-brand-title">Vanguard<strong>Precision</strong></span>
      <button class="drawer-close" id="closeDrawerBtn">&times;</button>
    </div>
    <div class="drawer-menu">
      <a href="#capabilities" class="drawer-item">Capabilities</a>
      <a href="#spec-sheet" class="drawer-item">Tolerances & Specs</a>
      <a href="#estimator" class="drawer-item">RFQ Estimator</a>
      <a href="#certifications" class="drawer-item">Quality Standards</a>
      <a href="#facilities" class="drawer-item">Facilities</a>
      <button class="ind-btn ind-btn-primary ind-btn-block" id="drawerRfqBtn">Request Instant RFQ</button>
    </div>
  </div>

  <main>
    <!-- Industrial Hero Section -->
    <section class="ind-hero">
      <div class="ind-grid-overlay"></div>
      <div class="ind-container hero-flex">
        <div class="hero-left">
          <div class="ind-tag-pill">
            <span class="gear-icon">⚙</span>
            <span>ITAR REGISTERED • AS9100D REV D CERTIFIED</span>
          </div>
          <h1 class="ind-hero-h1">Ultra-Precision Metallurgy for Extreme Environments</h1>
          <p class="ind-hero-p">
            Engineering flight-critical turbomachinery components, cryogenic valving, and robotic titanium assemblies with repeatable tolerances down to ±0.0025 mm.
          </p>

          <div class="ind-cta-row">
            <button class="ind-btn ind-btn-primary ind-btn-lg" id="heroRfqBtn">Launch Rapid Quote</button>
            <a href="#capabilities" class="ind-btn ind-btn-secondary ind-btn-lg">View Production Specs</a>
          </div>

          <div class="cert-row">
            <div class="cert-pill">ISO 9001:2015</div>
            <div class="cert-pill">AS9100D Aerospace</div>
            <div class="cert-pill">ITAR Registered</div>
            <div class="cert-pill">Nadcap Heat Treating</div>
          </div>
        </div>

        <div class="hero-right">
          <div class="machine-view-card">
            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80" alt="High speed 5-axis CNC machining titanium turbine impeller" class="machine-img">
            <div class="telemetry-box box-tl">
              <span class="tele-label">Spindle Velocity</span>
              <span class="tele-val">24,000 RPM</span>
            </div>
            <div class="telemetry-box box-br">
              <span class="tele-label">Metrology Precision</span>
              <span class="tele-val">±0.0001" (2.5 µm)</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Industrial Key Metrics Bar -->
    <section class="ind-stats-bar">
      <div class="ind-container stats-grid">
        <div class="stat-cell">
          <span class="stat-big">120+</span>
          <span class="stat-text">5-Axis CNC & Wire EDM Machines</span>
        </div>
        <div class="stat-cell">
          <span class="stat-big">&lt; 48 Hrs</span>
          <span class="stat-text">Rapid Prototype Turnaround</span>
        </div>
        <div class="stat-cell">
          <span class="stat-big">99.98%</span>
          <span class="stat-text">First-Pass Yield Metric</span>
        </div>
        <div class="stat-cell">
          <span class="stat-big">140k sq ft</span>
          <span class="stat-text">Climate-Controlled Cleanroom Facility</span>
        </div>
      </div>
    </section>

    <!-- Capabilities Section -->
    <section class="ind-section" id="capabilities">
      <div class="ind-container">
        <div class="ind-section-head">
          <span class="ind-sec-tag">Machining & Metallurgy</span>
          <h2 class="ind-sec-title">Mission-Critical Manufacturing Infrastructure</h2>
          <p class="ind-sec-sub">From rapid engineering prototypes to high-volume Tier-1 aerospace production runs.</p>
        </div>

        <div class="cap-grid">
          <div class="cap-card">
            <div class="cap-img-wrapper">
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80" alt="Multi-axis CNC milling" class="cap-img">
            </div>
            <div class="cap-body">
              <h3 class="cap-title">Simultaneous 5-Axis CNC Milling</h3>
              <p class="cap-desc">Continuous multi-axis contouring of high-nickel superalloys (Inconel 718, Hastelloy, Monel) and aerospace titanium Ti-6Al-4V.</p>
              <ul class="cap-specs">
                <li>Working Envelope: up to 1,600 x 1,200 x 900 mm</li>
                <li>Thermal displacement compensation</li>
                <li>Palletized automated tool changing</li>
              </ul>
            </div>
          </div>

          <div class="cap-card">
            <div class="cap-img-wrapper">
              <img src="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80" alt="Wire EDM electrical discharge machining" class="cap-img">
            </div>
            <div class="cap-body">
              <h3 class="cap-title">Sub-Micron Wire EDM & Sinker</h3>
              <p class="cap-desc">Erosion machining for intricate aerospace internal splines, turbine slots, and hardened tool steels up to 68 HRC with zero residual stress.</p>
              <ul class="cap-specs">
                <li>Corner radii down to 0.02 mm</li>
                <li>Surface finish down to Ra 0.1 µm</li>
                <li>Zero-taper automatic compensation</li>
              </ul>
            </div>
          </div>

          <div class="cap-card">
            <div class="cap-img-wrapper">
              <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80" alt="Direct metal laser sintering 3D printing" class="cap-img">
            </div>
            <div class="cap-body">
              <h3 class="cap-title">Direct Metal Laser Sintering (DMLS)</h3>
              <p class="cap-desc">Additive manufacturing of complex lattice heat exchangers and rocket engine injector heads with post-process CNC finishing.</p>
              <ul class="cap-specs">
                <li>Quad-laser 1kW powder bed fusion</li>
                <li>99.9% metallurgical density</li>
                <li>Full HIP (Hot Isostatic Pressing) certification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive RFQ Cost & Lead Time Estimator -->
    <section class="ind-section ind-section-alt" id="estimator">
      <div class="ind-container">
        <div class="ind-section-head">
          <span class="ind-sec-tag">Direct Engineering Tool</span>
          <h2 class="ind-sec-title">Parametric Production & Lead-Time Estimator</h2>
          <p class="ind-sec-sub">Select alloy grade, run volume, and tolerance class for instant feasibility modeling.</p>
        </div>

        <div class="ind-calc-container">
          <div class="ind-calc-form">
            <div class="ind-form-row">
              <div class="ind-group">
                <label class="ind-label">Material Alloy Class</label>
                <select class="ind-select" id="rfqMaterial">
                  <option value="ti64" data-factor="1.8">Titanium Grade 5 (Ti-6Al-4V) - Aerospace</option>
                  <option value="inconel" data-factor="2.4">Inconel 718 Superalloy - High Heat</option>
                  <option value="al7075" data-factor="1.0" selected>Aluminum 7075-T651 - Structural</option>
                  <option value="ss316" data-factor="1.2">Stainless 316L Surgical / Cryogenic</option>
                  <option value="peek" data-factor="1.5">Medical PEEK Polymer</option>
                </select>
              </div>

              <div class="ind-group">
                <label class="ind-label">Tolerance Class Requirement</label>
                <select class="ind-select" id="rfqTolerance">
                  <option value="standard" data-factor="1.0">Standard Precision (±0.05 mm / ±0.002")</option>
                  <option value="high" data-factor="1.35" selected>Aerospace Flight (±0.01 mm / ±0.0004")</option>
                  <option value="ultra" data-factor="1.75">Defense / Optical Sub-Micron (±0.0025 mm)</option>
                </select>
              </div>
            </div>

            <div class="ind-group">
              <label class="ind-label">Production Batch Quantity: <strong id="qtyDisplay" class="ind-highlight">250</strong> Units</label>
              <input type="range" class="ind-range" id="rfqQty" min="5" max="5000" step="5" value="250">
            </div>

            <div class="ind-group">
              <label class="ind-label">Post-Processing & Surface Treatment</label>
              <div class="ind-checkbox-row">
                <label class="ind-chk-label"><input type="checkbox" id="chkAnodize" checked> Type III Hard Anodize / Passivation</label>
                <label class="ind-chk-label"><input type="checkbox" id="chkCmm" checked> 100% CMM Metrology FAIR Report</label>
                <label class="ind-chk-label"><input type="checkbox" id="chkHip"> Hot Isostatic Pressing (HIP)</label>
              </div>
            </div>
          </div>

          <div class="ind-calc-output">
            <h4 class="output-title">Estimated Manufacturing Feasibility</h4>
            <div class="output-row">
              <span class="output-key">Est. Unit Price</span>
              <span class="output-val" id="estUnitPrice">$184.50</span>
            </div>
            <div class="output-row">
              <span class="output-key">Total Batch Cost</span>
              <span class="output-val" id="estBatchCost">$46,125</span>
            </div>
            <div class="output-row">
              <span class="output-key">Expedited Lead Time</span>
              <span class="output-val text-green" id="estLeadTime">12 Business Days</span>
            </div>
            <div class="output-row">
              <span class="output-key">Metrology Verification</span>
              <span class="output-val">AS9102 FAIR Included</span>
            </div>
            <button class="ind-btn ind-btn-primary ind-btn-block ind-mt-2" id="btnRequestOfficialQuote">
              Lock In Engineering Estimate
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Quality Standards & Metrology -->
    <section class="ind-section" id="certifications">
      <div class="ind-container">
        <div class="ind-section-head">
          <span class="ind-sec-tag">Quality Assurance</span>
          <h2 class="ind-sec-title">Coordinate Metrology & Certified Traceability</h2>
          <p class="ind-sec-sub">Laser radar scanning, optical interferometry, and Zeiss coordinate measuring machines.</p>
        </div>

        <div class="qa-grid">
          <div class="qa-box">
            <div class="qa-num">01</div>
            <h3 class="qa-title">Zeiss CMM In-Line Scanning</h3>
            <p class="qa-text">Climate-controlled 20°C (±0.2°C) inspection cleanrooms with multi-sensor touch triggers and non-contact laser optical triangulation.</p>
          </div>
          <div class="qa-box">
            <div class="qa-num">02</div>
            <h3 class="qa-title">Material Chemical Mill Certs</h3>
            <p class="qa-text">100% full domestic heat lot traceability with X-ray fluorescence (XRF) alloy verification prior to any spindle activation.</p>
          </div>
          <div class="qa-box">
            <div class="qa-num">03</div>
            <h3 class="qa-title">Non-Destructive Testing (NDT)</h3>
            <p class="qa-text">In-house Level III certified fluorescent penetrant inspection (FPI), ultrasonic testing, and radiographic weld inspections.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- RFQ Engineering Submission Section -->
    <section class="ind-section ind-section-darker" id="rfq-contact">
      <div class="ind-container max-w-narrow">
        <div class="rfq-wrapper">
          <div class="rfq-header">
            <h2>Submit CAD Files & Engineering Drawings</h2>
            <p>Upload STEP, IGES, or DXF files for rapid automated DFM analysis and quote validation within 4 hours.</p>
          </div>

          <form id="indRfqForm" class="ind-form" novalidate>
            <div class="ind-form-row">
              <div class="ind-group flex-1">
                <label class="ind-label" for="engName">Engineering Contact Name *</label>
                <input type="text" id="engName" class="ind-input" placeholder="e.g. David Zhao, Lead Mechanical Eng" required>
                <span class="ind-err" id="engNameErr">Contact name is required</span>
              </div>
              <div class="ind-group flex-1">
                <label class="ind-label" for="engEmail">Corporate / Defense Email *</label>
                <input type="email" id="engEmail" class="ind-input" placeholder="david.zhao@aerospace-systems.com" required>
                <span class="ind-err" id="engEmailErr">Valid corporate email required</span>
              </div>
            </div>

            <div class="ind-form-row">
              <div class="ind-group flex-1">
                <label class="ind-label" for="companyName">Company / Organization *</label>
                <input type="text" id="companyName" class="ind-input" placeholder="e.g. Orbital Space Flight Dynamics" required>
                <span class="ind-err" id="companyErr">Company name is required</span>
              </div>
              <div class="ind-group flex-1">
                <label class="ind-label" for="itarSelect">ITAR / EAR Compliance Status</label>
                <select id="itarSelect" class="ind-select">
                  <option value="commercial">Commercial / Industrial (Non-ITAR)</option>
                  <option value="itar">ITAR Regulated (US Persons Only)</option>
                  <option value="ear99">Dual-Use EAR99 Controlled</option>
                  <option value="defense">DoD / Class 1 Critical Safety Item</option>
                </select>
              </div>
            </div>

            <div class="ind-group">
              <label class="ind-label" for="rfqNotes">Part Specifications & Tolerances Notes</label>
              <textarea id="rfqNotes" class="ind-textarea" rows="3" placeholder="Provide part numbers, annual estimated volumes, surface roughness specs, or packaging requirements..."></textarea>
            </div>

            <button type="submit" class="ind-btn ind-btn-primary ind-btn-lg ind-btn-block" id="indSubmitBtn">
              Submit Secure RFQ Package
            </button>
          </form>
        </div>
      </div>
    </section>
  </main>

  <!-- Industrial Footer -->
  <footer class="ind-footer">
    <div class="ind-container footer-cols">
      <div class="f-col f-brand">
        <span class="ind-brand-title">Vanguard<strong>Precision</strong></span>
        <p class="f-desc">Precision aerospace manufacturing, robotic tooling, and metallurgic systems. Delivering sub-micron fidelity for mission-critical applications.</p>
        <span class="cage-tag">CAGE CODE: 78XY9 • DUNS: 08-992-1240</span>
      </div>
      <div class="f-col">
        <h4>Operational Facilities</h4>
        <ul>
          <li>Aerospace Plant 1: Everett, WA</li>
          <li>Defense & Titanium Fab: Huntsville, AL</li>
          <li>Precision Micro-Machining: Phoenix, AZ</li>
        </ul>
      </div>
      <div class="f-col">
        <h4>Direct Contact</h4>
        <ul>
          <li>RFQ Inquiries: rfq@vanguardprecision.com</li>
          <li>Engineering Hotline: +1 (888) 555-VANGUARD</li>
          <li>Secure ITAR Vault: sftp.vanguardprecision.com</li>
        </ul>
      </div>
    </div>
    <div class="ind-container sub-footer">
      <p>© 2026 Vanguard Precision Dynamics Inc. All defense manufacturing data handled under NIST SP 800-171 protocols.</p>
      <div class="sub-links">
        <a href="#">Export Compliance</a>
        <a href="#">Quality Manual</a>
        <a href="#">Terms of Sale</a>
      </div>
    </div>
  </footer>

  <!-- Instant RFQ Modal -->
  <div class="ind-modal-backdrop" id="rfqModal">
    <div class="ind-modal-box">
      <div class="modal-head">
        <h3>Fast-Track Engineering Quote</h3>
        <button class="modal-close-x" id="closeRfqModal">&times;</button>
      </div>
      <p class="modal-desc">Direct line to our senior manufacturing engineers. Expect technical review within 4 business hours.</p>
      <form id="modalRfqForm">
        <div class="ind-group">
          <label class="ind-label">Project Name / Drawing Number</label>
          <input type="text" class="ind-input" id="quickProj" placeholder="e.g. Turbine Impeller Mod 4B" required>
        </div>
        <div class="ind-group">
          <label class="ind-label">Direct Engineer Email</label>
          <input type="email" class="ind-input" id="quickEmail" placeholder="engineer@organization.com" required>
        </div>
        <button type="submit" class="ind-btn ind-btn-primary ind-btn-block">Dispatch to Manufacturing Engineering</button>
      </form>
    </div>
  </div>

  <div class="ind-toast-hub" id="toastHub"></div>

  <script src="script.js"></script>
</body>
</html>`,
    css: `/* Vanguard Precision Dynamics - High-End Industrial Styling */
:root {
  --ind-font: 'Plus Jakarta Sans', sans-serif;
  --ind-mono: 'Space Grotesk', monospace;
  
  --bg-color: #0b0f19;
  --surface-color: #111827;
  --surface-alt: #1f2937;
  --border-color: #374151;
  --border-accent: #f59e0b;
  
  --primary-accent: #f59e0b;
  --primary-hover: #d97706;
  --primary-glow: rgba(245, 158, 11, 0.25);
  
  --text-main: #f9fafb;
  --text-muted: #9ca3af;
  --text-dim: #6b7280;
  
  --green-accent: #10b981;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  --transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] {
  --bg-color: #f3f4f6;
  --surface-color: #ffffff;
  --surface-alt: #e5e7eb;
  --border-color: #d1d5db;
  --border-accent: #d97706;
  
  --primary-accent: #d97706;
  --primary-hover: #b45309;
  --primary-glow: rgba(217, 119, 6, 0.2);
  
  --text-main: #111827;
  --text-muted: #4b5563;
  --text-dim: #9ca3af;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--ind-font);
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.ind-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.max-w-narrow {
  max-width: 820px;
}

/* Industrial Header */
.ind-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
}

[data-theme="light"] .ind-header {
  background: rgba(255, 255, 255, 0.92);
}

.ind-nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 74px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.ind-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-main);
}

.ind-brand-badge {
  background: var(--primary-accent);
  color: #000;
  font-family: var(--ind-mono);
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.ind-brand-title {
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.ind-brand-title strong {
  color: var(--primary-accent);
}

.ind-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.ind-nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: var(--transition);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ind-nav-link:hover {
  color: var(--primary-accent);
}

.ind-nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ind-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--ind-mono);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
  text-decoration: none;
}

.ind-btn-primary {
  background: var(--primary-accent);
  color: #000000;
}

.ind-btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: 0 0 18px var(--primary-glow);
  transform: translateY(-2px);
}

.ind-btn-secondary {
  background: transparent;
  border-color: var(--border-color);
  color: var(--text-main);
}

.ind-btn-secondary:hover {
  border-color: var(--primary-accent);
  background: var(--surface-alt);
}

.ind-btn-lg {
  padding: 0.9rem 2rem;
  font-size: 0.95rem;
}

.ind-btn-block {
  width: 100%;
}

.ind-icon-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ind-icon-btn:hover {
  border-color: var(--primary-accent);
}

[data-theme="dark"] .moon-icon { display: none; }
[data-theme="dark"] .sun-icon { display: block; }
[data-theme="light"] .moon-icon { display: block; }
[data-theme="light"] .sun-icon { display: none; }

.ind-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
}

.ind-hamburger span {
  width: 24px;
  height: 2px;
  background: var(--text-main);
}

/* Mobile Drawer */
.ind-drawer {
  position: fixed;
  top: 0;
  right: -100%;
  width: 320px;
  height: 100vh;
  background: var(--surface-color);
  border-left: 1px solid var(--border-color);
  z-index: 1000;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: right 0.35s ease;
}

.ind-drawer.open {
  right: 0;
}

.drawer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.drawer-close {
  background: none;
  border: none;
  color: var(--text-main);
  font-size: 2rem;
  cursor: pointer;
}

.drawer-menu {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.drawer-item {
  color: var(--text-main);
  text-decoration: none;
  font-family: var(--ind-mono);
  font-weight: 600;
  font-size: 1.1rem;
}

/* Hero Section */
.ind-hero {
  position: relative;
  padding: 5rem 0 4rem;
  background: radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
  border-bottom: 1px solid var(--border-color);
}

.ind-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--border-color) 1px, transparent 1px),
                    linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.15;
  pointer-events: none;
}

.hero-flex {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  align-items: center;
  gap: 3.5rem;
  position: relative;
}

.ind-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  font-family: var(--ind-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
}

.ind-hero-h1 {
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1.25rem;
}

.ind-hero-p {
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 2.25rem;
  max-width: 580px;
}

.ind-cta-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.cert-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cert-pill {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  font-family: var(--ind-mono);
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

/* Hero Machine Card */
.machine-view-card {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
}

.machine-img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}

.telemetry-box {
  position: absolute;
  background: rgba(17, 24, 39, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-family: var(--ind-mono);
}

.box-tl { top: 16px; left: 16px; }
.box-br { bottom: 16px; right: 16px; }

.tele-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.tele-val {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-accent);
}

/* Stats Bar */
.ind-stats-bar {
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  padding: 2.5rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  text-align: center;
}

.stat-cell {
  border-right: 1px solid var(--border-color);
  padding: 0 1rem;
}

.stat-cell:last-child {
  border-right: none;
}

.stat-big {
  display: block;
  font-family: var(--ind-mono);
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--primary-accent);
  line-height: 1.1;
}

.stat-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Sections */
.ind-section {
  padding: 6rem 0;
}

.ind-section-alt {
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.ind-section-darker {
  background-color: #080c14;
}

.ind-section-head {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.5rem;
}

.ind-sec-tag {
  display: inline-block;
  font-family: var(--ind-mono);
  font-size: 0.8rem;
  color: var(--primary-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.ind-sec-title {
  font-size: clamp(2rem, 3.2vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.ind-sec-sub {
  color: var(--text-muted);
  font-size: 1.05rem;
}

/* Capabilities Grid */
.cap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.cap-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: var(--transition);
}

.cap-card:hover {
  border-color: var(--primary-accent);
  transform: translateY(-4px);
}

.cap-img-wrapper {
  aspect-ratio: 16/9;
  overflow: hidden;
}

.cap-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.cap-card:hover .cap-img {
  transform: scale(1.05);
}

.cap-body {
  padding: 2rem;
}

.cap-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.cap-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.cap-specs {
  list-style: none;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cap-specs li::before {
  content: "▸ ";
  color: var(--primary-accent);
  font-weight: bold;
}

/* Interactive RFQ Estimator */
.ind-calc-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ind-calc-form {
  padding: 3rem;
}

.ind-form-row {
  display: flex;
  gap: 1.5rem;
}

.ind-group {
  margin-bottom: 1.5rem;
}

.flex-1 { flex: 1; }

.ind-label {
  display: block;
  font-family: var(--ind-mono);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

.ind-highlight {
  color: var(--primary-accent);
}

.ind-select, .ind-input, .ind-textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
  transition: var(--transition);
}

.ind-select:focus, .ind-input:focus, .ind-textarea:focus {
  outline: none;
  border-color: var(--primary-accent);
}

.ind-range {
  width: 100%;
  accent-color: var(--primary-accent);
  margin-top: 0.5rem;
}

.ind-checkbox-row {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.ind-chk-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  cursor: pointer;
}

.ind-calc-output {
  background: var(--surface-alt);
  padding: 3rem;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.output-title {
  font-family: var(--ind-mono);
  font-size: 1rem;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  color: var(--text-main);
}

.output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border-color);
}

.output-key {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.output-val {
  font-family: var(--ind-mono);
  font-weight: 700;
  font-size: 1.25rem;
}

.text-green {
  color: var(--green-accent);
}

.ind-mt-2 {
  margin-top: 1.5rem;
}

/* QA Boxes */
.qa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.qa-box {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2.5rem;
  position: relative;
}

.qa-num {
  font-family: var(--ind-mono);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--border-color);
  line-height: 1;
  margin-bottom: 1rem;
}

.qa-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.qa-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* RFQ Form */
.rfq-wrapper {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 3.5rem;
}

.rfq-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.rfq-header h2 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.rfq-header p {
  color: var(--text-muted);
}

.ind-err {
  display: none;
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.3rem;
}

.ind-group.has-error .ind-err {
  display: block;
}

.ind-group.has-error .ind-input {
  border-color: #ef4444;
}

/* Footer */
.ind-footer {
  background: #080c14;
  border-top: 1px solid var(--border-color);
  padding: 4.5rem 0 2rem;
}

.footer-cols {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3.5rem;
}

.f-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 1rem 0;
  max-width: 340px;
}

.cage-tag {
  display: inline-block;
  font-family: var(--ind-mono);
  font-size: 0.75rem;
  color: var(--primary-accent);
  border: 1px dashed var(--primary-accent);
  padding: 0.35rem 0.65rem;
}

.f-col h4 {
  font-family: var(--ind-mono);
  font-size: 0.95rem;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
}

.f-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.f-col li {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.sub-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-dim);
  flex-wrap: wrap;
  gap: 1rem;
}

.sub-links {
  display: flex;
  gap: 1.5rem;
}

.sub-links a {
  color: var(--text-muted);
  text-decoration: none;
}

.sub-links a:hover {
  color: var(--primary-accent);
}

/* Modal */
.ind-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.ind-modal-backdrop.open {
  display: flex;
}

.ind-modal-box {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  max-width: 500px;
  width: 100%;
  padding: 2.5rem;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.modal-close-x {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.8rem;
  cursor: pointer;
}

.modal-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

/* Toast */
.ind-toast-hub {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ind-toast {
  background: var(--surface-color);
  border: 1px solid var(--primary-accent);
  color: var(--text-main);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-sm);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  font-family: var(--ind-mono);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 992px) {
  .hero-flex {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .ind-hero-p {
    margin: 0 auto 2.25rem;
  }
  .ind-cta-row, .cert-row {
    justify-content: center;
  }
  .ind-calc-container {
    grid-template-columns: 1fr;
  }
  .ind-calc-output {
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-cell:nth-child(2) {
    border-right: none;
  }
  .footer-cols {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .ind-nav {
    display: none;
  }
  .ind-hamburger {
    display: flex;
  }
  .ind-form-row {
    flex-direction: column;
    gap: 0;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-cell {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
  }
  .footer-cols {
    grid-template-columns: 1fr;
  }
}
`,
    js: `// Vanguard Precision Dynamics - Interactive RFQ Engine
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('indTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', storedTheme);

  themeToggle?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('indTheme', next);
  });

  // Mobile Drawer
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const closeDrawer = document.getElementById('closeDrawerBtn');

  mobileToggle?.addEventListener('click', () => drawer?.classList.add('open'));
  closeDrawer?.addEventListener('click', () => drawer?.classList.remove('open'));
  document.querySelectorAll('.drawer-item').forEach(link => {
    link.addEventListener('click', () => drawer?.classList.remove('open'));
  });

  // Interactive RFQ Estimator Logic
  const rfqMaterial = document.getElementById('rfqMaterial');
  const rfqTolerance = document.getElementById('rfqTolerance');
  const rfqQty = document.getElementById('rfqQty');
  const qtyDisplay = document.getElementById('qtyDisplay');
  const chkAnodize = document.getElementById('chkAnodize');
  const chkCmm = document.getElementById('chkCmm');
  const chkHip = document.getElementById('chkHip');

  const estUnitPrice = document.getElementById('estUnitPrice');
  const estBatchCost = document.getElementById('estBatchCost');
  const estLeadTime = document.getElementById('estLeadTime');

  function calculateEstimate() {
    if (!rfqMaterial || !rfqTolerance || !rfqQty) return;

    const qty = parseInt(rfqQty.value, 10);
    qtyDisplay.textContent = qty.toLocaleString();

    const matFactor = parseFloat(rfqMaterial.options[rfqMaterial.selectedIndex].getAttribute('data-factor') || '1.0');
    const tolFactor = parseFloat(rfqTolerance.options[rfqTolerance.selectedIndex].getAttribute('data-factor') || '1.0');

    let basePartCost = 95.0; // Base part cost
    // Economy of scale factor
    let scaleDiscount = Math.max(0.45, 1.0 - (Math.log10(qty) * 0.16));

    let extras = 0;
    if (chkAnodize?.checked) extras += 14.0;
    if (chkCmm?.checked) extras += 18.0;
    if (chkHip?.checked) extras += 35.0;

    let unitCost = ((basePartCost * matFactor * tolFactor) + extras) * scaleDiscount;
    let totalCost = unitCost * qty;

    let leadDays = 10;
    if (qty > 500) leadDays = 15;
    if (qty > 2000) leadDays = 22;
    if (matFactor > 2.0) leadDays += 3;

    estUnitPrice.textContent = '$' + unitCost.toFixed(2);
    estBatchCost.textContent = '$' + Math.round(totalCost).toLocaleString();
    estLeadTime.textContent = leadDays + ' Business Days';
  }

  rfqMaterial?.addEventListener('change', calculateEstimate);
  rfqTolerance?.addEventListener('change', calculateEstimate);
  rfqQty?.addEventListener('input', calculateEstimate);
  chkAnodize?.addEventListener('change', calculateEstimate);
  chkCmm?.addEventListener('change', calculateEstimate);
  chkHip?.addEventListener('change', calculateEstimate);

  // Toast Functionality
  function triggerIndToast(msg) {
    const hub = document.getElementById('toastHub');
    if (!hub) return;
    const toast = document.createElement('div');
    toast.className = 'ind-toast';
    toast.textContent = '⚙ ' + msg;
    hub.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Modal Fast RFQ
  const rfqModal = document.getElementById('rfqModal');
  const openRfqBtns = [
    document.getElementById('openRfqModalBtn'),
    document.getElementById('heroRfqBtn'),
    document.getElementById('drawerRfqBtn'),
    document.getElementById('btnRequestOfficialQuote')
  ];
  const closeRfqModal = document.getElementById('closeRfqModal');

  openRfqBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      rfqModal?.classList.add('open');
      drawer?.classList.remove('open');
    });
  });

  closeRfqModal?.addEventListener('click', () => rfqModal?.classList.remove('open'));
  window.addEventListener('click', (e) => {
    if (e.target === rfqModal) rfqModal?.classList.remove('open');
  });

  const modalForm = document.getElementById('modalRfqForm');
  modalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    rfqModal?.classList.remove('open');
    triggerIndToast('Part package routed to Manufacturing Engineering team.');
    modalForm.reset();
  });

  // Main RFQ Form Submission & Validation
  const mainRfqForm = document.getElementById('indRfqForm');
  mainRfqForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('engName');
    const email = document.getElementById('engEmail');
    const company = document.getElementById('companyName');

    if (!name.value.trim()) {
      name.closest('.ind-group').classList.add('has-error');
      valid = false;
    } else {
      name.closest('.ind-group').classList.remove('has-error');
    }

    const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      email.closest('.ind-group').classList.add('has-error');
      valid = false;
    } else {
      email.closest('.ind-group').classList.remove('has-error');
    }

    if (!company.value.trim()) {
      company.closest('.ind-group').classList.add('has-error');
      valid = false;
    } else {
      company.closest('.ind-group').classList.remove('has-error');
    }

    if (valid) {
      triggerIndToast('CAD Data & RFQ received. Preliminary DFM report dispatching within 4 hours.');
      mainRfqForm.reset();
    }
  });
});`
  };
}

function generateSaaSSite(customPrompt = '') {
  return {
    name: 'OmniFlow AI',
    category: 'saas',
    tagline: 'Autonomous AI Orchestration for Modern Enterprise Data Pipelines',
    seo: {
      title: 'OmniFlow AI | Autonomous Data Pipeline Orchestration Platform',
      description: 'Supercharge your engineering throughput with intelligent streaming ETL, self-healing pipeline models, and zero-latency vector indexing.',
      keywords: ['data orchestration', 'ai pipeline', 'etl automation', 'vector database', 'streaming data'],
      schemaType: 'SoftwareApplication'
    },
    html: `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniFlow AI | Autonomous Enterprise Data Pipeline Orchestration</title>
  <meta name="description" content="Supercharge your engineering throughput with intelligent streaming ETL, self-healing pipeline models, and zero-latency vector indexing.">
  <meta name="keywords" content="AI pipeline, streaming ETL, Kafka connector, autonomous database, vector indexing">
  <meta property="og:title" content="OmniFlow AI | Autonomous Pipeline Orchestration">
  <meta property="og:description" content="Stop debugging broken DAGs. Let autonomous AI models self-heal schema drifts and stream real-time embeddings.">
  <meta property="og:image" content="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "OmniFlow AI",
    "operatingSystem": "Cloud-Native / Kubernetes / AWS / GCP / Azure",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "49.00",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>
<body>
  <!-- Top Banner -->
  <div class="saas-banner">
    <span>🚀 OmniFlow 3.0 launched with instant Apache Iceberg & Snowflake Vector sync.</span>
    <a href="#pricing" class="banner-link">See benchmark results &rarr;</a>
  </div>

  <!-- Header -->
  <header class="saas-header" id="header">
    <div class="saas-nav-container">
      <a href="#" class="saas-brand">
        <span class="saas-brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </span>
        <span class="saas-brand-text">Omni<strong>Flow</strong></span>
      </a>

      <nav class="saas-nav" id="saasNav">
        <a href="#features" class="saas-nav-link">Product</a>
        <a href="#integrations" class="saas-nav-link">Connectors</a>
        <a href="#pricing" class="saas-nav-link">Pricing</a>
        <a href="#faq" class="saas-nav-link">Docs</a>
      </nav>

      <div class="saas-nav-actions">
        <button id="themeToggleBtn" class="saas-icon-btn" aria-label="Toggle theme">
          <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="saas-btn saas-btn-outline" id="loginModalBtn">Sign In</button>
        <button class="saas-btn saas-btn-primary" id="getStartedBtn">Start Free 14-Day Trial</button>
        <button class="saas-hamburger" id="mobileMenuToggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer -->
  <div class="saas-drawer" id="mobileDrawer">
    <div class="saas-drawer-top">
      <span class="saas-brand-text">Omni<strong>Flow</strong></span>
      <button class="saas-drawer-close" id="closeDrawerBtn">&times;</button>
    </div>
    <div class="saas-drawer-links">
      <a href="#features" class="drawer-a">Product</a>
      <a href="#integrations" class="drawer-a">Connectors</a>
      <a href="#pricing" class="drawer-a">Pricing</a>
      <a href="#faq" class="drawer-a">Documentation</a>
      <button class="saas-btn saas-btn-primary saas-btn-block" id="drawerTrialBtn">Start Free Trial</button>
    </div>
  </div>

  <main>
    <!-- SaaS Hero Section -->
    <section class="saas-hero">
      <div class="saas-glow-bg"></div>
      <div class="saas-container">
        <div class="hero-center">
          <div class="saas-pill">
            <span class="sparkle">⚡</span>
            <span>Eliminate 80% of Data Engineering Maintenance</span>
          </div>
          <h1 class="saas-h1">The Autonomous Data Engine for the Generative AI Era</h1>
          <p class="saas-sub">
            Continuous streaming ETL, automatic schema-drift resolution, and instant vectorization. Ingest petabytes from PostgreSQL, Kafka, and S3 without ever writing boilerplate glue code again.
          </p>

          <div class="hero-actions">
            <button class="saas-btn saas-btn-primary saas-btn-lg" id="heroTrialBtn">
              Deploy in 5 Minutes &rarr;
            </button>
            <button class="saas-btn saas-btn-glass saas-btn-lg" id="heroDemoBtn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              Watch 2-Min Live Sandbox
            </button>
          </div>

          <p class="credit-card-note">No credit card required • 50GB monthly free compute • SOC-2 Type II Certified</p>

          <!-- Interactive Code / Terminal Showcase -->
          <div class="hero-showcase">
            <div class="showcase-header">
              <div class="mac-dots">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <div class="tab-list">
                <button class="tab-item active" data-tab="stream">omniflow.stream()</button>
                <button class="tab-item" data-tab="schema">drift_guard.py</button>
                <button class="tab-item" data-tab="vector">vector_sync.sql</button>
              </div>
              <span class="runtime-badge">Active Engine: v3.2-node</span>
            </div>
            <div class="showcase-code">
              <pre id="codeDisplay"><code><span class="c-keyword">import</span> omniflow <span class="c-keyword">as</span> of

<span class="c-comment"># Declare autonomous streaming pipeline with self-healing schema</span>
pipeline = of.Pipeline(
    source=of.PostgresCDC(host=<span class="c-str">"db.internal.corp"</span>, slot=<span class="c-str">"production_cdc"</span>),
    sink=of.SnowflakeVector(warehouse=<span class="c-str">"ANALYTICS_WH"</span>, embeddings=<span class="c-str">"text-embedding-3-large"</span>),
    drift_policy=of.Policy.AUTONOMOUS_RESOLVE,
    latency_target_ms=<span class="c-num">85</span>
)

<span class="c-comment"># Engine streams 120k events/sec with zero memory leaks</span>
pipeline.start_autonomous_stream()</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trusted By Logos -->
    <section class="saas-logos">
      <div class="saas-container">
        <p class="logos-caption">MISSION-CRITICAL INFRASTRUCTURE AT SCALE-UPS & FORTUNE 500S</p>
        <div class="logo-strip">
          <span class="logo-item">STRIPE<small>FLOW</small></span>
          <span class="logo-item">DATABRICKS</span>
          <span class="logo-item">COINBASE</span>
          <span class="logo-item">VERCEL</span>
          <span class="logo-item">SCALE.AI</span>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="saas-section" id="features">
      <div class="saas-container">
        <div class="saas-sec-header">
          <span class="saas-tag">High Throughput Architecture</span>
          <h2 class="saas-sec-title">Engineered to Replace Brittle Airflow DAGs</h2>
          <p class="saas-sec-sub">Build reliable, real-time data pipelines in hours instead of quarters.</p>
        </div>

        <div class="saas-features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 class="feature-title">Self-Healing Schema Drift</h3>
            <p class="feature-desc">When upstream database columns change, OmniFlow’s local LLM parser infers new types, generates migrations, and backfills downstream consumers without pipeline failure.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 class="feature-title">Sub-100ms Vectorization</h3>
            <p class="feature-desc">Directly vectorize incoming unstructured customer conversations, tickets, and document streams directly into Pinecone, Qdrant, or pgvector at wire speed.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3 class="feature-title">Native Kubernetes Operator</h3>
            <p class="feature-desc">Deploy in your VPC via single-command Helm charts. Retain complete cryptographic custody over all production database credentials and proprietary data.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Pricing Calculator -->
    <section class="saas-section saas-section-alt" id="pricing">
      <div class="saas-container">
        <div class="saas-sec-header">
          <span class="saas-tag">Transparent Value</span>
          <h2 class="saas-sec-title">Predictable Pricing with Interactive ROI</h2>
          <p class="saas-sec-sub">Switch between monthly and annual billing to unlock 20% savings.</p>
        </div>

        <div class="billing-toggle-wrapper">
          <span class="billing-label" id="monthlyLabel">Monthly Billing</span>
          <button class="billing-switch" id="billingSwitch" role="switch" aria-checked="false">
            <span class="switch-knob"></span>
          </button>
          <span class="billing-label" id="annualLabel">Annual Billing <span class="discount-tag">Save 20%</span></span>
        </div>

        <div class="pricing-cards-grid">
          <!-- Developer Tier -->
          <div class="price-card">
            <div class="card-tier">Developer</div>
            <p class="tier-desc">For small teams and experimental AI pipelines.</p>
            <div class="price-val">
              <span class="currency">$</span>
              <span class="amount" id="priceDev">0</span>
              <span class="period">/ month</span>
            </div>
            <ul class="tier-perks">
              <li>Up to 2 concurrent pipelines</li>
              <li>10 million events / month</li>
              <li>Community Slack support</li>
              <li>Standard 5-minute CDC polling</li>
            </ul>
            <button class="saas-btn saas-btn-outline saas-btn-block" id="btnDevTier">Get Started Free</button>
          </div>

          <!-- Growth Tier -->
          <div class="price-card popular">
            <div class="popular-ribbon">Most Popular</div>
            <div class="card-tier">Scale Growth</div>
            <p class="tier-desc">For growing startups with high-volume real-time sync.</p>
            <div class="price-val">
              <span class="currency">$</span>
              <span class="amount" id="priceGrowth">99</span>
              <span class="period">/ month</span>
            </div>
            <ul class="tier-perks">
              <li>Unlimited active pipelines</li>
              <li>250 million events / month</li>
              <li>Sub-second real-time streaming</li>
              <li>Autonomous Schema Drift healing</li>
              <li>99.9% uptime SLA</li>
            </ul>
            <button class="saas-btn saas-btn-primary saas-btn-block" id="btnGrowthTier">Start 14-Day Free Trial</button>
          </div>

          <!-- Enterprise Tier -->
          <div class="price-card">
            <div class="card-tier">Enterprise Cloud</div>
            <p class="tier-desc">For large organizations requiring VPC deployment & compliance.</p>
            <div class="price-val">
              <span class="currency">$</span>
              <span class="amount" id="priceEnt">399</span>
              <span class="period">/ month</span>
            </div>
            <ul class="tier-perks">
              <li>Self-hosted in your AWS / GCP / Azure</li>
              <li>Unlimited events & vector transformations</li>
              <li>SOC-2 Type II, HIPAA & GDPR compliance</li>
              <li>Dedicated 24/7 Solutions Engineer</li>
            </ul>
            <button class="saas-btn saas-btn-outline saas-btn-block" id="btnEntTier">Talk to Solutions Architect</button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section class="saas-section" id="faq">
      <div class="saas-container max-w-narrow">
        <div class="saas-sec-header">
          <span class="saas-tag">Knowledge Base</span>
          <h2 class="saas-sec-title">Frequently Asked Questions</h2>
        </div>

        <div class="saas-accordion">
          <div class="saas-acc-item">
            <button class="saas-acc-trigger">
              <span>How does OmniFlow resolve schema drift automatically?</span>
              <span class="acc-arrow">+</span>
            </button>
            <div class="saas-acc-panel">
              <p>When an incoming database column changes or a new field is added, OmniFlow's AST engine creates an isolated branch, verifies type compatibility, automatically provisions the new schema in your target warehouse, and resumes streaming without backpressure.</p>
            </div>
          </div>

          <div class="saas-acc-item">
            <button class="saas-acc-trigger">
              <span>Can we run OmniFlow entirely inside our private AWS VPC?</span>
              <span class="acc-arrow">+</span>
            </button>
            <div class="saas-acc-panel">
              <p>Yes. We offer an official Helm chart and Terraform module that deploys OmniFlow as a stateless daemon set on your own Kubernetes cluster, ensuring that zero customer data ever exits your security perimeter.</p>
            </div>
          </div>

          <div class="saas-acc-item">
            <button class="saas-acc-trigger">
              <span>What connectors are natively supported?</span>
              <span class="acc-arrow">+</span>
            </button>
            <div class="saas-acc-panel">
              <p>Over 120 pre-built connectors including PostgreSQL CDC (Debezium), MySQL, MongoDB, Apache Kafka, Snowflake, BigQuery, ClickHouse, Apache Iceberg, Pinecone, and AWS S3.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sign Up CTA -->
    <section class="saas-section saas-section-cta">
      <div class="saas-container max-w-narrow">
        <div class="saas-cta-card">
          <h2>Ready to Unify Your Streaming Data Stack?</h2>
          <p>Join thousands of engineers building resilient, self-healing pipelines in minutes.</p>
          <form id="saasLeadForm" class="lead-form" novalidate>
            <div class="lead-input-wrap">
              <input type="email" id="leadEmail" placeholder="Enter your work email" required class="lead-input">
              <button type="submit" class="saas-btn saas-btn-primary" id="leadSubmitBtn">Get Instant Access</button>
            </div>
            <span class="lead-err" id="leadErr">Please enter a valid company email</span>
          </form>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="saas-footer">
    <div class="saas-container footer-flex">
      <div class="f-info">
        <span class="saas-brand-text">Omni<strong>Flow</strong></span>
        <p>The autonomous streaming orchestration layer for high-throughput enterprise AI.</p>
      </div>
      <div class="f-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">Security</a>
        <a href="#">Status</a>
      </div>
    </div>
    <div class="saas-container footer-copy">
      <p>© 2026 OmniFlow Technologies Inc. All rights reserved.</p>
    </div>
  </footer>

  <!-- Sign In Modal -->
  <div class="saas-modal-backdrop" id="authModal">
    <div class="saas-modal-box">
      <div class="modal-top">
        <h3>Sign In to OmniFlow Cloud</h3>
        <button class="modal-x" id="closeAuthModal">&times;</button>
      </div>
      <form id="signInForm">
        <div class="input-field">
          <label>Work Email</label>
          <input type="email" class="saas-input" id="authEmail" placeholder="you@company.com" required>
        </div>
        <div class="input-field">
          <label>Password</label>
          <input type="password" class="saas-input" id="authPass" placeholder="••••••••••••" required>
        </div>
        <button type="submit" class="saas-btn saas-btn-primary saas-btn-block">Sign In</button>
      </form>
    </div>
  </div>

  <div class="saas-toast-box" id="toastBox"></div>

  <script src="script.js"></script>
</body>
</html>`,
    css: `/* OmniFlow AI - Conversion-Focused SaaS Landing Page Styling */
:root {
  --saas-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --saas-mono: 'JetBrains Mono', monospace;
  
  --bg-dark: #07090e;
  --surface-card: #0e121b;
  --surface-card-hover: #141b27;
  --surface-alt: #121824;
  --border-line: #1e293b;
  
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --primary-glow: rgba(99, 102, 241, 0.35);
  
  --accent-cyan: #06b6d4;
  --text-white: #ffffff;
  --text-dim: #94a3b8;
  
  --radius-pill: 9999px;
  --radius-card: 16px;
  --radius-input: 8px;
  
  --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] {
  --bg-dark: #f8fafc;
  --surface-card: #ffffff;
  --surface-card-hover: #f1f5f9;
  --surface-alt: #f1f5f9;
  --border-line: #e2e8f0;
  
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --primary-glow: rgba(79, 70, 229, 0.2);
  
  --accent-cyan: #0891b2;
  --text-white: #0f172a;
  --text-dim: #64748b;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--saas-font);
  background-color: var(--bg-dark);
  color: var(--text-white);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.saas-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.max-w-narrow {
  max-width: 820px;
}

/* Banner */
.saas-banner {
  background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%);
  color: #ffffff;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
}

.banner-link {
  color: #ffffff;
  text-decoration: underline;
  margin-left: 0.5rem;
}

/* Header */
.saas-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(7, 9, 14, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-line);
}

[data-theme="light"] .saas-header {
  background: rgba(248, 250, 252, 0.85);
}

.saas-nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.saas-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text-white);
}

.saas-brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.saas-brand-text {
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.saas-brand-text strong {
  color: var(--primary-color);
}

.saas-nav {
  display: flex;
  gap: 2rem;
}

.saas-nav-link {
  color: var(--text-dim);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: var(--transition);
}

.saas-nav-link:hover {
  color: var(--primary-color);
}

.saas-nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.saas-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
  text-decoration: none;
}

.saas-btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, #06b6d4 100%);
  color: #ffffff;
  box-shadow: 0 4px 18px var(--primary-glow);
}

.saas-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--primary-glow);
}

.saas-btn-outline {
  background: transparent;
  border-color: var(--border-line);
  color: var(--text-white);
}

.saas-btn-outline:hover {
  border-color: var(--primary-color);
  background: var(--surface-card);
}

.saas-btn-glass {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-line);
  color: var(--text-white);
}

.saas-btn-glass:hover {
  background: rgba(255, 255, 255, 0.15);
}

.saas-btn-lg {
  padding: 0.85rem 1.85rem;
  font-size: 1rem;
}

.saas-btn-block {
  width: 100%;
}

.saas-icon-btn {
  background: transparent;
  border: 1px solid var(--border-line);
  color: var(--text-white);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

[data-theme="dark"] .moon-icon { display: none; }
[data-theme="dark"] .sun-icon { display: block; }
[data-theme="light"] .moon-icon { display: block; }
[data-theme="light"] .sun-icon { display: none; }

.saas-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
}

.saas-hamburger span {
  width: 24px;
  height: 2px;
  background: var(--text-white);
}

/* Drawer */
.saas-drawer {
  position: fixed;
  top: 0;
  right: -100%;
  width: 300px;
  height: 100vh;
  background: var(--surface-card);
  box-shadow: 0 0 40px rgba(0,0,0,0.5);
  z-index: 1000;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
}

.saas-drawer.open {
  right: 0;
}

.saas-drawer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.saas-drawer-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-white);
  cursor: pointer;
}

.saas-drawer-links {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.drawer-a {
  color: var(--text-white);
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Hero */
.saas-hero {
  position: relative;
  padding: 5rem 0 4rem;
  overflow: hidden;
}

.saas-glow-bg {
  position: absolute;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
  pointer-events: none;
}

.hero-center {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.saas-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  padding: 0.4rem 1.1rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.75rem;
}

.saas-h1 {
  font-size: clamp(2.5rem, 5vw, 4.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1.5rem;
}

.saas-sub {
  font-size: 1.2rem;
  color: var(--text-dim);
  line-height: 1.7;
  max-width: 720px;
  margin: 0 auto 2.5rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.credit-card-note {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-bottom: 3.5rem;
}

/* Terminal Showcase */
.hero-showcase {
  background: #0b0f17;
  border: 1px solid var(--border-line);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6);
  text-align: left;
}

.showcase-header {
  background: #080c14;
  border-bottom: 1px solid var(--border-line);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mac-dots {
  display: flex;
  gap: 6px;
}

.mac-dots .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.tab-list {
  display: flex;
  gap: 0.5rem;
}

.tab-item {
  background: none;
  border: none;
  font-family: var(--saas-mono);
  font-size: 0.8rem;
  color: var(--text-dim);
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.tab-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-white);
}

.runtime-badge {
  font-family: var(--saas-mono);
  font-size: 0.75rem;
  color: var(--accent-cyan);
}

.showcase-code {
  padding: 1.75rem;
  overflow-x: auto;
}

.showcase-code pre {
  font-family: var(--saas-mono);
  font-size: 0.95rem;
  line-height: 1.7;
}

.c-keyword { color: #f43f5e; font-weight: bold; }
.c-str { color: #34d399; }
.c-comment { color: #64748b; font-style: italic; }
.c-num { color: #38bdf8; }

/* Logos */
.saas-logos {
  padding: 3rem 0;
  border-top: 1px solid var(--border-line);
  border-bottom: 1px solid var(--border-line);
  text-align: center;
}

.logos-caption {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  margin-bottom: 1.5rem;
}

.logo-strip {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3.5rem;
  flex-wrap: wrap;
}

.logo-item {
  font-weight: 800;
  letter-spacing: 0.08em;
  font-size: 1.1rem;
  color: var(--text-dim);
  opacity: 0.7;
}

.logo-item small {
  color: var(--primary-color);
}

/* Features */
.saas-section {
  padding: 6rem 0;
}

.saas-section-alt {
  background: var(--surface-alt);
}

.saas-sec-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.5rem;
}

.saas-tag {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.saas-sec-title {
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.saas-sec-sub {
  color: var(--text-dim);
  font-size: 1.1rem;
}

.saas-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--surface-card);
  border: 1px solid var(--border-line);
  border-radius: var(--radius-card);
  padding: 2.5rem;
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-color);
  box-shadow: 0 12px 30px rgba(0,0,0,0.3);
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-desc {
  color: var(--text-dim);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Pricing */
.billing-toggle-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3.5rem;
}

.billing-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-dim);
}

.billing-switch {
  width: 52px;
  height: 28px;
  background: var(--border-line);
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  position: relative;
  transition: var(--transition);
}

.billing-switch[aria-checked="true"] {
  background: var(--primary-color);
}

.switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.billing-switch[aria-checked="true"] .switch-knob {
  transform: translateX(24px);
}

.discount-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  margin-left: 0.3rem;
}

.pricing-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  align-items: stretch;
}

.price-card {
  background: var(--surface-card);
  border: 1px solid var(--border-line);
  border-radius: var(--radius-card);
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: var(--transition);
}

.price-card.popular {
  border-color: var(--primary-color);
  box-shadow: 0 0 35px var(--primary-glow);
}

.popular-ribbon {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-color);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.85rem;
  border-radius: var(--radius-pill);
}

.card-tier {
  font-size: 1.35rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.tier-desc {
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-bottom: 2rem;
  min-height: 42px;
}

.price-val {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 2rem;
}

.currency {
  font-size: 1.5rem;
  font-weight: 700;
}

.amount {
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1;
}

.period {
  color: var(--text-dim);
  font-size: 0.9rem;
}

.tier-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  flex-grow: 1;
  font-size: 0.9rem;
}

.tier-perks li::before {
  content: "✓ ";
  color: var(--accent-cyan);
  font-weight: bold;
}

/* Accordion */
.saas-accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.saas-acc-item {
  border: 1px solid var(--border-line);
  border-radius: 12px;
  background: var(--surface-card);
  overflow: hidden;
}

.saas-acc-trigger {
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-white);
  text-align: left;
}

.acc-arrow {
  font-size: 1.4rem;
  color: var(--primary-color);
  transition: transform 0.25s ease;
}

.saas-acc-item.active .acc-arrow {
  transform: rotate(45deg);
}

.saas-acc-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 0 1.5rem;
  color: var(--text-dim);
}

.saas-acc-item.active .saas-acc-panel {
  padding-bottom: 1.25rem;
}

/* CTA */
.saas-section-cta {
  background: linear-gradient(180deg, var(--bg-dark) 0%, #0c111e 100%);
}

.saas-cta-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%);
  border: 1px solid var(--border-line);
  border-radius: var(--radius-card);
  padding: 4rem 2rem;
  text-align: center;
}

.saas-cta-card h2 {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.saas-cta-card p {
  color: var(--text-dim);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.lead-form {
  max-width: 500px;
  margin: 0 auto;
}

.lead-input-wrap {
  display: flex;
  gap: 0.5rem;
}

.lead-input {
  flex: 1;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-line);
  background: var(--surface-card);
  color: var(--text-white);
  font-family: inherit;
  font-size: 0.95rem;
}

.lead-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.lead-err {
  display: none;
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.5rem;
  text-align: left;
}

.lead-form.has-error .lead-err {
  display: block;
}

/* Footer */
.saas-footer {
  border-top: 1px solid var(--border-line);
  padding: 4rem 0 2rem;
}

.footer-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.f-info p {
  color: var(--text-dim);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  max-width: 320px;
}

.f-links {
  display: flex;
  gap: 1.5rem;
}

.f-links a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 0.9rem;
}

.f-links a:hover {
  color: var(--primary-color);
}

.footer-copy {
  border-top: 1px solid var(--border-line);
  padding-top: 2rem;
  font-size: 0.85rem;
  color: var(--text-dim);
}

/* Modal */
.saas-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.saas-modal-backdrop.open {
  display: flex;
}

.saas-modal-box {
  background: var(--surface-card);
  border: 1px solid var(--border-line);
  border-radius: var(--radius-card);
  max-width: 440px;
  width: 100%;
  padding: 2.5rem;
}

.modal-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-x {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.8rem;
  cursor: pointer;
}

.input-field {
  margin-bottom: 1.25rem;
}

.input-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.saas-input {
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-line);
  color: var(--text-white);
  border-radius: var(--radius-input);
  font-family: inherit;
}

.saas-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Toast */
.saas-toast-box {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.saas-toast {
  background: var(--surface-card);
  border: 1px solid var(--primary-color);
  color: var(--text-white);
  padding: 0.9rem 1.4rem;
  border-radius: var(--radius-input);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .saas-nav { display: none; }
  .saas-hamburger { display: flex; }
  .lead-input-wrap { flex-direction: column; }
  .saas-btn-block { width: 100%; }
}
`,
    js: `// OmniFlow AI - Interactive Terminal & Pricing Engine
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('saasTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', storedTheme);

  themeToggle?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('saasTheme', next);
  });

  // Mobile Drawer
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const closeDrawer = document.getElementById('closeDrawerBtn');

  mobileToggle?.addEventListener('click', () => drawer?.classList.add('open'));
  closeDrawer?.addEventListener('click', () => drawer?.classList.remove('open'));
  document.querySelectorAll('.drawer-a').forEach(link => {
    link.addEventListener('click', () => drawer?.classList.remove('open'));
  });

  // Code Tab Switcher
  const tabs = document.querySelectorAll('.tab-item');
  const codeDisplay = document.getElementById('codeDisplay');

  const codeSnippets = {
    stream: \`<span class="c-keyword">import</span> omniflow <span class="c-keyword">as</span> of

<span class="c-comment"># Declare autonomous streaming pipeline with self-healing schema</span>
pipeline = of.Pipeline(
    source=of.PostgresCDC(host=<span class="c-str">"db.internal.corp"</span>, slot=<span class="c-str">"production_cdc"</span>),
    sink=of.SnowflakeVector(warehouse=<span class="c-str">"ANALYTICS_WH"</span>, embeddings=<span class="c-str">"text-embedding-3-large"</span>),
    drift_policy=of.Policy.AUTONOMOUS_RESOLVE,
    latency_target_ms=<span class="c-num">85</span>
)

<span class="c-comment"># Engine streams 120k events/sec with zero memory leaks</span>
pipeline.start_autonomous_stream()\`,

    schema: \`<span class="c-comment"># drift_guard.py - Automated AST validation on incoming schema diffs</span>
<span class="c-keyword">def</span> <span class="c-num">handle_schema_drift</span>(event_payload):
    diff = of.detect_type_variance(event_payload)
    <span class="c-keyword">if</span> diff.has_new_column:
        migration = of.generate_ddl(diff, target=<span class="c-str">"snowflake"</span>)
        migration.apply_instant_shadow_branch()
        <span class="c-keyword">return</span> of.STATUS_HEALED_OK\`,

    vector: \`<span class="c-comment">-- vector_sync.sql - Real-time continuous embedding generation</span>
CREATE CONTINUOUS VECTOR STREAM raw_customer_feedback_idx
AS SELECT
  customer_id,
  timestamp,
  omni_vectorize(feedback_text, model => 'text-embedding-3-large') AS embedding_vector
FROM cdc_support_tickets_stream
WATERMARK FOR timestamp BOUNDED BY INTERVAL '2' SECOND;\`
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-tab');
      if (codeDisplay && codeSnippets[key]) {
        codeDisplay.innerHTML = codeSnippets[key];
      }
    });
  });

  // Billing Toggle (Monthly vs Annual -20%)
  const billingSwitch = document.getElementById('billingSwitch');
  const priceDev = document.getElementById('priceDev');
  const priceGrowth = document.getElementById('priceGrowth');
  const priceEnt = document.getElementById('priceEnt');
  let isAnnual = false;

  billingSwitch?.addEventListener('click', () => {
    isAnnual = !isAnnual;
    billingSwitch.setAttribute('aria-checked', String(isAnnual));

    if (isAnnual) {
      if (priceGrowth) priceGrowth.textContent = '79';
      if (priceEnt) priceEnt.textContent = '319';
    } else {
      if (priceGrowth) priceGrowth.textContent = '99';
      if (priceEnt) priceEnt.textContent = '399';
    }
  });

  // FAQ Accordions
  const accItems = document.querySelectorAll('.saas-acc-item');
  accItems.forEach(item => {
    const trigger = item.querySelector('.saas-acc-trigger');
    const panel = item.querySelector('.saas-acc-panel');

    trigger?.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      accItems.forEach(i => {
        i.classList.remove('active');
        const p = i.querySelector('.saas-acc-panel');
        if (p) p.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        if (panel) panel.style.maxHeight = panel.scrollHeight + 20 + 'px';
      }
    });
  });

  // Toast Functionality
  function triggerSaasToast(msg) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const toast = document.createElement('div');
    toast.className = 'saas-toast';
    toast.textContent = '⚡ ' + msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Auth Modal
  const authModal = document.getElementById('authModal');
  const openAuthBtns = [
    document.getElementById('loginModalBtn'),
    document.getElementById('getStartedBtn'),
    document.getElementById('heroTrialBtn'),
    document.getElementById('drawerTrialBtn'),
    document.getElementById('btnDevTier'),
    document.getElementById('btnGrowthTier'),
    document.getElementById('btnEntTier')
  ];
  const closeAuthModal = document.getElementById('closeAuthModal');

  openAuthBtns.forEach(btn => {
    btn?.addEventListener('click', () => authModal?.classList.add('open'));
  });

  closeAuthModal?.addEventListener('click', () => authModal?.classList.remove('open'));
  window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal?.classList.remove('open');
  });

  const signInForm = document.getElementById('signInForm');
  signInForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    authModal?.classList.remove('open');
    triggerSaasToast('Welcome back! Initializing workspace session.');
    signInForm.reset();
  });

  // Demo Video Simulation
  const heroDemoBtn = document.getElementById('heroDemoBtn');
  heroDemoBtn?.addEventListener('click', () => {
    triggerSaasToast('Live interactive sandbox spinning up on Kubernetes...');
  });

  // Lead Capture Form
  const leadForm = document.getElementById('saasLeadForm');
  leadForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('leadEmail');
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    if (!emailRegex.test(emailInput.value.trim())) {
      leadForm.classList.add('has-error');
    } else {
      leadForm.classList.remove('has-error');
      triggerSaasToast('Instant sandbox credentials dispatched to ' + emailInput.value);
      leadForm.reset();
    }
  });
});`
  };
}

const { generateEcommerceSite } = require('./ecommerceGenerator');
const { generateUniversalBespokeSite } = require('./universalSynthesizer');

// Fallback intelligent synthesizer for arbitrary prompts
function generateDynamicSite(prompt = '', category = 'general', blueprint = null) {
  const cleanPrompt = (prompt || 'Modern Digital Experience').toLowerCase();
  
  // Specific footwear only if explicitly shoes or sneakers
  if (cleanPrompt.includes('shoe') || cleanPrompt.includes('sneaker') || cleanPrompt.includes('footwear')) {
    return generateEcommerceSite(prompt, blueprint);
  }
  
  // Specific aerospace/manufacturing only if explicitly CNC/metallurgy
  if (cleanPrompt.includes('cnc') || cleanPrompt.includes('metallurgy') || cleanPrompt.includes('aerospace precision')) {
    return generateIndustrialSite(prompt);
  }

  // Universal bespoke synthesis for ALL other categories (fish, pets, cafe, fitness, real estate, custom prompts)
  return generateUniversalBespokeSite(prompt, category, blueprint);
}

module.exports = {
  generateHealthcareSite,
  generateIndustrialSite,
  generateSaaSSite,
  generateEcommerceSite,
  generateUniversalBespokeSite,
  generateDynamicSite
};
