export const defaultData = {
    tasks: [
        { id: 1, title: 'Morning exercise', completed: true, category: 'Health', priority: 'Medium' },
        { id: 2, title: 'Check emails & communications', completed: true, category: 'Work', priority: 'High' },
        { id: 3, title: 'Prepare healthy breakfast', completed: true, category: 'Home', priority: 'Low' },
        { id: 4, title: 'Buy weekly groceries', completed: false, category: 'Shopping', priority: 'High' },
        { id: 5, title: 'Pay monthly electricity bill', completed: false, category: 'Finance', priority: 'High' }
    ],
    events: [
        { id: 1, title: 'Team Strategy Meeting', time: '10:00 AM', date: '2026-09-11', location: 'Zoom' },
        { id: 2, title: 'Lunch with Client', time: '1:00 PM', date: '2026-09-11', location: 'Downtown' },
        { id: 3, title: 'Evening Workout Session', time: '5:30 PM', date: '2026-09-11', location: 'Gym' }
    ],
    shopping: [
        { id: 1, name: 'Organic Milk', quantity: '2L', price: 15, purchased: false, category: 'Groceries' },
        { id: 2, name: 'Artisan Bread', quantity: '1 loaf', price: 10, purchased: false, category: 'Groceries' },
        { id: 3, name: 'Free-range Eggs', quantity: '12 pack', price: 22, purchased: false, category: 'Groceries' },
        { id: 4, name: 'Basmati Rice', quantity: '5kg', price: 35, purchased: false, category: 'Groceries' },
        { id: 5, name: 'Fresh Apples', quantity: '1kg', price: 12, purchased: true, category: 'Groceries' }
    ],
    transactions: [
        { id: 1, title: 'Monthly Salary', amount: 12000, type: 'income', category: 'Housing', date: '2026-09-01' },
        { id: 2, title: 'Apartment Rent', amount: 4500, type: 'expense', category: 'Housing', date: '2026-09-02' },
        { id: 3, title: 'Grocery Supermarket', amount: 850, type: 'expense', category: 'Food', date: '2026-09-05' },
        { id: 4, title: 'Utilities & Internet', amount: 650, type: 'expense', category: 'Utilities', date: '2026-09-06' }
    ],
    goals: [
        { id: 1, title: 'Save for New Car', target: 40000, current: 30000, category: 'Financial', progress: 75 },
        { id: 2, title: 'Read 12 Books this Year', target: 12, current: 8, category: 'Personal', progress: 66 },
        { id: 3, title: 'Master Advanced JavaScript', target: 100, current: 80, category: 'Career', progress: 80 }
    ],
    notes: [
        { id: 1, title: 'App Architecture Thoughts', content: 'Ensure clean separation between UI components and local state stores.', category: 'Work' },
        { id: 2, title: 'Weekend Trip Ideas', content: 'Visit mountain resorts or relaxing beachside retreats.', category: 'Personal' }
    ],
    family: [
        { id: 1, name: 'Sara', relation: 'Spouse', birthday: '1992-05-14' },
        { id: 2, name: 'Zayn', relation: 'Son', birthday: '2018-08-22' }
    ],
    home: [
        { id: 1, task: 'AC Filter Service', dueIn: '12 days', status: 'Pending' },
        { id: 2, task: 'Water Purifier Maintenance', dueIn: '25 days', status: 'Pending' },
        { id: 3, task: 'Electricity Bill Settlement', dueIn: 'Tomorrow', status: 'Urgent' }
    ]
};