import { useState, useEffect } from 'react';
import { Download, TrendingUp, BarChart3, FileText, Calendar, Loader, Users, Ticket } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/admin')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = stats ? [
    { label: 'Tổng doanh thu', value: (stats.totalRevenue || 0).toLocaleString() + 'đ', sub: 'Từ tất cả đơn hàng', color: 'var(--primary)', bg: 'var(--primary-bg)', icon: TrendingUp },
    { label: 'Tổng đặt vé', value: (stats.totalBookings || 0).toLocaleString(), sub: 'Tất cả thời gian', color: '#22C55E', bg: '#DCFCE7', icon: BarChart3 },
    { label: 'Tổng người dùng', value: (stats.totalUsers || 0).toLocaleString(), sub: 'Tài khoản đã đăng ký', color: '#3B82F6', bg: '#DBEAFE', icon: Users },
    { label: 'Tổng vé đã tạo', value: (stats.totalTickets || 0).toLocaleString(), sub: 'Bao gồm đã dùng & hủy', color: '#8B5CF6', bg: '#EDE9FE', icon: Ticket },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Báo cáo & Thống kê</h1>
          <p className="section-subtitle">Phân tích dữ liệu kinh doanh chi tiết</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary">
            <Download size={15} /> Xuất PDF
          </button>
          <button className="btn btn-outline">
            <FileText size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Loader size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg }}><Icon size={22} color={s.color} /></div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          {(stats?.bookingsPerDay?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Revenue AreaChart */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Doanh thu 30 ngày gần nhất</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Đơn vị: VND</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.bookingsPerDay}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => v.toLocaleString() + 'đ'} />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#FF6B35" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Booking count BarChart */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Số đơn đặt vé 30 ngày</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Đơn vị: đơn</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.bookingsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số đơn" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent bookings table */}
          {(stats?.recentBookings?.length > 0) && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '800', fontSize: '15px' }}>10 giao dịch gần nhất</h3>
                <button className="btn btn-ghost btn-sm">
                  <Download size={13} /> Xuất
                </button>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Tuyến</th>
                      <th>Số tiền</th>
                      <th>Phương thức TT</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map(b => (
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
                        <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{b.paymentMethod || '—'}</td>
                        <td>
                          <span className={`badge ${b.bookingStatus === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>
                            {b.bookingStatus === 'cancelled' ? 'Đã hủy' : 'Xác nhận'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                          {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!stats?.bookingsPerDay?.length && !stats?.recentBookings?.length && (
            <div className="card">
              <div className="empty-state">
                <BarChart3 size={48} color="var(--gray-300)" />
                <div style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Chưa có đủ dữ liệu để hiển thị biểu đồ</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Dữ liệu sẽ xuất hiện sau khi có đơn đặt vé đầu tiên</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
