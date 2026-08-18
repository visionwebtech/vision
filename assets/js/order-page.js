import { requireCustomerUser, supabase } from './supabase-client.js';

const orderForm = document.querySelector('[data-customer-order-form]');
const orderStatus = document.querySelector('[data-order-form-status]');
const orderHeading = document.querySelector('[data-order-package-heading]');
const orderSummary = document.querySelector('[data-order-package-summary]');
const packageField = document.querySelector('[name="package"]');
const emailField = document.querySelector('[name="email"]');
const nameField = document.querySelector('[name="fullName"]');
const phoneField = document.querySelector('[name="phone"]');
const serviceField = document.querySelector('[name="service"]');
const businessField = document.querySelector('[name="businessName"]');
const requirementsField = document.querySelector('[name="requirements"]');

const packageDescriptions = {
  Starter: 'A clean starting point for smaller businesses and individuals.',
  Business: 'A stronger package for businesses that need better presentation and more structure.',
  Premium: 'A premium package for more advanced and highly customized requirements.',
  'Custom Discussion': 'A custom path for businesses that want to discuss a different scope.'
};

function setOrderStatus(message, type = 'info') {
  if (!orderStatus) return;
  orderStatus.textContent = message;
  orderStatus.className = `form-status ${type}`;
}

function getSelectedPackage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('package') || 'Business';
}

function normalizePackageName(value) {
  if (!value) return 'Business';
  const lower = value.toLowerCase();
  if (lower.includes('starter')) return 'Starter';
  if (lower.includes('premium')) return 'Premium';
  if (lower.includes('custom')) return 'Custom Discussion';
  return 'Business';
}

async function initializeOrderPage() {
  const user = await requireCustomerUser();
  if (!user) return;
  const selectedPackage = normalizePackageName(getSelectedPackage());

  if (emailField) emailField.value = user.email || '';
  if (nameField) nameField.value = user.user_metadata?.full_name || '';
  if (packageField) packageField.value = selectedPackage;
  if (serviceField && !serviceField.value) serviceField.value = 'Business Website Development';
  if (orderHeading) orderHeading.textContent = `${selectedPackage} Package Order`;
  if (orderSummary) orderSummary.textContent = packageDescriptions[selectedPackage] || packageDescriptions.Business;
}

async function submitCustomerOrder(event) {
  event.preventDefault();
  const user = await requireCustomerUser();
  if (!user || !orderForm) return;

  const submitButton = orderForm.querySelector('button[type="submit"]');
  const payload = {
    user_id: user.id,
    full_name: nameField?.value.trim() || '',
    email: emailField?.value.trim() || user.email || '',
    phone: phoneField?.value.trim() || '',
    business_name: businessField?.value.trim() || '',
    service: serviceField?.value.trim() || '',
    package: packageField?.value.trim() || '',
    requirements: requirementsField?.value.trim() || '',
    status: 'Pending Review'
  };

  const required = ['full_name', 'email', 'phone', 'business_name', 'service', 'package', 'requirements'];
  const missingField = required.find((field) => !payload[field]);
  if (missingField) {
    setOrderStatus('Please complete all required fields before placing your website order.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = 'Placing Order...';
  setOrderStatus('Saving your website order to Supabase...', 'loading');

  try {
    const { data, error } = await supabase.from('orders').insert(payload).select('id').single();
    if (error) throw error;
    setOrderStatus(`Order placed successfully. Order ID: ${data?.id || 'created'}. Redirecting to My Orders...`, 'success');
    window.setTimeout(() => {
      window.location.href = 'customer-dashboard.html?submitted=1';
    }, 900);
  } catch (error) {
    console.error(error);
    setOrderStatus(error.message || 'We could not submit your order right now. Please verify your account confirmation and Supabase setup.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText || 'Place Order';
  }
}

orderForm?.addEventListener('submit', submitCustomerOrder);
initializeOrderPage();
