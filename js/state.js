import { loadData, saveData } from './storage.js';
import { defaultData } from './data/default-data.js';

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
        this.tasks.push({ id: Date.now(), ...task });
        this.persist('tasks');
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            this.persist('tasks');
        }
    }

    updateTask(id, changes) {
        const task = this.tasks.find(x => x.id === id);
        if (task) {
            Object.assign(task, changes);
            this.persist('tasks');
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(x => x.id !== id);
        this.persist('tasks');
    }

    addEvent(event) {
        this.events.push({ id: Date.now(), ...event });
        this.persist('events');
    }

    updateEvent(id, changes) {
        const ev = this.events.find(x => x.id === id);
        if (ev) {
            Object.assign(ev, changes);
            this.persist('events');
        }
    }

    deleteEvent(id) {
        this.events = this.events.filter(x => x.id !== id);
        this.persist('events');
    }

    addShoppingItem(item) {
        this.shopping.push({ id: Date.now(), ...item });
        this.persist('shopping');
    }

    updateShoppingItem(id, changes) {
        const item = this.shopping.find(x => x.id === id);
        if (item) {
            Object.assign(item, changes);
            this.persist('shopping');
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
    }

    addTransaction(tx) {
        const transaction = { id: Date.now(), date: new Date().toISOString().slice(0, 10), ...tx };
        this.transactions.push(transaction);
        this.persist('transactions');
        return transaction;
    }

    updateTransaction(id, changes) {
        const tx = this.transactions.find(x => x.id === id);
        if (tx) {
            Object.assign(tx, changes);
            this.persist('transactions');
        }
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(x => x.id !== id);
        this.persist('transactions');
    }

    addGoal(goal) {
        this.goals.push({ id: Date.now(), ...goal });
        this.persist('goals');
    }

    updateGoal(id, changes) {
        const goal = this.goals.find(x => x.id === id);
        if (goal) {
            Object.assign(goal, changes);
            this.persist('goals');
        }
    }

    deleteGoal(id) {
        this.goals = this.goals.filter(x => x.id !== id);
        this.persist('goals');
    }

    addNote(note) {
        const now = new Date().toISOString();
        this.notes.push({ id: Date.now(), createdAt: now, updatedAt: now, ...note });
        this.persist('notes');
    }

    updateNote(id, changes) {
        const note = this.notes.find(x => x.id === id);
        if (note) {
            Object.assign(note, changes, { updatedAt: new Date().toISOString() });
            this.persist('notes');
        }
    }

    deleteNote(id) {
        this.notes = this.notes.filter(x => x.id !== id);
        this.persist('notes');
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
    }

    updateHomeTask(id, changes) {
        const task = this.home.find(x => x.id === id);
        if (task) {
            Object.assign(task, changes);
            this.syncHomeTaskTransaction(task);
            this.persist('home');
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