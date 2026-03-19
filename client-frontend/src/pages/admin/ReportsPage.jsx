import { useState } from 'react';
import { Download, TrendingUp, BarChart3, FileText, Calendar } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const monthlyData = [
  { month: 'T1', revenue: 420, cancelled: 18, occupancy: 72 },
  { month: 'T2', revenue: 380, cancelled: 22, occupancy: 65 },
  { month: 'T3', revenue: 510, cancelled: 15, occupancy: 80 },
  { month: 'T4', revenue: 470, cancelled: 19, occupancy: 76 },
  { month: 'T5', revenue: 620, cancelled: 12, occupancy: 88 },
  { month: 'T6', revenue: 580, cancelled: 14, occupancy: 84 },
];

const driverStats = [
  { name: 'Nguyễn Văn Bình', trips: 142, revenue: 21300000, rating: 4.9, onTime: 98 },
  { name: 'Trần Văn Dũng', trips: 98, revenue: 14700000, rating: 4.7, onTime: 95 },
  { name: 'Lê Thị Hoa', trips: 67, revenue: 10050000, rating: 4.6, onTime: 93 },
  { name: 'Phạm Văn An', trips: 201, revenue: 30150000, rating: 4.8, onTime: 97 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Báo cáo & Thống kê</h1>
          <p className="section-subtitle">Phân tích dữ liệu kinh doanh chi tiết</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="form-select" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm nay</option>
          </select>
          <button className="btn btn-primary">
            <Download size={15} /> Xuất PDF
          </button>
          <button className="btn btn-secondary">
            <FileText size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Tổng doanh thu', value: '8.4 tỷ', sub: 'Năm 2025', color: 'var(--primary)', bg: 'var(--primary-bg)', icon: TrendingUp },
          { label: 'Tỷ lệ lấp đầy', value: '78.5%', sub: 'TB toàn tuyến', color: '#22C55E', bg: '#DCFCE7', icon: BarChart3 },
          { label: 'Tỷ lệ hủy vé', value: '3.2%', sub: 'Giảm 1.4%', color: '#F59E0B', bg: '#FEF3C7', icon: FileText },
          { label: 'Doanh thu/chuyến', value: '1.8tr', sub: 'Trung bình', color: '#3B82F6', bg: '#DBEAFE', icon: Calendar },
        ].map((s, i) => {
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Doanh thu theo tháng</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Đơn vị: triệu đồng</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}tr`} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy + Cancellation */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Tỷ lệ lấp đầy & Hủy vé</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Đơn vị: %</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancy" name="Lấp đầy" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cancelled" name="Hủy vé" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver report */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '800', fontSize: '15px' }}>Báo cáo tài xế</h3>
          <button className="btn btn-ghost btn-sm"><Download size={13} /> Xuất Excel</button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Tài xế</th><th>Số chuyến</th><th>Doanh thu</th><th>Đánh giá</th><th>Đúng giờ</th></tr>
            </thead>
            <tbody>
              {driverStats.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '600', fontSize: '13px' }}>{d.name}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{d.trips} chuyến</td>
                  <td style={{ fontWeight: '700', color: 'var(--success)', fontSize: '13px' }}>{d.revenue.toLocaleString()}đ</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span style={{ color: '#F59E0B' }}>★</span>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{d.rating}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: '60px', height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.onTime}%`, height: '100%', background: d.onTime >= 97 ? 'var(--success)' : 'var(--warning)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{d.onTime}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
