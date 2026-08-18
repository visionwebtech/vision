import { supabase, ADMIN_EMAIL, isAuthorizedAdminEmail, getCurrentUser, signOutUser } from './supabase-client.js';

const form = document.querySelector('[data-admin-login-form]');
const statusBox = document.querySelector('[data-auth-status]');
const logoutButton = document.querySelector('[data-admin-logout]');
const signedInBox = document.querySelector('[data-signed-in-box]');
const signedInEmail = document.querySelector('[data-signed-in-email]');

function setStatus(message, type = 'info') {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

async function syncExistingSession() {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    if (isAuthorizedAdminEmail(user.email)) {
      window.location.replace('admin-dashboard.html');
      return;
    }

    signedInBox?.classList.remove('hidden');
    if (signedInEmail) signedInEmail.textContent = user.email || 'Signed in';
    setStatus('This account is signed in but is not authorized for the Vision Web Tech admin dashboard.', 'error');
  } catch (error) {
    console.error(error);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  if (!form) return;

  const email = form.querySelector('[name="email"]')?.value.trim() || '';
  const password = form.querySelector('[name="password"]')?.value || '';
  const button = form.querySelector('button[type="submit"]');

  if (!email || !password) {
    setStatus('Enter your email and password to continue.', 'error');
    return;
  }

  button.disabled = true;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = 'Signing In...';
  setStatus('Checking admin credentials...', 'loading');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userEmail = data.user?.email || '';
    if (!isAuthorizedAdminEmail(userEmail)) {
      await signOutUser();
      throw new Error(`Only ${ADMIN_EMAIL} is allowed to access the admin dashboard.`);
    }

    setStatus('Login successful. Redirecting to the admin dashboard...', 'success');
    window.location.replace('admin-dashboard.html');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Login failed. Please check your details and try again.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Login';
  }
}

async function handleLogout() {
  try {
    logoutButton.disabled = true;
    await signOutUser();
    setStatus('You have been logged out.', 'success');
    signedInBox?.classList.add('hidden');
  } catch (error) {
    console.error(error);
    setStatus('Could not log out right now. Please try again.', 'error');
  } finally {
    logoutButton.disabled = false;
  }
}

if (form) form.addEventListener('submit', handleLogin);
if (logoutButton) logoutButton.addEventListener('click', handleLogout);

const reason = new URLSearchParams(window.location.search).get('reason');
if (reason === 'unauthorized') {
  setStatus('Please sign in with the authorized Vision Web Tech admin account.', 'info');
}

syncExistingSession();
