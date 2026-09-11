import { state } from '../state.js';
import { formatDate, showToast } from '../utils.js';
import { openEventDialog } from './calendar.js';
import { getAccount } from '../auth.js';

export function renderDashboard(container) {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const totalTasks = state.tasks.length;
    const taskPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const firstName = getAccount()?.name?.trim().split(/\s+/)[0] || 'there';

    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 1.75rem; font-weight: 700;">GOOD MORNING, ${escapeHtml(firstName).toUpperCase()}</h1>
                <p style="color: var(--color-muted);">${todayStr} • Here's what's happening today.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <!-- Today Tasks Card -->
                <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-weight: 600;">Today's Tasks</h3>
                        <span class="badge badge-success">${completedTasks}/${totalTasks} Done</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${state.tasks.slice(0, 4).map(t => `
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem;">
                                <input type="checkbox" ${t.completed ? 'checked' : ''} disabled style="width: 16px; height: 16px;">
                                <span style="${t.completed ? 'text-decoration: line-through; color: var(--color-muted);' : ''}">${t.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Upcoming Events Card -->
                <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
                    <h3 style="font-weight: 600; margin-bottom: 16px;">Upcoming Events</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${state.events.map(e => `
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                                <div>
                                    <div style="font-weight: 600;">${e.title}</div>
                                    <div style="font-size: 0.75rem; color: var(--color-muted);">${e.location}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="badge badge-warning">${e.time}</span>
                                    <button class="btn-secondary edit-dash-ev" data-id="${e.id}" style="padding: 4px 8px;"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn-secondary delete-dash-ev" data-id="${e.id}" style="padding: 4px 8px; color: var(--color-danger);"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Life Insights -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
                <h3 style="font-weight: 600; margin-bottom: 12px;"><i class="fa-solid fa-chart-line" style="color: var(--color-primary);"></i> Smart Life Insights</h3>
                <ul style="display: flex; flex-direction: column; gap: 8px; color: var(--color-muted); font-size: 0.95rem;">
                    <li>• You have completed <strong style="color: var(--color-text);">${taskPercent}%</strong> of your master checklist tasks.</li>
                    <li>• Your shopping list contains <strong style="color: var(--color-text);">${state.shopping.filter(s => !s.purchased).length}</strong> pending items.</li>
                    <li>• Financial savings goal is <strong style="color: var(--color-text);">${state.goals[0]?.progress || 0}%</strong> achieved.</li>
                </ul>
            </div>
        </div>
    `;

    container.querySelectorAll('.edit-dash-ev').forEach(btn => {
        btn.onclick = () => {
            const ev = state.events.find(x => x.id === Number(btn.getAttribute('data-id')));
            if (ev) openEventDialog(null, ev, () => renderDashboard(container));
        };
    });

    container.querySelectorAll('.delete-dash-ev').forEach(btn => {
        btn.onclick = () => {
            state.deleteEvent(Number(btn.getAttribute('data-id')));
            showToast('Event deleted');
            renderDashboard(container);
        };
    });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
    })[character]);
}