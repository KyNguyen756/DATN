import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Star, Clock, MapPin, Shield, Users, ChevronRight,
  CheckCircle, Bus, AlertCircle, Loader
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDuration = (dep, arr, est) => {
  if (est) return `${Math.floor(est / 60)}h${est % 60 ? est % 60 + 'm' : ''}`;
  if (!dep || !arr) return '';
  const diff = (new Date(arr) - new Date(dep)) / 60000;
  return `${Math.floor(diff / 60)}h${diff % 60 ? Math.round(diff % 60) + 'm' : ''}`;
};

export default function TripDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { token } = useAuth();

  const [trip, setTrip] = useState(null);
  const [tripSeats, setTripSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // array of TripSeat objects
  const [deck, setDeck] = useState('lower');
  const [activeTab, setActiveTab] = useState('seats');
  const [loading, setLoading] = useState(true);
  const [lockLoading, setLockLoading] = useState(null); // tripSeatId being locked
  const [countdown, setCountdown] = useState(null); // seconds until lock expires
  const timerRef = useRef(null);

  // Start or reset the 5-min countdown when a seat is selected
  useEffect(() => {
    if (selectedSeats.length === 0) {
      clearInterval(timerRef.current);
      setCountdown(null);
      return;
    }
    const earliest = selectedSeats.reduce((min, s) => {
      const until = new Date(s.lockedUntil).getTime();
      return until < min ? until : min;
    }, Infinity);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((earliest - Date.now()) / 1000));
      setCountdown(secs);
      if (secs <= 0) clearInterval(timerRef.current);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [selectedSeats]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripRes, seatsRes] = await Promise.all([
          api.get(`/trips/${id}`),
          api.get(`/trip-seats/${id}`)
        ]);
        setTrip(tripRes.data);
        setTripSeats(seatsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleSeat = async (ts) => {
    if (ts.status === 'booked') return;

    // Deselect — allow without login
    if (selectedSeats.find(s => s._id === ts._id)) {
      try {
        await api.delete(`/trip-seats/unlock/${ts._id}`);
        setSelectedSeats(prev => prev.filter(s => s._id !== ts._id));
        setTripSeats(prev => prev.map(s => s._id === ts._id ? { ...s, status: 'available' } : s));
      } catch (err) {
        alert(err.response?.data?.message || 'Không thể bỏ chọn ghế.');
      }
      return;
    }

    if (!token) {
      // Nhắc nhở nhẹ nhàng — không redirect, chỉ show tích chọn ghế không được lock
      alert('Vui lòng đăng nhập để giữ ghế và đặt vé.');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (selectedSeats.length >= 5) return;

    setLockLoading(ts._id);
    try {
      const res = await api.post(`/trip-seats/lock/${ts._id}`);
      setSelectedSeats(prev => [...prev, res.data]);
      setTripSeats(prev => prev.map(s => s._id === ts._id ? { ...s, status: 'locked' } : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Ghế không còn khả dụng.');
    } finally {
      setLockLoading(null);
    }
  };

  const getSeatStyle = (ts) => {
    if (selectedSeats.find(s => s._id === ts._id)) return 'seat-selected';
    if (ts.status === 'booked') return 'seat-booked';
    if (ts.status === 'locked') return 'seat-booked';
    if (ts.seat?.type === 'vip') return 'seat-vip';
    return 'seat-available';
  };

  const totalPrice = selectedSeats.reduce((sum, ts) => {
    return sum + (ts.seat?.type === 'vip' ? (trip?.price * 1.3 || 0) : (trip?.price || 0));
  }, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!trip) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray-500)' }}>Không tìm thấy chuyến xe.</div>;
  }

  // Build seat grid from trip seat data
  const rows = [...new Set(tripSeats.map(ts => ts.seat?.row))].filter(Boolean).sort((a, b) => a - b);
  const cols = [...new Set(tripSeats.map(ts => ts.seat?.column))].filter(Boolean).sort((a, b) => a - b);
  const midCol = Math.ceil(cols.length / 2);

  // For sleeper buses, split into lower/upper deck by column index
  const isDoubleDeck = trip.bus?.type === 'sleeper' && cols.length > 2;
  const visibleCols = isDoubleDeck
    ? (deck === 'lower' ? cols.filter((_, i) => i < midCol) : cols.filter((_, i) => i >= midCol))
    : cols;

  const tabs = [
    { id: 'seats', label: 'Chọn ghế' },
    { id: 'info', label: 'Thông tin xe' },
    { id: 'policy', label: 'Chính sách' },
  ];

  return (
    <div style={{ padding: '24px 0', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header card */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip.departureTime)}</div>
              <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '2px' }}>{trip.fromStation?.city}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.fromStation?.name}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '6px' }}>
                {fmtDuration(trip.departureTime, trip.arrivalTime, trip.estimatedDuration)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '2px', background: 'var(--gray-300)' }} />
                <Bus size={20} color="var(--primary)" />
                <div style={{ width: '40px', height: '2px', background: 'var(--gray-300)' }} />
              </div>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>{trip.bus?.type}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip.arrivalTime)}</div>
              <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '2px' }}>{trip.toStation?.city}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.toStation?.name}</div>
            </div>
          </div>
          <div className="divider" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={16} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-800)' }}>{trip.bus?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Biển số: {trip.bus?.licensePlate}</div>
              </div>
            </div>
            {trip.bus?.driver && (
              <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                Tài xế: <strong>{trip.bus.driver}</strong>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Main content */}
          <div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  flex: 1, padding: '9px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === t.id ? 'white' : 'transparent',
                  color: activeTab === t.id ? 'var(--gray-900)' : 'var(--gray-500)',
                  boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
                }}>{t.label}</button>
              ))}
            </div>

            {activeTab === 'seats' && (
              <div className="card" style={{ padding: '24px' }}>
                {isDoubleDeck && (
                  <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)' }}>Tầng:</span>
                    {['lower', 'upper'].map(d => (
                      <button key={d} onClick={() => setDeck(d)} style={{
                        padding: '6px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px',
                        border: '2px solid', cursor: 'pointer',
                        borderColor: deck === d ? 'var(--primary)' : 'var(--gray-200)',
                        background: deck === d ? 'var(--primary-bg)' : 'white',
                        color: deck === d ? 'var(--primary)' : 'var(--gray-500)',
                      }}>
                        {d === 'lower' ? 'Tầng dưới' : 'Tầng trên'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  {[
                    { cls: 'seat-available', label: 'Còn trống' },
                    { cls: 'seat-selected', label: 'Đang chọn' },
                    { cls: 'seat-booked', label: 'Đã đặt' },
                    { cls: 'seat-vip', label: 'VIP' },
                  ].map(({ cls, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ width: '24px', height: '24px', borderRadius: '5px' }} className={cls} />
                      <span style={{ color: 'var(--gray-600)', fontSize: '12px' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {tripSeats.length === 0 ? (
                  <div className="empty-state">
                    <Bus size={36} color="var(--gray-300)" />
                    <div style={{ color: 'var(--gray-400)', fontSize: '13px' }}>Chưa có dữ liệu ghế cho chuyến này.</div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px', maxWidth: '340px', margin: '0 auto' }}>
                    {trip.bus?.driver && (
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--gray-200)', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', color: 'var(--gray-600)' }}>
                          <Bus size={14} /> Tài xế: {trip.bus.driver}
                        </div>
                      </div>
                    )}
                    {rows.map(row => {
                      const leftCols = visibleCols.slice(0, Math.ceil(visibleCols.length / 2));
                      const rightCols = visibleCols.slice(Math.ceil(visibleCols.length / 2));
                      return (
                        <div key={row} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          {leftCols.map(col => {
                            const ts = tripSeats.find(s => s.seat?.row === row && s.seat?.column === col);
                            if (!ts) return null;
                            return (
                              <button
                                key={ts._id}
                                onClick={() => toggleSeat(ts)}
                                disabled={lockLoading === ts._id}
                                className={getSeatStyle(ts)}
                                title={ts.seat?.seatNumber}
                                style={{
                                  width: '44px', height: '44px', borderRadius: '6px',
                                  fontSize: '10px', fontWeight: '700',
                                  cursor: ts.status === 'booked' ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {lockLoading === ts._id ? <Loader size={12} /> : ts.seat?.seatNumber}
                              </button>
                            );
                          })}
                          <div style={{ width: '2px', height: '44px', background: 'var(--gray-200)', borderRadius: '2px' }} />
                          {rightCols.map(col => {
                            const ts = tripSeats.find(s => s.seat?.row === row && s.seat?.column === col);
                            if (!ts) return null;
                            return (
                              <button
                                key={ts._id}
                                onClick={() => toggleSeat(ts)}
                                disabled={lockLoading === ts._id}
                                className={getSeatStyle(ts)}
                                title={ts.seat?.seatNumber}
                                style={{
                                  width: '44px', height: '44px', borderRadius: '6px',
                                  fontSize: '10px', fontWeight: '700',
                                  cursor: ts.status === 'booked' ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {lockLoading === ts._id ? <Loader size={12} /> : ts.seat?.seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Thông tin xe</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    ['Tên xe', trip.bus?.name],
                    ['Loại xe', trip.bus?.type],
                    ['Biển số', trip.bus?.licensePlate],
                    ['Tài xế', trip.bus?.driver || 'Chưa cập nhật'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '4px' }}>{k}</div>
                      <div style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {(trip.bus?.amenities || []).length > 0 && (
                  <>
                    <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Tiện ích trên xe</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {trip.bus.amenities.map(a => (
                        <span key={a} className="tag">
                          <CheckCircle size={12} color="var(--success)" style={{ marginRight: '4px' }} />{a}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Chính sách hủy vé</h3>
                {(trip.cancellationPolicy || '').split('.').filter(Boolean).map((p, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '10px', marginBottom: '8px' }}>
                    <AlertCircle size={16} color="var(--warning)" />
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{p.trim()}.</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking summary */}
          <div>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '80px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Tóm tắt đặt vé</h3>

              {countdown !== null && countdown > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                  <Clock size={14} />
                  Ghế được giữ trong {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </div>
              )}

              {selectedSeats.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <Users size={36} color="var(--gray-300)" />
                  <div style={{ fontSize: '13px', textAlign: 'center' }}>Vui lòng chọn ghế bên trái</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    {selectedSeats.map(ts => (
                      <div key={ts._id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                          Ghế {ts.seat?.seatNumber} {ts.seat?.type === 'vip' ? '(VIP)' : ''}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)' }}>
                          {(ts.seat?.type === 'vip' ? Math.round(trip.price * 1.3) : trip.price).toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between" style={{ marginBottom: '20px', paddingTop: '8px' }}>
                    <span style={{ fontWeight: '700' }}>Tổng cộng</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>{totalPrice.toLocaleString()}đ</span>
                  </div>
                </>
              )}

              <button
                className="btn btn-primary w-full"
                disabled={selectedSeats.length === 0}
                style={{ justifyContent: 'center', opacity: selectedSeats.length === 0 ? 0.5 : 1 }}
                onClick={() => {
                  if (!token) {
                    // Lưu state hiện tại để sau khi đăng nhập sẽ quay lại
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  navigate('/booking', {
                    state: {
                      tripId: trip._id,
                      seatIds: selectedSeats.map(s => s._id),
                      selectedSeats,
                      trip
                    }
                  });
                }}
              >
                Đặt vé ngay ({selectedSeats.length} ghế)
              </button>

              {!token && selectedSeats.length > 0 && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
                  ⚠️ Bạn cần đăng nhập để giữ ghế và thanh toán
                </div>
              )}

              <div className="flex items-center gap-2" style={{ marginTop: '12px', color: 'var(--gray-500)', fontSize: '12px', justifyContent: 'center' }}>
                <Shield size={12} /> Thanh toán bảo mật 256-bit SSL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
