import { LANGUAGES, applyLanguage, getLanguage, t } from './i18n.js';

const STORAGE_KEY = 'lifeos_account';

export function getAccount() {
    try {
        const account = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!account || typeof account !== 'object' || typeof account.name !== 'string' || typeof account.email !== 'string') {
            return null;
        }
        return account;
    } catch (error) {
        return null;
    }
}

function saveAccount(account) {
    const { password, ...safeAccount } = account;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeAccount));
}
import { getSupabaseAccount, signInWithPassword, signOutSupabase, signUpWithPassword } from './supabase.js';

export function initAuth(onReady) {
    const ready = account => {
        document.body.classList.remove('auth-gate');
        onReady(account);
    };
    const localAccount = getAccount();
    getSupabaseAccount().then(remoteAccount => {
        if (remoteAccount) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...localAccount, ...remoteAccount }));
            updateProfileHeader(remoteAccount);
            ready(remoteAccount);
            return;
        }
        if (localAccount) {
        updateProfileHeader(localAccount);
        ready(localAccount);
        return;
    }
    document.body.classList.add('auth-gate');
    renderWelcomePage(ready);
    }).catch(() => {
        if (localAccount) {
            updateProfileHeader(localAccount);
            ready(localAccount);
        } else {
            document.body.classList.add('auth-gate');
            renderWelcomePage(ready);
        }
    });
}

