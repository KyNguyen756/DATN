import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, DollarSign, Users, Bus, Search, ChevronRight, Printer, MapPin, Clock } from 'lucide-react';

const recentSales = [
  { id: 'VXB-111', customer: 'Nguyễn Văn A', route: 'TP.HCM → Đà Lạt', seat: 'A1', price: 150000, time: '14:32' },
  { id: 'VXB-112', customer: 'Trần Thị B', route: 'TP.HCM → Nha Trang', seat: 'B3', price: 200000, time: '14:10' },
  { id: 'VXB-113', customer: 'Lê Văn C', route: 'TP.HCM → Đà Lạt', seat: 'C2', price: 150000, time: '13:55' },
];

export default function StaffDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Dashboard nhân viên</h1>
          <p className="section-subtitle">Thứ Tư, 19/03/2026 · Ca làm việc: 07:00 - 15:00</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/staff/quick-sale')}>
          <Ticket size={16} /> Bán vé ngay
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Vé bán hôm nay', value: '47', icon: Ticket, color: '#FF6B35', bg: '#FFF3EE' },
          { label: 'Doanh thu', value: '8.4tr', icon: DollarSign, color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Khách check-in', value: '32', icon: Users, color: '#3B82F6', bg: '#DBEAFE' },
          { label: 'Ghế đang giữ', value: '3', icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
        ].map((s, i) => {
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Quick actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: '800', marginBottom: '16px', fontSize: '15px' }}>Thao tác nhanh</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Bán vé nhanh', icon: Ticket, color: 'var(--primary)', bg: 'var(--primary-bg)', to: '/staff/quick-sale' },
              { label: 'Check-in hành khách', icon: Users, color: '#3B82F6', bg: '#DBEAFE', to: '/staff/check-in' },
              { label: 'Quản lý giữ ghế', icon: Clock, color: '#F59E0B', bg: '#FEF3C7', to: '/staff/hold-seats' },
              { label: 'In vé (giấy)', icon: Printer, color: '#8B5CF6', bg: '#EDE9FE', to: '/staff/quick-sale' },
            ].map((a, i) => {
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

        {/* Recent sales */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '15px' }}>Vé bán gần đây</h3>
            <button className="btn btn-ghost btn-sm">Xem tất cả <ChevronRight size={13} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentSales.map(sale => (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)', flexShrink: 0 }}>
                  {sale.customer[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sale.customer}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{sale.route} · Ghế {sale.seat}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{sale.price.toLocaleString()}đ</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{sale.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
