import { router } from './router.js';
import { state } from './state.js';
import { initReminders } from './reminders.js';
import { initCurrencySelector } from './currency.js';
import { applyAccent, getAccent, initAccentSelector } from './theme.js';
import { initAuth, openProfileDialog } from './auth.js';
import { initLanguageSelector, t } from './i18n.js';
import { loadRemoteState, migrateLocalStateToSupabase } from './supabase.js';

window.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('lifeos_theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    initLanguageSelector();
    updateThemeButtonText(savedTheme);
    initAccentSelector();
    const profileButton = document.getElementById('profile-button');
    if (profileButton) profileButton.onclick = openProfileDialog;
    const quickAddButton = document.getElementById('quick-add-btn');
    if (quickAddButton) quickAddButton.onclick = openQuickActions;

    themeToggleBtn.onclick = () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('lifeos_theme', newTheme);
        applyAccent(getAccent());
        updateThemeButtonText(newTheme);
    };

    function updateThemeButtonText(theme) {
        themeToggleBtn.innerHTML = theme === 'dark' ? `<i class="fa-solid fa-sun"></i> <span>${t('lightMode')}</span>` : `<i class="fa-solid fa-moon"></i> <span>${t('darkMode')}</span>`;
    }

    // Account, currency, and app startup
    initAuth(async account => {
        await migrateLocalStateToSupabase(account, state).catch(error => console.warn('Supabase local data migration failed', error.message));
        const remoteState = await loadRemoteState(account.familyId).catch(() => null);
        if (remoteState) Object.assign(state, remoteState);
        initCurrencySelector();
        window.addEventListener('hashchange', router);
        router();
    });

    // Event reminder alarms
    initReminders();

    // Global Search Live Filtering
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('search-results-dropdown');

    if (!searchInput || !searchDropdown) return;

    searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            searchDropdown.classList.add('hidden');
            searchDropdown.innerHTML = '';
            return;
        }

        const taskMatches = state.tasks.filter(t => t.title.toLowerCase().includes(query));
        const noteMatches = state.notes.filter(n => n.title.toLowerCase().includes(query));

        let html = '';
        taskMatches.forEach(t => {
            html += `<div class="search-result-item" onclick="window.location.hash='#/tasks'">Task: ${t.title}</div>`;
        });
        noteMatches.forEach(n => {
            html += `<div class="search-result-item" onclick="window.location.hash='#/notes'">Note: ${n.title}</div>`;
        });

        if (!html) {
            html = `<div class="search-result-item" style="color: var(--color-muted);">No matches found</div>`;
        }

        searchDropdown.innerHTML = html;
        searchDropdown.classList.remove('hidden');
    };

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });
});

function openQuickActions() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card quick-actions-card">
            <div class="modal-header">
                <h3>Quick Actions</h3>
                <button class="close-modal-btn" title="Close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="quick-actions-grid">
                    ${[
                        ['tasks', 'fa-list-check', 'Add Task'],
                        ['calendar', 'fa-calendar-plus', 'Add Event'],
                        ['notes', 'fa-note-sticky', 'Add Note'],
                        ['shopping', 'fa-cart-plus', 'Add Shopping Item'],
                        ['money', 'fa-money-bill-transfer', 'Add Transaction'],
                        ['goals', 'fa-bullseye', 'Add Goal'],
                        ['social', 'fa-share-nodes', 'Social & Communication Hub'],
                    ].map(([route, icon, label]) => `<button type="button" class="quick-action-item" data-route="${route}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.querySelectorAll('.quick-action-item').forEach(button => {
        button.onclick = () => {
            window.location.hash = `#/${button.dataset.route}`;
            close();
        };
    });
}