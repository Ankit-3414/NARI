import client from './client';

export const getCurrentSession = () => client.get('/study/current');
export const startSession = (data) => client.post('/study/start', data);
export const pauseSession = () => client.post('/study/active/pause');
export const resumeSession = () => client.post('/study/active/resume');
export const stopSession = (notes) => client.post('/study/active/stop', { notes });
export const getSessions = (params) => client.get('/study/sessions', { params });
export const getStudyToday = () => client.get('/study/today');
export const getStudySummary = (date) => client.get('/study/summary', { params: { date } });
export const getStudyWeekly = () => client.get('/study/weekly');
