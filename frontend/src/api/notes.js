import client from './client';

export const getNotes = (params) => client.get('/notes', { params });
export const createNote = (data) => client.post('/notes', data);
export const getNote = (id) => client.get(`/notes/${id}`);
export const updateNote = (id, data) => client.patch(`/notes/${id}`, data);
export const deleteNote = (id) => client.delete(`/notes/${id}`);
export const getNoteVersions = (id) => client.get(`/notes/${id}/versions`);
export const restoreNoteVersion = (id, versionId) => client.post(`/notes/${id}/restore/${versionId}`);
export const searchNotes = (query) => client.get('/notes/search', { params: { q: query } });
