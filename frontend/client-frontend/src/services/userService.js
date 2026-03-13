import api from './api';

const ENDPOINT = '/users';

export const userService = {
  login: (data) => api.post(`${ENDPOINT}/login`, data),
  register: (data) => api.post(`${ENDPOINT}/register`, data),
  getProfile: () => api.get(`${ENDPOINT}/profile`),
};
