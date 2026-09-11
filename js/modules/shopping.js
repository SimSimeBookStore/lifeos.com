import { state } from '../state.js';
import { formatCurrency, showToast } from '../utils.js';

function parseQuantityNumber(quantity) {
    const match = /(\d+(\.\d+)?)/.exec(String(quantity ?? ''));
    return match ? Number(match[1]) : 1;
}

export function renderShopping(container) {
    const totalCost = state.shopping.filter(s => !s.purchased).reduce((acc, curr) => acc + parseQuantityNumber(curr.quantity) * (curr.price || 0), 0);
    const totalSpent = state.shopping.filter(s => s.purchased).reduce((acc, curr) => acc + parseQuantityNumber(curr.quantity) * (curr.actualPrice ?? curr.price ?? 0), 0);

    container.innerHTML = `
        <div class="shopping-page">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Smart Shopping List</h2>
                <button class="btn-primary" id="add-shop-btn"><i class="fa-solid fa-plus"></i> Add Item</button>
            </div>
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${state.shopping.map(s => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-background); border-radius: 8px; gap: 12px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 180px;">
                                <input type="checkbox" class="toggle-shop" data-id="${s.id}" ${s.purchased ? 'checked' : ''} style="width: 18px; height: 18px;">
                                <span style="${s.purchased ? 'text-decoration: line-through; color: var(--color-muted);' : 'font-weight: 500;'}">${s.name}</span>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="form-control edit-shop-qty" data-id="${s.id}" value="${s.quantity}" style="width: 90px; padding: 6px 8px;" title="Quantity">
                                <input type="number" class="form-control edit-shop-price" data-id="${s.id}" value="${s.purchased ? (s.actualPrice ?? s.price) : s.price}" style="width: 90px; padding: 6px 8px;" min="0" step="0.01" title="Price (AED)">
                                <button class="btn-secondary delete-shop" data-id="${s.id}" style="color: var(--color-danger); padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; text-align: right;">
                    <h3>Estimated Pending Total: <span style="color: var(--color-warning);">${formatCurrency(totalCost)}</span></h3>
                </div>
                <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; text-align: right;">
                    <h3>Total Spent: <span style="color: var(--color-success);">${formatCurrency(totalSpent)}</span></h3>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#add-shop-btn').onclick = () => {
        const name = prompt('Item Name:');
        if (!name) return;
        const quantity = prompt('Quantity:', '1 unit') || '1 unit';
        const price = Number(prompt('Estimated Price (AED):', '20')) || 0;
        state.addShoppingItem({ name, quantity, price, purchased: false, category: 'Groceries' });
        showToast('Shopping item added!');
        renderShopping(container);
    };

    container.querySelectorAll('.toggle-shop').forEach(box => {
        box.onchange = () => {
            const id = Number(box.getAttribute('data-id'));
            if (box.checked) {
                const item = state.shopping.find(s => s.id === id);
                const actualPrice = Number(prompt('Price paid (AED):', item?.price ?? 0)) || 0;
                state.purchaseShopping(id, actualPrice);
                showToast('Item purchased!');
            } else {
                state.toggleShopping(id);
            }
            renderShopping(container);
        };
    });

    container.querySelectorAll('.delete-shop').forEach(btn => {
        btn.onclick = () => {
            state.deleteShopping(Number(btn.getAttribute('data-id')));
            renderShopping(container);
        };
    });

    container.querySelectorAll('.edit-shop-qty').forEach(input => {
        input.onchange = () => {
            const id = Number(input.getAttribute('data-id'));
            state.updateShoppingItem(id, { quantity: input.value.trim() || '1 unit' });
            renderShopping(container);
        };
    });

    container.querySelectorAll('.edit-shop-price').forEach(input => {
        input.onchange = () => {
            const id = Number(input.getAttribute('data-id'));
            const item = state.shopping.find(s => s.id === id);
            const value = Number(input.value) || 0;
            if (item?.purchased) {
                state.purchaseShopping(id, value);
            } else {
                state.updateShoppingItem(id, { price: value });
            }
            renderShopping(container);
        };
    });
}