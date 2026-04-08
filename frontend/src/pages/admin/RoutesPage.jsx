import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Clock, Copy, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '';
const toDatetimeLocal = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : '';

const statusCfg = {
  scheduled:  { label: 'Lên lịch',   cls: 'badge-info' },
  active:     { label: 'Đang hoạt động', cls: 'badge-success' },
  ongoing:    { label: 'Đang chạy',  cls: 'badge-success' },
  completed:  { label: 'Hoàn thành', cls: 'badge-gray' },
  cancelled:  { label: 'Đã hủy',    cls: 'badge-danger' },
};

const emptyForm = {
  fromStationId: '', toStationId: '', busId: '',
  departureTime: '', arrivalTime: '', price: '',
  estimatedDuration: '', cancellationPolicy: '',
};

export default function RoutesPage() {
  const [tab, setTab] = useState('trips');
  const [search, setSearch] = useState('');
  const [trips, setTrips] = useState([]);
  const [stations, setStations] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsRes, stationsRes, busesRes] = await Promise.all([
        api.get('/trips'),
        api.get('/stations'),
        api.get('/buses'),
      ]);
      setTrips(tripsRes.data?.trips || tripsRes.data || []);
      setStations(stationsRes.data?.stations || stationsRes.data || []);
      setBuses(busesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditTrip(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (trip) => {
    setEditTrip(trip);
    setForm({
      fromStationId: trip.fromStation?._id || '',
      toStationId: trip.toStation?._id || '',
      busId: trip.bus?._id || '',
      departureTime: toDatetimeLocal(trip.departureTime),
      arrivalTime: toDatetimeLocal(trip.arrivalTime),
      price: trip.price || '',
      estimatedDuration: trip.estimatedDuration || '',
      cancellationPolicy: trip.cancellationPolicy || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.fromStationId || !form.toStationId || !form.busId || !form.departureTime || !form.price) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fromStation: form.fromStationId,
        toStation: form.toStationId,
        bus: form.busId,
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime || undefined,
        price: +form.price,
        estimatedDuration: form.estimatedDuration ? +form.estimatedDuration : undefined,
        cancellationPolicy: form.cancellationPolicy || undefined,
      };
      if (editTrip) {
        await api.put(`/trips/${editTrip._id}`, payload);
      } else {
        await api.post('/trips', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trip) => {
    if (!confirm(`Xóa chuyến ${trip.fromStation?.city} → ${trip.toStation?.city} lúc ${fmtTime(trip.departureTime)}?`)) return;
    setActionId(trip._id);
    try {
      await api.delete(`/trips/${trip._id}`);
      setTrips(prev => prev.filter(t => t._id !== trip._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    } finally {
      setActionId(null);
    }
  };

  const handleGenerateTripSeats = async (trip) => {
    try {
      await api.post(`/trip-seats/generate/${trip._id}`);
      alert('Tạo ghế chuyến đi thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo ghế.');
    }
  };

  const filtered = trips.filter(t =>
    t.fromStation?.city?.toLowerCase().includes(search.toLowerCase()) ||
    t.toStation?.city?.toLowerCase().includes(search.toLowerCase()) ||
    t.bus?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Chuyến đi & Lịch trình</h1>
          <p className="section-subtitle">Quản lý các chuyến xe ({trips.length} chuyến)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm chuyến đi
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng chuyến', value: trips.length, color: 'var(--primary)' },
          { label: 'Đang chạy', value: trips.filter(t => ['ongoing','active'].includes(t.status)).length, color: 'var(--success)' },
          { label: 'Lên lịch', value: trips.filter(t => t.status === 'scheduled').length, color: 'var(--info)' },
          { label: 'Đã hủy', value: trips.filter(t => t.status === 'cancelled').length, color: 'var(--danger)' },
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
        <input className="form-input" placeholder="Tìm thành phố, nhà xe..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
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
                  <th>Tuyến đường</th>
                  <th>Xe</th>
                  <th>Giờ đi – đến</th>
                  <th>Ngày đi</th>
                  <th>Giá vé</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const st = statusCfg[t.status] || statusCfg.scheduled;
                  const isActing = actionId === t._id;
                  return (
                    <tr key={t._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} color="var(--primary)" />
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{t.fromStation?.city}</span>
                          <span style={{ color: 'var(--gray-400)' }}>→</span>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{t.toStation?.city}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginLeft: '20px' }}>
                          {t.fromStation?.name} → {t.toStation?.name}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.bus?.name}</div>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>{t.bus?.type}</span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-1">
                          <Clock size={12} color="var(--gray-400)" />
                          {fmtTime(t.departureTime)} → {fmtTime(t.arrivalTime)}
                        </div>
                        {t.estimatedDuration && (
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                            ~{Math.floor(t.estimatedDuration / 60)}h{t.estimatedDuration % 60 ? t.estimatedDuration % 60 + 'm' : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>{fmtDate(t.departureTime)}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{t.price?.toLocaleString()}đ</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn btn-ghost btn-sm" title="Tạo ghế chuyến" onClick={() => handleGenerateTripSeats(t)}>
                            <Copy size={13} />
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={isActing} onClick={() => openEdit(t)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={isActing} onClick={() => handleDelete(t)}>
                            {isActing ? <Loader size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Không có chuyến đi nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{editTrip ? 'Chỉnh sửa chuyến đi' : 'Thêm chuyến đi mới'}</h3>

            {formError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Bến đi *</label>
                  <select className="form-select" value={form.fromStationId} onChange={e => setForm({...form, fromStationId: e.target.value})}>
                    <option value="">-- Chọn bến --</option>
                    {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bến đến *</label>
                  <select className="form-select" value={form.toStationId} onChange={e => setForm({...form, toStationId: e.target.value})}>
                    <option value="">-- Chọn bến --</option>
                    {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Xe *</label>
                <select className="form-select" value={form.busId} onChange={e => setForm({...form, busId: e.target.value})}>
                  <option value="">-- Chọn xe --</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.licensePlate} — {b.name} ({b.type})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày giờ khởi hành *</label>
                  <input className="form-input" type="datetime-local" value={form.departureTime} onChange={e => setForm({...form, departureTime: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày giờ đến (dự kiến)</label>
                  <input className="form-input" type="datetime-local" value={form.arrivalTime} onChange={e => setForm({...form, arrivalTime: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Giá vé (đ) *</label>
                  <input className="form-input" type="number" placeholder="150000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Thời gian ước tính (phút)</label>
                  <input className="form-input" type="number" placeholder="420" value={form.estimatedDuration} onChange={e => setForm({...form, estimatedDuration: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Chính sách hủy vé</label>
                <textarea className="form-input" rows={2} placeholder="Trước 24h: hoàn 70%. Trước 6h: hoàn 40%." value={form.cancellationPolicy} onChange={e => setForm({...form, cancellationPolicy: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} {editTrip ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
