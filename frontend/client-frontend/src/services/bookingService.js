import api from './api';

const ENDPOINT = '/booking';

export const bookingService = {
  create: (data) => api.post(ENDPOINT, data),
  getMyBookings: () => api.get(`${ENDPOINT}/my`),
  confirm: (id) => api.post(`${ENDPOINT}/${id}/confirm`),
};
