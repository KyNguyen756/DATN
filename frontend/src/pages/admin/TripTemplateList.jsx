import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit2, Loader, AlertCircle,
  CalendarPlus, MapPin, Clock, ChevronLeft, ChevronRight,
  CheckCircle, X,
} from 'lucide-react';
import tripTemplateApi from '../../api/tripTemplateApi';
import GenerateTripDialog from '../../components/GenerateTripDialog';

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 1300,
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

// Mapping dayOfWeek index → label VN
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_COLORS  = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F97316', '#6366F1'];

function DayBadges({ days }) {
  if (!days || days.length === 0) return <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Mọi ngày</span>;
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {days.map(d => (
        <span key={d} style={{
          padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
          background: DAY_COLORS[d] + '20', color: DAY_COLORS[d], border: `1px solid ${DAY_COLORS[d]}40`,
        }}>{DAY_LABELS[d]}</span>
      ))}
    </div>
  );
}

export default function TripTemplateList() {
  const [templates, setTemplates]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deleting, setDeleting]     = useState(null);
  const [generateTarget, setGenerateTarget] = useState(null);
  const [toast, setToast]           = useState(null); // { msg, type }

  const fetchTemplates = useCallback(async (page = 1) => {
    setLoading(true); setError('');
    try {
      const { data } = await tripTemplateApi.getAll({ page, limit: 15 });
      setTemplates(data.templates || []);
      setPagination(data.pagination || {});
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tải danh sách template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(1); }, [fetchTemplates]);

  // Client-side search filter
  const filtered = templates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.fromStation?.city?.toLowerCase().includes(search.toLowerCase()) ||
    t.toStation?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (tpl) => {
    if (!window.confirm(`Xóa template "${tpl.name}"?`)) return;
    setDeleting(tpl._id);
    try {
      await tripTemplateApi.remove(tpl._id);
      setToast({ msg: `Đã xóa template "${tpl.name}"`, type: 'success' });
      fetchTemplates(pagination.page);
    } catch (e) {
      setToast({ msg: e.response?.data?.message || 'Xóa thất bại', type: 'error' });
    } finally { setDeleting(null); }
  };

  return (
    <div>
      {/* Toast notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Generate dialog */}
      {generateTarget && (
        <GenerateTripDialog
          template={generateTarget}
          onClose={() => setGenerateTarget(null)}
          onSuccess={() => {
            setGenerateTarget(null);
            setToast({ msg: 'Tạo chuyến từ template thành công!', type: 'success' });
          }}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Lịch trình mẫu</h1>
          <p className="section-subtitle">Tái sử dụng lịch trình để tạo nhiều chuyến nhanh chóng</p>
        </div>
        <Link to="/admin/trip-templates/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={15} /> Tạo template mới
        </Link>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng template',   value: pagination.total,                                          color: 'var(--primary)' },
          { label: 'Đang hoạt động',  value: templates.filter(t => t.status === 'active').length,       color: 'var(--success, #16A34A)' },
          { label: 'Tạm dừng',        value: templates.filter(t => t.status === 'inactive').length,     color: 'var(--gray-400)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input className="form-input" placeholder="Tìm tên template, thành phố..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '36px' }} />
      </div>

      {error && (
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tên template</th>
                  <th>Tuyến đường</th>
                  <th>Giờ xuất phát</th>
                  <th>Ngày trong tuần</th>
                  <th>Xe mặc định</th>
                  <th>Giá vé</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tpl => (
                  <tr key={tpl._id}>
                    {/* Name */}
                    <td style={{ maxWidth: '180px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--gray-900)' }}>{tpl.name}</div>
                      {tpl.busCompany && (
                        <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>
                          {tpl.busCompany.shortName || tpl.busCompany.name}
                        </div>
                      )}
                    </td>

                    {/* Route */}
                    <td>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} color="var(--primary)" />
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{tpl.fromStation?.city}</span>
                        <span style={{ color: 'var(--gray-400)' }}>→</span>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{tpl.toStation?.city}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                        {tpl.fromStation?.name} → {tpl.toStation?.name}
                      </div>
                    </td>

                    {/* Departure */}
                    <td>
                      <div className="flex items-center gap-1" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gray-800)' }}>
                        <Clock size={13} color="var(--gray-400)" />
                        {String(tpl.departureHour).padStart(2,'0')}:{String(tpl.departureMinute).padStart(2,'0')}
                      </div>
                      {tpl.estimatedDuration > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                          ~{Math.floor(tpl.estimatedDuration/60)}h{tpl.estimatedDuration%60 ? tpl.estimatedDuration%60+'m' : ''}
                        </div>
                      )}
                    </td>

                    {/* Days */}
                    <td><DayBadges days={tpl.daysOfWeek} /></td>

                    {/* Bus */}
                    <td>
                      {tpl.bus ? (
                        <>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{tpl.bus.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{tpl.bus.licensePlate}</div>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Chưa chọn</span>
                      )}
                    </td>

                    {/* Price */}
                    <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>
                      {tpl.price?.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${tpl.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                        {tpl.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Generate trip button */}
                        <button
                          className="btn btn-ghost btn-sm"
                          title={tpl.status !== 'active' ? 'Template đang tạm dừng — không thể tạo chuyến' : 'Tạo chuyến từ template'}
                          onClick={() => tpl.status === 'active' && setGenerateTarget(tpl)}
                          style={{
                            color: tpl.status === 'active' ? '#7C3AED' : 'var(--gray-300)',
                            cursor: tpl.status !== 'active' ? 'not-allowed' : 'pointer',
                          }}
                          disabled={tpl.status !== 'active'}
                        >
                          <CalendarPlus size={14} />
                        </button>
                        {/* Edit */}
                        <Link to={`/admin/trip-templates/${tpl._id}/edit`} className="btn btn-ghost btn-sm" title="Sửa">
                          <Edit2 size={13} />
                        </Link>
                        {/* Delete */}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          disabled={deleting === tpl._id}
                          onClick={() => handleDelete(tpl)}
                        >
                          {deleting === tpl._id ? <Loader size={13} /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                    Chưa có lịch trình mẫu nào
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                {pagination.total} template | Trang {pagination.page}/{pagination.totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-ghost btn-sm" disabled={pagination.page <= 1} onClick={() => fetchTemplates(pagination.page - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <button className="btn btn-ghost btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTemplates(pagination.page + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}
