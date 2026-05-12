import client from './client';

export const logContext = async (text) => {
  const response = await client.post('/context', { text });
  return response.data;
};
