import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, Car, ChevronLeft, ChevronRight, RefreshCw, Pencil, Trash2, Eye } from 'lucide-react';
import busCompanyApi from '../../api/busCompanyApi';
import CompanyLogo from '../../components/CompanyLogo';

const STATUS_COLORS = {
  active:   { bg: '#DCFCE7', color: '#16A34A' },
  inactive: { bg: '#FEE2E2', color: '#DC2626' },
};

export default function BusCompanyList() {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await busCompanyApi.getAll({ page, limit: 10, search: q });
      setCompanies(data.companies || []);
      setPagination(data.pagination || {});
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tải danh sách nhà xe');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCompanies(1, ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies(1, search);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa nhà xe "${name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(id);
    try {
      await busCompanyApi.remove(id);
      fetchCompanies(pagination.page, search);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const goPage = (p) => fetchCompanies(p, search);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>Quản lý Nhà xe</h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Danh sách nhà xe và bến xe trực thuộc</p>
        </div>
        <Link to="/admin/bus-companies/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Thêm nhà xe
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '12px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã code..."
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '38px', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}>Tìm</button>
          <button type="button" onClick={() => { setSearch(''); fetchCompanies(1, ''); }} className="btn btn-ghost" style={{ height: '38px', padding: '0 12px' }}>
            <RefreshCw size={15} />
          </button>
        </form>
      </div>

      {/* Error */}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      {/* Table card */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray-400)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px' }}>Đang tải...</div>
          </div>
        ) : companies.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Building2 size={40} style={{ color: 'var(--gray-300)', marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Chưa có nhà xe nào</div>
            <Link to="/admin/bus-companies/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '13px' }}>
              <Plus size={14} /> Thêm nhà xe đầu tiên
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--gray-100)' }}>
                {['Nhà xe', 'Mã code', 'Hotline', 'Bến xe', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => {
                const sc = STATUS_COLORS[c.status] || STATUS_COLORS.active;
                return (
                  <tr key={c._id} style={{ borderBottom: i < companies.length - 1 ? '1px solid var(--gray-100)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {/* Name */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CompanyLogo logo={c.logo} name={c.name} size={38} radius="10px" />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--gray-900)' }}>{c.name}</div>
                          {c.shortName && <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{c.shortName}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Code */}
                    <td style={{ padding: '14px 16px' }}>
                      <code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', color: 'var(--gray-700)' }}>{c.code}</code>
                    </td>
                    {/* Hotline */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--gray-600)' }}>{c.hotline || '—'}</td>
                    {/* Stations count */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--gray-600)' }}>
                        <MapPin size={13} style={{ color: 'var(--primary)' }} />
                        {(c.stations || []).length} bến
                      </div>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...sc, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {c.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/admin/bus-companies/${c._id}`} title="Xem chi tiết"
                          style={{ padding: '6px', borderRadius: '7px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center' }}>
                          <Eye size={14} />
                        </Link>
                        <Link to={`/admin/bus-companies/${c._id}/edit`} title="Sửa"
                          style={{ padding: '6px', borderRadius: '7px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center' }}>
                          <Pencil size={14} />
                        </Link>
                        <button onClick={() => handleDelete(c._id, c.name)} disabled={deleting === c._id} title="Xóa"
                          style={{ padding: '6px', borderRadius: '7px', background: '#FEF2F2', color: '#DC2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: deleting === c._id ? 0.5 : 1 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              {pagination.total} nhà xe | Trang {pagination.page}/{pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1}
                style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
