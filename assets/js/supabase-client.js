import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { DEFAULT_SETTINGS } from './default-content.js';

export const SUPABASE_URL = 'https://mwznwyktcqrohvsqopmb.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H5u-fnIx6xuT7EqlYMQh2g_vDaPU3ZR';
export const ADMIN_EMAIL = 'visionwebtech.info@gmail.com';

export const CUSTOMER_ORDER_STATUSES = [
  'Pending Review',
  'Accepted',
  'In Progress',
  'Need Information',
  'Completed',
  'Cancelled'
];

export const ORDER_PROGRESS_MAP = {
  'Pending Review': { percent: 20, label: 'Order Received' },
  Accepted: { percent: 40, label: 'Accepted' },
  'In Progress': { percent: 60, label: 'In Progress' },
  'Need Information': { percent: 80, label: 'Need Information' },
  Completed: { percent: 100, label: 'Completed' },
  Cancelled: { percent: 0, label: 'Cancelled' }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isAuthorizedAdminEmail(value = '') {
  return normalizeEmail(value) === ADMIN_EMAIL;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getAuthRedirectTarget(defaultTarget = 'customer-dashboard.html') {
  const params = new URLSearchParams(window.location.search);
  return params.get('next') || defaultTarget;
}

export async function requireAdminUser({ redirectTo = 'admin-login.html', allowStay = false } = {}) {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdminEmail(user.email)) {
    if (user && !isAuthorizedAdminEmail(user.email)) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    if (!allowStay) {
      window.location.href = `${redirectTo}?reason=unauthorized`;
    }
    return null;
  }
  return user;
}

export async function requireCustomerUser({ redirectTo = 'auth.html', allowAdminRedirect = true } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
    window.location.href = `${redirectTo}?next=${next}&reason=login_required`;
    return null;
  }

  if (allowAdminRedirect && isAuthorizedAdminEmail(user.email)) {
    window.location.href = 'admin-dashboard.html';
    return null;
  }

  return user;
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function getOrderProgress(status = '') {
  return ORDER_PROGRESS_MAP[status] || ORDER_PROGRESS_MAP['Pending Review'];
}

export function formatOrderDisplay(order = {}) {
  const expectedDelivery = order.expected_delivery ?? order.expected_delivery_text ?? '';
  return {
    id: order.id ?? null,
    userId: order.user_id ?? null,
    fullName: order.full_name ?? order.name ?? order.customer_name ?? '—',
    email: order.email ?? order.customer_email ?? '—',
    phone: order.phone ?? order.whatsapp ?? order.whatsapp_number ?? '—',
    businessName: order.business_name ?? order.business ?? '—',
    service: order.service ?? order.website_type ?? order.website_service ?? '—',
    packageName: order.package ?? order.package_name ?? order.plan ?? '—',
    requirements: order.requirements ?? order.message ?? order.notes ?? '—',
    status: order.status ?? 'Pending Review',
    expectedDeliveryText: expectedDelivery || 'Estimated Delivery: Within 48 Hours',
    adminNotes: order.admin_notes ?? '',
    deliveryUrl: order.delivery_url ?? '',
    createdAt: order.created_at ?? null,
    updatedAt: order.updated_at ?? null
  };
}

export function mapSettingRows(rows = []) {
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => {
    if (!row?.setting_key) return;
    settings[row.setting_key] = row.setting_value;
  });
  return settings;
}

export function normalizeFeatures(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function packageSlugToQuery(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function safeUrl(value = '') {
  try {
    if (!value) return '';
    const url = new URL(value);
    return url.toString();
  } catch {
    return '';
  }
}
