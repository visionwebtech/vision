import {
  escapeHtml,
  CUSTOMER_ORDER_STATUSES,
  formatDateTime,
  formatOrderDisplay,
  mapSettingRows,
  normalizeFeatures,
  requireAdminUser,
  signOutUser,
  supabase
} from './supabase-client.js';
import { DEFAULT_PACKAGES, DEFAULT_PORTFOLIO, DEFAULT_SERVICES, DEFAULT_SETTINGS } from './default-content.js';

const loadingGate = document.querySelector('[data-dashboard-loading]');
const dashboardApp = document.querySelector('[data-dashboard-app]');
const adminEmailNode = document.querySelector('[data-admin-email]');
const ordersMessage = document.querySelector('[data-orders-message]');
const statsMap = {
  total: document.querySelector('[data-total-orders]'),
  pending: document.querySelector('[data-pending-orders]'),
  accepted: document.querySelector('[data-accepted-orders]'),
  progress: document.querySelector('[data-progress-orders]'),
  needInfo: document.querySelector('[data-needinfo-orders]'),
  completed: document.querySelector('[data-completed-orders]'),
  cancelled: document.querySelector('[data-cancelled-orders]')
};
const ordersList = document.querySelector('[data-orders-list]');
const orderSearch = document.querySelector('[data-order-search]');
const orderFilter = document.querySelector('[data-order-filter]');
const customersGrid = document.querySelector('[data-customers-grid]');
const pricingManager = document.querySelector('[data-pricing-manager]');
const servicesManager = document.querySelector('[data-services-manager]');
const portfolioManager = document.querySelector('[data-portfolio-manager]');
const siteSettingsForm = document.querySelector('[data-site-settings-form]');
const siteSettingsMessage = document.querySelector('[data-site-settings-message]');
const refreshButtons = document.querySelectorAll('[data-refresh-dashboard]');
const logoutButtons = document.querySelectorAll('[data-dashboard-logout]');

let dashboardState = {
  orders: [],
  packages: [],
  services: [],
  portfolio: [],
  settings: { ...DEFAULT_SETTINGS }
};

function setMessage(node, message, type = 'info') {
  if (!node) return;
  node.textContent = message;
  node.className = `form-status ${type}`;
}

