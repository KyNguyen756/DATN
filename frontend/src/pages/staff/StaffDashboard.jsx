import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, DollarSign, Users, Clock, ChevronRight, Printer, Loader } from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    // Fetch overall admin stats (includes totals we can display)
    api.get('/stats/admin')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch recent tickets sold today
    api.get('/tickets', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } })
      .then(res => setRecentTickets(res.data?.tickets || res.data || []))
      .catch(() => {});
  }, []);

  const quickActions = [
    { label: 'Bán vé nhanh', icon: Ticket, color: 'var(--primary)', bg: 'var(--primary-bg)', to: '/staff/quick-sale' },
    { label: 'Check-in hành khách', icon: Users, color: '#3B82F6', bg: '#DBEAFE', to: '/staff/check-in' },
    { label: 'Quản lý giữ ghế', icon: Clock, color: '#F59E0B', bg: '#FEF3C7', to: '/staff/hold-seats' },
    { label: 'In lại vé', icon: Printer, color: '#8B5CF6', bg: '#EDE9FE', to: '/staff/quick-sale' },
  ];

  const statCards = [
    { label: 'Tổng vé hệ thống', value: stats ? stats.totalTickets?.toLocaleString() : '—', icon: Ticket, color: '#FF6B35', bg: '#FFF3EE' },
    { label: 'Tổng doanh thu', value: stats ? ((stats.totalRevenue || 0) / 1e6).toFixed(1) + 'tr' : '—', icon: DollarSign, color: '#22C55E', bg: '#DCFCE7' },
    { label: 'Tổng người dùng', value: stats ? stats.totalUsers?.toLocaleString() : '—', icon: Users, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Tổng đặt vé', value: stats ? stats.totalBookings?.toLocaleString() : '—', icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Dashboard nhân viên</h1>
          <p className="section-subtitle">{today}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/staff/quick-sale')}>
          <Ticket size={16} /> Bán vé ngay
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>
                {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: s.color }} /> : <Icon size={22} color={s.color} />}
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Quick actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: '800', marginBottom: '16px', fontSize: '15px' }}>Thao tác nhanh</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(a.to)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    padding: '20px 12px', borderRadius: '12px', background: a.bg,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  className="card-hover"
                >
                  <Icon size={24} color={a.color} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: a.color, textAlign: 'center' }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '15px' }}>Vé gần đây</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/staff/quick-sale')}>
              Bán mới <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)', fontSize: '13px' }}>
                Chưa có vé nào được bán hôm nay
              </div>
            ) : recentTickets.map(t => (
              <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)', flexShrink: 0, fontSize: '12px' }}>
                  {(t.booking?.passengerName || t.booking?.user?.username || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.booking?.passengerName || t.booking?.user?.username || 'Khách vãng lai'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                    {t.booking?.trip?.fromStation?.city && t.booking?.trip?.toStation?.city
                      ? `${t.booking.trip.fromStation.city} → ${t.booking.trip.toStation.city}`
                      : '—'} · {fmtTime(t.booking?.trip?.departureTime)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>
                    {t.booking?.totalPrice?.toLocaleString()}đ
                  </div>
                  <span className={`badge ${t.status === 'valid' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                    {t.status === 'valid' ? 'Hợp lệ' : t.status === 'used' ? 'Đã dùng' : 'Đã hủy'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
