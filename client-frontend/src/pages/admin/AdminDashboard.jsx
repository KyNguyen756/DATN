import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Ticket, Users, Bus, TrendingUp, TrendingDown,
  ChevronRight, ArrowUpRight, BarChart3, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const revenueData = [
  { month: 'T1', revenue: 420, tickets: 340 },
  { month: 'T2', revenue: 380, tickets: 290 },
  { month: 'T3', revenue: 510, tickets: 420 },
  { month: 'T4', revenue: 470, tickets: 380 },
  { month: 'T5', revenue: 620, tickets: 510 },
  { month: 'T6', revenue: 580, tickets: 470 },
  { month: 'T7', revenue: 720, tickets: 590 },
  { month: 'T8', revenue: 680, tickets: 550 },
  { month: 'T9', revenue: 750, tickets: 620 },
  { month: 'T10', revenue: 840, tickets: 700 },
  { month: 'T11', revenue: 920, tickets: 780 },
  { month: 'T12', revenue: 1100, tickets: 950 },
];

const routeData = [
  { name: 'HCM→Đà Lạt', value: 28 },
  { name: 'HCM→Nha Trang', value: 22 },
  { name: 'HN→Đà Nẵng', value: 18 },
  { name: 'HCM→Vũng Tàu', value: 15 },
  { name: 'Khác', value: 17 },
];
const COLORS = ['#FF6B35', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];

const recentOrders = [
  { id: 'VXB-9981', customer: 'Nguyễn Văn A', route: 'HCM → Đà Lạt', amount: 150000, status: 'confirmed' },
  { id: 'VXB-9982', customer: 'Trần Thị B', route: 'HCM → Nha Trang', amount: 200000, status: 'pending' },
  { id: 'VXB-9983', customer: 'Lê Văn C', route: 'HN → Đà Nẵng', amount: 250000, status: 'confirmed' },
  { id: 'VXB-9984', customer: 'Phạm Thị D', route: 'HCM → Vũng Tàu', amount: 80000, status: 'cancelled' },
];

const statCards = [
  { label: 'Doanh thu tháng', value: '1.2 tỷ', change: '+18.2%', up: true, icon: DollarSign, color: '#FF6B35', bg: '#FFF3EE' },
  { label: 'Vé bán tháng', value: '4,821', change: '+12.5%', up: true, icon: Ticket, color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'Khách hàng mới', value: '342', change: '+8.1%', up: true, icon: Users, color: '#22C55E', bg: '#DCFCE7' },
  { label: 'Tỷ lệ hủy vé', value: '3.2%', change: '-1.4%', up: false, icon: TrendingDown, color: '#8B5CF6', bg: '#EDE9FE' },
];

const statusConfig = {
  confirmed: { label: 'Xác nhận', cls: 'badge-success' },
  pending: { label: 'Chờ xử lý', cls: 'badge-warning' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
};

export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Tổng quan hệ thống</h1>
          <p className="section-subtitle">Thứ Tư, 19/03/2026</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Tháng 3, 2026</option>
            <option>Tháng 2, 2026</option>
          </select>
          <button className="btn btn-primary">
            <BarChart3 size={15} /> Xuất báo cáo
          </button>
        </div>
      </div>

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
                <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
                  {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {s.change} so với tháng trước
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Area Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>Doanh thu & Vé bán</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>12 tháng gần nhất (triệu đồng)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}tr`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#FF6B35" fill="url(#colorRevenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="tickets" name="Vé bán" stroke="#3B82F6" fill="url(#colorTickets)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>Top tuyến đường</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '16px' }}>Theo % vé bán</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={routeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {routeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {routeData.map((r, i) => (
              <div key={i} className="flex items-center justify-between" style={{ fontSize: '12px' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: 'var(--gray-600)' }}>{r.name}</span>
                </div>
                <span style={{ fontWeight: '700' }}>{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '800', fontSize: '15px' }}>Đặt vé gần đây</h3>
          <button className="btn btn-ghost btn-sm">Xem tất cả <ChevronRight size={13} /></button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Khách hàng</th>
                <th>Tuyến đường</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => {
                const st = statusConfig[o.status];
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary)', fontSize: '12px' }}>{o.id}</td>
                    <td style={{ fontWeight: '600', fontSize: '13px' }}>{o.customer}</td>
                    <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{o.route}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{o.amount.toLocaleString()}đ</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
