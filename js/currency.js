const STORAGE_KEY = 'lifeos_currency';

export const CURRENCIES = [
    { code: 'AED', country: 'United Arab Emirates', symbol: 'AED' },
    { code: 'USD', country: 'United States', symbol: '$' },
    { code: 'CAD', country: 'Canada', symbol: 'CA$' },
    { code: 'MXN', country: 'Mexico', symbol: 'MX$' },
    { code: 'EUR', country: 'Eurozone', symbol: '€' },
    { code: 'GBP', country: 'United Kingdom', symbol: '£' },
    { code: 'CHF', country: 'Switzerland', symbol: 'CHF' },
    { code: 'SEK', country: 'Sweden', symbol: 'SEK' },
    { code: 'NOK', country: 'Norway', symbol: 'NOK' },
    { code: 'DKK', country: 'Denmark', symbol: 'DKK' },
    { code: 'PLN', country: 'Poland', symbol: 'PLN' },
    { code: 'TRY', country: 'Turkey', symbol: 'TRY' },
    { code: 'RUB', country: 'Russia', symbol: 'RUB' },
    { code: 'SAR', country: 'Saudi Arabia', symbol: 'SAR' },
    { code: 'QAR', country: 'Qatar', symbol: 'QAR' },
    { code: 'KWD', country: 'Kuwait', symbol: 'KWD' },
    { code: 'BHD', country: 'Bahrain', symbol: 'BHD' },
    { code: 'OMR', country: 'Oman', symbol: 'OMR' },
    { code: 'EGP', country: 'Egypt', symbol: 'EGP' },
    { code: 'ZAR', country: 'South Africa', symbol: 'ZAR' },
    { code: 'NGN', country: 'Nigeria', symbol: 'NGN' },
    { code: 'INR', country: 'India', symbol: '₹' },
    { code: 'PKR', country: 'Pakistan', symbol: 'PKR' },
    { code: 'BDT', country: 'Bangladesh', symbol: 'BDT' },
    { code: 'LKR', country: 'Sri Lanka', symbol: 'LKR' },
    { code: 'JPY', country: 'Japan', symbol: '¥' },
    { code: 'CNY', country: 'China', symbol: '¥' },
    { code: 'KRW', country: 'South Korea', symbol: '₩' },
    { code: 'SGD', country: 'Singapore', symbol: 'SGD' },
    { code: 'MYR', country: 'Malaysia', symbol: 'MYR' },
    { code: 'IDR', country: 'Indonesia', symbol: 'IDR' },
    { code: 'THB', country: 'Thailand', symbol: 'THB' },
    { code: 'PHP', country: 'Philippines', symbol: '₱' },
    { code: 'VND', country: 'Vietnam', symbol: 'VND' },
    { code: 'AUD', country: 'Australia', symbol: 'A$' },
    { code: 'NZD', country: 'New Zealand', symbol: 'NZ$' },
    { code: 'BRL', country: 'Brazil', symbol: 'R$' },
    { code: 'ARS', country: 'Argentina', symbol: 'ARS' },
    { code: 'CLP', country: 'Chile', symbol: 'CLP' },
    { code: 'COP', country: 'Colombia', symbol: 'COP' },
    { code: 'PEN', country: 'Peru', symbol: 'PEN' }
];

export function getCurrency() {
    return localStorage.getItem(STORAGE_KEY) || null;
}

export function setCurrency(code) {
    localStorage.setItem(STORAGE_KEY, code);
}

export function initCurrencySelector() {
    if (!getCurrency()) {
        openCurrencyDialog(true);
    }

    const changeBtn = document.getElementById('currency-toggle');
    if (changeBtn) {
        changeBtn.onclick = () => openCurrencyDialog(false);
    }
}

function openCurrencyDialog(forced) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const current = getCurrency() || 'AED';
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h3>Choose Your Currency</h3>
                ${forced ? '' : '<button class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>'}
            </div>
            <div class="modal-body">
                <form id="currency-form">
                    <div class="form-group">
                        <label for="currency-select">Country / Currency</label>
                        <select id="currency-select" class="form-control">
                            ${CURRENCIES.map(c => `<option value="${c.code}" ${c.code === current ? 'selected' : ''}>${c.country} (${c.code})</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="submit" class="btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    if (!forced) {
        overlay.querySelector('.close-modal-btn').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }

    overlay.querySelector('#currency-form').onsubmit = (e) => {
        e.preventDefault();
        const code = overlay.querySelector('#currency-select').value;
        setCurrency(code);
        close();
        window.location.reload();
    };
}
