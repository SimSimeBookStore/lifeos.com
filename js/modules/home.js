import { state } from '../state.js';
import { showToast, formatCurrency } from '../utils.js';

function badgeClass(status) {
    if (status === 'Urgent') return 'badge-danger';
    if (status === 'Done') return 'badge-success';
    return 'badge-warning';
}

export function renderHome(container) {
    const totalCost = state.home.reduce((acc, h) => acc + (h.cost || 0), 0);

    container.innerHTML = `
        <div class="home-page">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Household Management</h2>
                <button class="btn-primary" id="add-home-btn"><i class="fa-solid fa-plus"></i> Add Task</button>
            </div>
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 16px;">Maintenance & Utilities Schedule</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${state.home.map(h => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-background); border-radius: 8px; gap: 12px; flex-wrap: wrap;">
                            <div style="font-weight: 600; ${h.status === 'Done' ? 'text-decoration: line-through; color: var(--color-muted);' : ''}">${h.task}</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="text" class="form-control edit-home-due" data-id="${h.id}" value="${h.dueIn}" style="width: 110px; padding: 6px 8px;" title="Due In">
                                <input type="number" class="form-control edit-home-cost" data-id="${h.id}" value="${h.cost || 0}" style="width: 90px; padding: 6px 8px;" min="0" step="0.01" title="Cost">
                                <select class="form-control edit-home-status" data-id="${h.id}" style="padding: 6px 8px;">
                                    <option value="Pending" ${h.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Urgent" ${h.status === 'Urgent' ? 'selected' : ''}>Urgent</option>
                                    <option value="Done" ${h.status === 'Done' ? 'selected' : ''}>Done</option>
                                </select>
                                <span class="badge ${badgeClass(h.status)}">${h.status}</span>
                                <button class="btn-secondary delete-home" data-id="${h.id}" style="color: var(--color-danger); padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; text-align: right;">
                <h3>Total Household Spending: <span style="color: var(--color-danger);">${formatCurrency(totalCost)}</span></h3>
            </div>
        </div>
    `;

    container.querySelector('#add-home-btn').onclick = () => {
        const task = prompt('Task (e.g. AC Filter Service):');
        if (!task) return;
        const dueIn = prompt('Due In (e.g. 7 days, Tomorrow):', '7 days') || '7 days';
        const cost = Number(prompt('Cost (leave 0 if none):', '0')) || 0;
        state.addHomeTask({ task, dueIn, status: 'Pending', cost });
        showToast('Household task added!');
        renderHome(container);
    };

    container.querySelectorAll('.edit-home-due').forEach(input => {
        input.onchange = () => {
            state.updateHomeTask(Number(input.getAttribute('data-id')), { dueIn: input.value.trim() || 'N/A' });
            renderHome(container);
        };
    });

    container.querySelectorAll('.edit-home-cost').forEach(input => {
        input.onchange = () => {
            state.updateHomeTask(Number(input.getAttribute('data-id')), { cost: Number(input.value) || 0 });
            showToast('Spending updated');
            renderHome(container);
        };
    });

    container.querySelectorAll('.edit-home-status').forEach(select => {
        select.onchange = () => {
            state.updateHomeTask(Number(select.getAttribute('data-id')), { status: select.value });
            renderHome(container);
        };
    });

    container.querySelectorAll('.delete-home').forEach(btn => {
        btn.onclick = () => {
            state.deleteHomeTask(Number(btn.getAttribute('data-id')));
            showToast('Task deleted');
            renderHome(container);
        };
    });
}
