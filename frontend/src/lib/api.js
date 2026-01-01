import { API_BASE } from '../config';

// Subjects
export async function getSubjects() {
    const res = await fetch(`${API_BASE}/subjects`);
    return res.json();
}

export async function addSubject(name) {
    const res = await fetch(`${API_BASE}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return res.json();
}

export async function deleteSubject(name) {
    const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(name)}`, {
        method: 'DELETE'
    });
    return res.json();
}

// Tasks
export async function getTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
}

export async function createTask(title, priority = 'medium', dueDate = null) {
    const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, due_date: dueDate })
    });
    return res.json();
}

export async function updateTask(id, status) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    return res.json();
}

export async function deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE'
    });
    return res.json();
}

// Notes
export async function getNotes() {
    const res = await fetch(`${API_BASE}/notes`);
    return res.json();
}

export async function createNote(title, content = '') {
    const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    return res.json();
}

export async function deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE'
    });
    return res.json();
}

// Study sessions
export async function getStudyStatus() {
    const res = await fetch(`${API_BASE}/study/status`);
    return res.json();
}

export async function startStudy(subject) {
    const res = await fetch(`${API_BASE}/study/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject })
    });
    return res.json();
}

export async function stopStudy(save = true) {
    const res = await fetch(`${API_BASE}/study/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save })
    });
    return res.json();
}

// Health check
export async function getHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return { ok: res.ok };
    } catch (e) {
        return { ok: false };
    }
}

// Activity
export async function getActivityLog() {
    const res = await fetch(`${API_BASE}/activity?t=${Date.now()}`);
    return res.json();
}