function renderWelcomePage(onReady) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <section class="welcome-page" aria-labelledby="welcome-title">
            <div class="welcome-content">
                <div class="welcome-brand"><img src="icon.png" alt="LifeOS" width="48" height="48"><span>LifeOS</span></div>
                <p class="welcome-kicker">${t('welcomeKicker')}</p>
                <h1 id="welcome-title">${t('welcomeTitle')}</h1>
                <p class="welcome-copy">${t('welcomeCopy')}</p>
                <div class="welcome-actions">
                    <button type="button" class="btn-primary" id="welcome-register-btn">${t('create')}</button>
                    <button type="button" class="btn-secondary" id="welcome-signin-btn">${t('signIn')}</button>
                </div>
                <label class="welcome-language" for="welcome-language-select">${t('language')}
                    <select id="welcome-language-select" class="form-control">
                        ${Object.entries(LANGUAGES).map(([key, language]) => `<option value="${key}" ${key === getLanguage() ? 'selected' : ''}>${language.name}</option>`).join('')}
                    </select>
                </label>
            </div>
        </section>
    `;
    mainContent.querySelector('#welcome-register-btn').onclick = () => openAuthDialog(false, onReady, 'register');
    mainContent.querySelector('#welcome-signin-btn').onclick = () => openAuthDialog(false, onReady, 'signin');
    mainContent.querySelector('#welcome-language-select').onchange = event => {
        applyLanguage(event.target.value);
        window.location.reload();
    };
}

function updateProfileHeader(account) {
    const username = document.querySelector('.username');
    const avatar = document.querySelector('.avatar');
    const name = account.name.trim() || 'User';
    if (username) username.textContent = name;
    if (avatar) avatar.textContent = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function openAuthDialog(forced, onReady, initialMode = 'register') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card auth-modal-card">
            <div class="modal-header">
                <h3>${t('welcome')}</h3>
                ${forced ? '' : '<button class="close-modal-btn" title="Close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>'}
            </div>
            <div class="modal-body">
                <div class="auth-tabs" role="tablist">
                    <button type="button" class="auth-tab active" data-mode="register">Create Account</button>
                    <button type="button" class="auth-tab" data-mode="signin">Sign In</button>
                </div>
                <form id="auth-form">
                    <div class="form-group auth-register-field">
                        <label for="auth-name">${t('name')}</label>
                        <input type="text" id="auth-name" class="form-control" autocomplete="name" required>
                    </div>
                    <div class="form-group">
                        <label for="auth-email">${t('email')}</label>
                        <input type="email" id="auth-email" class="form-control" autocomplete="email" required>
                    </div>
                    <div class="form-group">
                        <label for="auth-password">${t('password')}</label>
                        <input type="password" id="auth-password" class="form-control" autocomplete="new-password" minlength="4" required>
                    </div>
                    <div class="auth-register-field">
                        <div class="form-group">
                            <label for="auth-address">${t('address')}</label>
                            <input type="text" id="auth-address" class="form-control" autocomplete="street-address" required>
                        </div>
                        <div class="form-group">
                            <label for="auth-country">${t('country')}</label>
                            <select id="auth-country" class="form-control" required>
                                ${COUNTRIES.map(country => `<option value="${country}">${country}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="auth-phone">${t('phone')}</label>
                            <input type="tel" id="auth-phone" class="form-control" autocomplete="tel" placeholder="+971 50 123 4567" required>
                            <small class="form-help">Used for quick call actions on tasks and calendar events.</small>
                        </div>
                    </div>
                    <p class="auth-error" aria-live="polite"></p>
                    <button type="submit" class="btn-primary auth-submit">${t('createAccount')}</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    let mode = 'register';
    const form = overlay.querySelector('#auth-form');
    const error = overlay.querySelector('.auth-error');
    const nameField = overlay.querySelector('#auth-name');
    const registerFields = overlay.querySelectorAll('.auth-register-field');
    const registerControls = overlay.querySelectorAll('.auth-register-field input, .auth-register-field select');
    const submit = overlay.querySelector('.auth-submit');

    const setMode = nextMode => {
        mode = nextMode;
        overlay.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
        registerFields.forEach(field => { field.hidden = mode === 'signin'; });
        registerControls.forEach(control => { control.required = mode === 'register'; });
        submit.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
        overlay.querySelector('#auth-password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
        error.textContent = '';
    };

    overlay.querySelectorAll('.auth-tab').forEach(tab => { tab.onclick = () => setMode(tab.dataset.mode); });
    setMode(initialMode);
    if (!forced) {
        const close = () => overlay.remove();
        overlay.querySelector('.close-modal-btn').onclick = close;
        overlay.onclick = event => { if (event.target === overlay) close(); };
    }

    form.onsubmit = async event => {
        event.preventDefault();
        const email = overlay.querySelector('#auth-email').value.trim().toLowerCase();
        const password = overlay.querySelector('#auth-password').value;
        const existing = getAccount();
        try {
        if (mode === 'signin') {
            const account = await signInWithPassword(email, password);
            overlay.remove();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...account }));
            updateProfileHeader(account);
            onReady(account);
            return;
        }

        if (existing && existing.email === email) {
            error.textContent = 'An account with this email already exists. Sign in instead.';
            return;
        }
        const details = {
            name: nameField.value.trim(),
            email,
            password,
            address: overlay.querySelector('#auth-address').value.trim(),
            country: overlay.querySelector('#auth-country').value,
            phone: overlay.querySelector('#auth-phone').value.trim(),
        };
        const createdAccount = await signUpWithPassword(email, password, details);
        saveAccount({ ...details, ...createdAccount });
        overlay.remove();
        updateProfileHeader(createdAccount);
        onReady(createdAccount);
        } catch (authError) {
            error.textContent = authError.message || 'Authentication failed. Please try again.';
        }
    };
}

export function openProfileDialog() {
    const account = getAccount();
    if (!account) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h3>Account Profile</h3>
                <button class="close-modal-btn" title="Close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="profile-summary"><strong>${escapeHtml(account.name)}</strong><span>${escapeHtml(account.email)}</span><span>${escapeHtml(account.phone)}</span><span>${escapeHtml(account.address)}, ${escapeHtml(account.country)}</span></div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;"><button type="button" class="btn-secondary" id="sign-out-btn">Sign Out</button><button type="button" class="btn-primary" id="close-profile-btn">Close</button></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.querySelector('#close-profile-btn').onclick = close;
    overlay.querySelector('#sign-out-btn').onclick = async () => { await signOutSupabase(); localStorage.removeItem(STORAGE_KEY); window.location.reload(); };
}

export function getContactPhone(fallback = '') {
    return getAccount()?.phone || fallback;
}

const COUNTRIES = [
    'United Arab Emirates', 'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand', 'Ireland', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Greece', 'Turkey', 'Russia', 'Ukraine', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Egypt', 'Morocco', 'South Africa', 'Nigeria', 'Kenya', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
