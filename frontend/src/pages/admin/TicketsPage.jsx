import { useState, useEffect, useCallback } from 'react';
import { Search, Download, X, Eye, Loader, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const statusConfig = {
  valid: { label: 'Còn hiệu lực', cls: 'badge-success' },
  used: { label: 'Đã dùng', cls: 'badge-gray' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
};

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—';

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets', {
        params: {
          page,
          limit: 20,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: search || undefined,
        },
      });
      setTickets(res.data.tickets || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách vé.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, page]);

  useEffect(() => {
    const t = setTimeout(fetchTickets, 350);
    return () => clearTimeout(t);
  }, [fetchTickets]);

  const handleCancel = async (ticket) => {
    if (!confirm(`Hủy vé ${ticket.code}?`)) return;
    setCancellingId(ticket._id);
    try {
      // Cancel via booking cancellation
      await api.delete(`/bookings/${ticket.booking?._id || ticket.booking}`);
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy vé.');
    } finally {
      setCancellingId(null);
    }
  };

  const counts = {
    valid: tickets.filter(t => t.status === 'valid').length,
    used: tickets.filter(t => t.status === 'used').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
  };
  const revenue = tickets.filter(t => t.status !== 'cancelled')
    .reduce((s, t) => s + (t.booking?.totalPrice || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Vé & Đặt chỗ</h1>
          <p className="section-subtitle">Quản lý toàn bộ vé và đơn đặt chỗ ({total} tổng)</p>
        </div>
        <button className="btn btn-primary">
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng vé (trang này)', value: tickets.length, color: 'var(--primary)', bg: 'var(--primary-bg)' },
          { label: 'Còn hiệu lực', value: counts.valid, color: 'var(--success)', bg: 'var(--success-light)' },
          { label: 'Đã dùng', value: counts.used, color: 'var(--gray-600)', bg: 'var(--gray-100)' },
          { label: 'Doanh thu (trang)', value: revenue > 0 ? (revenue / 1000).toFixed(0) + 'k' : '0', color: 'var(--info)', bg: 'var(--info-light)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: s.bg, fontWeight: '800', fontSize: '18px', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-3" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input className="form-input" placeholder="Tìm mã vé, tên khách..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '36px' }} />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'valid', 'used', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
              padding: '7px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '12px',
              border: `2px solid ${filterStatus === s ? 'var(--primary)' : 'var(--gray-200)'}`,
              background: filterStatus === s ? 'var(--primary-bg)' : 'white',
              color: filterStatus === s ? 'var(--primary)' : 'var(--gray-600)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {s === 'all' ? 'Tất cả' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ color: 'var(--gray-400)', fontSize: '13px' }}>Đang tải dữ liệu...</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Hành khách</th>
                  <th>Tuyến & Giờ</th>
                  <th>Ghế</th>
                  <th>Tiền</th>
                  <th>T.Toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  const st = statusConfig[t.status] || statusConfig.valid;
                  const trip = t.trip;
                  return (
                    <tr key={t._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{t.code || t._id?.slice(-8)}</td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.booking?.passengerName || t.user?.username || 'Khách'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{t.booking?.passengerPhone || t.user?.email || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                          {trip?.fromStation?.city && trip?.toStation?.city
                            ? `${trip.fromStation.city} → ${trip.toStation.city}`
                            : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{fmtTime(trip?.departureTime)}</div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--gray-100)', padding: '3px 8px', borderRadius: '5px', fontWeight: '700', fontFamily: 'monospace', fontSize: '12px' }}>
                          {t.seat?.seat?.seatNumber || '—'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>
                        {t.booking?.totalPrice ? `${(t.booking.totalPrice / (t.booking.seatIds?.length || 1)).toLocaleString()}đ` : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{t.booking?.paymentMethod || '—'}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(t)} title="Chi tiết">
                            <Eye size={13} />
                          </button>
                          {t.status === 'valid' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger)' }}
                              title="Hủy vé"
                              disabled={cancellingId === t._id}
                              onClick={() => handleCancel(t)}
                            >
                              {cancellingId === t._id ? <Loader size={13} /> : <X size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tickets.length === 0 && !loading && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Không tìm thấy vé nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-2" style={{ marginTop: '16px', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
          <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>Trang {page} / {Math.ceil(total / 20)}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Tiếp →</button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>Chi tiết vé — <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{showDetail.code}</span></h3>

            {showDetail.qrCode && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <img src={showDetail.qrCode} alt="QR" style={{ width: '140px', height: '140px', borderRadius: '10px', border: '2px solid var(--gray-200)' }} />
              </div>
            )}

            {[
              ['Hành khách', showDetail.booking?.passengerName || showDetail.user?.username],
              ['Điện thoại', showDetail.booking?.passengerPhone || '—'],
              ['Email', showDetail.booking?.passengerEmail || showDetail.user?.email || '—'],
              ['Tuyến', showDetail.trip?.fromStation?.city && showDetail.trip?.toStation?.city ? `${showDetail.trip.fromStation.city} → ${showDetail.trip.toStation.city}` : '—'],
              ['Ngày giờ đi', fmtTime(showDetail.trip?.departureTime)],
              ['Ghế', showDetail.seat?.seat?.seatNumber || '—'],
              ['Phương thức TT', showDetail.booking?.paymentMethod || '—'],
              ['Ghi chú', showDetail.booking?.note || '—'],
              ['Trạng thái', statusConfig[showDetail.status]?.label],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: '700' }}>{v}</span>
              </div>
            ))}
            <div className="flex items-center gap-3" style={{ marginTop: '20px' }}>
              {showDetail.status === 'valid' && (
                <button
                  className="btn btn-sm w-full"
                  style={{ background: 'var(--danger-light)', color: 'var(--danger)', justifyContent: 'center' }}
                  onClick={() => { handleCancel(showDetail); setShowDetail(null); }}
                >
                  Hủy vé
                </button>
              )}
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
