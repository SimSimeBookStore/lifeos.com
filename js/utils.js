export function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

export function formatCurrency(amount) {
    const code = localStorage.getItem('lifeos_currency') || 'AED';
    const symbols = { AED: 'AED', USD: '$', CAD: 'CA$', MXN: 'MX$', EUR: '€', GBP: '£', CHF: 'CHF', SEK: 'SEK', NOK: 'NOK', DKK: 'DKK', PLN: 'PLN', TRY: 'TRY', RUB: 'RUB', SAR: 'SAR', QAR: 'QAR', KWD: 'KWD', BHD: 'BHD', OMR: 'OMR', EGP: 'EGP', ZAR: 'ZAR', NGN: 'NGN', INR: '₹', PKR: 'PKR', BDT: 'BDT', LKR: 'LKR', JPY: '¥', CNY: '¥', KRW: '₩', SGD: 'SGD', MYR: 'MYR', IDR: 'IDR', THB: 'THB', PHP: '₱', VND: 'VND', AUD: 'A$', NZD: 'NZ$', BRL: 'R$', ARS: 'ARS', CLP: 'CLP', COP: 'COP', PEN: 'PEN' };
    const symbol = symbols[code] || code;
    return `${symbol} ${Number(amount || 0).toLocaleString()}`;
}