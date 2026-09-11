import { loadData, saveData } from './storage.js';
import { defaultData } from './data/default-data.js';
import { syncRemoteMutation } from './supabase.js';

class AppState {
    constructor() {
        this.init();
    }

    init() {
        // First run initialization check
        if (!localStorage.getItem('lifeos_initialized')) {
            saveData('tasks', defaultData.tasks);
            saveData('events', defaultData.events);
            saveData('shopping', defaultData.shopping);
            saveData('transactions', defaultData.transactions);
            saveData('goals', defaultData.goals);
            saveData('notes', defaultData.notes);
            saveData('family', defaultData.family);
            saveData('home', defaultData.home);
            localStorage.setItem('lifeos_initialized', 'true');
        }

        this.tasks = loadData('tasks', []).map(task => ({
            ...task,
            dueDate: task.dueDate || new Date().toISOString().slice(0, 10),
        }));
        this.events = loadData('events', []);
        this.shopping = loadData('shopping', []);
        this.transactions = loadData('transactions', []);
        this.goals = loadData('goals', []);
        this.notes = loadData('notes', []).map(note => ({
            ...note,
            createdAt: note.createdAt || new Date().toISOString(),
        }));
        this.family = loadData('family', []);
        this.home = loadData('home', []);
        this.salary = loadData('salary', 0);

        this.applyMonthlySalary();
    }

    applyMonthlySalary() {
        if (!this.salary || this.salary <= 0) return;
        const now = new Date();
        const alreadyAdded = this.transactions.some(tx => {
            if (tx.category !== 'Salary') return false;
            const txDate = new Date(tx.date || tx.id);
            return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
        });
        if (!alreadyAdded) {
            this.addTransaction({ title: 'Monthly Salary', amount: this.salary, type: 'income', category: 'Salary' });
        }
    }

    setSalary(amount) {
        this.salary = amount;
        this.persist('salary');
        this.applyMonthlySalary();
    }

    persist(key) {
        saveData(key, this[key]);
    }

