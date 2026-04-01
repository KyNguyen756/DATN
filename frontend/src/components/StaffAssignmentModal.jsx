import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, MapPin, Check, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import busCompanyApi from '../api/busCompanyApi';

/**
 * StaffAssignmentModal
 * Props:
 *   company    {object}  The BusCompany object (with .stations[], ._id, .name)
 *   onClose    {fn}      Called when the modal should be dismissed
 *   onSuccess  {fn}      Called after a successful assignment (triggers list refresh)
 */
export default function StaffAssignmentModal({ company, onClose, onSuccess }) {
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState([]); // unassigned staff
  const [selected, setSelected] = useState(null);   // single user picked
  const [stationIds, setStationIds] = useState([]);  // stations to grant
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch staff who are not yet assigned to any company
  const fetchCandidates = useCallback(async (q = '') => {
    setLoadingUsers(true);
    setError('');
    try {
      const { data } = await api.get('/users', {
        params: { role: 'staff', busCompany: 'none', search: q, limit: 50 }
      });
      setCandidates(data.users || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates(search);
  };

  const toggleStation = (id) => {
    setStationIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAssign = async () => {
    if (!selected) return setError('Vui lòng chọn một nhân viên');
    setError('');
    setSaving(true);
    try {
      await busCompanyApi.assignStaff(selected._id, company._id, stationIds);
      setSuccessMsg(`Đã gán ${selected.username} vào nhà xe ${company.name}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e) {
      setError(e.response?.data?.message || 'Gán nhân viên thất bại');
    } finally {
      setSaving(false);
    }
  };

  const stations = company.stations || [];

  // ── Styles ──────────────────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px',
  };
  const modalStyle = {
    background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  };
  const headerStyle = {
    padding: '20px 24px', borderBottom: '1px solid var(--gray-100)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const inputStyle = {
    width: '100%', padding: '9px 12px 9px 36px',
    border: '1px solid var(--gray-200)', borderRadius: '8px',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };
  const labelSm = { fontSize: '12px', fontWeight: '700', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)' }}>Gán nhân viên</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>vào {company.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div style={{ margin: '16px 24px 0', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '13px', fontWeight: '600' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ margin: '16px 24px 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontSize: '13px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Scrollable body — 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
          {/* LEFT: staff picker */}
          <div style={{ borderRight: '1px solid var(--gray-100)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ ...labelSm, marginBottom: '10px' }}>Chọn nhân viên</div>
              <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  style={inputStyle}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, email..."
                  onKeyDown={e => e.key === 'Enter' && fetchCandidates(search)}
                />
              </form>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '6px' }}>Chỉ hiản thị staff chưa thuộc nhà xe nào</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {loadingUsers ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  Đang tải...
                </div>
              ) : candidates.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                  Không tìm thấy nhân viên nào<br />chưa được gán compay
                </div>
              ) : (
                candidates.map(u => {
                  const isSelected = selected?._id === u._id;
                  return (
                    <button
                      key={u._id}
                      onClick={() => { setSelected(isSelected ? null : u); setError(''); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                        background: isSelected ? 'rgba(255,107,53,0.06)' : 'transparent',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        background: isSelected ? 'var(--primary)' : 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '13px',
                        transition: 'background 0.15s',
                      }}>
                        {(u.username || 'S')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.username}
                          {isSelected && <Check size={13} style={{ color: 'var(--primary)' }} />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: station assignment */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ ...labelSm, marginBottom: '4px' }}>Phân quyền bến xe</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                {selected ? `Chọn bến ${selected.username} được quản lý` : 'Chọn nhân viên trước'}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {stations.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                  Nhà xe chưa có bến xe nào.<br />Thêm bến trong tab "Bến xe".
                </div>
              ) : (
                <>
                  {/* Select all */}
                  <button
                    onClick={() => setStationIds(stationIds.length === stations.length ? [] : stations.map(s => s._id))}
                    disabled={!selected}
                    style={{
                      width: '100%', padding: '8px 12px', marginBottom: '8px', borderRadius: '8px',
                      border: '1px dashed var(--gray-300)', background: 'var(--gray-50)',
                      fontSize: '12px', color: 'var(--gray-600)', cursor: selected ? 'pointer' : 'not-allowed',
                      fontWeight: '600', opacity: selected ? 1 : 0.45,
                    }}
                  >
                    {stationIds.length === stations.length ? '☑ Bỏ chọn tất cả' : '☐ Chọn tất cả bến'}
                  </button>

                  {stations.map(st => {
                    const checked = stationIds.includes(st._id);
                    return (
                      <label
                        key={st._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', borderRadius: '10px', marginBottom: '4px',
                          border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--gray-200)'}`,
                          background: checked ? 'rgba(255,107,53,0.05)' : 'white',
                          cursor: selected ? 'pointer' : 'not-allowed',
                          opacity: selected ? 1 : 0.45,
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => selected && toggleStation(st._id)}
                          disabled={!selected}
                          style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                        />
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: checked ? 'rgba(255,107,53,0.1)' : 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin size={13} style={{ color: checked ? 'var(--primary)' : 'var(--gray-400)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>{st.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{st.city}</div>
                        </div>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-50)', borderRadius: '0 0 16px 16px' }}>
          {/* Preview of selection */}
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {selected
              ? <span><strong style={{ color: 'var(--gray-800)' }}>{selected.username}</strong> · {stationIds.length}/{stations.length} bến</span>
              : 'Chưa chọn nhân viên'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose}
              style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: 'var(--gray-700)' }}>
              Hủy
            </button>
            <button
              onClick={handleAssign}
              disabled={!selected || saving}
              style={{
                padding: '9px 20px', borderRadius: '8px',
                background: !selected || saving ? 'var(--gray-300)' : 'var(--primary)',
                color: 'white', fontWeight: '700', fontSize: '13px', border: 'none',
                cursor: !selected || saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                transition: 'background 0.2s',
              }}
            >
              <UserPlus size={14} />
              {saving ? 'Đang gán...' : 'Gán nhân viên'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
