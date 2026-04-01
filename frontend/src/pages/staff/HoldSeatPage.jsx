import { useState, useEffect, useCallback } from 'react';
import { Clock, X, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

// Calculate minutes remaining from lockedAt + 5-min lock window
const minutesRemaining = (seat) => {
  if (!seat.lockedAt) return 0;
  const expiresAt = new Date(seat.lockedAt).getTime() + 5 * 60 * 1000;
  const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 60000));
  return remaining;
};

export default function HoldSeatPage() {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasingId, setReleasingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchLockedSeats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Get all trip seats that are locked across all trips
      // Backend: GET /api/trip-seats?status=locked (if supported) 
      // Fallback: could be a staff-specific endpoint
      const res = await api.get('/trip-seats/locked');
      setSeats(res.data || []);
    } catch {
      // If no dedicated endpoint, show empty with helpful message
      setSeats([]);
      setError('Endpoint /api/trip-seats/locked chưa được triển khai. Vui lòng liên hệ backend developer.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-calculate remaining times every 30s
  useEffect(() => {
    fetchLockedSeats();
    const t = setInterval(() => setSeats(prev => [...prev]), 30000);
    return () => clearInterval(t);
  }, [fetchLockedSeats]);

  const handleRelease = async (seat) => {
    if (!confirm(`Hủy giữ ghế ${seat.seat?.seatNumber}?`)) return;
    setReleasingId(seat._id);
    try {
      await api.delete(`/trip-seats/unlock/${seat._id}`);
      setSeats(prev => prev.filter(s => s._id !== seat._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy giữ ghế.');
    } finally {
      setReleasingId(null);
    }
  };

  const expiringSoon = seats.filter(s => minutesRemaining(s) < 2);
  const stillHeld = seats.filter(s => minutesRemaining(s) >= 2);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Quản lý giữ ghế</h1>
          <p className="section-subtitle">Theo dõi các ghế đang được giữ chờ thanh toán</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchLockedSeats} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Đang giữ', value: seats.length, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'Sắp hết hạn (< 2 phút)', value: expiringSoon.length, color: 'var(--danger)', bg: 'var(--danger-light)' },
          { label: 'Còn thời gian (≥ 2 phút)', value: stillHeld.length, color: 'var(--success)', bg: 'var(--success-light)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--warning)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px' }}>Danh sách ghế đang giữ</h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Ghế</th>
                  <th>Chuyến đi</th>
                  <th>Người giữ</th>
                  <th>Thời gian còn lại</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {seats.map(seat => {
                  const mins = minutesRemaining(seat);
                  const isActing = releasingId === seat._id || confirmingId === seat._id;
                  return (
                    <tr key={seat._id}>
                      <td>
                        <span style={{
                          background: 'var(--primary-bg)', color: 'var(--primary)',
                          padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace',
                        }}>{seat.seat?.seatNumber || '?'}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                          {seat.trip?.fromStation?.city && seat.trip?.toStation?.city
                            ? `${seat.trip.fromStation.city} → ${seat.trip.toStation.city}`
                            : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                          {fmtTime(seat.trip?.departureTime)} · {seat.trip?.bus?.name || ''}
                        </div>
                      </td>
                      <td>
                        {seat.lockedBy ? (
                          <>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{seat.lockedBy?.username || 'Khách'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{seat.lockedBy?.email}</div>
                          </>
                        ) : <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>Không rõ</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'var(--gray-200)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min((mins / 5) * 100, 100)}%`, height: '100%', borderRadius: '3px',
                              background: mins < 2 ? 'var(--danger)' : mins < 4 ? 'var(--warning)' : 'var(--success)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{
                            fontWeight: '700', fontSize: '13px',
                            color: mins < 2 ? 'var(--danger)' : mins < 4 ? 'var(--warning)' : 'var(--success)',
                          }}>
                            {mins} phút
                          </span>
                          {mins < 2 && <AlertCircle size={14} color="var(--danger)" />}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                            disabled={isActing}
                            onClick={() => handleRelease(seat)}
                          >
                            {releasingId === seat._id ? <Loader size={13} /> : <X size={13} />}
                            Hủy giữ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {seats.length === 0 && !loading && (
              <div className="empty-state">
                <Clock size={40} color="var(--gray-300)" />
                <div>Không có ghế nào đang được giữ</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Ghế được giữ tự động khi khách chọn ghế trong quá trình đặt vé</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
