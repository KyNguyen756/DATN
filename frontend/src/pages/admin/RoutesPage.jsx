import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, MapPin, Clock, Copy,
  Loader, AlertCircle, CheckCircle, CalendarClock, X,
  Filter, ChevronDown, LayoutList, LayoutTemplate,
} from 'lucide-react';
import api from '../../api/axios';

// ── Timezone helpers (always UTC+7) ──────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  });
};
const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};
const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  // Convert UTC → local display (browser uses local timezone for datetime-local)
  const d = new Date(iso);
  const offset = 7 * 60; // UTC+7
  const local = new Date(d.getTime() + offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Hoạt động',  cls: 'badge-success' },
  scheduled: { label: 'Lên lịch',   cls: 'badge-info' },
  ongoing:   { label: 'Đang chạy',  cls: 'badge-success' },
  completed: { label: 'Hoàn thành', cls: 'badge-gray' },
  cancelled: { label: 'Đã hủy',     cls: 'badge-danger' },
};

const EMPTY_FORM = {
  fromStationId: '', toStationId: '', busId: '',
  departureTime: '', arrivalTime: '', price: '',
  estimatedDuration: '', cancellationPolicy: '',
};

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  const pulse = {
    background: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: '4px',
    display: 'inline-block',
  };
  return (
    <tr>
      <td><div style={{ ...pulse, width: '120px', height: '14px' }} /></td>
      <td><div style={{ ...pulse, width: '80px', height: '14px' }} /></td>
      <td><div style={{ ...pulse, width: '100px', height: '14px' }} /></td>
      <td><div style={{ ...pulse, width: '70px',  height: '14px' }} /></td>
      <td><div style={{ ...pulse, width: '60px',  height: '14px' }} /></td>
      <td><div style={{ ...pulse, width: '70px',  height: '20px', borderRadius: '20px' }} /></td>
      <td><div style={{ ...pulse, width: '80px',  height: '28px', borderRadius: '8px' }} /></td>
    </tr>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200,
      padding: '12px 18px', borderRadius: '10px',
      background: type === 'success' ? '#16A34A' : '#DC2626',
      color: 'white', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '8px',
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', marginLeft: '4px', display: 'flex', padding: '2px' }}>
        <X size={13} />
      </button>
    </div>
  );
}

