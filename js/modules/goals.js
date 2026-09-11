import { state } from '../state.js';
import { showToast } from '../utils.js';

export function renderGoals(container) {
    container.innerHTML = `
        <div class="goals-page">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Personal Goals & Milestones</h2>
                <button class="btn-primary" id="add-goal-btn"><i class="fa-solid fa-plus"></i> Add Goal</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${state.goals.map(g => `
                    <div class="goal-card" data-id="${g.id}" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <h3 style="font-weight: 600;">${g.title}</h3>
                            <span class="badge badge-success goal-progress-label">${g.progress}% Complete</span>
                        </div>
                        <div style="width: 100%; background: var(--color-background); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                            <div class="goal-progress-bar" style="width: ${g.progress}%; background: var(--color-primary); height: 100%; transition: width 0.2s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--color-muted);">
                            <span>Category: ${g.category}</span>
                            <div class="goal-actions">
                                <label class="goal-progress-control">Progress
                                    <input class="goal-progress-range" type="range" min="0" max="100" value="${g.progress}" aria-label="${g.title} progress">
                                    <input class="goal-progress-number" type="number" min="0" max="100" value="${g.progress}" aria-label="${g.title} progress percentage">%
                                </label>
                                <button class="btn-secondary delete-goal" data-id="${g.id}" style="color: var(--color-danger); padding: 2px 6px;"><i class="fa-solid fa-trash"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelector('#add-goal-btn').onclick = () => {
        const title = prompt('Goal Title:');
        if (!title) return;
        state.addGoal({ title, target: 100, current: 20, category: 'Personal', progress: 20 });
        showToast('Goal added successfully!');
        renderGoals(container);
    };

    container.querySelectorAll('.delete-goal').forEach(btn => {
        btn.onclick = () => {
            state.deleteGoal(Number(btn.getAttribute('data-id')));
            showToast('Goal deleted');
            renderGoals(container);
        };
    });

    container.querySelectorAll('.goal-card').forEach(card => {
        const id = Number(card.dataset.id);
        const range = card.querySelector('.goal-progress-range');
        const number = card.querySelector('.goal-progress-number');
        const label = card.querySelector('.goal-progress-label');
        const bar = card.querySelector('.goal-progress-bar');

        const updateProgress = value => {
            const progress = Math.min(100, Math.max(0, Number(value) || 0));
            range.value = progress;
            number.value = progress;
            label.textContent = `${progress}% Complete`;
            bar.style.width = `${progress}%`;
            state.updateGoal(id, { progress, current: progress });
        };

        range.oninput = () => {
            const progress = Number(range.value);
            number.value = progress;
            label.textContent = `${progress}% Complete`;
            bar.style.width = `${progress}%`;
        };
        range.onchange = () => updateProgress(range.value);
        number.onchange = () => updateProgress(number.value);
    });
}