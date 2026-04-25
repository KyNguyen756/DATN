import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Download, X, CheckCircle, Bus, Loader, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '';

const statusConfig = {
  valid: { label: 'Còn hiệu lực', cls: 'badge-success', icon: CheckCircle },
  used: { label: 'Đã sử dụng', cls: 'badge-gray', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger', icon: X },
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('valid');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrTicket, setQrTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets/my');
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách vé.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCancel = async (ticket) => {
    if (!ticket || !confirm('Hủy vé này? Ghế sẽ được giải phóng và không thể hoàn tác.')) return;
    try {
      await api.patch(`/tickets/${ticket._id}/cancel`);
      // Update ticket status locally — by ticket ID (not booking ID)
      setTickets(prev => prev.map(t =>
        t._id === ticket._id ? { ...t, status: 'cancelled' } : t
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy vé.');
    }
  };

  const filtered = tickets.filter(t => t.status === tab);

  const tabCounts = {
    valid: tickets.filter(t => t.status === 'valid').length,
    used: tickets.filter(t => t.status === 'used').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
  };

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
            { id: 'valid', label: 'Còn hiệu lực' },
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
              {t.label} ({tabCounts[t.id]})
            </button>
          ))}
        </div>

        {loading && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Loader size={32} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'var(--gray-400)' }}>Đang tải vé...</div>
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '20px' }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '14px' }}>
              <AlertCircle size={16} />{error}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <Bus size={48} color="var(--gray-300)" />
              <div style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Không có vé nào</div>
              <button className="btn btn-primary" onClick={() => navigate('/search')}>Đặt vé ngay</button>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(ticket => {
              const sc = statusConfig[ticket.status] || statusConfig.valid;
              const Icon = sc.icon;
              const trip = ticket.trip;
              return (
                <div key={ticket._id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Top */}
                  <div style={{ padding: '20px 24px', borderBottom: '3px dashed var(--gray-200)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                      <div className="flex items-center gap-3">
                        {/* Logo nhà xe */}
                        {trip?.busCompany?.logo ? (
                          <img
                            src={trip.busCompany.logo}
                            alt={trip.busCompany.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: 'var(--gray-50)', border: '1px solid var(--gray-100)', padding: '2px' }}
                          />
                        ) : (
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '8px', fontWeight: '800',
                            background: 'var(--primary-bg)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                          }}>{trip?.busCompany?.name?.[0] || trip?.bus?.name?.[0] || 'X'}</div>
                        )}
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>
                            {trip?.busCompany?.shortName || trip?.busCompany?.name || trip?.bus?.name || 'Nhà xe'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{trip?.bus?.type || ''}</span>
                            {trip?.bus?.licensePlate && (
                              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--gray-700)', background: 'var(--gray-100)', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                {trip.bus.licensePlate}
                              </span>
                            )}
                          </div>
                          {trip?.bus?.driver && (
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                              🧑‍✈️ {trip.bus.driver}{trip?.bus?.driverPhone ? ` · ${trip.bus.driverPhone}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${sc.cls}`}><Icon size={10} /> {sc.label}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip?.departureTime)}</div>
                        <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '13px' }}>{trip?.fromStation?.city}</div>
                      </div>
                      <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, var(--primary), var(--primary-light))' }} />
                      <Bus size={16} color="var(--primary)" />
                      <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, var(--primary-light), var(--primary))' }} />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip?.arrivalTime)}</div>
                        <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '13px' }}>{trip?.toStation?.city}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-50)' }}>
                    <div className="flex items-center gap-4">
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        <div>Ngày: <strong style={{ color: 'var(--gray-700)' }}>{fmtDate(trip?.departureTime)}</strong></div>
                        <div>Ghế: <strong style={{ color: 'var(--gray-700)' }}>{ticket.seat?.seat?.seatNumber || '—'}</strong></div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>Mã vé</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '14px', color: 'var(--primary)' }}>
                          {ticket.code || ticket._id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.status === 'valid' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setQrTicket(ticket)}>
                            <QrCode size={14} /> QR Code
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                            onClick={() => handleCancel(ticket)}
                            disabled={cancellingId === ticket._id}
                          >
                            {cancellingId === ticket._id ? <Loader size={14} /> : <X size={14} />} Hủy
                          </button>
                        </>
                      )}
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>
                        {ticket.booking?.totalPrice?.toLocaleString()}đ
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
              <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '20px' }}>
                {qrTicket.trip?.fromStation?.city} → {qrTicket.trip?.toStation?.city}
              </p>

              {/* Real QR from backend */}
              {qrTicket.qrCode ? (
                <img
                  src={qrTicket.qrCode}
                  alt="QR Code"
                  style={{ width: '180px', height: '180px', margin: '0 auto 16px', display: 'block', borderRadius: '12px', border: '3px solid var(--gray-200)' }}
                />
              ) : (
                <div style={{ width: '180px', height: '180px', borderRadius: '12px', border: '3px solid var(--gray-200)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                  <QrCode size={48} />
                </div>
              )}

              <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', letterSpacing: '3px' }}>
                {qrTicket.code || qrTicket._id}
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setQrTicket(null)}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}