function statusClass(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function sortByOrder(rows = []) {
  return [...rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

function textareaValue(value) {
  return normalizeFeatures(value).join('\n');
}

function packageEditorCard(pkg = {}) {
  return `
    <article class="manager-card">
      <div class="manager-card-head">
        <div>
          <span class="card-badge">Pricing Package</span>
          <h3>${escapeHtml(pkg.name || 'New Package')}</h3>
        </div>
        <button class="btn btn-secondary slim-btn" type="button" data-delete-pricing="${pkg.id || ''}">Delete</button>
      </div>
      <form class="manager-form" data-pricing-form="${pkg.id || ''}">
        <div class="form-row">
          <div class="form-field"><label>Package Name</label><input type="text" name="name" value="${escapeHtml(pkg.name || '')}" required></div>
          <div class="form-field"><label>Slug</label><input type="text" name="slug" value="${escapeHtml(pkg.slug || '')}" required></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Price</label><input type="text" name="price_text" value="${escapeHtml(pkg.price_text || '')}" required></div>
          <div class="form-field"><label>Delivery Time</label><input type="text" name="delivery_time" value="${escapeHtml(pkg.delivery_time || 'Within 48 Hours')}"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Sort Order</label><input type="number" name="sort_order" value="${escapeHtml(pkg.sort_order ?? 1)}"></div>
          <div class="form-field"><label>Featured Label</label><input type="text" name="featured_label" value="${escapeHtml(pkg.featured_label || '')}" placeholder="Most Popular"></div>
        </div>
        <div class="form-field"><label>Description</label><textarea name="description" required>${escapeHtml(pkg.description || '')}</textarea></div>
        <div class="form-field"><label>Features (one per line)</label><textarea name="features">${escapeHtml(textareaValue(pkg.features))}</textarea></div>
        <div class="inline-check-row">
          <label><input type="checkbox" name="is_visible" ${pkg.is_visible !== false ? 'checked' : ''}> Visible</label>
          <label><input type="checkbox" name="is_featured" ${pkg.is_featured ? 'checked' : ''}> Featured / Popular</label>
        </div>
        <div class="form-status info" data-form-message>Ready to save package changes.</div>
        <button class="btn btn-primary slim-btn" type="submit">Save Package</button>
      </form>
    </article>
  `;
}

function serviceEditorCard(service = {}) {
  return `
    <article class="manager-card">
      <div class="manager-card-head">
        <div>
          <span class="card-badge">Service</span>
          <h3>${escapeHtml(service.title || 'New Service')}</h3>
        </div>
        <button class="btn btn-secondary slim-btn" type="button" data-delete-service="${service.id || ''}">Delete</button>
      </div>
      <form class="manager-form" data-service-form="${service.id || ''}">
        <div class="form-row">
          <div class="form-field"><label>Service Name</label><input type="text" name="title" value="${escapeHtml(service.title || '')}" required></div>
          <div class="form-field"><label>Sort Order</label><input type="number" name="sort_order" value="${escapeHtml(service.sort_order ?? 1)}"></div>
        </div>
        <div class="form-field"><label>Description</label><textarea name="description" required>${escapeHtml(service.description || '')}</textarea></div>
        <label><input type="checkbox" name="is_visible" ${service.is_visible !== false ? 'checked' : ''}> Visible on public site</label>
        <div class="form-status info" data-form-message>Ready to save service changes.</div>
        <button class="btn btn-primary slim-btn" type="submit">Save Service</button>
      </form>
    </article>
  `;
}

function portfolioEditorCard(project = {}) {
  return `
    <article class="manager-card">
      <div class="manager-card-head">
        <div>
          <span class="card-badge">Portfolio</span>
          <h3>${escapeHtml(project.title || 'New Portfolio Item')}</h3>
        </div>
        <button class="btn btn-secondary slim-btn" type="button" data-delete-portfolio="${project.id || ''}">Delete</button>
      </div>
      <form class="manager-form" data-portfolio-form="${project.id || ''}">
        <div class="form-row">
          <div class="form-field"><label>Project Name</label><input type="text" name="title" value="${escapeHtml(project.title || '')}" required></div>
          <div class="form-field"><label>Category</label><input type="text" name="category" value="${escapeHtml(project.category || '')}" required></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Website URL</label><input type="url" name="website_url" value="${escapeHtml(project.website_url || '')}" placeholder="https://example.com"></div>
          <div class="form-field"><label>Image URL / Path</label><input type="text" name="image_url" value="${escapeHtml(project.image_url || '')}" placeholder="assets/images/project-cover.jpg"></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label>Sort Order</label><input type="number" name="sort_order" value="${escapeHtml(project.sort_order ?? 1)}"></div>
          <div class="form-field inline-check-row stacked-checks"><label><input type="checkbox" name="is_visible" ${project.is_visible !== false ? 'checked' : ''}> Visible on public site</label></div>
        </div>
        <div class="form-field"><label>Description</label><textarea name="description" required>${escapeHtml(project.description || '')}</textarea></div>
        <div class="form-status info" data-form-message>Ready to save portfolio changes.</div>
        <button class="btn btn-primary slim-btn" type="submit">Save Portfolio Item</button>
      </form>
    </article>
  `;
}

function orderEditorCard(orderRow = {}) {
  const order = formatOrderDisplay(orderRow);
  return `
    <article class="admin-order-card">
      <div class="admin-order-head">
        <div>
          <span class="card-badge">${escapeHtml(order.packageName)}</span>
          <h3>${escapeHtml(order.fullName)} <small>• ${escapeHtml(order.businessName)}</small></h3>
          <p class="muted">${escapeHtml(order.email)} • ${escapeHtml(order.phone)}</p>
        </div>
        <span class="status-badge status-${statusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <div class="order-meta-grid compact-admin-grid">
        <div><span>Order ID</span><strong>${escapeHtml(order.id || '—')}</strong></div>
        <div><span>Service</span><strong>${escapeHtml(order.service)}</strong></div>
        <div><span>Created</span><strong>${escapeHtml(formatDateTime(order.createdAt))}</strong></div>
        <div><span>Updated</span><strong>${escapeHtml(formatDateTime(order.updatedAt || order.createdAt))}</strong></div>
      </div>
      <div class="dashboard-note"><strong>Requirements</strong><p>${escapeHtml(order.requirements)}</p></div>
      <form class="manager-form admin-order-form" data-order-form-id="${escapeHtml(order.id || '')}">
        <div class="form-row">
          <div class="form-field">
            <label>Status</label>
            <select name="status">${CUSTOMER_ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select>
          </div>
          <div class="form-field">
            <label>Expected Delivery</label>
            <input type="text" name="expected_delivery" value="${escapeHtml(order.expectedDeliveryText || '')}" placeholder="Within 48 Hours">
          </div>
        </div>
        <div class="form-field"><label>Delivery Website URL</label><input type="url" name="delivery_url" value="${escapeHtml(order.deliveryUrl || '')}" placeholder="https://customerwebsite.com"></div>
        <div class="form-field"><label>Customer-visible admin message</label><textarea name="admin_notes" placeholder="Please send your final logo.">${escapeHtml(order.adminNotes || '')}</textarea></div>
        <div class="form-status info" data-form-message>Ready to update this order.</div>
        <button class="btn btn-primary slim-btn" type="submit">Save Order Update</button>
      </form>
    </article>
  `;
}

function updateStats(orders) {
  statsMap.total.textContent = String(orders.length);
  statsMap.pending.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'Pending Review').length);
  statsMap.accepted.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'Accepted').length);
  statsMap.progress.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'In Progress').length);
  statsMap.needInfo.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'Need Information').length);
  statsMap.completed.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'Completed').length);
  statsMap.cancelled.textContent = String(orders.filter((row) => formatOrderDisplay(row).status === 'Cancelled').length);
}

