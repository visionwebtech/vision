 const navToggle = document.querySelector('.nav-toggle');
const header = document.querySelector('.site-header');
const siteShell = document.querySelector('.site-shell');
const navLinks = document.querySelectorAll('.nav-links a');
const html = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initNavigation() {
  if (!navToggle || !siteShell) return;
  navToggle.addEventListener('click', () => {
    const open = siteShell.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      siteShell.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initHeaderScroll() {
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 18);
  }, { passive: true });
}

function initReveal() {
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in-view'));
  }
}

function initAccordion() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach((item) => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      accordionItems.forEach((accordionItem) => {
        accordionItem.classList.remove('active');
        const button = accordionItem.querySelector('.accordion-trigger');
        if (button) button.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function getDynamicWhatsAppLink() {
  const dynamicLink = document.querySelector('[data-link-type="whatsapp"]');
  if (dynamicLink?.getAttribute('href')) return dynamicLink.getAttribute('href');
  return 'https://wa.me/919546723997';
}

function initInquiryForm() {
  const inquiryForm = document.querySelector('[data-whatsapp-form]');
  if (!inquiryForm) return;

  inquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const getValue = (name) => inquiryForm.querySelector(`[name="${name}"]`)?.value.trim() || '';
    const name = getValue('name');
    const businessName = getValue('businessName');
    const phone = getValue('phone');
    const businessType = getValue('businessType');
    const requirement = getValue('requirement');
    const packageName = getValue('package');

    const lines = [
      'Hi Vision Web Tech,',
      `My name is ${name || 'Not provided'}.`,
      `Business: ${businessName || 'Not provided'}.`,
      `Phone: ${phone || 'Not provided'}.`,
      `Business Type: ${businessType || 'Not provided'}.`,
      `I am interested in the ${packageName || 'Not specified'} package.`,
      `Requirement: ${requirement || 'Not provided'}.`,
      'Please contact me.'
    ];

    const base = getDynamicWhatsAppLink().split('?')[0];
    const url = `${base}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
  });
}

function initHeroCanvas() {
  const heroCanvas = document.getElementById('hero-canvas');
  if (!heroCanvas || prefersReducedMotion) return;

  const context = heroCanvas.getContext('2d');
  let particles = [];
  let animationFrame = null;

  const resizeCanvas = () => {
    const { width, height } = heroCanvas.getBoundingClientRect();
    heroCanvas.width = Math.max(1, width * devicePixelRatio);
    heroCanvas.height = Math.max(1, height * devicePixelRatio);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    particles = Array.from({ length: Math.min(38, Math.floor(width / 32)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.8 + 0.6
    }));
  };

  const draw = () => {
    const width = heroCanvas.clientWidth;
    const height = heroCanvas.clientHeight;
    context.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      context.beginPath();
      context.fillStyle = 'rgba(120, 220, 255, 0.58)';
      context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      context.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 110) {
          context.beginPath();
          context.strokeStyle = `rgba(78, 200, 255, ${0.16 - distance / 800})`;
          context.lineWidth = 1;
          context.moveTo(p.x, p.y);
          context.lineTo(q.x, q.y);
          context.stroke();
        }
      }
    }

    animationFrame = window.requestAnimationFrame(draw);
  };

  resizeCanvas();
  draw();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('beforeunload', () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  });
}

function initIntroOverlay() {
  return;
}

initNavigation();
initHeaderScroll();
initReveal();
initAccordion();
initInquiryForm();
initHeroCanvas();
initIntroOverlay();
