import { renderDashboard } from './modules/dashboard.js';
import { renderCalendar } from './modules/calendar.js';
import { renderTasks } from './modules/tasks.js';
import { renderShopping } from './modules/shopping.js';
import { renderMoney } from './modules/money.js';
import { renderHome } from './modules/home.js';
import { renderFamily } from './modules/family.js';
import { renderGoals } from './modules/goals.js';
import { renderNotes } from './modules/notes.js';
import { renderAI } from './modules/ai.js';
import { renderSocial } from './modules/social.js';

const routes = {
    'dashboard': renderDashboard,
    'calendar': renderCalendar,
    'tasks': renderTasks,
    'shopping': renderShopping,
    'money': renderMoney,
    'home': renderHome,
    'family': renderFamily,
    'goals': renderGoals,
    'notes': renderNotes,
    'ai': renderAI,
    'social': renderSocial
};

export function router() {
    const hash = window.location.hash.slice(2) || 'dashboard';
    const mainContent = document.getElementById('main-content');
    
    // Update active nav links
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
        if (el.getAttribute('data-route') === hash) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    const renderFn = routes[hash] || renderDashboard;
    mainContent.innerHTML = '';
    renderFn(mainContent);
}