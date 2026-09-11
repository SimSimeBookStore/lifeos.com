import { state } from '../state.js';
import { showToast } from '../utils.js';
import { getContactPhone } from '../auth.js';

export function renderCalendar(container) {
    const calendarState = { view: 'month', date: startOfDay(new Date()) };

    const renderView = () => {
        const viewStart = getViewStart(calendarState.date, calendarState.view);
        const viewEnd = getViewEnd(calendarState.date, calendarState.view);
        container.innerHTML = `
            <div class="calendar-page">
                <div class="calendar-toolbar">
                    <div>
                        <h2>Calendar & Appointments</h2>
                        <p class="calendar-subtitle">Click any date or time slot to schedule an event.</p>
                    </div>
                    <button class="btn-primary" id="add-event-btn"><i class="fa-solid fa-plus"></i> Add Event</button>
                </div>
                <div class="calendar-controls">
                    <div class="calendar-nav-group">
                        <button class="btn-secondary" id="today-btn">Today</button>
                        <button class="icon-btn" id="previous-period" title="Previous period" aria-label="Previous period"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="icon-btn" id="next-period" title="Next period" aria-label="Next period"><i class="fa-solid fa-chevron-right"></i></button>
                        <strong>${getPeriodLabel(calendarState.date, calendarState.view)}</strong>
                    </div>
                    <div class="calendar-view-switcher" role="group" aria-label="Calendar view">
                        ${['month', 'week', 'day'].map(view => `<button class="calendar-view-btn ${calendarState.view === view ? 'active' : ''}" data-view="${view}">${capitalize(view)}</button>`).join('')}
                    </div>
                </div>
                <div class="calendar-grid-shell">
                    ${calendarState.view === 'month' ? renderMonthGrid(calendarState.date) : renderTimeGrid(calendarState.date, calendarState.view)}
                </div>
                <p class="calendar-range">${formatDateLabel(viewStart)}${viewStart.getTime() !== viewEnd.getTime() ? ` - ${formatDateLabel(viewEnd)}` : ''}</p>
            </div>
        `;

        container.querySelector('#add-event-btn').onclick = () => openEventDialog(container, null, renderView);
        container.querySelector('#today-btn').onclick = () => { calendarState.date = startOfDay(new Date()); renderView(); };
        container.querySelector('#previous-period').onclick = () => { calendarState.date = shiftDate(calendarState.date, calendarState.view, -1); renderView(); };
        container.querySelector('#next-period').onclick = () => { calendarState.date = shiftDate(calendarState.date, calendarState.view, 1); renderView(); };
        container.querySelectorAll('.calendar-view-btn').forEach(button => {
            button.onclick = () => { calendarState.view = button.dataset.view; renderView(); };
        });
        bindCalendarInteractions(container, renderView);
    };

    renderView();
}

function renderMonthGrid(date) {
    const firstDay = startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
    const cells = Array.from({ length: 42 }, (_, index) => addDays(firstDay, index));
    return `
        <div class="month-grid">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
            ${cells.map(cellDate => {
                const dateKey = toDateKey(cellDate);
                const events = state.events.filter(event => event.date === dateKey);
                const isOutsideMonth = cellDate.getMonth() !== date.getMonth();
                const isToday = dateKey === toDateKey(new Date());
                return `<button class="month-cell ${isOutsideMonth ? 'outside-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateKey}" aria-label="Schedule event on ${formatDateLabel(cellDate)}">
                    <span class="month-cell-number">${cellDate.getDate()}</span>
                    <span class="month-events">${events.slice(0, 3).map(event => renderEventChip(event)).join('')}${events.length > 3 ? `<span class="more-events">+${events.length - 3} more</span>` : ''}</span>
                </button>`;
            }).join('')}
        </div>
    `;
}

function renderTimeGrid(date, view) {
    const dates = view === 'day' ? [date] : Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(date), index));
    const hours = Array.from({ length: 24 }, (_, index) => index);
    return `
        <div class="time-grid" style="--calendar-columns: ${dates.length};">
            <div class="time-grid-corner"></div>
            ${dates.map(day => `<div class="time-grid-day ${toDateKey(day) === toDateKey(new Date()) ? 'today' : ''}"><strong>${day.toLocaleDateString(undefined, { weekday: 'short' })}</strong><span>${day.getDate()}</span></div>`).join('')}
            ${hours.map(hour => `<div class="time-label">${formatHour(hour)}</div>${dates.map(day => {
                const dateKey = toDateKey(day);
                const events = state.events.filter(event => event.date === dateKey && parseTimeToHour(event.time) === hour);
                return `<button class="time-slot" data-date="${dateKey}" data-hour="${hour}" aria-label="Schedule event on ${formatDateLabel(day)} at ${formatHour(hour)}">${events.map(event => renderEventChip(event, true)).join('')}</button>`;
            }).join('')}`).join('')}
        </div>
    `;
}