function renderOrders() {
  if (!ordersList) return;
  const keyword = (orderSearch?.value || '').trim().toLowerCase();
  const filter = orderFilter?.value || 'all';
  const filtered = dashboardState.orders.filter((row) => {
    const order = formatOrderDisplay(row);
    const matchesKeyword = !keyword || [order.fullName, order.email, order.businessName, order.service, order.packageName, order.requirements].join(' ').toLowerCase().includes(keyword);
    const matchesFilter = filter === 'all' || order.status === filter;
    return matchesKeyword && matchesFilter;
  });

  if (!filtered.length) {
    ordersList.innerHTML = '<div class="empty-dashboard-state"><h3>No matching orders</h3><p>Try adjusting the search or status filter.</p></div>';
    return;
  }

  ordersList.innerHTML = filtered.map(orderEditorCard).join('');
}

function renderCustomers() {
  if (!customersGrid) return;
  const grouped = new Map();
  dashboardState.orders.forEach((row) => {
    const order = formatOrderDisplay(row);
    const key = order.userId || order.email;
    if (!grouped.has(key)) {
      grouped.set(key, { name: order.fullName, email: order.email, phone: order.phone, orders: 0, active: 0, completed: 0 });
    }
    const current = grouped.get(key);
    current.orders += 1;
    if (['Pending Review', 'Accepted', 'In Progress', 'Need Information'].includes(order.status)) current.active += 1;
    if (order.status === 'Completed') current.completed += 1;
  });

  const customers = [...grouped.values()];
  if (!customers.length) {
    customersGrid.innerHTML = '<div class="empty-dashboard-state"><h3>No customers yet</h3><p>Customer summaries will appear after website orders are submitted.</p></div>';
    return;
  }

  customersGrid.innerHTML = customers.map((customer) => `
    <article class="manager-card compact-manager-card">
      <span class="card-badge">Customer</span>
      <h3>${escapeHtml(customer.name)}</h3>
      <p>${escapeHtml(customer.email)}</p>
      <p class="muted">${escapeHtml(customer.phone)}</p>
      <div class="mini-stat-row">
        <div><span>Total</span><strong>${customer.orders}</strong></div>
        <div><span>Active</span><strong>${customer.active}</strong></div>
        <div><span>Completed</span><strong>${customer.completed}</strong></div>
      </div>
    </article>
  `).join('');
}

function renderPricing() {
  if (!pricingManager) return;
  const rows = dashboardState.packages.length ? sortByOrder(dashboardState.packages) : DEFAULT_PACKAGES;
  pricingManager.innerHTML = rows.map(packageEditorCard).join('') + '<button class="btn btn-secondary" type="button" data-add-pricing>Add Package</button>';
}

function renderServices() {
  if (!servicesManager) return;
  const rows = dashboardState.services.length ? sortByOrder(dashboardState.services) : DEFAULT_SERVICES;
  servicesManager.innerHTML = rows.map(serviceEditorCard).join('') + '<button class="btn btn-secondary" type="button" data-add-service>Add Service</button>';
}

function renderPortfolio() {
  if (!portfolioManager) return;
  const rows = dashboardState.portfolio.length ? sortByOrder(dashboardState.portfolio) : DEFAULT_PORTFOLIO;
  portfolioManager.innerHTML = rows.map(portfolioEditorCard).join('') + '<button class="btn btn-secondary" type="button" data-add-portfolio>Add Portfolio Item</button>';
}

function populateSiteSettings() {
  if (!siteSettingsForm) return;
  const settings = { ...DEFAULT_SETTINGS, ...dashboardState.settings };
  Object.entries(settings).forEach(([key, value]) => {
    const field = siteSettingsForm.querySelector(`[name="${key}"]`);
    if (field) field.value = typeof value === 'string' ? value : JSON.stringify(value);
  });
}

