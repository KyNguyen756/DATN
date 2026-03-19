import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Star, Clock, MapPin, Shield, Users, ChevronRight,
  Wifi, Snowflake, Zap, Coffee, Info, CheckCircle,
  Bus, AlertCircle
} from 'lucide-react';

const ROWS = 11;
const COLS_LOWER = 4;
const COLS_UPPER = 4;

// Simulated seat states
const bookedSeats = new Set(['A2', 'A3', 'B1', 'C4', 'D2', 'E1', 'E2', 'F3', 'G4', 'H1', 'I2', 'J3', 'K1', 'K4']);
const vipSeats = new Set(['A1', 'A4', 'K1', 'K4']);

const SEAT_ROWS = ['A','B','C','D','E','F','G','H','I','J','K'];

export default function TripDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [deck, setDeck] = useState('lower');
  const [activeTab, setActiveTab] = useState('seats');

  const trip = {
    company: 'Phương Trang',
    type: 'Limousine',
    from: 'TP.HCM', fromAddr: 'Bến xe Miền Tây, 395 Kinh Dương Vương',
    to: 'Đà Lạt', toAddr: 'Bến xe Đà Lạt, 01 Tô Hiến Thành',
    depart: '07:00', arrive: '14:00', duration: '7 tiếng',
    price: 150000, vipPrice: 200000,
    rating: 4.8, reviews: 234,
    plate: '51B-12345',
    driver: 'Nguyễn Văn Bình',
    amenities: ['WiFi miễn phí', 'Điều hòa', 'USB sạc', 'Nước uống', 'Chăn gối'],
    policies: ['Hủy trước 24h: hoàn 80%', 'Hủy trước 2h: hoàn 50%', 'Không hoàn sau khi xe xuất phát'],
  };

  const toggleSeat = (seatId) => {
    if (bookedSeats.has(seatId)) return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : prev.length < 5 ? [...prev, seatId] : prev
    );
  };

  const getSeatStyle = (seatId) => {
    if (selectedSeats.includes(seatId)) return 'seat-selected';
    if (bookedSeats.has(seatId)) return 'seat-booked';
    if (vipSeats.has(seatId)) return 'seat-vip';
    return 'seat-available';
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (vipSeats.has(seat) ? trip.vipPrice : trip.price), 0);

  const tabs = [
    { id: 'seats', label: 'Chọn ghế' },
    { id: 'info', label: 'Thông tin xe' },
    { id: 'policy', label: 'Chính sách' },
  ];

  return (
    <div style={{ padding: '24px 0', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)' }}>{trip.depart}</div>
              <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '2px' }}>{trip.from}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.fromAddr}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '6px' }}>{trip.duration}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '2px', background: 'var(--gray-300)' }} />
                <Bus size={20} color="var(--primary)" />
                <div style={{ width: '40px', height: '2px', background: 'var(--gray-300)' }} />
              </div>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>{trip.type}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)' }}>{trip.arrive}</div>
              <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '2px' }}>{trip.to}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.toAddr}</div>
            </div>
          </div>

          <div className="divider" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={16} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-800)' }}>{trip.company}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Biển số: {trip.plate}</div>
              </div>
            </div>
            <div className="flex items-center gap-1" style={{ marginLeft: 'auto' }}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontWeight: '700', fontSize: '13px' }}>{trip.rating}</span>
              <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>({trip.reviews} đánh giá)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Main content */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  flex: 1, padding: '9px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === t.id ? 'white' : 'transparent',
                  color: activeTab === t.id ? 'var(--gray-900)' : 'var(--gray-500)',
                  boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'seats' && (
              <div className="card" style={{ padding: '24px' }}>
                {/* Deck selector */}
                <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)' }}>Tầng:</span>
                  {['lower', 'upper'].map(d => (
                    <button key={d} onClick={() => setDeck(d)} style={{
                      padding: '6px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px',
                      border: '2px solid', cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: deck === d ? 'var(--primary)' : 'var(--gray-200)',
                      background: deck === d ? 'var(--primary-bg)' : 'white',
                      color: deck === d ? 'var(--primary)' : 'var(--gray-500)',
                    }}>
                      {d === 'lower' ? 'Tầng dưới' : 'Tầng trên'}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4" style={{ marginBottom: '20px', fontSize: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  {[
                    { cls: 'seat-available', label: 'Còn trống' },
                    { cls: 'seat-selected', label: 'Đang chọn' },
                    { cls: 'seat-booked', label: 'Đã đặt' },
                    { cls: 'seat-vip', label: 'VIP' },
                  ].map(({ cls, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ width: '24px', height: '24px', borderRadius: '5px' }} className={cls} />
                      <span style={{ color: 'var(--gray-600)' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Seat map */}
                <div style={{
                  background: 'var(--gray-50)', borderRadius: '12px', padding: '20px',
                  maxWidth: '320px', margin: '0 auto',
                }}>
                  {/* Driver */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--gray-200)', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', color: 'var(--gray-600)',
                    }}>
                      <Bus size={14} /> Tài xế: {trip.driver}
                    </div>
                  </div>

                  {/* Seats grid */}
                  {SEAT_ROWS.map(row => (
                    <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px 1fr 1fr', marginBottom: '8px', gap: '6px', alignItems: 'center' }}>
                      {[1, 2].map(col => {
                        const sid = `${row}${col}`;
                        return (
                          <button
                            key={sid}
                            onClick={() => toggleSeat(sid)}
                            className={getSeatStyle(sid)}
                            style={{
                              width: '100%', aspectRatio: '1', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '700', cursor: bookedSeats.has(sid) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >{sid}</button>
                        );
                      })}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)', fontSize: '12px' }}>|</div>
                      {[3, 4].map(col => {
                        const sid = `${row}${col}`;
                        return (
                          <button
                            key={sid}
                            onClick={() => toggleSeat(sid)}
                            className={getSeatStyle(sid)}
                            style={{
                              width: '100%', aspectRatio: '1', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '700', cursor: bookedSeats.has(sid) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >{sid}</button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Thông tin xe</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    ['Hãng xe', trip.company],
                    ['Loại xe', trip.type],
                    ['Biển số', trip.plate],
                    ['Tài xế', trip.driver],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '4px' }}>{k}</div>
                      <div style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Tiện ích trên xe</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {trip.amenities.map(a => (
                    <span key={a} className="tag">
                      <CheckCircle size={12} color="var(--success)" style={{ marginRight: '4px' }} />{a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Chính sách hủy vé</h3>
                {trip.policies.map((p, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '10px', marginBottom: '8px' }}>
                    <AlertCircle size={16} color="var(--warning)" />
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking summary */}
          <div>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '80px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Tóm tắt đặt vé</h3>

              {selectedSeats.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <Users size={36} color="var(--gray-300)" />
                  <div style={{ fontSize: '13px', textAlign: 'center' }}>Vui lòng chọn ghế bên trái</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    {selectedSeats.map(seat => (
                      <div key={seat} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                          Ghế {seat} {vipSeats.has(seat) ? '(VIP)' : ''}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)' }}>
                          {(vipSeats.has(seat) ? trip.vipPrice : trip.price).toLocaleString()}đ
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
                onClick={() => navigate('/booking', { state: { seats: selectedSeats, trip } })}
              >
                Đặt vé ngay ({selectedSeats.length} ghế)
              </button>

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
