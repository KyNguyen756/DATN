import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Download, X, Clock, CheckCircle, AlertCircle, Bus, MapPin } from 'lucide-react';

const tickets = [
  {
    id: 'VXB-123456', status: 'active',
    company: 'Phương Trang', from: 'TP.HCM', to: 'Đà Lạt',
    depart: '07:00', date: '25/03/2025', seats: ['A1', 'A2'],
    price: 300000, type: 'Limousine',
  },
  {
    id: 'VXB-654321', status: 'used',
    company: 'Thành Bưởi', from: 'TP.HCM', to: 'Vũng Tàu',
    depart: '08:00', date: '10/03/2025', seats: ['B3'],
    price: 80000, type: 'Ghế ngồi',
  },
  {
    id: 'VXB-999111', status: 'cancelled',
    company: 'Kumho Samco', from: 'Hà Nội', to: 'Đà Nẵng',
    depart: '22:00', date: '05/03/2025', seats: ['C4'],
    price: 200000, type: 'Giường nằm',
  },
];

const statusConfig = {
  active: { label: 'Còn hiệu lực', cls: 'badge-success', icon: CheckCircle },
  used: { label: 'Đã sử dụng', cls: 'badge-gray', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger', icon: X },
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [qrTicket, setQrTicket] = useState(null);

  const filtered = tickets.filter(t => t.status === tab);

  return (
    <div style={{ padding: '32px 0', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="page-header">
          <div>
            <h1 className="section-title">Vé của tôi</h1>
            <p className="section-subtitle">Quản lý toàn bộ vé xe của bạn</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            <Bus size={16} /> Đặt thêm vé
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
          {[
            { id: 'active', label: 'Còn hiệu lực' },
            { id: 'used', label: 'Đã sử dụng' },
            { id: 'cancelled', label: 'Đã hủy' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? 'var(--gray-900)' : 'var(--gray-500)',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            }}>
              {t.label} ({tickets.filter(v => v.status === t.id).length})
            </button>
          ))}
        </div>

        {/* Tickets */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Bus size={48} color="var(--gray-300)" />
              <div style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Không có vé nào</div>
              <button className="btn btn-primary" onClick={() => navigate('/search')}>Đặt vé ngay</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(ticket => {
              const sc = statusConfig[ticket.status];
              const Icon = sc.icon;
              return (
                <div key={ticket.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Top */}
                  <div style={{ padding: '20px 24px', borderBottom: `3px dashed var(--gray-200)` }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px', fontWeight: '800',
                          background: 'var(--primary-bg)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{ticket.company[0]}</div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>{ticket.company}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{ticket.type}</div>
                        </div>
                      </div>
                      <span className={`badge ${sc.cls}`}><Icon size={10} /> {sc.label}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)' }}>{ticket.depart}</div>
                        <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '13px' }}>{ticket.from}</div>
                      </div>
                      <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, var(--primary), var(--primary-light))' }} />
                      <Bus size={16} color="var(--primary)" />
                      <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, var(--primary-light), var(--primary))' }} />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)' }}>--:--</div>
                        <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '13px' }}>{ticket.to}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-50)' }}>
                    <div className="flex items-center gap-4">
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        <div>Ngày: <strong style={{ color: 'var(--gray-700)' }}>{ticket.date}</strong></div>
                        <div>Ghế: <strong style={{ color: 'var(--gray-700)' }}>{ticket.seats.join(', ')}</strong></div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>Mã vé</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '14px', color: 'var(--primary)' }}>{ticket.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.status === 'active' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setQrTicket(ticket)}>
                            <QrCode size={14} /> QR Code
                          </button>
                          <button className="btn btn-ghost btn-sm">
                            <Download size={14} /> In vé
                          </button>
                          <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                            <X size={14} /> Hủy
                          </button>
                        </>
                      )}
                      {ticket.status === 'used' && (
                        <button className="btn btn-ghost btn-sm">
                          <Download size={14} /> Tải PDF
                        </button>
                      )}
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>
                        {ticket.price.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Modal */}
        {qrTicket && (
          <div className="modal-overlay" onClick={() => setQrTicket(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '340px', textAlign: 'center' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '4px' }}>Vé điện tử</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '20px' }}>{qrTicket.from} → {qrTicket.to}</p>
              <div style={{
                width: '180px', height: '180px', borderRadius: '12px', border: '3px solid var(--gray-200)',
                display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gridTemplateRows: 'repeat(9, 1fr)',
                margin: '0 auto 16px', padding: '10px', gap: '2px',
              }}>
                {Array(81).fill(0).map((_, i) => (
                  <div key={i} style={{
                    borderRadius: '1px',
                    background: Math.random() > 0.5 ? 'var(--gray-900)' : 'transparent',
                  }} />
                ))}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', letterSpacing: '3px' }}>
                {qrTicket.id}
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setQrTicket(null)}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
