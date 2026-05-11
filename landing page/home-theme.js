document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const navPill = document.querySelector('.nav-pill');
  const menuButton = document.querySelector('.menu-pill');
  const themeButton = document.querySelector('.theme-pill');
  const menuPanel = document.querySelector('.menu-panel');
  const menuItems = document.querySelectorAll('.menu-item');
  const percentPill = document.querySelector('.percent-pill');
  const faqButtons = document.querySelectorAll('.faq-q');
  const demoButton = document.querySelector('.demo-submit');
  const demoResult = document.getElementById('demoResult');
  const sectionIds = ['home', 'how', 'features', 'faq'];
  let lastPercent = -1;

  function setTheme(mode) {
    const isDark = mode === 'dark';
    body.classList.toggle('dark', isDark);
    if (themeButton) {
      themeButton.textContent = isDark ? '☾' : '☀';
      themeButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }
    localStorage.setItem('empowerme-theme', mode);
  }

  function toggleTheme() {
    setTheme(body.classList.contains('dark') ? 'light' : 'dark');
  }

  function animatePercent() {
    if (!percentPill) return;
    percentPill.classList.remove('animate');
    void percentPill.offsetWidth;
    percentPill.classList.add('animate');
  }

  function updateScrollPercent() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percent = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
    if (percentPill && percent !== lastPercent) {
      percentPill.textContent = `${percent}%`;
      animatePercent();
      lastPercent = percent;
    }
  }

  function closeMenu() {
    if (!navPill) return;
    navPill.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuPanel?.setAttribute('aria-hidden', 'true');
  }

  function openMenu() {
    if (!navPill) return;
    navPill.classList.add('menu-open');
    menuButton?.setAttribute('aria-expanded', 'true');
    menuPanel?.setAttribute('aria-hidden', 'false');
  }

  function toggleMenu() {
    if (!navPill) return;
    navPill.classList.contains('menu-open') ? closeMenu() : openMenu();
  }

  function scrollToSection(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleFaqToggle(button) {
    const item = button.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((openItem) => openItem.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }

  function showDemoResult() {
    if (!demoResult) return;
    demoResult.classList.remove('hidden');
    demoResult.style.opacity = '0';
    demoResult.style.transform = 'translateY(10px)';
    demoResult.style.transition = 'opacity .4s ease, transform .4s ease';
    requestAnimationFrame(() => {
      demoResult.style.opacity = '1';
      demoResult.style.transform = 'translateY(0)';
    });
  }

  function initTheme() {
    const storedTheme = localStorage.getItem('empowerme-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }

  function initRevealObserver() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach((reveal) => observer.observe(reveal));
  }

  function initHowSteps() {
    document.querySelectorAll('.how-step').forEach((step, index) => {
      step.style.opacity = '0';
      step.style.transform = 'translateX(-20px)';
      step.style.transition = `opacity .6s ${index * 0.12}s ease, transform .6s ${index * 0.12}s ease`;
      const stepObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          step.style.opacity = '1';
          step.style.transform = 'translateX(0)';
          stepObserver.unobserve(step);
        }
      }, { threshold: 0.15 });
      stepObserver.observe(step);
    });
  }

  themeButton?.addEventListener('click', toggleTheme);
  menuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      if (sectionIds.includes(targetId)) {
        scrollToSection(targetId);
      }
      closeMenu();
    });
  });

  faqButtons.forEach((button) => {
    button.addEventListener('click', () => handleFaqToggle(button));
  });

  demoButton?.addEventListener('click', showDemoResult);

  document.addEventListener('click', (event) => {
    if (!navPill?.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  window.addEventListener('scroll', () => {
    updateScrollPercent();
    closeMenu();
    navPill?.classList.toggle('scrolled', window.scrollY > 30);
  });

  initTheme();
  updateScrollPercent();
  initRevealObserver();
  initHowSteps();
});
