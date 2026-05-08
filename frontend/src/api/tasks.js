import client from './client';

export const getTasks = () => client.get('/tasks');
export const getTasksToday = () => client.get('/tasks/today');
export const createTask = (data) => client.post('/tasks', data);
export const getTask = (id) => client.get(`/tasks/${id}`);
export const updateTask = (id, data) => client.patch(`/tasks/${id}`, data);
export const deleteTask = (id) => client.delete(`/tasks/${id}`);
export const completeTask = (id) => client.post(`/tasks/${id}/complete`);
export const reopenTask = (id) => client.post(`/tasks/${id}/reopen`);
export const getTaskHistory = (id) => client.get(`/tasks/${id}/history`);
