import client from '../api/client';

/**
 * Standard CRUD action helpers to reduce repetition in entity configuration.
 */
const crud = (base) => ({
  CREATE: (data) => {
    const { _tempId, ...payload } = data;
    return client.post(base, payload);
  },
  UPDATE: (data) => {
    const { id, ...payload } = data;
    return client.patch(`${base}/${id}`, payload);
  },
  DELETE: (data) => client.delete(`${base}/${data.id}`),
});

/**
 * Entity-specific sync configuration.
 * Maps entity types and actions to their corresponding API calls.
 */
export const ENTITY_CONFIG = {
  tasks: {
    ...crud('/tasks'),
    COMPLETE: (data) => client.post(`/tasks/${data.id}/complete`),
    REOPEN: (data) => client.post(`/tasks/${data.id}/reopen`),
  },
  notes: {
    ...crud('/notes'),
  },
  habits: {
    ...crud('/habits'),
    COMPLETE: (data) => client.post(`/habits/${data.id}/complete`, { note: data.note }),
  },
  goals: {
    ...crud('/goals'),
    PROGRESS: (data) => client.post(`/goals/${data.id}/progress`, null, { params: { increment: data.increment } }),
  },
  context: {
    LOG: (data) => client.post('/context', { text: data.text, is_private: data.is_private }),
  },
  subjects: {
    ...crud('/subjects'),
  }
};
