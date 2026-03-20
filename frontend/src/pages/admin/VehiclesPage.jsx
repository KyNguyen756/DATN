import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Settings, Loader, AlertCircle, X, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const busTypes = ['seater', 'sleeper', 'limousine'];
const typeLabels = { seater: 'Ghế ngồi', sleeper: 'Giường nằm', limousine: 'Limousine' };

const statusVehicle = {
  active: { label: 'Hoạt động', cls: 'badge-success' },
  maintenance: { label: 'Bảo dưỡng', cls: 'badge-warning' },
  inactive: { label: 'Ngưng hoạt động', cls: 'badge-danger' },
};

const emptyBusForm = { name: '', licensePlate: '', type: 'seater', totalSeats: 40, driver: '', driverPhone: '', amenities: '' };

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBus, setEditBus] = useState(null); // null = adding, obj = editing
  const [form, setForm] = useState(emptyBusForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [generatingSeats, setGeneratingSeats] = useState(null); // busId being generated
  const [actionId, setActionId] = useState(null);

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/buses');
      setBuses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách xe.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  const openAdd = () => {
    setEditBus(null);
    setForm(emptyBusForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (bus) => {
    setEditBus(bus);
    setForm({
      name: bus.name || '',
      licensePlate: bus.licensePlate || '',
      type: bus.type || 'seater',
      totalSeats: bus.totalSeats || 40,
      driver: bus.driver || '',
      driverPhone: bus.driverPhone || '',
      amenities: (bus.amenities || []).join(', '),
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.licensePlate) { setFormError('Vui lòng điền đầy đủ thông tin bắt buộc.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalSeats: +form.totalSeats,
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editBus) {
        await api.put(`/buses/${editBus._id}`, payload);
      } else {
        await api.post('/buses', payload);
      }
      setShowModal(false);
      fetchBuses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bus) => {
    if (!confirm(`Xóa xe ${bus.licensePlate}?`)) return;
    setActionId(bus._id);
    try {
      await api.delete(`/buses/${bus._id}`);
      setBuses(prev => prev.filter(b => b._id !== bus._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    } finally {
      setActionId(null);
    }
  };

  const handleGenerateSeats = async (bus) => {
    if (!confirm(`Tạo sơ đồ ghế cho xe ${bus.licensePlate}? (Sẽ xóa ghế cũ nếu có)`)) return;
    setGeneratingSeats(bus._id);
    try {
      await api.post(`/buses/${bus._id}/generate-seats`);
      alert('Tạo sơ đồ ghế thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo sơ đồ ghế.');
    } finally {
      setGeneratingSeats(null);
    }
  };

  const filtered = buses.filter(b =>
    b.licensePlate?.toLowerCase().includes(search.toLowerCase()) ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.driver?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Xe & Phương tiện</h1>
          <p className="section-subtitle">Quản lý đội xe ({buses.length} xe)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm xe
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng xe', value: buses.length, color: 'var(--primary)' },
          { label: 'Đang hoạt động', value: buses.filter(b => b.status === 'active').length, color: 'var(--success)' },
          { label: 'Bảo dưỡng', value: buses.filter(b => b.status === 'maintenance').length, color: 'var(--warning)' },
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
        <input className="form-input" placeholder="Tìm biển số, tên xe, tài xế..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
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
                  <th>Biển số / Tên</th>
                  <th>Loại xe</th>
                  <th>Số ghế</th>
                  <th>Tài xế</th>
                  <th>Tiện ích</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const st = statusVehicle[b.status] || statusVehicle.active;
                  const isActing = actionId === b._id || generatingSeats === b._id;
                  return (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{b.licensePlate}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{b.name}</div>
                      </td>
                      <td><span className="badge badge-info">{typeLabels[b.type] || b.type}</span></td>
                      <td style={{ fontWeight: '600', fontSize: '13px' }}>{b.totalSeats} ghế</td>
                      <td style={{ fontSize: '13px' }}>
                        {b.driver ? (
                          <>
                            <div style={{ fontWeight: '600' }}>{b.driver}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{b.driverPhone}</div>
                          </>
                        ) : <span style={{ color: 'var(--gray-400)' }}>Chưa phân công</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1" style={{ flexWrap: 'wrap', maxWidth: '160px' }}>
                          {(b.amenities || []).slice(0, 3).map(a => (
                            <span key={a} className="tag" style={{ fontSize: '10px' }}>{a}</span>
                          ))}
                          {(b.amenities || []).length > 3 && <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>+{b.amenities.length - 3}</span>}
                        </div>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Tạo sơ đồ ghế"
                            disabled={isActing}
                            onClick={() => handleGenerateSeats(b)}
                          >
                            {generatingSeats === b._id ? <Loader size={13} /> : <Settings size={13} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={isActing} onClick={() => openEdit(b)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={isActing} onClick={() => handleDelete(b)}>
                            {actionId === b._id ? <Loader size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Không tìm thấy xe nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{editBus ? 'Chỉnh sửa xe' : 'Thêm xe mới'}</h3>

            {formError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tên xe / Nhà xe *</label>
                  <input className="form-input" placeholder="Phương Trang" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Biển số *</label>
                  <input className="form-input" placeholder="51B-12345" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Loại xe</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {busTypes.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số ghế</label>
                  <input className="form-input" type="number" min="1" max="80" value={form.totalSeats} onChange={e => setForm({...form, totalSeats: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tên tài xế</label>
                  <input className="form-input" placeholder="Nguyễn Văn A" value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SĐT tài xế</label>
                  <input className="form-input" type="tel" placeholder="0901234567" value={form.driverPhone} onChange={e => setForm({...form, driverPhone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tiện ích (phân cách bằng dấu phẩy)</label>
                <input className="form-input" placeholder="WiFi, Điều hòa, Sạc điện thoại" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} {editBus ? 'Cập nhật' : 'Thêm xe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
