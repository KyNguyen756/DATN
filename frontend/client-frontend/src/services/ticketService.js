import api from './api';

const ENDPOINT = '/booking';

export const ticketService = {
  getUserTickets: () => api.get(`${ENDPOINT}/my`),
};
