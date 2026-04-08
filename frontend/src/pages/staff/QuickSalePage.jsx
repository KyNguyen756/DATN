import { useState, useEffect, useCallback } from 'react';
import {
  Search, Bus, User, Phone, Mail, MapPin, Clock, CheckCircle,
  Printer, X, Loader, ChevronRight, AlertCircle, RotateCw,
  Tag, ArrowRight, CreditCard
} from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const typeLabels = { seater: 'Ghế ngồi', sleeper: 'Giường nằm', limousine: 'Limousine' };

const STEPS = ['Chọn chuyến', 'Chọn ghế', 'Thông tin KH', 'Xác nhận'];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tiền mặt' },
  { id: 'transfer', label: 'Chuyển khoản' },
  { id: 'card', label: 'Thẻ ngân hàng' },
];

// ── Seat Map subcomponent ──────────────────────────────────────────────────────
function SeatMap({ tripSeats, selected, onToggle }) {
  const rows = [...new Set(tripSeats.map(ts => ts.seat?.row))].filter(Boolean).sort((a, b) => a - b);
  const cols = [...new Set(tripSeats.map(ts => ts.seat?.column))].filter(Boolean).sort((a, b) => a - b);

  const getSeat = (row, col) => tripSeats.find(ts => ts.seat?.row === row && ts.seat?.column === col);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4" style={{ marginBottom: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
        {[
          { bg: 'var(--gray-100)', color: 'var(--gray-600)', label: 'Trống' },
          { bg: 'var(--primary)', color: 'white', label: 'Đã chọn' },
          { bg: 'var(--gray-400)', color: 'white', label: 'Đã đặt' },
          { bg: '#F59E0B20', color: '#F59E0B', label: 'VIP' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: l.bg, border: `1px solid ${l.color}20` }} />
            <span style={{ color: 'var(--gray-600)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Driver indicator */}
      <div style={{
        textAlign: 'center', padding: '8px', background: 'var(--gray-100)',
        borderRadius: '8px', fontSize: '12px', color: 'var(--gray-500)',
        fontWeight: '600', marginBottom: '16px',
      }}>🚗 Tài xế</div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
        {rows.map(row => (
          <div key={row} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ width: '24px', fontSize: '11px', color: 'var(--gray-400)', textAlign: 'right', flexShrink: 0 }}>
              {row}
            </span>
            {cols.map(col => {
              const ts = getSeat(row, col);
              if (!ts) return <div key={col} style={{ width: '44px', height: '44px' }} />;

              const isSelected = selected.includes(ts._id);
              const isBooked = ts.status === 'booked';
              const isVip = ts.seat?.type === 'vip';

              return (
                <button
                  key={col}
                  onClick={() => !isBooked && onToggle(ts)}
                  title={`Ghế ${ts.seat?.seatNumber}${isVip ? ' (VIP)' : ''}${isBooked ? ' - Đã đặt' : ''}`}
                  style={{
                    width: '44px', height: '44px', borderRadius: '8px', border: '2px solid',
                    fontSize: '11px', fontWeight: '700', cursor: isBooked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    background: isBooked ? 'var(--gray-300)' : isSelected ? 'var(--primary)' : isVip ? '#FFF8E7' : 'white',
                    color: isBooked ? 'var(--gray-500)' : isSelected ? 'white' : isVip ? '#F59E0B' : 'var(--gray-700)',
                    borderColor: isBooked ? 'var(--gray-300)' : isSelected ? 'var(--primary)' : isVip ? '#F59E0B' : 'var(--gray-200)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {ts.seat?.seatNumber?.replace(/R\d+C/, '') || col}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Receipt print view ─────────────────────────────────────────────────────────
function ReceiptView({ result, onClose, onNew }) {
  const { booking, tickets, receiptNumber } = result;
  const ticket = tickets?.[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: 'var(--success-light)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={36} color="var(--success)" />
          </div>
          <h2 style={{ fontWeight: '900', color: 'var(--success)', fontSize: '20px', marginBottom: '4px' }}>
            Bán vé thành công!
          </h2>
          <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: 'var(--primary)', letterSpacing: '2px' }}>
            {receiptNumber}
          </div>
        </div>

        {/* QR Code */}
        {ticket?.qrCode && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src={ticket.qrCode} alt="QR vé"
              style={{ width: '160px', height: '160px', borderRadius: '12px', border: '3px solid var(--gray-200)', margin: '0 auto' }}
            />
          </div>
        )}

        {/* Ticket info */}
        <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
          {[
            ['Mã vé', ticket?.code || '—'],
            ['Hành khách', booking.passengerName],
            ['Điện thoại', booking.passengerPhone],
            ['Số ghế', `${tickets?.length} ghế`],
            ['Thanh toán', booking.paymentMethod],
            ['Tổng tiền', `${booking.finalPrice?.toLocaleString()}đ`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--gray-200)' }}>
              <span style={{ color: 'var(--gray-500)' }}>{k}</span>
              <span style={{ fontWeight: k === 'Tổng tiền' ? '800' : '600', color: k === 'Tổng tiền' ? 'var(--primary)' : 'var(--gray-800)', fontSize: k === 'Tổng tiền' ? '15px' : '13px' }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>
            <Printer size={15} /> In phiếu
          </button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onNew}>
            <Tag size={15} /> Bán vé mới
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Counter Sale Page ─────────────────────────────────────────────────────
export default function QuickSalePage() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  // Step 0 — Trip selection
  const [tripSearch, setTripSearch] = useState('');
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Step 1 — Seat selection
  const [tripSeats, setTripSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [selectedSeatObjs, setSelectedSeatObjs] = useState([]);

  // Step 2 — Customer info
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formError, setFormError] = useState('');

  // Load today's trips on mount
  const loadTrips = useCallback(async (q = '') => {
    setTripsLoading(true);
    try {
      const params = {};
      if (q) params.from = q;
      const res = await api.get('/trips');
      const data = Array.isArray(res.data) ? res.data : (res.data?.trips || []);
      // Filter by search query
      const filtered = q.trim()
        ? data.filter(t =>
          t.fromStation?.city?.toLowerCase().includes(q.toLowerCase()) ||
          t.toStation?.city?.toLowerCase().includes(q.toLowerCase()) ||
          t.bus?.name?.toLowerCase().includes(q.toLowerCase())
        )
        : data;
      setTrips(filtered);
    } catch { setTrips([]); }
    finally { setTripsLoading(false); }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  // Load trip seats when trip selected
  const loadSeats = useCallback(async (tripId) => {
    setSeatsLoading(true);
    setSelectedSeatIds([]);
    setSelectedSeatObjs([]);
    try {
      const res = await api.get(`/trip-seats/${tripId}`);
      setTripSeats(res.data || []);
    } catch { setTripSeats([]); }
    finally { setSeatsLoading(false); }
  }, []);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    loadSeats(trip._id);
    setStep(1);
  };

  const handleToggleSeat = (ts) => {
    setSelectedSeatIds(prev => {
      if (prev.includes(ts._id)) {
        setSelectedSeatObjs(p => p.filter(s => s._id !== ts._id));
        return prev.filter(id => id !== ts._id);
      }
      if (prev.length >= 8) return prev;
      setSelectedSeatObjs(p => [...p, ts]);
      return [...prev, ts._id];
    });
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await api.post('/bookings/counter', {
        tripId: selectedTrip._id,
        seatIds: selectedSeatIds,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        paymentMethod,
        note: note.trim() || undefined,
      });
      setResult(res.data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Tạo vé thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setResult(null);
    setSelectedTrip(null);
    setTripSeats([]);
    setSelectedSeatIds([]);
    setSelectedSeatObjs([]);
    setGuestName(''); setGuestPhone(''); setGuestEmail('');
    setPaymentMethod('cash'); setNote('');
    setSubmitError(''); setFormError('');
    loadTrips();
  };

  // Price calc
  const VIP = 1.3;
  const totalPrice = selectedSeatObjs.reduce((sum, ts) =>
    sum + (ts.seat?.type === 'vip' ? Math.round((selectedTrip?.price || 0) * VIP) : (selectedTrip?.price || 0))
    , 0);

  const availableSeats = tripSeats.filter(ts => ts.status !== 'booked').length;

  return (
    <div>
      {/* Receipt overlay */}
      {result && <ReceiptView result={result} onClose={() => setResult(null)} onNew={handleReset} />}

      <div className="page-header">
        <div>
          <h1 className="section-title">Bán vé tại quầy</h1>
          <p className="section-subtitle">Bán vé trực tiếp cho khách đến quầy, không cần tài khoản</p>
        </div>
        <button className="btn btn-ghost" onClick={handleReset}>
          <RotateCw size={16} /> Làm mới
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: step > i ? 'var(--success)' : step === i ? 'var(--primary)' : 'var(--gray-200)',
                color: step >= i ? 'white' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '12px', transition: 'all 0.3s',
              }}>
                {step > i ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '12px', fontWeight: step === i ? '700' : '500',
                color: step === i ? 'var(--primary)' : 'var(--gray-400)', whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: step > i ? 'var(--success)' : 'var(--gray-200)', margin: '0 8px', transition: 'all 0.3s', minWidth: '16px' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Step content */}
        <div>

          {/* ── STEP 0: Trip selection ── */}
          {step === 0 && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '16px' }}>
                <Bus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Chọn chuyến xe
              </h3>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  className="form-input"
                  placeholder="Tìm theo thành phố, nhà xe..."
                  value={tripSearch}
                  onChange={e => { setTripSearch(e.target.value); loadTrips(e.target.value); }}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {tripsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : trips.length === 0 ? (
                <div className="empty-state"><Bus size={40} color="var(--gray-300)" /><div>Không có chuyến xe</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                  {trips.map(trip => (
                    <button
                      key={trip._id}
                      onClick={() => handleSelectTrip(trip)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '12px',
                        border: '2px solid var(--gray-200)', background: 'white', cursor: 'pointer',
                        transition: 'all 0.2s',
                        ':hover': { borderColor: 'var(--primary)' },
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-bg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'white'; }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'var(--primary)',
                          }}>
                            {(trip.bus?.name || 'X')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: '700', fontSize: '14px' }}>{trip.fromStation?.city}</span>
                              <ArrowRight size={13} color="var(--primary)" />
                              <span style={{ fontWeight: '700', fontSize: '14px' }}>{trip.toStation?.city}</span>
                            </div>
                            <div className="flex items-center gap-3" style={{ marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{trip.bus?.name}</span>
                              <span className="badge badge-info" style={{ fontSize: '10px' }}>{typeLabels[trip.bus?.type] || trip.bus?.type}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '16px' }}>{fmtTime(trip.departureTime)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{fmtDate(trip.departureTime)}</div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)' }}>{trip.price?.toLocaleString()}đ</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: Seat map ── */}
          {step === 1 && selectedTrip && (
            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px' }}>Chọn ghế</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>← Đổi chuyến</button>
              </div>

              {/* Trip mini summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--primary-bg)', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--gray-900)' }}>{fmtTime(selectedTrip.departureTime)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{selectedTrip.fromStation?.city}</div>
                </div>
                <ArrowRight size={16} color="var(--primary)" />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--gray-900)' }}>{fmtTime(selectedTrip.arrivalTime) || '—'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{selectedTrip.toStation?.city}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--gray-500)' }}>{availableSeats} chỗ trống</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>{selectedTrip.price?.toLocaleString()}đ/ghế</div>
                </div>
              </div>

              {seatsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : tripSeats.length === 0 ? (
                <div className="empty-state"><Bus size={40} color="var(--gray-300)" /><div>Chưa có sơ đồ ghế</div></div>
              ) : (
                <SeatMap tripSeats={tripSeats} selected={selectedSeatIds} onToggle={handleToggleSeat} />
              )}

              <button
                className="btn btn-primary"
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                disabled={selectedSeatIds.length === 0}
                onClick={() => setStep(2)}
              >
                Tiếp theo ({selectedSeatIds.length} ghế) <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Customer info ── */}
          {step === 2 && (
            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px' }}>
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Thông tin khách hàng
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Đổi ghế</button>
              </div>

              {formError && (
                <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={14} />{formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label"><User size={12} /> Họ và tên *</label>
                    <input className="form-input" placeholder="Nguyễn Văn A" value={guestName} onChange={e => setGuestName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Phone size={12} /> Số điện thoại *</label>
                    <input className="form-input" type="tel" placeholder="0901234567" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={12} /> Email (tùy chọn)</label>
                  <input className="form-input" type="email" placeholder="email@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                </div>

                {/* Payment method */}
                <div className="form-group">
                  <label className="form-label"><CreditCard size={12} /> Phương thức thanh toán</label>
                  <div className="flex items-center gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '13px',
                        border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                        background: paymentMethod === m.id ? 'var(--primary-bg)' : 'white',
                        color: paymentMethod === m.id ? 'var(--primary)' : 'var(--gray-600)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-input" rows={2} placeholder="Yêu cầu đặc biệt..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (!guestName.trim()) { setFormError('Vui lòng nhập tên khách hàng.'); return; }
                  if (!guestPhone.trim()) { setFormError('Vui lòng nhập số điện thoại.'); return; }
                  setFormError(''); setStep(3);
                }}
              >
                Tiếp tục <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <div className="card" style={{ padding: '24px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px' }}>
                  <CheckCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Xác nhận và xuất vé
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← Sửa thông tin</button>
              </div>

              {submitError && (
                <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={14} />{submitError}
                </div>
              )}

              {/* Review */}
              <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '13px' }}>
                {[
                  ['Tuyến xe', `${selectedTrip?.fromStation?.city} → ${selectedTrip?.toStation?.city}`],
                  ['Giờ đi', `${fmtTime(selectedTrip?.departureTime)} — ${fmtDate(selectedTrip?.departureTime)}`],
                  ['Xe', `${selectedTrip?.bus?.name || '—'} (${typeLabels[selectedTrip?.bus?.type] || ''})`],
                  ['Ghế', selectedSeatObjs.map(s => s.seat?.seatNumber).join(', ')],
                  ['Khách hàng', guestName],
                  ['Điện thoại', guestPhone],
                  ['Thanh toán', PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label],
                  ['Tổng tiền', `${totalPrice.toLocaleString()}đ`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--gray-200)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                    <span style={{ fontWeight: k === 'Tổng tiền' ? '800' : '600', color: k === 'Tổng tiền' ? 'var(--primary)' : 'var(--gray-800)', fontSize: k === 'Tổng tiền' ? '15px' : '13px' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                  : <><CheckCircle size={16} /> Xác nhận & Xuất vé — {totalPrice.toLocaleString()}đ</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Right: Order summary panel (always visible) */}
        <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
          <h4 style={{ fontWeight: '800', fontSize: '14px', marginBottom: '16px' }}>Đơn hàng</h4>

          {!selectedTrip ? (
            <div style={{ color: 'var(--gray-400)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              Chưa chọn chuyến
            </div>
          ) : (
            <>
              {/* Trip */}
              <div style={{ padding: '12px', background: 'var(--primary-bg)', borderRadius: '10px', marginBottom: '12px' }}>
                <div className="flex items-center gap-1" style={{ fontWeight: '700', fontSize: '13px', color: 'var(--gray-900)' }}>
                  <MapPin size={12} color="var(--primary)" />
                  {selectedTrip.fromStation?.city}
                  <ArrowRight size={12} color="var(--primary)" />
                  {selectedTrip.toStation?.city}
                </div>
                <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                  <Clock size={11} />
                  {fmtTime(selectedTrip.departureTime)} · {fmtDate(selectedTrip.departureTime)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                  {selectedTrip.bus?.name}
                </div>
              </div>

              {/* Selected seats */}
              {selectedSeatObjs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600', marginBottom: '6px' }}>Ghế đã chọn</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedSeatObjs.map(s => (
                      <span key={s._id} style={{
                        fontFamily: 'monospace', fontWeight: '700', fontSize: '12px',
                        background: 'var(--gray-100)', padding: '3px 8px', borderRadius: '6px',
                        color: s.seat?.type === 'vip' ? '#F59E0B' : 'var(--gray-800)',
                      }}>
                        {s.seat?.seatNumber}{s.seat?.type === 'vip' ? '★' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div style={{ borderTop: '2px solid var(--gray-100)', paddingTop: '12px' }}>
                <div className="flex items-center justify-between" style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>
                  <span>Đơn giá</span>
                  <span>{selectedTrip.price?.toLocaleString()}đ/ghế</span>
                </div>
                <div className="flex items-center justify-between" style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                  <span>Số ghế</span>
                  <span>{selectedSeatIds.length}</span>
                </div>
                <div className="flex items-center justify-between" style={{ fontWeight: '800', fontSize: '16px' }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: 'var(--primary)' }}>{totalPrice.toLocaleString()}đ</span>
                </div>
              </div>
            </>
          )}

          {/* Step buttons */}
          {step > 0 && step < 3 && (
            <button
              className="btn btn-primary"
              style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
              disabled={step === 1 && selectedSeatIds.length === 0}
              onClick={() => setStep(s => s + 1)}
            >
              Tiếp theo <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}