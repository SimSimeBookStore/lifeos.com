import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://vcsfpaemlxofgbtuksct.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0DwiZpdMj9Bjt8xUcjWg9g_HoWh71f1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function getSupabaseAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('display_name,address,country,phone').eq('id', user.id).maybeSingle();
    const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
    return { id: user.id, familyId: family?.id || null, name: profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User', email: user.email || '', address: profile?.address || '', country: profile?.country || '', phone: profile?.phone || '' };
}

export async function ensureSupabaseProfile(user, details = {}) {
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: details.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        address: details.address || null,
        country: details.country || null,
        phone: details.phone || null,
    });
    if (profileError) throw profileError;

    let { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
    if (!family) {
        const { data, error } = await supabase.from('families').insert({ owner_id: user.id, name: `${details.name || 'My'} Family` }).select('id').single();
        if (error) throw error;
        family = data;
    }
    await supabase.from('family_members').upsert({ family_id: family.id, user_id: user.id, role: 'adult' }, { onConflict: 'family_id,user_id' });
    return { ...user, familyId: family.id };
}

export async function signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return getSupabaseAccount();
}

export async function signUpWithPassword(email, password, details) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: details.name } } });
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Check your email to confirm your account before signing in.');
    await ensureSupabaseProfile(data.user, details);
    return getSupabaseAccount();
}

export async function signOutSupabase() {
    await supabase.auth.signOut();
}

export async function migrateLocalStateToSupabase(account, localState) {
    if (!account?.id || !account.familyId) return;
    const migrationKey = `lifeos_supabase_migrated_${account.id}`;
    if (localStorage.getItem(migrationKey)) return;

    const checks = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('family_id', account.familyId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('family_id', account.familyId),
        supabase.from('shopping_items').select('id', { count: 'exact', head: true }).eq('family_id', account.familyId),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('family_id', account.familyId),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('family_id', account.familyId),
    ]);
    if (checks.some(result => result.error) || checks.some(result => (result.count || 0) > 0)) {
        localStorage.setItem(migrationKey, 'skipped-existing-remote-data');
        return;
    }

    const operations = [
        bulkInsert('tasks', (localState.tasks || []).map(task => toRemotePayload('tasks', task, {}, account.id, account.familyId))),
        bulkInsert('events', (localState.events || []).map(event => toRemotePayload('events', event, {}, account.id, account.familyId))),
        bulkInsert('shopping_items', (localState.shopping || []).map(item => toRemotePayload('shopping', item, {}, account.id, account.familyId))),
        bulkInsert('notes', (localState.notes || []).map(note => toRemotePayload('notes', note, {}, account.id, account.familyId))),
        bulkInsert('goals', (localState.goals || []).map(goal => toRemotePayload('goals', goal, {}, account.id, account.familyId))),
        bulkInsert('expenses', (localState.transactions || []).filter(tx => tx.type === 'expense').map(tx => toRemotePayload('transactions', tx, {}, account.id, account.familyId))),
        bulkInsert('income_records', (localState.transactions || []).filter(tx => tx.type === 'income').map(tx => toRemotePayload('transactions', tx, {}, account.id, account.familyId))),
        bulkInsert('maintenance_records', (localState.home || []).map(task => toRemotePayload('home', task, {}, account.id, account.familyId))),
    ];
    const results = await Promise.all(operations);
    const failed = results.find(result => result.error);
    if (failed) throw failed.error;
    localStorage.setItem(migrationKey, 'complete');
}

async function bulkInsert(table, rows) {
    if (!rows.length) return { error: null };
    const { error } = await supabase.from(table).insert(rows);
    return { error };
}

function numericId(uuid, index) {
    const value = Number.parseInt(String(uuid).replace(/-/g, '').slice(-8), 16);
    return Number.isFinite(value) ? value : Date.now() + index;
}

