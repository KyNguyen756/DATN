import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Car, Users, Pencil, Trash2,
  Phone, Building2, X, UserPlus, UserMinus, RefreshCw,
} from 'lucide-react';
import busCompanyApi from '../../api/busCompanyApi';
import CompanyLogo from '../../components/CompanyLogo';
import StaffAssignmentModal from '../../components/StaffAssignmentModal';
import api from '../../api/axios';

export default function BusCompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany]           = useState(null);
  const [buses,   setBuses]             = useState([]);
  const [staff,   setStaff]             = useState([]);
  const [activeTab, setActiveTab]       = useState('stations');
  const [loading,  setLoading]          = useState(true);
  const [error,    setError]            = useState('');
  const [removingStation, setRemovingStation] = useState(null);
  const [removingStaff,   setRemovingStaff]   = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, busRes, userRes] = await Promise.all([
        busCompanyApi.getById(id),
        api.get('/buses',  { params: { limit: 200 } }),
        api.get('/users',  { params: { busCompany: id, role: 'staff', limit: 200 } }),
      ]);

      const companyData = companyRes.data;
      setCompany(companyData);

      const allBuses = busRes.data.buses || [];
      setBuses(allBuses.filter(b => {
        const bCompany = b.busCompany?._id || b.busCompany;
        return bCompany === id;
      }));

      setStaff(userRes.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Remove a station from the company
  const handleRemoveStation = async (stationId, stationName) => {
    if (!window.confirm(`Bỏ bến "${stationName}" khỏi nhà xe?`)) return;
    setRemovingStation(stationId);
    try {
      await busCompanyApi.removeStation(id, stationId);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setRemovingStation(null);
    }
  };

  // Unassign a staff member from this company
  const handleRemoveStaff = async (staffUser) => {
    if (!window.confirm(`Gỡ nhân viên "${staffUser.username}" khỏi nhà xe?`)) return;
    setRemovingStaff(staffUser._id);
    try {
      await busCompanyApi.assignStaff(staffUser._id, null, []);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setRemovingStaff(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '10px', color: 'var(--gray-400)' }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '14px' }}>Đang tải...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return <div style={{ padding: '32px', color: '#DC2626', fontSize: '14px' }}>{error}</div>;
  if (!company) return null;

  const TABS = [
    { key: 'stations', label: 'Bến xe',    count: (company.stations || []).length, icon: MapPin  },
    { key: 'buses',    label: 'Xe',         count: buses.length,                   icon: Car     },
    { key: 'staff',    label: 'Nhân viên',  count: staff.length,                   icon: Users   },
  ];

  return (
    <div>
      {/* Assign Staff Modal */}
      {showAssignModal && (
        <StaffAssignmentModal
          company={company}
          onClose={() => setShowAssignModal(false)}
          onSuccess={load}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/admin/bus-companies')}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>Chi tiết nhà xe</h1>
        </div>
        <Link to={`/admin/bus-companies/${id}/edit`} className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <Pencil size={14} /> Chỉnh sửa
        </Link>
      </div>

      {/* Company info card */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <CompanyLogo logo={company.logo} name={company.name} size={64} radius="14px" />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gray-900)', margin: 0 }}>{company.name}</h2>
              {company.shortName && <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>({company.shortName})</span>}
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: company.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                color:      company.status === 'active' ? '#16A34A' : '#DC2626',
              }}>
                {company.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-600)' }}>
                <Building2 size={13} style={{ color: 'var(--gray-400)' }} />
                <code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{company.code}</code>
              </div>
              {company.hotline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gray-600)' }}>
                  <Phone size={13} style={{ color: 'var(--gray-400)' }} /> {company.hotline}
                </div>
              )}
            </div>

            {company.description && (
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '10px', lineHeight: 1.6 }}>{company.description}</p>
            )}
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { icon: MapPin, label: 'Bến xe',   value: (company.stations || []).length, color: '#2563EB' },
              { icon: Car,    label: 'Xe',        value: buses.length,                   color: '#16A34A' },
              { icon: Users,  label: 'Nhân viên', value: staff.length,                   color: '#9333EA' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center', minWidth: '72px' }}>
                <Icon size={16} style={{ color, margin: '0 auto 4px' }} />
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--gray-900)' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '1px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs card */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', padding: '0 20px' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '14px 14px',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                color: active ? 'var(--primary)' : 'var(--gray-500)',
                fontWeight: active ? '700' : '500', fontSize: '13px',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <Icon size={14} />
                {tab.label}
                <span style={{ background: active ? 'rgba(255,107,53,0.12)' : 'var(--gray-100)', color: active ? 'var(--primary)' : 'var(--gray-500)', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── Stations tab ── */}
          {activeTab === 'stations' && (
            (company.stations || []).length === 0
              ? <EmptyState icon={MapPin} text="Chưa có bến xe nào được gán" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {(company.stations || []).map(st => (
                    <div key={st._id} style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={14} style={{ color: '#2563EB' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-900)' }}>{st.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{st.city}</div>
                        {st.address && <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.address}</div>}
                      </div>
                      <button onClick={() => handleRemoveStation(st._id, st.name)} disabled={removingStation === st._id} title="Gỡ bến"
                        style={{ padding: '4px', borderRadius: '6px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', flexShrink: 0, display: 'flex', opacity: removingStation === st._id ? 0.5 : 1 }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
          )}

          {/* ── Buses tab ── */}
          {activeTab === 'buses' && (
            buses.length === 0
              ? <EmptyState icon={Car} text="Chưa có xe nào thuộc nhà xe này" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {buses.map(b => (
                    <div key={b._id} style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-900)' }}>{b.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                        🚌 {b.licensePlate} · {b.type} · {b.totalSeats} chỗ
                      </div>
                      {b.driver && <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>👤 {b.driver}</div>}
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.status === 'active' ? '#DCFCE7' : '#FEE2E2', color: b.status === 'active' ? '#16A34A' : '#DC2626' }}>
                          {b.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* ── Staff tab ── */}
          {activeTab === 'staff' && (
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                  {staff.length > 0 ? `${staff.length} nhân viên thuộc nhà xe này` : 'Chưa có nhân viên nào'}
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  <UserPlus size={14} /> Gán nhân viên mới
                </button>
              </div>

              {staff.length === 0 ? (
                <EmptyState icon={Users} text="Chưa có nhân viên nào được gán">
                  <button onClick={() => setShowAssignModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginTop: '12px' }}>
                    <UserPlus size={14} /> Gán ngay
                  </button>
                </EmptyState>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {staff.map(u => (
                    <div key={u._id} style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '14px 16px' }}>
                      {/* User row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                          {(u.username || 'S')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-900)' }}>{u.username}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveStaff(u)}
                          disabled={removingStaff === u._id}
                          title="Gỡ khỏi nhà xe"
                          style={{ padding: '5px', borderRadius: '7px', background: '#FEF2F2', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', opacity: removingStaff === u._id ? 0.5 : 1, flexShrink: 0 }}
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>

                      {/* Managed stations chips */}
                      {(u.managedStations || []).length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(u.managedStations || []).map(st => (
                            <span key={st._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: '600' }}>
                              <MapPin size={10} /> {st.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Status badge */}
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: u.status === 'active' ? '#DCFCE7' : '#FEE2E2', color: u.status === 'active' ? '#16A34A' : '#DC2626' }}>
                          {u.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'var(--gray-100)', color: 'var(--gray-500)', fontSize: '11px' }}>{u.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Simple empty-state helper
function EmptyState({ icon: Icon, text, children }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <Icon size={36} style={{ color: 'var(--gray-300)', margin: '0 auto 12px' }} />
      <div style={{ fontSize: '14px', color: 'var(--gray-400)' }}>{text}</div>
      {children}
    </div>
  );
}
