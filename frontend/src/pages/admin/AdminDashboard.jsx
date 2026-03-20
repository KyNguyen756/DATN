import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Ticket, Users, Bus, TrendingUp, TrendingDown,
  ChevronRight, BarChart3, Loader
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';

const COLORS = ['#FF6B35', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];

const statusConfig = {
  active: { label: 'Xác nhận', cls: 'badge-success' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
  pending: { label: 'Chờ xử lý', cls: 'badge-warning' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/admin')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const statCards = stats ? [
    { label: 'Doanh thu tổng', value: stats.totalRevenue?.toLocaleString() + 'đ', icon: DollarSign, color: '#FF6B35', bg: '#FFF3EE' },
    { label: 'Tổng đơn đặt vé', value: stats.totalBookings?.toLocaleString(), icon: Ticket, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Tổng khách hàng', value: stats.totalUsers?.toLocaleString(), icon: Users, color: '#22C55E', bg: '#DCFCE7' },
    { label: 'Vé đã tạo', value: stats.totalTickets?.toLocaleString(), icon: Bus, color: '#8B5CF6', bg: '#EDE9FE' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Tổng quan hệ thống</h1>
          <p className="section-subtitle">{today}</p>
        </div>
        <button className="btn btn-primary">
          <BarChart3 size={15} /> Xuất báo cáo
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Loader size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg }}>
                    <Icon size={22} color={s.color} />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue Chart */}
          {(stats?.bookingsPerDay?.length > 0) && (
            <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Doanh thu & Đặt vé (30 ngày gần nhất)</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Theo ngày</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.bookingsPerDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, name) => name === 'revenue' ? v.toLocaleString() + 'đ' : v} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu (đ)" stroke="#FF6B35" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="count" name="Đơn đặt" stroke="#3B82F6" fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Bookings */}
          {(stats?.recentBookings?.length > 0) && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '800', fontSize: '15px' }}>Đặt vé gần đây</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tickets')}>Xem tất cả <ChevronRight size={13} /></button>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Tuyến đường</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map(b => {
                      const st = statusConfig[b.bookingStatus] || statusConfig.active;
                      return (
                        <tr key={b._id}>
                          <td style={{ fontWeight: '600', fontSize: '13px' }}>
                            {b.user?.username || 'Khách'}
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{b.user?.email}</div>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                            {b.trip?.fromStation?.city && b.trip?.toStation?.city
                              ? `${b.trip.fromStation.city} → ${b.trip.toStation.city}`
                              : '—'}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{b.totalPrice?.toLocaleString()}đ</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{new Date(b.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