function bindCalendarInteractions(container, renderView) {
    container.querySelectorAll('[data-date]').forEach(cell => {
        cell.onclick = event => {
            const eventButton = event.target.closest('.calendar-event');
            if (eventButton) {
                event.stopPropagation();
                const existingEvent = state.events.find(item => item.id === Number(eventButton.dataset.id));
                if (existingEvent) openEventDialog(container, existingEvent, renderView);
                return;
            }
            const time = cell.dataset.hour === undefined ? '' : `${String(cell.dataset.hour).padStart(2, '0')}:00`;
            openEventDialog(container, null, renderView, cell.dataset.date, time);
        };
    });
}

function renderEventChip(event, compact = false) {
    const title = escapeHtml(event.title);
    const callAction = event.contactPhone ? `<a class="call-action calendar-call-action" href="tel:${encodeURIComponent(event.contactPhone)}" title="Call event contact" aria-label="Call event contact"><i class="fa-solid fa-phone"></i></a>` : '';
    return `<span class="calendar-event ${compact ? 'compact' : ''}" data-id="${event.id}" title="${title}"><strong>${escapeHtml(event.time || 'All day')}</strong> ${title}${callAction}</span>`;
}

function getViewStart(date, view) {
    if (view === 'month') return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
    return view === 'week' ? startOfWeek(date) : date;
}

function getViewEnd(date, view) {
    if (view === 'month') return addDays(getViewStart(date, view), 41);
    return view === 'week' ? addDays(startOfWeek(date), 6) : date;
}

function getPeriodLabel(date, view) {
    if (view === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (view === 'day') return formatDateLabel(date);
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function shiftDate(date, view, amount) {
    if (view === 'month') return new Date(date.getFullYear(), date.getMonth() + amount, 1);
    return addDays(date, view === 'week' ? amount * 7 : amount);
}

function startOfWeek(date) {
    return addDays(startOfDay(date), -startOfDay(date).getDay());
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return startOfDay(result);
}

function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
}

function parseTimeToHour(time) {
    const match = /^(\d+):\d+\s*(AM|PM)$/i.exec(time || '');
    if (!match) return -1;
    let hour = Number(match[1]);
    if (match[2].toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (match[2].toUpperCase() === 'AM' && hour === 12) hour = 0;
    return hour;
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
    })[character]);
}

export function openEventDialog(container, existingEvent, onSaved, selectedDate, selectedTime) {
    const isEdit = !!existingEvent;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Event' : 'Add Event'}</h3>
                <button class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="event-form">
                    <div class="form-group">
                        <label for="ev-title">Event Title</label>
                        <input type="text" id="ev-title" class="form-control" value="${isEdit ? existingEvent.title : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="ev-date">Date</label>
                        <input type="date" id="ev-date" class="form-control" value="${isEdit ? existingEvent.date : selectedDate || toDateKey(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label for="ev-time">Time</label>
                        <input type="time" id="ev-time" class="form-control" value="${isEdit ? parseTimeTo24(existingEvent.time) : selectedTime || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="ev-location">Location</label>
                        <input type="text" id="ev-location" class="form-control" value="${isEdit ? existingEvent.location : ''}" placeholder="Office">
                    </div>
                    <div class="form-group">
                        <label for="ev-phone">Contact telephone (optional)</label>
                        <input type="tel" id="ev-phone" class="form-control" value="${isEdit ? existingEvent.contactPhone || '' : getContactPhone()}" placeholder="+971 50 123 4567">
                    </div>
                    <div class="form-group">
                        <label for="ev-reminder">Remind Me Before</label>
                        <select id="ev-reminder" class="form-control">
                            <option value="0">At time of event</option>
                            <option value="5">5 minutes before</option>
                            <option value="10">10 minutes before</option>
                            <option value="15">15 minutes before</option>
                            <option value="30">30 minutes before</option>
                            <option value="60">1 hour before</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn-secondary" id="cancel-event-btn">Cancel</button>
                        <button type="submit" class="btn-primary">Save Event</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    if (isEdit) {
        overlay.querySelector('#ev-reminder').value = String(existingEvent.reminder ?? 10);
    }

    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.querySelector('#cancel-event-btn').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    overlay.querySelector('#event-form').onsubmit = (e) => {
        e.preventDefault();
        const title = overlay.querySelector('#ev-title').value.trim();
        const date = overlay.querySelector('#ev-date').value;
        const timeRaw = overlay.querySelector('#ev-time').value;
        const location = overlay.querySelector('#ev-location').value.trim() || 'Office';
        const contactPhone = overlay.querySelector('#ev-phone').value.trim();
        const reminder = Number(overlay.querySelector('#ev-reminder').value);
        if (!title || !date || !timeRaw) return;

        const time = formatTime(timeRaw);
        if (isEdit) {
            state.updateEvent(existingEvent.id, { title, date, time, location, contactPhone, reminder });
            showToast('Event updated successfully!');
        } else {
            state.addEvent({ title, date, time, location, contactPhone, reminder });
            showToast('Event added successfully!');
        }
        close();
        if (onSaved) onSaved();
        else if (container) renderCalendar(container);
    };
}

function formatTime(timeRaw) {
    const [h, m] = timeRaw.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function parseTimeTo24(timeStr) {
    const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(timeStr);
    if (!match) return '';
    let [, h, m, period] = match;
    h = Number(h);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
}