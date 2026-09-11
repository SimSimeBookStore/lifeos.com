import { state } from '../state.js';
import { formatCurrency, formatDate } from '../utils.js';

export function renderAI(container) {
    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; height: calc(100vh - 140px);">
            <h2 style="margin-bottom: 16px;">LifeOS AI Assistant</h2>
            <div id="ai-messages" style="flex: 1; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--color-background); padding: 12px 16px; border-radius: 8px; max-width: 80%;">
                    Hello Firas! I am your LifeOS Assistant. How can I help you optimize your schedule, summarize tasks, or review financials today?
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <input type="text" class="form-control" id="ai-input" placeholder="Ask LifeOS anything or request a summary...">
                <button class="btn-primary" id="ai-send-btn">Send</button>
            </div>
        </div>
    `;

    const input = container.querySelector('#ai-input');
    const sendBtn = container.querySelector('#ai-send-btn');
    const messages = container.querySelector('#ai-messages');

    const sendMessage = () => {
        const question = input.value.trim();
        if (!question) return;

        appendMessage(question, true);
        appendMessage(getLocalResponse(question));
        input.value = '';
        input.focus();
    };

    sendBtn.onclick = sendMessage;
    input.onkeydown = event => {
        if (event.key === 'Enter') sendMessage();
    };

    function appendMessage(message, isUser = false) {
        const bubble = document.createElement('div');
        bubble.style.cssText = `background: ${isUser ? 'var(--color-primary)' : 'var(--color-background)'}; color: ${isUser ? '#ffffff' : 'inherit'}; padding: 12px 16px; border-radius: 8px; max-width: 80%; align-self: ${isUser ? 'flex-end' : 'flex-start'}; white-space: pre-wrap;`;
        bubble.textContent = message;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }
}

function getLocalResponse(question) {
    const normalizedQuestion = question.toLowerCase();

    if (/task|todo|to-do|checklist/.test(normalizedQuestion)) {
        const completedTasks = state.tasks.filter(task => task.completed).length;
        const pendingTasks = state.tasks.filter(task => !task.completed);
        if (!pendingTasks.length) return `You have completed all ${state.tasks.length} tasks. Excellent work.`;
        return `You have completed ${completedTasks} of ${state.tasks.length} tasks. Your remaining tasks are:\n${pendingTasks.map(task => `- ${task.title}`).join('\n')}`;
    }

    if (/calendar|schedule|event|appointment|meeting/.test(normalizedQuestion)) {
        if (!state.events.length) return 'Your calendar is clear. There are no upcoming events saved in LifeOS.';
        return `You have ${state.events.length} saved calendar event${state.events.length === 1 ? '' : 's'}:\n${state.events.map(event => `- ${event.title} on ${formatDate(event.date)}${event.time ? ` at ${event.time}` : ''}`).join('\n')}`;
    }

    if (/note|notes|remember/.test(normalizedQuestion)) {
        if (!state.notes.length) return 'You do not have any personal notes yet. Add one from the Notes section.';
        return `You have ${state.notes.length} personal note${state.notes.length === 1 ? '' : 's'}:\n${state.notes.map(note => `- ${note.title} (${note.category || 'General'})`).join('\n')}`;
    }

    if (/shop|shopping|buy|purchase|grocery/.test(normalizedQuestion)) {
        const pendingItems = state.shopping.filter(item => !item.purchased);
        if (!pendingItems.length) return 'Your shopping list is clear. There are no pending items.';
        return `You have ${pendingItems.length} pending shopping item${pendingItems.length === 1 ? '' : 's'}:\n${pendingItems.map(item => `- ${item.name}${item.quantity ? ` (${item.quantity})` : ''}`).join('\n')}`;
    }

    if (/goal|goals|progress|achievement/.test(normalizedQuestion)) {
        if (!state.goals.length) return 'You have not added any goals yet.';
        return `Your current goals are:\n${state.goals.map(goal => `- ${goal.title}: ${goal.progress ?? 0}% complete`).join('\n')}`;
    }

    if (/money|finance|financial|spend|spent|expense|income|budget/.test(normalizedQuestion)) {
        const income = state.transactions.filter(tx => tx.type === 'income').reduce((total, tx) => total + Number(tx.amount || 0), 0);
        const expenses = state.transactions.filter(tx => tx.type === 'expense').reduce((total, tx) => total + Number(tx.amount || 0), 0);
        return `Here is your saved financial summary:\n- Income: ${formatCurrency(income)}\n- Expenses: ${formatCurrency(expenses)}\n- Balance: ${formatCurrency(income - expenses)}`;
    }

    if (/hello|hi|hey|help/.test(normalizedQuestion)) {
        return 'I can summarize your tasks, schedule, notes, shopping list, goals, or finances. Try asking "What tasks are left?" or "How much have I spent?"';
    }

    return 'I can answer questions about your saved LifeOS data. Try asking about tasks, calendar events, notes, shopping, goals, or finances. More open-ended questions will be available when a backend AI service is connected.';
}