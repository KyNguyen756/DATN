import { useState, useEffect } from 'react';
import {
  Download, TrendingUp, BarChart3, FileText, Calendar,
  Loader, Users, Ticket, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios';

// Trigger a browser file download from a blob URL
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date range for export
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate]     = useState(today);
  const [exporting, setExporting] = useState(null); // 'excel' | 'pdf' | null
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    api.get('/stats/admin')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (format) => {
    setExportError('');
    setExporting(format);
    try {
      const res = await api.get(`/reports/${format}`, {
        params: { from: fromDate || undefined, to: toDate || undefined },
        responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mime = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const blob = new Blob([res.data], { type: mime });
      const label = `${fromDate || 'all'}_${toDate || 'all'}`;
      downloadBlob(blob, `BaoCao_${label}.${ext}`);
    } catch (err) {
      setExportError('Không thể xuất báo cáo. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  const kpiCards = stats ? [
    { label: 'Tổng doanh thu', value: (stats.totalRevenue || 0).toLocaleString() + 'đ', sub: 'Từ tất cả đơn hàng', color: 'var(--primary)', bg: 'var(--primary-bg)', icon: TrendingUp },
    { label: 'Tổng đặt vé',   value: (stats.totalBookings || 0).toLocaleString(), sub: 'Tất cả thời gian', color: '#22C55E', bg: '#DCFCE7', icon: BarChart3 },
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

        {/* ── Export panel ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          background: 'var(--gray-50)', borderRadius: '12px', padding: '12px 16px',
        }}>
          {/* Date range pickers */}
          <div className="flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
            <Calendar size={14} color="var(--primary)" />
            <span>Từ:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '12px', width: '130px' }}
              value={fromDate}
              max={toDate}
              onChange={e => setFromDate(e.target.value)}
            />
            <span>Đến:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '12px', width: '130px' }}
              value={toDate}
              min={fromDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>

          {/* Export buttons */}
          <button
            id="btn-export-excel"
            className="btn btn-outline"
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
          >
            {exporting === 'excel'
              ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <FileText size={14} />}
            Xuất Excel
          </button>

          <button
            id="btn-export-pdf"
            className="btn btn-primary"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
          >
            {exporting === 'pdf'
              ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Download size={14} />}
            Xuất PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div className="flex items-center gap-2" style={{ padding: '10px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
          <AlertCircle size={14} />{exportError}
        </div>
      )}


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
