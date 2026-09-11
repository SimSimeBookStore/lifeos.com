import { state } from '../state.js';
import { formatDate, showToast } from '../utils.js';

export function renderNotes(container) {
    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2>Personal Notes</h2>
                <button class="btn-primary" id="add-note-btn"><i class="fa-solid fa-plus"></i> Add Note</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                ${state.notes.map(n => `
                    <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                                <h3 style="font-weight: 600;">${escapeHtml(n.title)}</h3>
                                <button class="btn-secondary edit-note" data-id="${n.id}" title="Edit note" aria-label="Edit ${escapeHtml(n.title)}" style="padding: 4px 8px;"><i class="fa-solid fa-pen"></i></button>
                            </div>
                            <p style="font-size: 0.9rem; color: var(--color-muted); white-space: pre-wrap;">${escapeHtml(n.content)}</p>
                            ${n.audioData ? `<audio class="note-audio" controls preload="none" src="${n.audioData}"></audio>` : ''}
                            <p style="font-size: 0.75rem; color: var(--color-muted); margin-top: 14px;">Written ${formatDate(n.createdAt)}${n.updatedAt && n.updatedAt !== n.createdAt ? ` · Updated ${formatDate(n.updatedAt)}` : ''}</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="badge badge-success">${escapeHtml(n.category)}</span>
                            <button class="btn-secondary delete-note" data-id="${n.id}" title="Delete note" aria-label="Delete ${escapeHtml(n.title)}" style="color: var(--color-danger); padding: 4px 8px;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelector('#add-note-btn').onclick = () => openNoteDialog(container);

    container.querySelectorAll('.edit-note').forEach(btn => {
        btn.onclick = () => {
            const note = state.notes.find(item => item.id === Number(btn.dataset.id));
            if (note) openNoteDialog(container, note);
        };
    });

    container.querySelectorAll('.delete-note').forEach(btn => {
        btn.onclick = () => {
            state.deleteNote(Number(btn.getAttribute('data-id')));
            showToast('Note deleted');
            renderNotes(container);
        };
    });
}

function openNoteDialog(container, existingNote) {
    const isEdit = Boolean(existingNote);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Personal Note' : 'Add Personal Note'}</h3>
                <button class="close-modal-btn" title="Close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="note-form">
                    <div class="form-group">
                        <label for="note-title">Title</label>
                        <input type="text" id="note-title" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="note-category">Category</label>
                        <input type="text" id="note-category" class="form-control" placeholder="General">
                    </div>
                    <div class="form-group">
                        <label for="note-content">Note</label>
                        <textarea id="note-content" class="form-control" rows="6" required></textarea>
                    </div>
                    <div class="note-voice-tools">
                        <div class="note-voice-actions">
                            <button type="button" class="btn-secondary" id="record-note-btn"><i class="fa-solid fa-microphone"></i> Record Voice</button>
                            <button type="button" class="btn-secondary" id="voice-to-text-btn"><i class="fa-solid fa-waveform-lines"></i> Voice to Text</button>
                        </div>
                        <span id="voice-status" class="form-help">Voice recording is saved with this note.</span>
                        ${existingNote?.audioData ? `<audio id="note-audio-preview" controls preload="none" src="${existingNote.audioData}"></audio>` : '<audio id="note-audio-preview" controls class="hidden"></audio>'}
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn-secondary" id="cancel-note-btn">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Save Note'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#note-title').value = existingNote?.title || '';
    overlay.querySelector('#note-category').value = existingNote?.category || 'General';
    overlay.querySelector('#note-content').value = existingNote?.content || '';

    let audioData = existingNote?.audioData || '';
    let audioMimeType = existingNote?.audioMimeType || '';
    let mediaRecorder;
    let recordingStream;
    let recordingChunks = [];
    let recognition;

    const close = () => overlay.remove();
    overlay.querySelector('.close-modal-btn').onclick = close;
    overlay.querySelector('#cancel-note-btn').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.querySelector('#record-note-btn').onclick = async () => {
        const button = overlay.querySelector('#record-note-btn');
        const status = overlay.querySelector('#voice-status');
        if (mediaRecorder?.state === 'recording') {
            mediaRecorder.stop();
            button.innerHTML = '<i class="fa-solid fa-microphone"></i> Record Voice';
            status.textContent = 'Finishing recording...';
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            status.textContent = 'Voice recording is not supported in this browser.';
            return;
        }
        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordingChunks = [];
            mediaRecorder = new MediaRecorder(recordingStream);
            audioMimeType = mediaRecorder.mimeType;
            mediaRecorder.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordingChunks, { type: audioMimeType || 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    audioData = reader.result;
                    const preview = overlay.querySelector('#note-audio-preview');
                    preview.src = audioData;
                    preview.classList.remove('hidden');
                    status.textContent = 'Voice note ready. Save the note to keep it.';
                };
                reader.readAsDataURL(blob);
                recordingStream?.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            button.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Recording';
            status.textContent = 'Recording...';
        } catch (error) {
            status.textContent = 'Microphone permission was not granted.';
        }
    };
    overlay.querySelector('#voice-to-text-btn').onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const status = overlay.querySelector('#voice-status');
        if (!SpeechRecognition) {
            status.textContent = 'Voice to Text is not supported in this browser.';
            return;
        }
        recognition?.stop();
        recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = false;
        recognition.onstart = () => { status.textContent = 'Listening... speak now.'; };
        recognition.onresult = event => {
            const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ');
            const contentField = overlay.querySelector('#note-content');
            contentField.value = `${contentField.value.trim()}${contentField.value.trim() ? '\n' : ''}${transcript}`;
            status.textContent = 'Voice added to the note. You can edit the text before saving.';
        };
        recognition.onerror = () => { status.textContent = 'Voice to Text could not hear a clear recording.'; };
        recognition.onend = () => { if (status.textContent === 'Listening... speak now.') status.textContent = 'Voice to Text stopped.'; };
        recognition.start();
    };
    overlay.querySelector('#note-form').onsubmit = event => {
        event.preventDefault();
        const title = overlay.querySelector('#note-title').value.trim();
        const category = overlay.querySelector('#note-category').value.trim() || 'General';
        const content = overlay.querySelector('#note-content').value.trim();
        if (!title || !content) return;

        if (isEdit) {
            state.updateNote(existingNote.id, { title, category, content, audioData, audioMimeType });
            showToast('Note updated successfully!');
        } else {
            state.addNote({ title, category, content, audioData, audioMimeType });
            showToast('Note saved successfully!');
        }
        close();
        renderNotes(container);
    };
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