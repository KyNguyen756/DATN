import { useState, useEffect, useCallback } from 'react';
import {
  Search, Trash2, Shield, UserX, UserCheck, Loader,
  AlertCircle, ChevronDown, CheckCircle
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const roleConfig = {
  user:  { label: 'Khách hàng', cls: 'badge-gray' },
  staff: { label: 'Nhân viên',  cls: 'badge-info' },
  admin: { label: 'Admin',      cls: 'badge-warning' },
};

// Inline role picker dropdown
function RolePicker({ userId, currentRole, onChanged, disabled }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (newRole) => {
    if (newRole === currentRole) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      onChanged(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật vai trò thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const rc = roleConfig[currentRole] || roleConfig.user;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        disabled={disabled || saving}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px', border: '2px solid',
          borderColor: currentRole === 'admin' ? '#F59E0B' : currentRole === 'staff' ? '#3B82F6' : '#9CA3AF',
          background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
          color: currentRole === 'admin' ? '#F59E0B' : currentRole === 'staff' ? '#3B82F6' : '#6B7280',
          transition: 'all 0.15s',
        }}
      >
        {saving
          ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
          : <Shield size={11} />
        }
        {rc.label}
        <ChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
            background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid var(--gray-200)', overflow: 'hidden', minWidth: '130px',
          }}>
            {Object.entries(roleConfig).map(([role, cfg]) => (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 14px',
                  border: 'none', background: role === currentRole ? 'var(--primary-bg)' : 'white',
                  fontSize: '12px', fontWeight: role === currentRole ? '700' : '500',
                  color: role === currentRole ? 'var(--primary)' : 'var(--gray-700)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
                onMouseEnter={e => { if (role !== currentRole) e.currentTarget.style.background = 'var(--gray-50)'; }}
                onMouseLeave={e => { if (role !== currentRole) e.currentTarget.style.background = 'white'; }}
              >
                {role === currentRole && <CheckCircle size={12} color="var(--primary)" />}
                {role !== currentRole && <div style={{ width: 12 }} />}
                {cfg.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users', {
        params: { search: search || undefined, page: 1, limit: 100 }
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 350);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggleLock = async (user) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    if (!confirm(`${newStatus === 'locked' ? 'Khóa' : 'Mở khóa'} tài khoản ${user.username}?`)) return;
    setActionId(user._id);
    try {
      await api.put(`/users/${user._id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Xóa tài khoản ${user.username}? Hành động này không thể hoàn tác.`)) return;
    setActionId(user._id);
    try {
      await api.delete(`/users/${user._id}`);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa tài khoản.');
    } finally {
      setActionId(null);
    }
  };

  const handleRoleChanged = (updatedUser) => {
    setUsers(prev => prev.map(u => u._id === updatedUser._id ? { ...u, role: updatedUser.role } : u));
  };

  const filtered = users.filter(u =>
    roleFilter === 'all' || u.role === roleFilter
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Khách hàng & Nhân viên</h1>
          <p className="section-subtitle">Quản lý tài khoản và phân quyền hệ thống ({total} tổng)</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng tài khoản', value: total,                                         color: 'var(--primary)' },
          { label: 'Khách hàng',     value: users.filter(u => u.role === 'user').length,   color: 'var(--gray-600)' },
          { label: 'Nhân viên',      value: users.filter(u => u.role === 'staff').length,  color: 'var(--info)' },
          { label: 'Đã khóa',        value: users.filter(u => u.status === 'locked').length, color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-input"
            placeholder="Tên, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'user', 'staff', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: '7px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '12px',
              border: `2px solid ${roleFilter === r ? 'var(--primary)' : 'var(--gray-200)'}`,
              background: roleFilter === r ? 'var(--primary-bg)' : 'white',
              color: roleFilter === r ? 'var(--primary)' : 'var(--gray-600)', cursor: 'pointer',
            }}>
              {r === 'all' ? 'Tất cả' : roleConfig[r]?.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ color: 'var(--gray-400)' }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isLocked = u.status === 'locked';
                  const isActing = actionId === u._id;
                  const isSelf   = u._id === currentUser?._id;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'var(--primary-bg)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', color: 'var(--primary)', fontSize: '13px',
                          }}>
                            {u.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>
                              {u.username}
                              {isSelf && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>(Bạn)</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: isLocked ? 'var(--danger)' : 'var(--gray-400)' }}>
                              {isLocked ? '⛔ Đã khóa' : '✓ Hoạt động'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{u.email}</td>

                      {/* ── Inline role picker (admin-only feature) ─────────── */}
                      <td>
                        {isSelf ? (
                          // Can't change own role
                          <span className={`badge ${roleConfig[u.role]?.cls}`}>{roleConfig[u.role]?.label}</span>
                        ) : (
                          <RolePicker
                            userId={u._id}
                            currentRole={u.role}
                            onChanged={handleRoleChanged}
                            disabled={isActing}
                          />
                        )}
                      </td>

                      <td>
                        <span className={`badge ${isLocked ? 'badge-danger' : 'badge-success'}`}>
                          {isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            title={isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                            disabled={isActing || isSelf}
                            onClick={() => handleToggleLock(u)}
                            style={{ color: isLocked ? 'var(--success)' : 'var(--warning)' }}
                          >
                            {isActing ? <Loader size={13} /> : isLocked ? <UserCheck size={13} /> : <UserX size={13} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Xóa tài khoản"
                            disabled={isActing || isSelf}
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(u)}
                          >
                            {isActing ? <Loader size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>
                      Không tìm thấy người dùng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