    addTask(task) {
        const record = { id: Date.now(), ...task };
        this.tasks.push(record);
        this.persist('tasks');
        syncRemoteMutation('tasks', 'insert', record);
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            this.persist('tasks');
            syncRemoteMutation('tasks', 'update', t, { completed: t.completed });
        }
    }

    updateTask(id, changes) {
        const task = this.tasks.find(x => x.id === id);
        if (task) {
            Object.assign(task, changes);
            this.persist('tasks');
            syncRemoteMutation('tasks', 'update', task, changes);
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(x => x.id === id);
        this.tasks = this.tasks.filter(x => x.id !== id);
        this.persist('tasks');
        if (task) syncRemoteMutation('tasks', 'delete', task);
    }

    addEvent(event) {
        const record = { id: Date.now(), ...event };
        this.events.push(record);
        this.persist('events');
        syncRemoteMutation('events', 'insert', record);
    }

    updateEvent(id, changes) {
        const ev = this.events.find(x => x.id === id);
        if (ev) {
            Object.assign(ev, changes);
            this.persist('events');
            syncRemoteMutation('events', 'update', ev, changes);
        }
    }

    deleteEvent(id) {
        const ev = this.events.find(x => x.id === id);
        this.events = this.events.filter(x => x.id !== id);
        this.persist('events');
        if (ev) syncRemoteMutation('events', 'delete', ev);
    }

    addShoppingItem(item) {
        const record = { id: Date.now(), ...item };
        this.shopping.push(record);
        this.persist('shopping');
        syncRemoteMutation('shopping', 'insert', record);
    }

    updateShoppingItem(id, changes) {
        const item = this.shopping.find(x => x.id === id);
        if (item) {
            Object.assign(item, changes);
            this.persist('shopping');
            syncRemoteMutation('shopping', 'update', item, changes);
        }
    }

    toggleShopping(id) {
        const item = this.shopping.find(x => x.id === id);
        if (item) {
            item.purchased = !item.purchased;
            if (!item.purchased) {
                item.actualPrice = undefined;
                if (item.transactionId) {
                    this.deleteTransaction(item.transactionId);
                    item.transactionId = undefined;
                }
            }
            this.persist('shopping');
            syncRemoteMutation('shopping', 'update', item, { purchased: item.purchased });
        }
    }

    purchaseShopping(id, actualPrice) {
        const item = this.shopping.find(x => x.id === id);
        if (item) {
            item.purchased = true;
            item.actualPrice = actualPrice;
            if (item.transactionId && this.transactions.some(t => t.id === item.transactionId)) {
                this.updateTransaction(item.transactionId, { amount: actualPrice, title: `Shopping: ${item.name}` });
            } else {
                const tx = this.addTransaction({ title: `Shopping: ${item.name}`, amount: actualPrice, type: 'expense', category: 'Shopping' });
                item.transactionId = tx.id;
            }
            this.persist('shopping');
        }
    }

    deleteShopping(id) {
        const item = this.shopping.find(x => x.id === id);
        if (item?.transactionId) {
            this.deleteTransaction(item.transactionId);
        }
        this.shopping = this.shopping.filter(x => x.id !== id);
        this.persist('shopping');
        if (item) syncRemoteMutation('shopping', 'delete', item);
    }

    addTransaction(tx) {
        const transaction = { id: Date.now(), date: new Date().toISOString().slice(0, 10), ...tx };
        this.transactions.push(transaction);
        this.persist('transactions');
        syncRemoteMutation('transactions', 'insert', transaction);
        return transaction;
    }

    updateTransaction(id, changes) {
        const tx = this.transactions.find(x => x.id === id);
        if (tx) {
            Object.assign(tx, changes);
            this.persist('transactions');
                syncRemoteMutation('transactions', 'update', tx, changes);
        }
    }

    deleteTransaction(id) {
        const tx = this.transactions.find(x => x.id === id);
        this.transactions = this.transactions.filter(x => x.id !== id);
        this.persist('transactions');
        if (tx) syncRemoteMutation('transactions', 'delete', tx);
    }

    addGoal(goal) {
        const record = { id: Date.now(), ...goal };
        this.goals.push(record);
        this.persist('goals');
        syncRemoteMutation('goals', 'insert', record);
    }

    updateGoal(id, changes) {
        const goal = this.goals.find(x => x.id === id);
        if (goal) {
            Object.assign(goal, changes);
            this.persist('goals');
            syncRemoteMutation('goals', 'update', goal, changes);
        }
    }

    deleteGoal(id) {
        const goal = this.goals.find(x => x.id === id);
        this.goals = this.goals.filter(x => x.id !== id);
        this.persist('goals');
        if (goal) syncRemoteMutation('goals', 'delete', goal);
    }

    addNote(note) {
        const now = new Date().toISOString();
        const record = { id: Date.now(), createdAt: now, updatedAt: now, ...note };
        this.notes.push(record);
        this.persist('notes');
        syncRemoteMutation('notes', 'insert', record);
    }

    updateNote(id, changes) {
        const note = this.notes.find(x => x.id === id);
        if (note) {
            Object.assign(note, changes, { updatedAt: new Date().toISOString() });
            this.persist('notes');
            syncRemoteMutation('notes', 'update', note, changes);
        }
    }

    deleteNote(id) {
        const note = this.notes.find(x => x.id === id);
        this.notes = this.notes.filter(x => x.id !== id);
        this.persist('notes');
        if (note) syncRemoteMutation('notes', 'delete', note);
    }

    addHomeTask(task) {
        const { cost, ...rest } = task;
        const homeTask = { id: Date.now(), cost: cost || 0, ...rest };
        if (homeTask.status === 'Done' && cost > 0) {
            const tx = this.addTransaction({ title: `Household: ${homeTask.task}`, amount: cost, type: 'expense', category: 'Household' });
            homeTask.transactionId = tx.id;
        }
        this.home.push(homeTask);
        this.persist('home');
        syncRemoteMutation('home', 'insert', homeTask);
    }

    updateHomeTask(id, changes) {
        const task = this.home.find(x => x.id === id);
        if (task) {
            Object.assign(task, changes);
            this.syncHomeTaskTransaction(task);
            this.persist('home');
                syncRemoteMutation('home', 'update', task, changes);
        }
    }

    syncHomeTaskTransaction(task) {
        const isDone = task.status === 'Done';
        const hasLinkedTx = task.transactionId && this.transactions.some(t => t.id === task.transactionId);

        if (isDone && task.cost > 0) {
            if (hasLinkedTx) {
                this.updateTransaction(task.transactionId, { amount: task.cost, title: `Household: ${task.task}` });
            } else {
                const tx = this.addTransaction({ title: `Household: ${task.task}`, amount: task.cost, type: 'expense', category: 'Household' });
                task.transactionId = tx.id;
            }
        } else if (!isDone && hasLinkedTx) {
            this.deleteTransaction(task.transactionId);
            task.transactionId = undefined;
        }
    }

    deleteHomeTask(id) {
        const task = this.home.find(x => x.id === id);
        if (task?.transactionId) {
            this.deleteTransaction(task.transactionId);
        }
        this.home = this.home.filter(x => x.id !== id);
        this.persist('home');
        if (task) syncRemoteMutation('home', 'delete', task);
    }

    addFamilyMember(member) {
        this.family.push({ id: Date.now(), ...member });
        this.persist('family');
    }

    updateFamilyMember(id, changes) {
        const member = this.family.find(x => x.id === id);
        if (member) {
            Object.assign(member, changes);
            this.persist('family');
        }
    }

    deleteFamilyMember(id) {
        this.family = this.family.filter(x => x.id !== id);
        this.persist('family');
    }
}

export const state = new AppState();