export function saveData(key, data) {
    try {
        localStorage.setItem(`lifeos_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
}

export function loadData(key, fallback = []) {
    try {
        const item = localStorage.getItem(`lifeos_${key}`);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error("Error loading from localStorage", e);
        return fallback;
    }
}