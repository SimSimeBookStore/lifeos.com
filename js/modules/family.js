import { state } from '../state.js';
import { showToast } from '../utils.js';

export function renderFamily(container) {
    container.innerHTML = `
        <div class="family-page">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Family Organization</h2>
                <button class="btn-primary" id="add-family-btn"><i class="fa-solid fa-plus"></i> Add Member</button>
            </div>
            <div class="family-panel">
                <h3 style="margin-bottom: 16px;">Family Members & Important Dates</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${state.family.map(f => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-background); border-radius: 8px; gap: 12px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <input type="text" class="form-control edit-family-name" data-id="${f.id}" value="${f.name}" style="width: 130px; padding: 6px 8px;" title="Name">
                                <input type="text" class="form-control edit-family-relation" data-id="${f.id}" value="${f.relation}" style="width: 110px; padding: 6px 8px;" title="Relation">
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="date" class="form-control edit-family-birthday" data-id="${f.id}" value="${f.birthday}" style="padding: 6px 8px;" title="Birthday">
                                <button class="btn-secondary delete-family" data-id="${f.id}" style="color: var(--color-danger); padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    container.querySelector('#add-family-btn').onclick = () => {
        const name = prompt('Family Member Name:');
        if (!name) return;
        const relation = prompt('Relation (e.g. Spouse, Son, Daughter):', 'Family') || 'Family';
        const birthday = prompt('Birthday (YYYY-MM-DD):', new Date().toISOString().slice(0, 10)) || '';
        state.addFamilyMember({ name, relation, birthday });
        showToast('Family member added!');
        renderFamily(container);
    };

    container.querySelectorAll('.edit-family-name').forEach(input => {
        input.onchange = () => {
            state.updateFamilyMember(Number(input.getAttribute('data-id')), { name: input.value.trim() || 'Unnamed' });
            renderFamily(container);
        };
    });

    container.querySelectorAll('.edit-family-relation').forEach(input => {
        input.onchange = () => {
            state.updateFamilyMember(Number(input.getAttribute('data-id')), { relation: input.value.trim() || 'Family' });
            renderFamily(container);
        };
    });

    container.querySelectorAll('.edit-family-birthday').forEach(input => {
        input.onchange = () => {
            state.updateFamilyMember(Number(input.getAttribute('data-id')), { birthday: input.value });
            renderFamily(container);
        };
    });

    container.querySelectorAll('.delete-family').forEach(btn => {
        btn.onclick = () => {
            state.deleteFamilyMember(Number(btn.getAttribute('data-id')));
            showToast('Family member removed');
            renderFamily(container);
        };
    });
}