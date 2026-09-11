import { state } from '../state.js';
import { formatCurrency, showToast } from '../utils.js';

function txDate(tx) {
    return new Date(tx.date || tx.id);
}

function isThisMonth(tx) {
    const d = txDate(tx);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function printTable(title, headers, rows) {
    const printWindow = window.open('', '_blank');
    const headerCells = headers.map(h => `<th class="${h.numeric ? 'numeric' : ''}">${h.label}</th>`).join('');
    const bodyRows = rows.map(row => `<tr>${row.map((cell, i) => `<td class="${headers[i]?.numeric ? 'numeric' : ''}">${cell}</td>`).join('')}</tr>`).join('');
    printWindow.document.write(
        '<html><head><title>' + title + '</title><style>' +
        'body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }' +
        'h1 { font-size: 1.25rem; margin-bottom: 16px; }' +
        'table { width: 100%; border-collapse: collapse; }' +
        'th, td { padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; }' +
        'th { background: #f1f5f9; }' +
        '.numeric { text-align: right; }' +
        '</style></head><body>' +
        '<h1>' + title + '</h1>' +
        '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + bodyRows + '</tbody></table>' +
        '</body></html>'
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

export function renderMoney(container) {
    const monthTransactions = state.transactions.filter(isThisMonth);
    const income = monthTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const balance = income - expenses;
    const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    container.innerHTML = `
        <div class="money-page">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Personal Finance Organizer</h2>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-secondary" id="set-salary-btn"><i class="fa-solid fa-sack-dollar"></i> ${state.salary ? 'Salary: ' + formatCurrency(state.salary) : 'Set Monthly Salary'}</button>
                    <button class="btn-secondary" id="print-ledger-btn"><i class="fa-solid fa-print"></i> Print</button>
                    <button class="btn-secondary" id="annual-budget-btn"><i class="fa-solid fa-chart-pie"></i> Annual Budget</button>
                    <button class="btn-primary" id="add-tx-btn"><i class="fa-solid fa-plus"></i> Add Transaction</button>
                </div>
            </div>
            <p style="color: var(--color-muted); margin-bottom: 16px;">Showing <strong style="color: var(--color-text);">${monthLabel}</strong> — resets automatically each month. See Annual Budget for full year history.</p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
                <div style="background: var(--color-surface); padding: 20px; border-radius: 12px; border: 1px solid var(--color-border);">
                    <div style="color: var(--color-muted); font-size: 0.85rem;">Income This Month</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${formatCurrency(income)}</div>
                </div>
                <div style="background: var(--color-surface); padding: 20px; border-radius: 12px; border: 1px solid var(--color-border);">
                    <div style="color: var(--color-muted); font-size: 0.85rem;">Expenses This Month</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-danger);">${formatCurrency(expenses)}</div>
                </div>
                <div style="background: var(--color-surface); padding: 20px; border-radius: 12px; border: 1px solid var(--color-border);">
                    <div style="color: var(--color-muted); font-size: 0.85rem;">Remaining Balance</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${formatCurrency(balance)}</div>
                </div>
            </div>
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
                <h3 style="margin-bottom: 16px;">Transaction Ledgers (${monthLabel})</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${monthTransactions.length ? monthTransactions.map(tx => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-background); border-radius: 8px;">
                            <div>
                                <h4 style="font-weight: 600;">${tx.title}</h4>
                                <span class="badge badge-success">${tx.category}</span>
                            </div>
                            <div style="display: flex; gap: 16px; align-items: center;">
                                <span style="font-weight: 700; color: ${tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'};">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</span>
                                <button class="btn-secondary delete-tx" data-id="${tx.id}" style="color: var(--color-danger); padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--color-muted); text-align: center; padding: 20px 0;">No transactions yet this month.</p>'}
                </div>
            </div>
        </div>
    `;

    container.querySelector('#add-tx-btn').onclick = () => {
        const title = prompt('Transaction Description:');
        if (!title) return;
        const amount = Number(prompt('Amount (AED):', '100')) || 0;
        const type = prompt('Type (income / expense):', 'expense') === 'income' ? 'income' : 'expense';
        state.addTransaction({ title, amount, type, category: 'General' });
        showToast('Transaction added successfully!');
        renderMoney(container);
    };

    container.querySelector('#set-salary-btn').onclick = () => {
        const amount = Number(prompt('Monthly Salary (AED):', state.salary || 0));
        if (isNaN(amount) || amount < 0) return;
        state.setSalary(amount);
        showToast('Monthly salary saved! It will be added as income each month.');
        renderMoney(container);
    };

    container.querySelector('#annual-budget-btn').onclick = () => openAnnualBudgetDialog();

    container.querySelector('#print-ledger-btn').onclick = () => {
        printTable(
            `Transaction Ledger — ${monthLabel}`,
            [{ label: 'Title' }, { label: 'Category' }, { label: 'Type' }, { label: 'Amount', numeric: true }],
            monthTransactions.map(tx => [tx.title, tx.category, tx.type, `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}`])
        );
    };

    container.querySelectorAll('.delete-tx').forEach(btn => {
        btn.onclick = () => {
            state.deleteTransaction(Number(btn.getAttribute('data-id')));
            showToast('Transaction removed');
            renderMoney(container);
        };
    });
}

function openAnnualBudgetDialog() {
    const years = Array.from(new Set(state.transactions.map(tx => txDate(tx).getFullYear())));
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    years.sort((a, b) => b - a);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card" style="max-width: 640px;">
            <div class="modal-header">
                <h3>Annual Budget</h3>
                <button class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="budget-year">Year</label>
                    <select id="budget-year" class="form-control">
                        ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                    <button type="button" class="btn-secondary" id="print-budget-btn"><i class="fa-solid fa-print"></i> Print</button>
                </div>
                <div id="budget-summary"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    const yearSelect = overlay.querySelector('#budget-year');
    const summaryEl = overlay.querySelector('#budget-summary');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const renderSummary = () => {
        const year = Number(yearSelect.value);
        const yearTx = state.transactions.filter(tx => txDate(tx).getFullYear() === year);

        let cumulative = 0;
        const rows = monthNames.map((name, month) => {
            const monthTx = yearTx.filter(tx => txDate(tx).getMonth() === month);
            const income = monthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
            const expenses = monthTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
            const savings = income - expenses;
            cumulative += savings;
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid var(--color-border);">${name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right; color: var(--color-success);">${formatCurrency(income)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right; color: var(--color-danger);">${formatCurrency(expenses)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right; color: var(--color-primary);">${formatCurrency(savings)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right; font-weight: 600;">${formatCurrency(cumulative)}</td>
                </tr>
            `;
        }).join('');

        const yearIncome = yearTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const yearExpenses = yearTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        const yearSavings = yearIncome - yearExpenses;

        summaryEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--color-background); border-radius: 8px;">
                    <span>Yearly Income</span>
                    <span style="font-weight: 700; color: var(--color-success);">${formatCurrency(yearIncome)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--color-background); border-radius: 8px;">
                    <span>Yearly Spending</span>
                    <span style="font-weight: 700; color: var(--color-danger);">${formatCurrency(yearExpenses)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--color-background); border-radius: 8px;">
                    <span>Yearly Savings</span>
                    <span style="font-weight: 700; color: var(--color-primary);">${formatCurrency(yearSavings)}</span>
                </div>
                <div style="overflow-x: auto; margin-top: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="color: var(--color-muted); text-align: left;">
                                <th style="padding: 8px; border-bottom: 1px solid var(--color-border);">Month</th>
                                <th style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right;">Income</th>
                                <th style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right;">Spending</th>
                                <th style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right;">Savings</th>
                                <th style="padding: 8px; border-bottom: 1px solid var(--color-border); text-align: right;">Cumulative</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    };

    overlay.querySelector('#print-budget-btn').onclick = () => {
        const year = Number(yearSelect.value);
        const yearTx = state.transactions.filter(tx => txDate(tx).getFullYear() === year);
        let cumulative = 0;
        const rows = monthNames.map((name, month) => {
            const monthTx = yearTx.filter(tx => txDate(tx).getMonth() === month);
            const income = monthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
            const expenses = monthTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
            const savings = income - expenses;
            cumulative += savings;
            return [name, formatCurrency(income), formatCurrency(expenses), formatCurrency(savings), formatCurrency(cumulative)];
        });
        printTable(
            `Annual Budget — ${year}`,
            [{ label: 'Month' }, { label: 'Income', numeric: true }, { label: 'Spending', numeric: true }, { label: 'Savings', numeric: true }, { label: 'Cumulative', numeric: true }],
            rows
        );
    };

    yearSelect.onchange = renderSummary;
    renderSummary();
}