export async function loadRemoteState(familyId) {
    if (!familyId) return null;
    const [tasks, events, shopping, notes, goals, expenses, income, maintenance] = await Promise.all([
        supabase.from('tasks').select('id,title,details,completed').eq('family_id', familyId),
        supabase.from('events').select('id,title,details,starts_at').eq('family_id', familyId),
        supabase.from('shopping_items').select('id,title,completed').eq('family_id', familyId),
        supabase.from('notes').select('id,title,content,category,audio_data,audio_mime_type,created_at,updated_at').eq('family_id', familyId),
        supabase.from('goals').select('id,title,details,category,target,current,progress,due_date').eq('family_id', familyId),
        supabase.from('expenses').select('id,amount,category,description,spent_at').eq('family_id', familyId),
        supabase.from('income_records').select('id,amount,category,source,received_on').eq('family_id', familyId),
        supabase.from('maintenance_records').select('id,title,area,due_date').eq('family_id', familyId),
    ]);
    const hasRemoteData = [tasks, events, shopping, notes, goals, expenses, income, maintenance].some(result => result.data?.length);
    if (!hasRemoteData) return null;
    return {
        tasks: tasks.data?.map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, title: row.title, completed: row.completed, category: 'Personal', priority: 'Medium', dueDate: row.details ? safeJson(row.details).dueDate || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) })) || [],
        events: events.data?.map((row, index) => { const details = safeJson(row.details); const date = new Date(row.starts_at); return { id: numericId(row.id, index), remoteId: row.id, title: row.title, date: date.toISOString().slice(0, 10), time: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), location: details.location || 'Office', contactPhone: details.contactPhone || '', reminder: details.reminder ?? 10 }; }) || [],
        shopping: shopping.data?.map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, name: row.title, quantity: '1 unit', price: 0, purchased: row.completed, category: 'Groceries' })) || [],
        notes: notes.data?.map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, ...row, audioData: row.audio_data, audioMimeType: row.audio_mime_type, createdAt: row.created_at, updatedAt: row.updated_at })) || [],
        goals: goals.data?.map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, ...row, dueDate: row.due_date })) || [],
        transactions: [
            ...(income.data || []).map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, title: row.source, amount: Number(row.amount), type: 'income', category: row.category || 'General', date: row.received_on })),
            ...(expenses.data || []).map((row, index) => ({ id: numericId(row.id, index + (income.data?.length || 0)), remoteId: row.id, title: row.description, amount: Number(row.amount), type: 'expense', category: row.category, date: row.spent_at })),
        ],
        home: maintenance.data?.map((row, index) => ({ id: numericId(row.id, index), remoteId: row.id, task: row.title, dueIn: row.due_date || 'N/A', dueDate: row.due_date || '', status: 'Pending', cost: 0 })) || [],
    };
}

export function syncRemoteMutation(entity, operation, record, changes = {}) {
    void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
        if (!family) return;
        const familyId = family.id;
        const table = entity === 'shopping' ? 'shopping_items' : entity === 'home' ? 'maintenance_records' : entity === 'transactions' ? (record?.type === 'income' ? 'income_records' : 'expenses') : entity;
        const remoteId = record?.remoteId;
        if (operation === 'delete') {
            if (remoteId) await supabase.from(table).delete().eq('id', remoteId);
            return;
        }
        const payload = toRemotePayload(entity, record, changes, user.id, familyId);
        if (operation === 'insert') {
            const { data, error } = await supabase.from(table).insert(payload).select('id').single();
            if (error) throw error;
            if (data?.id) record.remoteId = data.id;
        } else if (remoteId) {
            const { error } = await supabase.from(table).update(payload).eq('id', remoteId);
            if (error) throw error;
        }
    })().catch(error => console.warn(`Supabase ${entity} sync failed`, error.message));
}

function toRemotePayload(entity, record, changes, ownerId, familyId) {
    const value = { ...record, ...changes };
    if (entity === 'tasks') return { owner_id: ownerId, family_id: familyId, title: value.title, completed: Boolean(value.completed), details: JSON.stringify({ dueDate: value.dueDate, category: value.category, priority: value.priority, contactPhone: value.contactPhone }) };
    if (entity === 'events') return { owner_id: ownerId, family_id: familyId, title: value.title, starts_at: toEventTimestamp(value.date, value.time), details: JSON.stringify({ location: value.location, contactPhone: value.contactPhone, reminder: value.reminder }) };
    if (entity === 'shopping') return { owner_id: ownerId, family_id: familyId, title: value.name, completed: Boolean(value.purchased) };
    if (entity === 'notes') return { owner_id: ownerId, family_id: familyId, title: value.title, content: value.content || '', category: value.category || 'General', audio_data: value.audioData || null, audio_mime_type: value.audioMimeType || null };
    if (entity === 'goals') return { owner_id: ownerId, family_id: familyId, title: value.title, details: value.details || null, category: value.category || 'Personal', target: Number(value.target || 100), current: Number(value.current || 0), progress: Number(value.progress || 0), due_date: value.dueDate || null };
    if (entity === 'transactions') return value.type === 'income'
        ? { owner_id: ownerId, family_id: familyId, source: value.title, amount: Number(value.amount || 0), category: value.category || null, received_on: value.date || new Date().toISOString().slice(0, 10) }
        : { owner_id: ownerId, family_id: familyId, amount: Number(value.amount || 0), category: value.category || 'Other', description: value.title, spent_at: value.date || new Date().toISOString().slice(0, 10) };
    if (entity === 'home') return { owner_id: ownerId, family_id: familyId, title: value.task, area: value.area || null, due_date: value.dueDate || null };
    return value;
}

function toEventTimestamp(date, time) {
    const parsed = new Date(`${date || new Date().toISOString().slice(0, 10)} ${time || '12:00 PM'}`);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function safeJson(value) {
    try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}
