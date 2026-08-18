import { escapeHtml, formatDateTime, formatOrderDisplay, getOrderProgress, requireCustomerUser, safeUrl, signOutUser, supabase } from './supabase-client.js';

const dashboardApp = document.querySelector('[data-customer-dashboard]');
const loadingGate = document.querySelector('[data-customer-loading]');
const ordersContainer = document.querySelector('[data-customer-orders]');
const emptyState = document.querySelector('[data-customer-empty]');
const dashboardStatus = document.querySelector('[data-customer-status]');
const customerEmail = document.querySelector('[data-customer-email]');
const customerName = document.querySelector('[data-customer-name]');
const profileName = document.querySelector('[data-profile-name]');
const profileEmail = document.querySelector('[data-profile-email]');
const profileUid = document.querySelector('[data-profile-uid]');
const logoutButtons = document.querySelectorAll('[data-customer-logout]');
const orderCount = document.querySelector('[data-customer-order-count]');
const activeCount = document.querySelector('[data-customer-active-count]');
const completedCount = document.querySelector('[data-customer-completed-count]');

function setStatus(message, type = 'info') {
  if (!dashboardStatus) return;
  dashboardStatus.textContent = message;
  dashboardStatus.className = `form-status ${type}`;
}

function renderTimeline(status) {
  const stages = ['Pending Review', 'Accepted', 'In Progress', 'Need Information', 'Completed'];
  const currentIndex = stages.indexOf(status);
  const fallbackIndex = status === 'Cancelled' ? -1 : 0;
  const activeIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
  return `
    <div class="order-timeline ${status === 'Cancelled' ? 'cancelled-timeline' : ''}">
      ${stages.map((step, index) => {
        const active = activeIndex >= index && status !== 'Cancelled';
        return `<div class="timeline-step ${active ? 'active' : ''}"><span></span><small>${escapeHtml(step)}</small></div>`;
      }).join('')}
    </div>
  `;
}

function renderProgressBar(status) {
  const progress = getOrderProgress(status);
  return `
    <div class="order-progress-shell" aria-label="Order progress ${escapeHtml(String(progress.percent))} percent">
      <div class="order-progress-top">
        <strong>${escapeHtml(progress.label)}</strong>
        <span>${escapeHtml(String(progress.percent))}%</span>
      </div>
      <div class="order-progress-track"><span class="order-progress-fill" style="width:${progress.percent}%"></span></div>
    </div>
  `;
}

