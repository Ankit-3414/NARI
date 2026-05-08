import client from './client';

export const getSubjects = (params) => client.get('/subjects', { params });
export const createSubject = (data) => client.post('/subjects', data);
export const getSubject = (id) => client.get(`/subjects/${id}`);
export const updateSubject = (id, data) => client.patch(`/subjects/${id}`, data);
export const deleteSubject = (id) => client.delete(`/subjects/${id}`);
export const getSubjectStats = (id) => client.get(`/subjects/${id}/stats`);
