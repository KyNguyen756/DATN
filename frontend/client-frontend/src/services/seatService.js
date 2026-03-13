import api from './api';

const ENDPOINT = '/tripseats';

export const seatService = {
  getLayout: (tripId) => api.get(`${ENDPOINT}/${tripId}`),
  lock: (tripSeatId) => api.post(`${ENDPOINT}/lock`, { tripSeatId }),
  unlock: (tripSeatId) => api.post(`${ENDPOINT}/unlock`, { tripSeatId }),
};
