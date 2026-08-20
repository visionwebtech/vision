 import { DEFAULT_PACKAGES, DEFAULT_PORTFOLIO, DEFAULT_SERVICES, DEFAULT_SETTINGS } from './default-content.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeFeatures(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function packageSlugToQuery(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function safeUrl(value = '') {
  try {
    if (!value) return '';
    const url = new URL(value);
    return url.toString();
  } catch {
    return '';
  }
}

function mapSettingRows(rows = []) {
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => {
    if (row?.setting_key) settings[row.setting_key] = row.setting_value;
  });
  return settings;
}

function sortRows(rows = []) {
  return [...rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

function renderPricingCards(container, packages, { compact = false } = {}) {
  if (!container) return;
  const visiblePackages = sortRows(packages).slice(0, compact ? 3 : packages.length);
  container.innerHTML = visiblePackages.map((pkg) => {
    const slug = packageSlugToQuery(pkg.slug || pkg.name);
    const cleanName = pkg.name.replace(' Website', '');
    const classes = ['pricing-card', 'reveal', pkg.is_featured ? 'featured' : '', slug === 'premium' ? 'premium' : ''].filter(Boolean).join(' ');
    const badge = pkg.is_featured
      ? '<span class="top-badge">Most Popular</span>'
      : slug === 'premium'
        ? '<span class="top-badge alt">Best Value</span>'
        : '';
    const buttonClass = pkg.is_featured ? 'btn btn-primary full-width' : 'btn btn-secondary full-width';
    const extraMeta = pkg.delivery_time ? `<p class="pricing-meta-line">Delivery: ${escapeHtml(pkg.delivery_time)}</p>` : '';
    return `
      <article class="${classes}">
        ${badge}
        <h3>${escapeHtml(pkg.name)}</h3>
        <p class="pricing-subtitle">${escapeHtml(pkg.description || '')}</p>
        <div class="price">${escapeHtml(pkg.price_text || '')}</div>
        ${extraMeta}
        <ul class="pricing-features">
          ${normalizeFeatures(pkg.features).map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
        </ul>
        <a class="${buttonClass}" href="order.html?package=${encodeURIComponent(cleanName)}">Choose ${escapeHtml(cleanName)}</a>
      </article>
    `;
  }).join('');
}

function renderHeroPills(container, packages) {
  if (!container) return;
  const visiblePackages = sortRows(packages).slice(0, 3);
  container.innerHTML = visiblePackages
    .map((pkg) => `<span class="tech-pill">${escapeHtml(pkg.name.replace(' Website', ''))} — ${escapeHtml(pkg.price_text)}</span>`)
    .join('');
}

function renderServices(container, services) {
  if (!container) return;
  container.innerHTML = sortRows(services)
    .map(
      (service, index) => `
    <article class="service-item reveal ${index % 3 === 1 ? 'delay-1' : index % 3 === 2 ? 'delay-2' : ''}">
      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.description)}</p>
    </article>
  `
    )
    .join('');
}

function renderPortfolio(container, projects) {
  if (!container) return;
  container.innerHTML = sortRows(projects)
    .map((project, index) => {
      const safeProjectUrl = safeUrl(project.website_url);
      const visual = project.image_url
        ? `<div class="concept-visual external-portfolio-image" style="background-image:url('${String(project.image_url).replace(/'/g, '%27')}');"></div>`
        : `<div class="concept-visual ${(project.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'consultant-theme'}"><div class="concept-screen minimal"></div></div>`;
      const link = safeProjectUrl
        ? `<a class="portfolio-link" href="${safeProjectUrl}" target="_blank" rel="noopener">Open Website</a>`
        : '<span class="portfolio-link muted">Preview only</span>';
      return `
      <article class="concept-card reveal ${index % 3 === 1 ? 'delay-1' : index % 3 === 2 ? 'delay-2' : ''}">
        <span class="card-badge">${escapeHtml(project.category || 'Portfolio')}</span>
        ${visual}
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description || '')}</p>
        ${link}
      </article>
    `;
    })
    .join('');
}

function updateSettingDrivenContent(settings) {
  document.querySelectorAll('[data-contact-phone-text]').forEach((el) => {
    el.textContent = settings.business_phone;
  });

  document.querySelectorAll('[data-contact-email-text]').forEach((el) => {
    el.textContent = settings.business_email;
  });

  document.querySelectorAll('[data-contact-instagram-text]').forEach((el) => {
    el.textContent = settings.instagram_handle;
  });

  document.querySelectorAll('[data-primary-cta-text]').forEach((el) => {
    el.textContent = settings.primary_cta_text;
  });

  document.querySelectorAll('[data-link-type="phone"]').forEach((el) => {
    el.setAttribute('href', `tel:${settings.business_phone.replace(/\s+/g, '')}`);
  });

  document.querySelectorAll('[data-link-type="email"]').forEach((el) => {
    el.setAttribute('href', `mailto:${settings.business_email}`);
  });

  document.querySelectorAll('[data-link-type="instagram"]').forEach((el) => {
    el.setAttribute('href', settings.instagram_url);
  });

  document.querySelectorAll('[data-link-type="whatsapp"]').forEach((el) => {
    const preset = el.getAttribute('data-whatsapp-message');
    const href = preset
      ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(preset)}`
      : `https://wa.me/${settings.whatsapp_number}`;
    el.setAttribute('href', href);
  });

  const contactHeading = document.querySelector('[data-contact-heading]');
  if (contactHeading) contactHeading.textContent = settings.contact_heading;
  const contactIntro = document.querySelector('[data-contact-intro]');
  if (contactIntro) contactIntro.textContent = settings.contact_intro;
}

/*
 * Safety fallback: every .reveal element starts at opacity:0 in style.css and is
 * revealed by IntersectionObserver in main.js. If JS stalls, or if the visitor
 * is using a headless renderer / screenshot tool that does not scroll, those
 * items would stay invisible forever. This timeout guarantees no element gets
 * stuck hidden more than 1.2s after page load.
 */
(function revealFallback() {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in-view)').forEach((el) => el.classList.add('in-view'));
  }, 1200);
})();

function bootSiteData() {
  /*
   * Render directly from DEFAULT_* exports of default-content.js.
   * The original implementation imported the Supabase client from
   *   https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
   * via ./supabase-client.js. If that CDN import failed, was slow, or the
   * Supabase call rejected, the entire module chain stalled and the
   * pricing/services/portfolio grids were left with only their static
   * placeholder <article> -> the giant empty gap you saw on Pricing and
   * Services pages. Rendering from defaults synchronously makes the page
   * render reliably every time. Admin edits via Supabase (if any) can be
   * wired in as a non-blocking enhancement later without breaking render.
   */
  const packages = DEFAULT_PACKAGES;
  const services = DEFAULT_SERVICES;
  const projects = DEFAULT_PORTFOLIO;
  const settings = DEFAULT_SETTINGS;

  renderHeroPills(document.querySelector('[data-pricing-hero-pills]'), packages);
  renderPricingCards(document.querySelector('[data-pricing-grid]'), packages, { compact: false });
  renderPricingCards(document.querySelector('[data-pricing-preview-grid]'), packages, { compact: true });
  renderServices(document.querySelector('[data-services-grid]'), services);
  renderPortfolio(document.querySelector('[data-portfolio-grid]'), projects);
  updateSettingDrivenContent(settings);

  document.querySelectorAll('.reveal').forEach((item) => {
    if (!item.classList.contains('in-view') && item.getBoundingClientRect().top < window.innerHeight) {
      item.classList.add('in-view');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSiteData);
} else {
  bootSiteData();
}
