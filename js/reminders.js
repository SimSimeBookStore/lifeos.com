import { state } from './state.js';
import { showToast } from './utils.js';

const notifiedEventIds = new Set();

export function initReminders() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    checkEvents();
    setInterval(checkEvents, 20000);
}

function checkEvents() {
    const now = new Date();
    state.events.forEach(ev => {
        if (notifiedEventIds.has(ev.id)) return;
        const eventDate = parseEventDateTime(ev);
        if (!eventDate) return;

        const reminderMinutes = Number(ev.reminder ?? 10);
        const alarmTime = new Date(eventDate.getTime() - reminderMinutes * 60000);
        const diff = now - alarmTime;
        // Fire once the reminder time has arrived, within a 1-minute window
        if (diff >= 0 && diff < 60000) {
            notifiedEventIds.add(ev.id);
            triggerAlarm(ev, reminderMinutes);
        }
    });
}

function parseEventDateTime(ev) {
    if (!ev.date || !ev.time) return null;
    const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(ev.time);
    if (!match) return null;
    let [, h, m, period] = match;
    h = Number(h);
    m = Number(m);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    const [y, mo, d] = ev.date.split('-').map(Number);
    if (!y || !mo || !d) return null;
    return new Date(y, mo - 1, d, h, m, 0);
}

function triggerAlarm(ev, reminderMinutes) {
    const message = reminderMinutes > 0
        ? `⏰ Reminder: "${ev.title}" starts in ${reminderMinutes} minute${reminderMinutes === 1 ? '' : 's'} at ${ev.location}!`
        : `⏰ Reminder: "${ev.title}" is happening now at ${ev.location}!`;
    showToast(message);

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Event Reminder', { body: `${ev.title} — ${ev.time} at ${ev.location}` });
    }

    playBeep();
}

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        // Audio not available in this environment
    }
}
