import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Custom hook for fetching trips with search params.
 *
 * @param {object} params - { from, to, date, type, limit }
 * @param {boolean} autoFetch - if true, fetches immediately on mount
 */
export function useTrips(params = {}, autoFetch = false) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const merged = { ...params, ...overrideParams };
      const endpoint = (merged.from || merged.to || merged.date)
        ? '/trips/search'
        : '/trips';

      const cleanParams = {};
      Object.entries(merged).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'Tất cả') cleanParams[k] = v;
      });

      const res = await api.get(endpoint, { params: cleanParams });
      const data = Array.isArray(res.data) ? res.data : (res.data?.trips || []);
      setTrips(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách chuyến xe.';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (autoFetch) fetch(params);
  }, []); // eslint-disable-line

  return { trips, loading, error, fetch, setTrips };
}