function renderOrders(rows) {
  if (!ordersContainer) return;
  if (!rows.length) {
    ordersContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  ordersContainer.innerHTML = rows.map((row, index) => {
    const order = formatOrderDisplay(row);
    const safeDeliveryUrl = safeUrl(order.deliveryUrl);
    const statusClass = order.status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const deliveryMarkup = safeDeliveryUrl
      ? `<a class="btn btn-primary slim-btn" href="${safeDeliveryUrl}" target="_blank" rel="noopener">Open Website</a>`
      : '<span class="muted">Delivery URL will appear here once the project is completed.</span>';
    const noteMarkup = order.adminNotes
      ? `<div class="dashboard-note"><strong>Update from Vision Web Tech</strong><p>${escapeHtml(order.adminNotes)}</p></div>`
      : '';
    const completionNotice = order.status === 'Completed'
      ? '<div class="form-status success">Website Delivered — your website is ready.</div>'
      : '';
    const needInfoNotice = order.status === 'Need Information'
      ? '<div class="form-status loading">Vision Web Tech needs more information to continue this project.</div>'
      : '';
    const summary = escapeHtml(order.requirements.length > 140 ? `${order.requirements.slice(0, 140)}…` : order.requirements);
    return `
      <article class="customer-order-card ${index === 0 ? 'expanded-order' : ''}">
        <button class="order-detail-toggle" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
          <div class="customer-order-top">
            <div>
              <span class="card-badge">Order ID</span>
              <h3>${escapeHtml(order.id || '—')}</h3>
              <p class="muted">${escapeHtml(order.packageName)} • ${escapeHtml(order.service)}</p>
            </div>
            <span class="status-badge status-${statusClass}">${escapeHtml(order.status)}</span>
          </div>
          <div class="order-meta-grid compact-admin-grid">
            <div><span>Submitted</span><strong>${escapeHtml(formatDateTime(order.createdAt))}</strong></div>
            <div><span>Expected Delivery</span><strong>${escapeHtml(order.expectedDeliveryText)}</strong></div>
            <div><span>Requirements Summary</span><strong>${summary}</strong></div>
          </div>
        </button>
        <div class="order-detail-panel ${index === 0 ? '' : 'hidden'}">
          ${renderProgressBar(order.status)}
          ${renderTimeline(order.status)}
          ${needInfoNotice}
          ${completionNotice}
          <div class="order-meta-grid">
            <div><span>Package</span><strong>${escapeHtml(order.packageName)}</strong></div>
            <div><span>Service</span><strong>${escapeHtml(order.service)}</strong></div>
            <div><span>Order Date</span><strong>${escapeHtml(formatDateTime(order.createdAt))}</strong></div>
            <div><span>Last Update</span><strong>${escapeHtml(formatDateTime(order.updatedAt || order.createdAt))}</strong></div>
          </div>
          <div class="dashboard-note"><strong>Requirements</strong><p>${escapeHtml(order.requirements)}</p></div>
          ${noteMarkup}
          <div class="delivery-panel">
            <div>
              <strong>Delivery</strong>
              <p class="muted">When completed, your final website link appears below.</p>
            </div>
            ${deliveryMarkup}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function updateStats(rows) {
  if (orderCount) orderCount.textContent = String(rows.length);
  if (activeCount) activeCount.textContent = String(rows.filter((row) => ['Pending Review', 'Accepted', 'In Progress', 'Need Information'].includes(formatOrderDisplay(row).status)).length);
  if (completedCount) completedCount.textContent = String(rows.filter((row) => formatOrderDisplay(row).status === 'Completed').length);
}

async function loadDashboard() {
  const user = await requireCustomerUser();
  if (!user) return;

  const fullName = user.user_metadata?.full_name || 'Vision Web Tech Customer';
  if (customerEmail) customerEmail.textContent = user.email || 'Signed in';
  if (customerName) customerName.textContent = fullName;
  if (profileName) profileName.textContent = fullName;
  if (profileEmail) profileEmail.textContent = user.email || '—';
  if (profileUid) profileUid.textContent = user.id || '—';

  loadingGate?.classList.add('hidden');
  dashboardApp?.classList.remove('hidden');
  setStatus('Loading your website orders...', 'loading');

  try {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    renderOrders(data || []);
    updateStats(data || []);
    const submitted = new URLSearchParams(window.location.search).get('submitted');
    setStatus(submitted ? 'Your website order was submitted successfully and is now visible in My Orders.' : 'Your account is synced with the latest order information.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'We could not load your orders. Please verify your Supabase setup and sign-in state.', 'error');
  }
}

ordersContainer?.addEventListener('click', (event) => {
  const toggle = event.target.closest('.order-detail-toggle');
  if (!toggle) return;
  const card = toggle.closest('.customer-order-card');
  const panel = card?.querySelector('.order-detail-panel');
  if (!card || !panel) return;
  const willOpen = panel.classList.contains('hidden');
  card.classList.toggle('expanded-order', willOpen);
  panel.classList.toggle('hidden', !willOpen);
  toggle.setAttribute('aria-expanded', String(willOpen));
});

logoutButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      button.disabled = true;
      await signOutUser();
      window.location.replace('auth.html');
    } catch (error) {
      console.error(error);
      setStatus('Could not log out right now. Please try again.', 'error');
      button.disabled = false;
    }
  });
});

loadDashboard();
