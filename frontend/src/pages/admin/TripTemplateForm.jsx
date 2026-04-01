import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, AlertCircle, CalendarClock } from 'lucide-react';
import tripTemplateApi from '../../api/tripTemplateApi';
import api from '../../api/axios';

const DAY_OPTIONS = [
  { value: 0, label: 'CN' },
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
];

const empty = {
  name: '', fromStation: '', toStation: '', bus: '',
  departureHour: '7', departureMinute: '0',
  estimatedDuration: '', price: '',
  daysOfWeek: [], isRecurring: false, recurrenceRule: '',
  status: 'active',
};

export default function TripTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]       = useState(empty);
  const [stations, setStations] = useState([]);
  const [buses, setBuses]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Load reference data + existing template when editing
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stRes, busRes] = await Promise.all([
          api.get('/stations', { params: { limit: 200 } }),
          api.get('/buses',    { params: { limit: 200 } }),
        ]);
        setStations(stRes.data?.stations || stRes.data || []);
        setBuses(busRes.data?.buses || busRes.data || []);

        if (isEdit) {
          const { data } = await tripTemplateApi.getById(id);
          setForm({
            name:              data.name            || '',
            fromStation:       data.fromStation?._id || data.fromStation || '',
            toStation:         data.toStation?._id   || data.toStation   || '',
            bus:               data.bus?._id          || data.bus         || '',
            departureHour:     String(data.departureHour   ?? 7),
            departureMinute:   String(data.departureMinute ?? 0),
            estimatedDuration: String(data.estimatedDuration || ''),
            price:             String(data.price      || ''),
            daysOfWeek:        data.daysOfWeek       || [],
            isRecurring:       data.isRecurring       || false,
            recurrenceRule:    data.recurrenceRule    || '',
            status:            data.status            || 'active',
          });
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d)
        ? f.daysOfWeek.filter(x => x !== d)
        : [...f.daysOfWeek, d].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim())       return setError('Tên template không được để trống');
    if (!form.fromStation)       return setError('Chọn bến đi');
    if (!form.toStation)         return setError('Chọn bến đến');
    if (form.fromStation === form.toStation) return setError('Bến đi và bến đến không được giống nhau');
    if (!form.price)             return setError('Nhập giá vé');

    const hour   = parseInt(form.departureHour,   10);
    const minute = parseInt(form.departureMinute, 10);
    if (isNaN(hour) || hour < 0 || hour > 23)       return setError('Giờ xuất phát không hợp lệ (0-23)');
    if (isNaN(minute) || minute < 0 || minute > 59) return setError('Phút xuất phát không hợp lệ (0-59)');

    const payload = {
      name:             form.name.trim(),
      fromStation:      form.fromStation,
      toStation:        form.toStation,
      bus:              form.bus || undefined,
      departureHour:    hour,
      departureMinute:  minute,
      estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration, 10) : 0,
      price:            parseFloat(form.price),
      daysOfWeek:       form.daysOfWeek,
      isRecurring:      form.isRecurring,
      recurrenceRule:   form.recurrenceRule,
      status:           form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await tripTemplateApi.update(id, payload);
      } else {
        await tripTemplateApi.create(payload);
      }
      navigate('/admin/trip-templates');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '14px' }}>Đang tải...</div>;

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/admin/trip-templates')}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarClock size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
              {isEdit ? 'Chỉnh sửa lịch trình mẫu' : 'Tạo lịch trình mẫu mới'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>Template sẽ được dùng để tạo nhiều chuyến nhanh</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#DC2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-100)' }}>
            Thông tin cơ bản
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Tên template *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="VD: Sài Gòn - Đà Lạt sáng 7h" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Bến đi *</label>
                <select className="form-select" value={form.fromStation} onChange={set('fromStation')} required>
                  <option value="">-- Chọn bến đi --</option>
                  {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bến đến *</label>
                <select className="form-select" value={form.toStation} onChange={set('toStation')} required>
                  <option value="">-- Chọn bến đến --</option>
                  {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Xe mặc định <span style={{ fontWeight: '400', color: 'var(--gray-400)' }}>(có thể override khi tạo chuyến)</span></label>
              <select className="form-select" value={form.bus} onChange={set('bus')}>
                <option value="">-- Chưa chọn xe --</option>
                {buses.map(b => <option key={b._id} value={b._id}>{b.licensePlate} — {b.name} ({b.type}, {b.totalSeats} chỗ)</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-100)' }}>
            Lịch trình
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            {/* Departure time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Giờ xuất phát *</label>
                <input className="form-input" type="number" min="0" max="23"
                  value={form.departureHour} onChange={set('departureHour')} placeholder="7" />
              </div>
              <div className="form-group">
                <label className="form-label">Phút *</label>
                <input className="form-input" type="number" min="0" max="59"
                  value={form.departureMinute} onChange={set('departureMinute')} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Thời gian di chuyển (phút)</label>
                <input className="form-input" type="number" min="0"
                  value={form.estimatedDuration} onChange={set('estimatedDuration')} placeholder="360" />
              </div>
            </div>

            {/* Days of week */}
            <div className="form-group">
              <label className="form-label">
                Ngày trong tuần
                <span style={{ fontWeight: '400', color: 'var(--gray-400)', marginLeft: '8px' }}>
                  (bỏ trống = mọi ngày khi bulk generate)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {DAY_OPTIONS.map(({ value, label }) => {
                  const active = form.daysOfWeek.includes(value);
                  return (
                    <button key={value} type="button" onClick={() => toggleDay(value)} style={{
                      padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '13px',
                      border: `2px solid ${active ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: active ? 'rgba(255,107,53,0.1)' : 'white',
                      color: active ? 'var(--primary)' : 'var(--gray-500)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Recurring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)' }}>
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }} />
                Lịch lặp cố định (Recurring)
              </label>
            </div>
            {form.isRecurring && (
              <div className="form-group">
                <label className="form-label">Quy tắc lặp (recurrenceRule)</label>
                <input className="form-input" value={form.recurrenceRule} onChange={set('recurrenceRule')}
                  placeholder="VD: MON,WED,FRI hoặc DAILY" />
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Status */}
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-100)' }}>
            Giá vé & Trạng thái
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Giá vé mặc định (đ) *</label>
              <input className="form-input" type="number" min="0" value={form.price} onChange={set('price')} placeholder="200000" required />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/admin/trip-templates')} className="btn btn-outline">Hủy</button>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Save size={15} />
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật template' : 'Tạo template')}
          </button>
        </div>
      </form>
    </div>
  );
}