export default function RoutesPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [templateFilter,  setTemplateFilter]  = useState('all'); // 'all' | 'template' | 'manual'
  const [statusFilter,    setStatusFilter]    = useState('all'); // 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  const [trips,           setTrips]           = useState([]);
  const [stations,        setStations]        = useState([]);
  const [buses,           setBuses]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [editTrip,        setEditTrip]        = useState(null);
  const [form,            setForm]            = useState(EMPTY_FORM);
  const [saving,          setSaving]          = useState(false);
  const [formError,       setFormError]       = useState('');
  const [actionId,        setActionId]        = useState(null);
  const [templateModal,   setTemplateModal]   = useState(null); // template detail mini-modal
  const [toast,           setToast]           = useState(null); // { msg, type }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const hasTemplateParam =
        templateFilter === 'template' ? 'true'  :
        templateFilter === 'manual'   ? 'false' : undefined;

      const params = { limit: 200 };
      if (hasTemplateParam !== undefined) params.hasTemplate = hasTemplateParam;

      const [tripsRes, stationsRes, busesRes] = await Promise.all([
        api.get('/trips', { params }),
        api.get('/stations'),
        api.get('/buses'),
      ]);
      setTrips(tripsRes.data?.trips || tripsRes.data || []);
      setStations(stationsRes.data?.stations || stationsRes.data || []);
      setBuses(busesRes.data?.buses || busesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu chuyến đi.');
    } finally {
      setLoading(false);
    }
  }, [templateFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const fromTemplate = trips.filter(t => Boolean(t.template));
  const manual       = trips.filter(t => !t.template);

  // ── Filtered list (client-side search + status filter) ────────────────────
  const filtered = trips.filter(t => {
    const matchSearch =
      t.fromStation?.city?.toLowerCase().includes(search.toLowerCase()) ||
      t.toStation?.city?.toLowerCase().includes(search.toLowerCase())   ||
      t.bus?.name?.toLowerCase().includes(search.toLowerCase())         ||
      t.template?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Form actions ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTrip(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true);
  };
  const openEdit = (trip) => {
    setEditTrip(trip);
    setForm({
      fromStationId:     trip.fromStation?._id || '',
      toStationId:       trip.toStation?._id   || '',
      busId:             trip.bus?._id          || '',
      departureTime:     toDatetimeLocal(trip.departureTime),
      arrivalTime:       toDatetimeLocal(trip.arrivalTime),
      price:             trip.price             || '',
      estimatedDuration: trip.estimatedDuration || '',
      cancellationPolicy: trip.cancellationPolicy || '',
    });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.fromStationId || !form.toStationId || !form.busId || !form.departureTime || !form.price) {
      return setFormError('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
    }
    setSaving(true);
    try {
      const payload = {
        fromStation:       form.fromStationId,
        toStation:         form.toStationId,
        bus:               form.busId,
        departureTime:     form.departureTime,
        arrivalTime:       form.arrivalTime || undefined,
        price:             +form.price,
        estimatedDuration: form.estimatedDuration ? +form.estimatedDuration : undefined,
        cancellationPolicy: form.cancellationPolicy || undefined,
      };
      if (editTrip) {
        await api.put(`/trips/${editTrip._id}`, payload);
      } else {
        await api.post('/trips', payload);
      }
      setShowModal(false);
      setToast({ msg: editTrip ? 'Cập nhật chuyến thành công!' : 'Thêm chuyến mới thành công!', type: 'success' });
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
      setToast({ msg: 'Đã xóa chuyến!', type: 'success' });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Không thể xóa chuyến này.', type: 'error' });
    } finally {
      setActionId(null);
    }
  };

  const handleGenerateSeats = async (trip) => {
    setActionId(trip._id);
    try {
      await api.post(`/trip-seats/generate/${trip._id}`);
      setToast({ msg: 'Tạo ghế chuyến đi thành công!', type: 'success' });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Không thể tạo ghế.', type: 'error' });
    } finally {
      setActionId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Chuyến đi & Lịch trình</h1>
          <p className="section-subtitle">Quản lý {trips.length} chuyến xe</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm chuyến đi
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng chuyến',   value: trips.length,                                     color: 'var(--primary)',  filter: null },
          { label: 'Đang chạy',     value: trips.filter(t => t.status === 'ongoing').length,  color: 'var(--success)',  filter: 'ongoing' },
          { label: 'Lên lịch',      value: trips.filter(t => t.status === 'scheduled').length, color: '#2563EB',        filter: 'scheduled' },
          { label: 'Từ template',   value: fromTemplate.length,                               color: '#7C3AED',         filter: null, isTemplate: true },
          { label: 'Thủ công',      value: manual.length,                                     color: 'var(--gray-500)', filter: null },
        ].map((s, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: '14px 18px', textAlign: 'center', cursor: s.filter || s.isTemplate ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s, transform 0.15s',
              border: (statusFilter === s.filter && s.filter) || (s.isTemplate && templateFilter === 'template')
                ? `2px solid ${s.color}` : '2px solid transparent',
            }}
            onClick={() => {
              if (s.filter) setStatusFilter(statusFilter === s.filter ? 'all' : s.filter);
              if (s.isTemplate) setTemplateFilter(templateFilter === 'template' ? 'all' : 'template');
            }}
            onMouseEnter={e => { if (s.filter || s.isTemplate) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-input"
            placeholder="Tìm thành phố, template, xe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Template source filter pill toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-100)', borderRadius: '10px', padding: '4px' }}>
          {[
            { val: 'all',      label: 'Tất cả',         icon: null },
            { val: 'template', label: '📋 Template',     icon: null },
            { val: 'manual',   label: '✍️ Thủ công',    icon: null },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setTemplateFilter(val)}
              style={{
                padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                border: 'none', cursor: 'pointer',
                background: templateFilter === val ? 'white' : 'transparent',
                color: templateFilter === val ? 'var(--gray-900)' : 'var(--gray-500)',
                boxShadow: templateFilter === val ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ paddingLeft: '32px', paddingRight: '32px', fontSize: '12px', minWidth: '140px' }}
          >
            <option value="all">Mọi trạng thái</option>
            <option value="scheduled">Lên lịch</option>
            <option value="ongoing">Đang chạy</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        </div>

        {/* Active filters chip */}
        {(templateFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button
            onClick={() => { setTemplateFilter('all'); setStatusFilter('all'); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 10px', borderRadius: '7px', fontSize: '12px',
              background: 'var(--danger-light, #FEF2F2)', color: 'var(--danger)',
              border: '1px solid var(--danger-light, #FECACA)', cursor: 'pointer',
            }}
          >
            <X size={12} /> Bỏ lọc
          </button>
        )}

        {/* Result count */}
        <span style={{ fontSize: '12px', color: 'var(--gray-400)', marginLeft: 'auto' }}>
          Hiển thị {filtered.length}/{trips.length} chuyến
        </span>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontSize: '13px' }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* Table / Skeleton */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tuyến đường</th>
                <th>Xe</th>
                <th>Giờ đi – đến</th>
                <th>Ngày đi <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--gray-400)' }}>(UTC+7)</span></th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚌</div>
                    <div>Không có chuyến đi nào phù hợp</div>
                    {(templateFilter !== 'all' || statusFilter !== 'all' || search) && (
                      <button onClick={() => { setTemplateFilter('all'); setStatusFilter('all'); setSearch(''); }}
                        style={{ marginTop: '8px', fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Xóa bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const st = STATUS_CFG[t.status] || STATUS_CFG.scheduled;
                  const isActing = actionId === t._id;
                  return (
                    <tr key={t._id} style={{ opacity: isActing ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                      {/* Route */}
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
                        {/* Template badge — click to show mini-modal */}
                        {t.template && (
                          <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                            <button
                              onClick={() => setTemplateModal(t.template)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                                background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                              title="Xem thông tin template"
                              onMouseEnter={e => e.currentTarget.style.background = '#DDD6FE'}
                              onMouseLeave={e => e.currentTarget.style.background = '#EDE9FE'}
                            >
                              <CalendarClock size={10} /> Từ template: {t.template.name || ''}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Bus */}
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.bus?.name}</div>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>{t.bus?.type}</span>
                      </td>

                      {/* Time */}
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

                      {/* Date */}
                      <td style={{ fontSize: '13px' }}>{fmtDate(t.departureTime)}</td>

                      {/* Price */}
                      <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>
                        {t.price?.toLocaleString('vi-VN')}đ
                      </td>

                      {/* Status */}
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Tạo ghế cho chuyến"
                            onClick={() => handleGenerateSeats(t)}
                            disabled={isActing}
                          >
                            {isActing ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Copy size={13} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={isActing} onClick={() => openEdit(t)}>
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            disabled={isActing}
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Template detail mini-modal ────────────────────────────────────────────── */}
      {templateModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '16px' }}
          onClick={() => setTemplateModal(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 50px rgba(0,0,0,0.20)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #7C3AED10, #EDE9FE40)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarClock size={16} style={{ color: '#7C3AED' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-900)' }}>Lịch trình mẫu</div>
                  <div style={{ fontSize: '11px', color: '#7C3AED', fontWeight: '600' }}>{templateModal.name}</div>
                </div>
              </div>
              <button onClick={() => setTemplateModal(null)} style={{ padding: '6px', borderRadius: '7px', border: 'none', background: 'var(--gray-100)', cursor: 'pointer', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px', display: 'grid', gap: '11px' }}>
              {[
                { label: 'Tuyến đường',     value: `${templateModal.fromStation?.city || '?'} → ${templateModal.toStation?.city || '?'}` },
                { label: 'Giờ xuất phát',   value: templateModal.departureHour !== undefined ? `${String(templateModal.departureHour).padStart(2,'0')}:${String(templateModal.departureMinute ?? 0).padStart(2,'0')} (UTC+7)` : '--' },
                { label: 'Ngày trong tuần', value: templateModal.daysOfWeek?.length ? templateModal.daysOfWeek.map(d => ['CN','T2','T3','T4','T5','T6','T7'][d]).join(', ') : 'Mọi ngày' },
                { label: 'Giá mặc định',    value: templateModal.price ? `${Number(templateModal.price).toLocaleString('vi-VN')}đ` : '--' },
                { label: 'Trạng thái',      value: templateModal.status === 'active' ? '● Hoạt động' : '● Tạm dừng', valueColor: templateModal.status === 'active' ? '#16A34A' : '#6B7280' },
              ].map(({ label, value, valueColor }) => (
                <div key={label} style={{ display: 'flex', gap: '10px', fontSize: '13px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gray-400)', minWidth: '130px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: '600', color: valueColor || 'var(--gray-800)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>ID: {templateModal._id}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTemplateModal(null)}
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '7px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontWeight: '600', color: 'var(--gray-600)' }}
                >
                  Đóng
                </button>
                <Link
                  to={`/admin/trip-templates/${templateModal._id}/edit`}
                  style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '7px', background: '#7C3AED', color: 'white', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => setTemplateModal(null)}
                >
                  <CalendarClock size={12} /> Mở template
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Trip Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px', fontSize: '17px' }}>
              {editTrip ? 'Chỉnh sửa chuyến đi' : 'Thêm chuyến đi mới'}
            </h3>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} /> {formError}
                <button onClick={() => setFormError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}><X size={13} /></button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Station row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Bến đi *</label>
                  <select className="form-select" value={form.fromStationId} onChange={e => setForm({ ...form, fromStationId: e.target.value })}>
                    <option value="">-- Chọn bến --</option>
                    {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bến đến *</label>
                  <select className="form-select" value={form.toStationId} onChange={e => setForm({ ...form, toStationId: e.target.value })}>
                    <option value="">-- Chọn bến --</option>
                    {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                  </select>
                </div>
              </div>

              {/* Bus */}
              <div className="form-group">
                <label className="form-label">Xe *</label>
                <select className="form-select" value={form.busId} onChange={e => setForm({ ...form, busId: e.target.value })}>
                  <option value="">-- Chọn xe --</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.licensePlate} — {b.name} ({b.type})</option>)}
                </select>
              </div>

              {/* Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày giờ khởi hành * <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--gray-400)' }}>(UTC+7)</span></label>
                  <input className="form-input" type="datetime-local" value={form.departureTime} onChange={e => setForm({ ...form, departureTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày giờ đến <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--gray-400)' }}>(dự kiến)</span></label>
                  <input className="form-input" type="datetime-local" value={form.arrivalTime} onChange={e => setForm({ ...form, arrivalTime: e.target.value })} />
                </div>
              </div>

              {/* Price and duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Giá vé (đ) *</label>
                  <input className="form-input" type="number" placeholder="150000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Thời gian ước tính (phút)</label>
                  <input className="form-input" type="number" placeholder="420" value={form.estimatedDuration} onChange={e => setForm({ ...form, estimatedDuration: e.target.value })} />
                </div>
              </div>

              {/* Policy */}
              <div className="form-group">
                <label className="form-label">Chính sách hủy vé</label>
                <textarea className="form-input" rows={2} placeholder="Trước 24h: hoàn 70%. Trước 6h: hoàn 40%." value={form.cancellationPolicy} onChange={e => setForm({ ...form, cancellationPolicy: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
                  : <><CheckCircle size={15} /> {editTrip ? 'Cập nhật' : 'Thêm mới'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}