async function fetchAllData() {
  setMessage(ordersMessage, 'Loading orders, CMS content and site settings...', 'loading');
  const [ordersRes, packagesRes, servicesRes, portfolioRes, settingsRes] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('pricing_packages').select('*').order('sort_order', { ascending: true }),
    supabase.from('services_content').select('*').order('sort_order', { ascending: true }),
    supabase.from('portfolio_projects').select('*').order('sort_order', { ascending: true }),
    supabase.from('site_settings').select('*')
  ]);

  const responses = [ordersRes, packagesRes, servicesRes, portfolioRes, settingsRes];
  const firstError = responses.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  dashboardState.orders = ordersRes.data || [];
  dashboardState.packages = packagesRes.data || [];
  dashboardState.services = servicesRes.data || [];
  dashboardState.portfolio = portfolioRes.data || [];
  dashboardState.settings = mapSettingRows(settingsRes.data || []);

  updateStats(dashboardState.orders);
  renderOrders();
  renderCustomers();
  renderPricing();
  renderServices();
  renderPortfolio();
  populateSiteSettings();
  setMessage(ordersMessage, 'Dashboard synced successfully with Supabase.', 'success');
}

function collectFormData(form, kind) {
  const formData = new FormData(form);
  if (kind === 'pricing') {
    return {
      name: formData.get('name')?.toString().trim() || '',
      slug: formData.get('slug')?.toString().trim() || '',
      price_text: formData.get('price_text')?.toString().trim() || '',
      delivery_time: formData.get('delivery_time')?.toString().trim() || 'Within 48 Hours',
      featured_label: formData.get('featured_label')?.toString().trim() || null,
      description: formData.get('description')?.toString().trim() || '',
      features: normalizeFeatures(formData.get('features')?.toString() || ''),
      is_visible: formData.get('is_visible') === 'on',
      is_featured: formData.get('is_featured') === 'on',
      sort_order: Number(formData.get('sort_order') || 1)
    };
  }
  if (kind === 'service') {
    return {
      title: formData.get('title')?.toString().trim() || '',
      description: formData.get('description')?.toString().trim() || '',
      is_visible: formData.get('is_visible') === 'on',
      sort_order: Number(formData.get('sort_order') || 1)
    };
  }
  if (kind === 'portfolio') {
    return {
      title: formData.get('title')?.toString().trim() || '',
      category: formData.get('category')?.toString().trim() || '',
      website_url: formData.get('website_url')?.toString().trim() || '',
      image_url: formData.get('image_url')?.toString().trim() || '',
      description: formData.get('description')?.toString().trim() || '',
      is_visible: formData.get('is_visible') === 'on',
      sort_order: Number(formData.get('sort_order') || 1)
    };
  }
  return {};
}

async function saveManagerForm(form, table, kind, id) {
  const messageNode = form.querySelector('[data-form-message]');
  const submitButton = form.querySelector('button[type="submit"]');
  const payload = collectFormData(form, kind);
  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = 'Saving...';
  setMessage(messageNode, 'Saving changes to Supabase...', 'loading');

  try {
    const query = id
      ? supabase.from(table).update(payload).eq('id', id)
      : supabase.from(table).insert(payload);
    const { error } = await query;
    if (error) throw error;
    setMessage(messageNode, 'Saved successfully.', 'success');
    await fetchAllData();
  } catch (error) {
    console.error(error);
    setMessage(messageNode, error.message || 'Could not save changes.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText || 'Save';
  }
}

async function deleteRow(table, id, message = 'Item deleted.') {
  if (!id) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    setMessage(ordersMessage, message, 'success');
    await fetchAllData();
  } catch (error) {
    console.error(error);
    setMessage(ordersMessage, error.message || 'Could not delete item.', 'error');
  }
}

