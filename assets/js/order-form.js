import { supabase } from './supabase-client.js';

const form = document.querySelector('[data-order-form]');
const statusBox = document.querySelector('[data-order-status]');

function setStatus(message, type = 'info') {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

function readValue(name) {
  return form?.querySelector(`[name="${name}"]`)?.value.trim() || '';
}

async function submitOrder(event) {
  event.preventDefault();
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const payload = {
    full_name: readValue('fullName'),
    email: readValue('email'),
    phone: readValue('phone'),
    business_name: readValue('businessName'),
    service: readValue('service'),
    package: readValue('package'),
    requirements: readValue('requirements'),
    status: 'Pending'
  };

  if (!payload.full_name || !payload.email || !payload.phone || !payload.business_name || !payload.service || !payload.package || !payload.requirements) {
    setStatus('Please fill in all required fields before submitting your website order.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = 'Submitting Order...';
  setStatus('Saving your website order...', 'loading');

  try {
    const { error } = await supabase.from('orders').insert(payload);
    if (error) throw error;

    form.reset();
    setStatus('Your website order has been submitted successfully. Vision Web Tech will review it and contact you soon.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('We could not submit your website order right now. Please try again or contact Vision Web Tech on WhatsApp.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText || 'Place Website Order';
  }
}

if (form) {
  form.addEventListener('submit', submitOrder);
}
