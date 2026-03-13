import api from './api';

const ENDPOINT = '/auth';

export const authService = {
  register: (data) => api.post(`${ENDPOINT}/register`, data),
  login: (data) => api.post(`${ENDPOINT}/login`, data),
};