async function saveOrderUpdate(form, id) {
  const messageNode = form.querySelector('[data-form-message]');
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const expectedDelivery = formData.get('expected_delivery')?.toString().trim() || 'Within 48 Hours';
  const payload = {
    status: formData.get('status')?.toString() || 'Pending Review',
    expected_delivery: expectedDelivery,
    expected_delivery_text: expectedDelivery,
    delivery_url: formData.get('delivery_url')?.toString().trim() || null,
    admin_notes: formData.get('admin_notes')?.toString().trim() || null
  };

  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = 'Updating...';
  setMessage(messageNode, 'Saving order update...', 'loading');

  try {
    const { error } = await supabase.from('orders').update(payload).eq('id', id);
    if (error) throw error;
    setMessage(messageNode, 'Order updated successfully.', 'success');
    await fetchAllData();
  } catch (error) {
    console.error(error);
    setMessage(messageNode, error.message || 'Could not update order.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText || 'Save Order Update';
  }
}

async function saveSiteSettings(event) {
  event.preventDefault();
  if (!siteSettingsForm) return;
  const submitButton = siteSettingsForm.querySelector('button[type="submit"]');
  const formData = new FormData(siteSettingsForm);
  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = 'Saving Settings...';
  setMessage(siteSettingsMessage, 'Updating public contact and CTA settings...', 'loading');

  try {
    for (const [key, value] of formData.entries()) {
      const { error } = await supabase.from('site_settings').upsert({ setting_key: key, setting_value: String(value).trim() }, { onConflict: 'setting_key' });
      if (error) throw error;
    }
    setMessage(siteSettingsMessage, 'Settings saved successfully.', 'success');
    await fetchAllData();
  } catch (error) {
    console.error(error);
    setMessage(siteSettingsMessage, error.message || 'Could not save site settings.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText || 'Save Settings';
  }
}

function bindDynamicActions() {
  ordersList?.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-order-form-id]');
    if (!form) return;
    event.preventDefault();
    saveOrderUpdate(form, form.dataset.orderFormId);
  });

  pricingManager?.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-pricing-form]');
    if (!form) return;
    event.preventDefault();
    saveManagerForm(form, 'pricing_packages', 'pricing', form.dataset.pricingForm);
  });

  servicesManager?.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-service-form]');
    if (!form) return;
    event.preventDefault();
    saveManagerForm(form, 'services_content', 'service', form.dataset.serviceForm);
  });

  portfolioManager?.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-portfolio-form]');
    if (!form) return;
    event.preventDefault();
    saveManagerForm(form, 'portfolio_projects', 'portfolio', form.dataset.portfolioForm);
  });

  pricingManager?.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('[data-delete-pricing]');
    if (deleteButton) {
      await deleteRow('pricing_packages', deleteButton.dataset.deletePricing, 'Pricing package deleted.');
      return;
    }
    if (event.target.closest('[data-add-pricing]')) {
      dashboardState.packages = [...dashboardState.packages, { id: '', name: 'New Package', slug: 'new-package', price_text: '₹0', description: '', features: [], delivery_time: 'Within 48 Hours', featured_label: '', is_visible: true, is_featured: false, sort_order: dashboardState.packages.length + 1 }];
      renderPricing();
    }
  });

  servicesManager?.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('[data-delete-service]');
    if (deleteButton) {
      await deleteRow('services_content', deleteButton.dataset.deleteService, 'Service deleted.');
      return;
    }
    if (event.target.closest('[data-add-service]')) {
      dashboardState.services = [...dashboardState.services, { id: '', title: 'New Service', description: '', is_visible: true, sort_order: dashboardState.services.length + 1 }];
      renderServices();
    }
  });

  portfolioManager?.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('[data-delete-portfolio]');
    if (deleteButton) {
      await deleteRow('portfolio_projects', deleteButton.dataset.deletePortfolio, 'Portfolio item deleted.');
      return;
    }
    if (event.target.closest('[data-add-portfolio]')) {
      dashboardState.portfolio = [...dashboardState.portfolio, { id: '', title: 'New Project', category: 'Portfolio', description: '', website_url: '', image_url: '', is_visible: true, sort_order: dashboardState.portfolio.length + 1 }];
      renderPortfolio();
    }
  });
}

async function bootDashboard() {
  const user = await requireAdminUser();
  if (!user) return;
  if (adminEmailNode) adminEmailNode.textContent = user.email || '';
  loadingGate?.classList.add('hidden');
  dashboardApp?.classList.remove('hidden');
  try {
    await fetchAllData();
  } catch (error) {
    console.error(error);
    setMessage(ordersMessage, error.message || 'Dashboard setup is incomplete. Run the Supabase upgrade SQL and verify RLS permissions.', 'error');
  }
}

orderSearch?.addEventListener('input', renderOrders);
orderFilter?.addEventListener('change', renderOrders);
siteSettingsForm?.addEventListener('submit', saveSiteSettings);
refreshButtons.forEach((button) => button.addEventListener('click', fetchAllData));
logoutButtons.forEach((button) => button.addEventListener('click', async () => {
  try {
    button.disabled = true;
    await signOutUser();
    window.location.replace('admin-login.html');
  } catch (error) {
    console.error(error);
    setMessage(ordersMessage, 'Could not log out right now.', 'error');
    button.disabled = false;
  }
}));

bindDynamicActions();
bootDashboard();
