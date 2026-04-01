import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, Plus, Building2 } from 'lucide-react';
import busCompanyApi from '../../api/busCompanyApi';
import api from '../../api/axios';

export default function BusCompanyForm() {
  const { id } = useParams(); // defined when editing
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', shortName: '', code: '', hotline: '', description: '',
    logo: '', status: 'active',
  });
  const [allStations, setAllStations] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load existing company data when editing
  useEffect(() => {
    const loadStations = async () => {
      try {
        const { data } = await api.get('/stations', { params: { limit: 200 } });
        setAllStations(data.stations || data || []);
      } catch { setAllStations([]); }
    };
    loadStations();

    if (isEdit) {
      setLoading(true);
      busCompanyApi.getById(id)
        .then(({ data }) => {
          setForm({
            name: data.name || '',
            shortName: data.shortName || '',
            code: data.code || '',
            hotline: data.hotline || '',
            description: data.description || '',
            logo: data.logo || '',
            status: data.status || 'active',
          });
          setSelectedStations((data.stations || []).map(s => s._id || s));
        })
        .catch(() => setError('Không thể tải dữ liệu nhà xe'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const toggleStation = (stId) => {
    setSelectedStations(prev =>
      prev.includes(stId) ? prev.filter(x => x !== stId) : [...prev, stId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Tên nhà xe không được để trống');
    if (!form.code.trim()) return setError('Mã code không được để trống');

    setSaving(true);
    try {
      const payload = { ...form, stationIds: selectedStations };

      if (isEdit) {
        await busCompanyApi.update(id, payload);
        // Sync station assignment separately
        await busCompanyApi.addStations(id, selectedStations).catch(() => {}); // best effort
      } else {
        await busCompanyApi.create(payload);
      }
      navigate('/admin/bus-companies');
    } catch (e) {
      setError(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', color: 'var(--gray-400)' }}>
        <span style={{ fontSize: '14px' }}>Đang tải...</span>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--gray-200)',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '6px', display: 'block' };

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/admin/bus-companies')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
            {isEdit ? 'Chỉnh sửa nhà xe' : 'Thêm nhà xe mới'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>Điền thông tin nhà xe bên dưới</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#DC2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <X size={14} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic info card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--gray-100)' }}>
            <Building2 size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)' }}>Thông tin cơ bản</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tên nhà xe *</label>
              <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="VD: Phương Trang" required />
            </div>
            <div>
              <label style={labelStyle}>Tên viết tắt</label>
              <input style={inputStyle} value={form.shortName} onChange={set('shortName')} placeholder="VD: PT" />
            </div>
            <div>
              <label style={labelStyle}>Mã code *</label>
              <input style={{ ...inputStyle, textTransform: 'uppercase' }} value={form.code} onChange={set('code')}
                placeholder="VD: PHUONG_TRANG" required />
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px', display: 'block' }}>Chỉ dùng chữ hoa, số, dấu gạch dưới</span>
            </div>
            <div>
              <label style={labelStyle}>Hotline</label>
              <input style={inputStyle} value={form.hotline} onChange={set('hotline')} placeholder="VD: 1900 6067" />
            </div>
            <div>
              <label style={labelStyle}>URL Logo (Cloudinary)</label>
              <input style={inputStyle} value={form.logo} onChange={set('logo')} placeholder="https://res.cloudinary.com/..." />
            </div>
            <div>
              <label style={labelStyle}>Trạng thái</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={set('status')}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Mô tả</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={form.description} onChange={set('description')} placeholder="Mô tả ngắn về nhà xe..." />
            </div>
          </div>
        </div>

        {/* Station assignment */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', marginBottom: '14px' }}>
            Bến xe trực thuộc
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '500', color: 'var(--gray-500)' }}>
              (đã chọn: {selectedStations.length})
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {allStations.map(st => {
              const checked = selectedStations.includes(st._id);
              return (
                <label key={st._id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                  borderRadius: '8px', border: `1px solid ${checked ? 'var(--primary)' : 'var(--gray-200)'}`,
                  background: checked ? 'rgba(255,107,53,0.06)' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s', fontSize: '13px',
                }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleStation(st._id)}
                    style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>{st.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{st.city}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/admin/bus-companies')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: 'var(--gray-700)' }}>
            Hủy
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 24px', borderRadius: '8px', background: saving ? 'var(--gray-400)' : 'var(--primary)', color: 'white', fontWeight: '600', fontSize: '13px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={15} />
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo nhà xe')}
          </button>
        </div>
      </form>
    </div>
  );
}
