import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Custom hook for fetching and updating the current user's profile.
 *
 * Returns a unified flat profile object:
 * { _id, username, email, phone, role, status, createdAt, avatar, firstName, lastName }
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    setSaveError('');
    setSaving(true);
    try {
      const res = await api.put('/users/profile', updates);
      // updateProfile returns { user: {...} }
      const updated = res.data?.user || res.data;
      setProfile(prev => ({ ...prev, ...updated }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Không thể cập nhật hồ sơ.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    profile, loading, error,
    saving, saveError, saveSuccess,
    fetchProfile, updateProfile, setProfile
  };
}
