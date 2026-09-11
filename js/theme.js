const STORAGE_KEY = 'lifeos_accent';

export const ACCENTS = {
    emerald: {
        name: 'Emerald Green', primary: '#168a72', hover: '#0f6f5d', soft: '#e4f5ef',
        light: { background: '#eefaf5', surface: 'rgba(255, 255, 255, 0.86)', surfaceHover: '#e3f5ee', text: '#203d38', muted: '#5f7d76', border: '#c8e7dc' },
        dark: { background: '#0c211b', surface: '#14352b', surfaceHover: '#1e4a3d', text: '#e8fff7', muted: '#9bcbbd', border: '#28604e' },
    },
    ocean: {
        name: 'Ocean Blue', primary: '#2674c8', hover: '#1b5ca3', soft: '#e5f0fc',
        light: { background: '#edf6ff', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#e1effd', text: '#203852', muted: '#607b96', border: '#c9def2' },
        dark: { background: '#0d1d31', surface: '#142c47', surfaceHover: '#1d4164', text: '#e9f5ff', muted: '#9ab7d2', border: '#2c587e' },
    },
    sunset: {
        name: 'Sunset Orange', primary: '#e05a47', hover: '#c74636', soft: '#fff0e5',
        light: { background: '#fff8f0', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#fff0e4', text: '#25344a', muted: '#66758a', border: '#f1d7c7' },
        dark: { background: '#2b1715', surface: '#40211d', surfaceHover: '#5a2d26', text: '#fff1eb', muted: '#d5aaa0', border: '#754239' },
    },
    rose: {
        name: 'Rose Pink', primary: '#c84d77', hover: '#aa3b62', soft: '#fbe8ef',
        light: { background: '#fff1f6', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#fce5ef', text: '#482738', muted: '#896477', border: '#efcbd9' },
        dark: { background: '#2b1521', surface: '#422031', surfaceHover: '#5b2a42', text: '#fff0f6', muted: '#d2a2b7', border: '#75405a' },
    },
    lime: {
        name: 'Neon Lime', primary: '#5dbb3f', hover: '#429c2b', soft: '#e8f8df', glow: '#a7ff70',
        light: { background: '#f4fbe9', surface: 'rgba(255, 255, 255, 0.86)', surfaceHover: '#e7f6d8', text: '#29401f', muted: '#6d805f', border: '#d1e7bd' },
        dark: { background: '#14210f', surface: '#20341a', surfaceHover: '#2d4b22', text: '#f1ffe8', muted: '#b2d59d', border: '#477332' },
    },
    violet: {
        name: 'Electric Violet', primary: '#8b5cf6', hover: '#7041d4', soft: '#f0eaff', glow: '#b99aff',
        light: { background: '#f6f1ff', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#eee5ff', text: '#33254d', muted: '#75678b', border: '#ddcff7' },
        dark: { background: '#1b1230', surface: '#2a1b49', surfaceHover: '#3d2868', text: '#f5eeff', muted: '#c0a9e0', border: '#604294' },
    },
    aqua: {
        name: 'Aqua Cyan', primary: '#079db5', hover: '#057d92', soft: '#dff8fb', glow: '#67efff',
        light: { background: '#ebfbfc', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#dcf5f8', text: '#173d44', muted: '#63838a', border: '#c4e8ec' },
        dark: { background: '#0b2025', surface: '#12353c', surfaceHover: '#1b505a', text: '#e8fdff', muted: '#9dced3', border: '#2b6974' },
    },
    magenta: {
        name: 'Hot Magenta', primary: '#e33d8f', hover: '#c62a75', soft: '#ffe5f1', glow: '#ff85be',
        light: { background: '#fff0f7', surface: 'rgba(255, 255, 255, 0.88)', surfaceHover: '#ffe2ef', text: '#4b2039', muted: '#8c6479', border: '#f0c5d9' },
        dark: { background: '#2a1021', surface: '#41162f', surfaceHover: '#5b2042', text: '#fff0f8', muted: '#dca1c2', border: '#783258' },
    },
};

export function getAccent() {
    return localStorage.getItem(STORAGE_KEY) || 'sunset';
}

export function applyAccent(accentKey) {
    const key = ACCENTS[accentKey] ? accentKey : 'sunset';
    const accent = ACCENTS[key];
    const palette = accent[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', accent.primary);
    root.style.setProperty('--color-primary-hover', accent.hover);
    root.style.setProperty('--color-primary-soft', accent.soft);
    root.style.setProperty('--color-primary-glow', accent.glow || accent.primary);
    root.style.setProperty('--color-background', palette.background);
    root.style.setProperty('--color-surface', palette.surface);
    root.style.setProperty('--color-surface-hover', palette.surfaceHover);
    root.style.setProperty('--color-text', palette.text);
    root.style.setProperty('--color-muted', palette.muted);
    root.style.setProperty('--color-border', palette.border);
    root.dataset.accent = key;
    localStorage.setItem(STORAGE_KEY, key);
    return key;
}

export function initAccentSelector() {
    const accentButton = document.getElementById('accent-toggle');
    if (!accentButton) return;

    const updateButton = () => {
        accentButton.innerHTML = `<i class="fa-solid fa-palette"></i> <span>Accent: ${ACCENTS[getAccent()].name}</span>`;
    };

    applyAccent(getAccent());
    updateButton();
    accentButton.onclick = () => openAccentDialog(updateButton);
}

function openAccentDialog(onSaved) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const current = getAccent();
    overlay.innerHTML = `
        <div class="modal-card accent-modal-card">
            <div class="modal-header">
                <h3>Choose Accent Color</h3>
                <button class="close-modal-btn" title="Close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p class="accent-description">Personalize your LifeOS buttons, highlights, and active navigation color.</p>
                <form id="accent-form">
                    <div class="accent-options">
                        ${Object.entries(ACCENTS).map(([key, accent]) => `
                            <label class="accent-option ${key === current ? 'selected' : ''}">
                                <input type="radio" name="accent" value="${key}" ${key === current ? 'checked' : ''}>
                                <span class="accent-swatch" style="background: ${accent.primary};"></span>
                                <span>${accent.name}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn-secondary" id="cancel-accent-btn">Cancel</button>
                        <button type="submit" class="btn-primary">Apply Accent</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.querySelector('#cancel-accent-btn').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.querySelectorAll('input[name="accent"]').forEach(input => {
        input.onchange = () => {
            overlay.querySelectorAll('.accent-option').forEach(option => option.classList.remove('selected'));
            input.closest('.accent-option').classList.add('selected');
        };
    });
    overlay.querySelector('#accent-form').onsubmit = event => {
        event.preventDefault();
        applyAccent(overlay.querySelector('input[name="accent"]:checked').value);
        close();
        onSaved();
    };
}
