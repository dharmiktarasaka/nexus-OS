/**
 * SYS by Tarasaka • Landing Page Interactive Engine
 * Zero external dependencies • 100% Lightweight & Lightning Fast
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCountdownTimer();
  initMockupTabs();
  initCalculator();
  initFaqAccordion();
  initModal();
  initMobileNav();
  initLiveTicker();
});

/* ==============================================================================
   1. Theme Toggle (Dark / Light) with LocalStorage Persistence
   ============================================================================== */
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  if (!toggleBtn) return;

  // Default to dark theme as planned for high-tech aesthetic
  const savedTheme = localStorage.getItem('sys_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sys_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === 'light') {
      themeIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`; // Moon icon
    } else {
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      `; // Sun icon
    }
  }
}

/* ==============================================================================
   2. Interactive Product Mockup Tab Switcher
   ============================================================================== */
function initMockupTabs() {
  const tabButtons = document.querySelectorAll('.mockup-tab-btn');
  const tabPanels = document.querySelectorAll('.mockup-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* ==============================================================================
   3. Interactive ROI & Hours Saved Calculator
   ============================================================================== */
function initCalculator() {
  const teamSlider = document.getElementById('teamSizeSlider');
  const toolsSlider = document.getElementById('toolsCountSlider');
  const teamVal = document.getElementById('teamSizeVal');
  const toolsVal = document.getElementById('toolsCountVal');
  
  const dollarsSavedElem = document.getElementById('dollarsSavedVal');
  const hoursSavedElem = document.getElementById('hoursSavedVal');

  if (!teamSlider || !toolsSlider) return;

  function recalculate() {
    const team = parseInt(teamSlider.value, 10);
    const tools = parseInt(toolsSlider.value, 10);

    teamVal.textContent = team + (team === 50 ? '+ employees' : ' members');
    toolsVal.textContent = tools + (tools === 12 ? '+ SaaS subscriptions' : ' apps');

    // Formula: average SaaS cost per user ~$35/app/mo + manual work waste
    const avgSaaSCostPerUser = 35;
    const avgHoursWastedPerWeekPerPerson = 4.2;

    const monthlySaaSSavings = team * (tools - 1) * avgSaaSCostPerUser;
    const monthlyHoursSaved = Math.round(team * avgHoursWastedPerWeekPerPerson * 4);

    dollarsSavedElem.textContent = '$' + monthlySaaSSavings.toLocaleString();
    hoursSavedElem.textContent = monthlyHoursSaved.toLocaleString() + ' hrs';
  }

  teamSlider.addEventListener('input', recalculate);
  toolsSlider.addEventListener('input', recalculate);
  recalculate();
}

/* ==============================================================================
   4. AEO-Critical FAQ Accordion (ARIA Accessible & SEO Crawlable)
   ============================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all other accordions for clean UX
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const btn = otherItem.querySelector('.faq-question');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('active');
        questionBtn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==============================================================================
   5. Book a Demo Modal Dialog
   ============================================================================== */
function initModal() {
  const openButtons = document.querySelectorAll('.open-demo-modal');
  const backdrop = document.getElementById('demoModalBackdrop');
  const closeBtn = document.getElementById('closeModalBtn');
  const demoForm = document.getElementById('demoBookingForm');
  const formSuccess = document.getElementById('demoSuccessState');

  if (!backdrop) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) {
      closeModal();
    }
  });

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      demoForm.style.display = 'none';
      if (formSuccess) formSuccess.style.display = 'block';
    });
  }
}

/* ==============================================================================
   6. Mobile Navigation Drawer Toggle
   ============================================================================== */
function initMobileNav() {
  const hamburger = document.getElementById('mobileHamburgerBtn');
  const mobileNav = document.getElementById('mobileNavDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isShown = mobileNav.style.display === 'flex';
    mobileNav.style.display = isShown ? 'none' : 'flex';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.style.display = 'none';
    });
  });
}

/* ==============================================================================
   7. Live Tasks Automated Counter Ticker
   ============================================================================== */
function initLiveTicker() {
  const counter = document.getElementById('liveTaskTicker');
  if (!counter) return;

  let count = 842109;
  counter.textContent = count.toLocaleString();

  setInterval(() => {
    count += Math.floor(Math.random() * 4) + 1;
    counter.textContent = count.toLocaleString();
  }, 2400);
}

/* ==============================================================================
   8. 24-Hour Special Launch Countdown Timer
   ============================================================================== */
function initCountdownTimer() {
  const timerDisplays = document.querySelectorAll('.countdown-timer-display');
  if (!timerDisplays.length) return;

  const storageKey = 'sys_launch_countdown_target';
  let targetTime = parseInt(localStorage.getItem(storageKey), 10);

  // If no stored target or stored target is in the past, seed with 23h 48m 12s from now
  const now = Date.now();
  if (!targetTime || targetTime <= now) {
    targetTime = now + (23 * 3600 + 48 * 60 + 12) * 1000;
    try {
      localStorage.setItem(storageKey, targetTime.toString());
    } catch (e) {
      // LocalStorage might be disabled in private mode
    }
  }

  function renderTimer() {
    const current = Date.now();
    let diff = Math.max(0, targetTime - current);

    // If timer reaches 0, roll over to a 45-minute urgent final grace period
    if (diff <= 0) {
      targetTime = current + 45 * 60 * 1000;
      try {
        localStorage.setItem(storageKey, targetTime.toString());
      } catch (e) {}
      diff = 45 * 60 * 1000;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');

    timerDisplays.forEach(el => {
      el.textContent = formatted;
    });
  }

  renderTimer();
  setInterval(renderTimer, 1000);
}
