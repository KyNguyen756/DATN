import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const emptyForm = { name: '', city: '', address: '', phone: '', isActive: true };

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stations');
      setStations(res.data?.stations || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bến xe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const openAdd = () => {
    setEditStation(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStation(s);
    setForm({ name: s.name, city: s.city, address: s.address || '', phone: s.phone || '', isActive: s.isActive !== false });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.city) { setFormError('Tên bến và thành phố là bắt buộc.'); return; }
    setSaving(true);
    try {
      if (editStation) {
        await api.put(`/stations/${editStation._id}`, form);
      } else {
        await api.post('/stations', form);
      }
      setShowModal(false);
      fetchStations();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (station) => {
    if (!confirm(`Xóa bến "${station.name}"? Hành động này không thể hoàn tác.`)) return;
    setActionId(station._id);
    try {
      await api.delete(`/stations/${station._id}`);
      setStations(prev => prev.filter(s => s._id !== station._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bến xe.');
    } finally {
      setActionId(null);
    }
  };

  const filtered = stations.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by city for the donut summary
  const cities = [...new Set(stations.map(s => s.city))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Bến xe & Điểm dừng</h1>
          <p className="section-subtitle">Quản lý hệ thống bến xe ({stations.length} bến)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm bến xe
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng bến xe', value: stations.length, color: 'var(--primary)' },
          { label: 'Thành phố có bến', value: cities.length, color: 'var(--info)' },
          { label: 'Đang hoạt động', value: stations.filter(s => s.isActive !== false).length, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative" style={{ marginBottom: '16px', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input className="form-input" placeholder="Tìm tên bến, thành phố..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
      </div>

      {error && (
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tên bến xe</th>
                  <th>Thành phố</th>
                  <th>Địa chỉ</th>
                  <th>Điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MapPin size={15} color="var(--primary)" />
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{s.city}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--gray-600)', maxWidth: '220px' }}>{s.address || '—'}</td>
                    <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{s.phone || '—'}</td>
                    <td>
                      {s.isActive !== false
                        ? <span className="badge badge-success">Hoạt động</span>
                        : <span className="badge badge-gray">Tạm dừng</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm" disabled={actionId === s._id} onClick={() => openEdit(s)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={actionId === s._id} onClick={() => handleDelete(s)}>
                          {actionId === s._id ? <Loader size={13} /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Không tìm thấy bến xe nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{editStation ? 'Chỉnh sửa bến xe' : 'Thêm bến xe mới'}</h3>

            {formError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tên bến xe *</label>
                  <input className="form-input" placeholder="Bến xe Miền Đông" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Thành phố *</label>
                  <input className="form-input" placeholder="TP.HCM" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="form-input" placeholder="292 Đinh Bộ Lĩnh, Q.Bình Thạnh" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" type="tel" placeholder="028 3899 9999" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} style={{ accentColor: 'var(--primary)' }} />
                Đang hoạt động
              </label>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} {editStation ? 'Cập nhật' : 'Thêm bến'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
