import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Phone, Mail, CreditCard, ChevronRight, CheckCircle,
  MapPin, Clock, Ticket, Tag, X, Loader, AlertCircle, Gift,
  XCircle, Home, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'COD - Nhận tại quầy', icon: CreditCard, note: 'Thanh toán khi lên xe' },
  { id: 'vnpay', label: 'VNPay', icon: CreditCard, note: 'Thanh toán qua VNPay (ATM/Visa/MasterCard/QR)' },
  { id: 'momo', label: 'Ví MoMo', icon: CreditCard, note: 'Quét QR MoMo (Sắp có)', disabled: true },
];

const SS_KEY = 'booking_state';

// Persist booking state so the page survives a browser refresh
const saveToSession = (state) => {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch (_) {}
};
const loadFromSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); } catch (_) { return null; }
};
const clearSession = () => { try { sessionStorage.removeItem(SS_KEY); } catch (_) {} };

export default function BookingPage() {
  const { state: navState } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // ── VNPay return detection ──
  const hasVnpReturn = !!searchParams.get('vnp_ResponseCode');
  const vnpVerified = useRef(false); // prevent duplicate verify on strict-mode / refresh
  const [vnpayLoading, setVnpayLoading] = useState(hasVnpReturn);
  const [vnpayResult, setVnpayResult] = useState(null); // { isSuccess, booking, tickets, ... }
  const [vnpayError, setVnpayError] = useState('');

  // Restore from sessionStorage if navigated with no state (e.g. after refresh)
  const restored = !navState ? loadFromSession() : null;
  const bookingState = navState || restored;

  const trip     = bookingState?.trip;
  const seatIds  = bookingState?.seatIds || [];
  const seatObjs = bookingState?.seatObjs || [];

  // Verify VNPay payment on mount if query params present
  useEffect(() => {
    if (!hasVnpReturn || vnpVerified.current) return;
    vnpVerified.current = true;

    const verifyVnpay = async () => {
      try {
        const queryString = searchParams.toString();
        const res = await api.get(`/vnpay/return?${queryString}`);
        setVnpayResult(res.data);
        if (res.data.isSuccess) {
          clearSession();
        }
      } catch (err) {
        setVnpayError(err.response?.data?.message || 'Không thể xác minh kết quả thanh toán');
      } finally {
        setVnpayLoading(false);
      }
    };

    verifyVnpay();
  }, []); // eslint-disable-line

  // Normal booking flow: redirect if no booking context AND not a VNPay return
  useEffect(() => {
    if (hasVnpReturn) return; // don't redirect during VNPay verification
    if (!trip || seatIds.length === 0) {
      navigate('/search', { replace: true });
    } else if (navState) {
      saveToSession({ trip, seatIds, seatObjs });
    }
  }, []); // eslint-disable-line

  const [step, setStep] = useState(1); // 1=Info, 2=Payment, 3=Confirm

  // Passenger info
  const [name, setName] = useState(user?.username || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoData, setPromoData] = useState(null); // { discountAmount, finalTotal }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Booking
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { booking, tickets }

  // Allow render for VNPay return even without booking context
  if (!hasVnpReturn && (!trip || seatIds.length === 0)) return null;

  // Pricing (only computed when trip context is available — not needed for VNPay return)
  const VIP_MULTIPLIER = 1.3;
  const totalPrice = trip ? (seatObjs.reduce((sum, s) => {
    return sum + (s.seat?.type === 'vip' ? Math.round(trip.price * VIP_MULTIPLIER) : trip.price);
  }, 0) || trip.price * seatIds.length) : 0;

  const finalPrice = promoData ? promoData.finalTotal : totalPrice;
  const discount = promoData ? promoData.discountAmount : 0;

  // ── Promo ──────────────────────────────────────────────────────────────────

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoData(null);
    try {
      const res = await api.post('/promotions/apply', {
        code: promoInput.trim(),
        orderTotal: totalPrice
      });
      setPromoData(res.data);
      setPromoCode(promoInput.trim().toUpperCase());
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Mã không hợp lệ');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoInput('');
    setPromoData(null);
    setPromoError('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và số điện thoại.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/bookings/checkout', {
        tripId: trip._id,
        seatIds,
        passengerName: name.trim(),
        passengerPhone: phone.trim(),
        passengerEmail: email.trim() || undefined,
        paymentMethod,
        note: note.trim() || undefined,
        promoCode: promoCode || undefined,
      });

      // VNPay flow: redirect to VNPay payment gateway
      if (res.data.requiresPayment && res.data.paymentMethod === 'vnpay') {
        try {
          const vnpayRes = await api.post('/vnpay/create-payment-url', {
            bookingId: res.data.booking._id
          });
          // Redirect to VNPay gateway
          window.location.href = vnpayRes.data.paymentUrl;
          return;
        } catch (vnpayErr) {
          setError(vnpayErr.response?.data?.message || 'Không thể tạo liên kết thanh toán VNPay.');
          setSubmitting(false);
          return;
        }
      }

      // COD flow: show success immediately
      clearSession();
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt vé thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── VNPay verification states ────────────────────────────────────────────

  // VNPay: loading verification
  if (vnpayLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>Đang xác minh thanh toán...</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // VNPay: network error
  if (vnpayError) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertCircle size={36} color="var(--danger)" />
          </div>
          <h3 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--danger)', marginBottom: '8px' }}>
            Lỗi xác minh
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '24px' }}>{vnpayError}</p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
            <Home size={16} /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // VNPay: verified result
  if (vnpayResult) {
    const vnpBooking = vnpayResult.booking;
    const vnpTrip = vnpBooking?.trip;
    const vnpSeats = vnpBooking?.seats || [];
    const vnpTickets = vnpayResult.tickets || [];
    const firstTicket = vnpTickets[0];
    const isSuccess = vnpayResult.isSuccess;

    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: isSuccess ? 'var(--success-light)' : 'rgba(239, 68, 68, 0.1)',
              margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isSuccess
                ? <CheckCircle size={36} color="var(--success)" />
                : <XCircle size={36} color="var(--danger)" />
              }
            </div>
            <h2 style={{ fontWeight: '900', fontSize: '22px', color: isSuccess ? 'var(--success)' : 'var(--danger)', marginBottom: '6px' }}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>
              {isSuccess
                ? `${vnpTickets.length} vé đã được tạo`
                : vnpayResult.message || 'Giao dịch không thành công. Vui lòng thử lại.'
              }
            </p>

            {isSuccess && firstTicket?.qrCode && (
              <img
                src={firstTicket.qrCode}
                alt="QR vé"
                style={{ width: '180px', height: '180px', borderRadius: '14px', border: '3px solid var(--gray-200)', margin: '0 auto 20px', display: 'block' }}
              />
            )}

            {/* Summary */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              {[
                ...(vnpTrip ? [
                  ['Tuyến xe', `${vnpTrip.fromStation?.city || ''} → ${vnpTrip.toStation?.city || ''}`],
                  ['Ngày đi', fmtDate(vnpTrip.departureTime)],
                  ['Giờ đi', fmtTime(vnpTrip.departureTime)],
                ] : []),
                ['Số ghế', vnpSeats.map(s => s.seat?.seatNumber).filter(Boolean).join(', ') || `${vnpBooking?.seats?.length || 0} ghế`],
                ['Số tiền', `${vnpayResult.amount?.toLocaleString()}đ`],
                ['Hành khách', vnpBooking?.passengerName || '—'],
                ['Điện thoại', vnpBooking?.passengerPhone || '—'],
                ['Thanh toán', 'VNPay'],
                ['Ngân hàng', vnpayResult.bankCode || '—'],
                ['Mã GD', vnpayResult.transactionNo || '—'],
                ['Trạng thái', isSuccess ? 'Thành công' : `Thất bại (${vnpayResult.responseCode || '?'})`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--gray-200)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                  <span style={{
                    fontWeight: k === 'Số tiền' || k === 'Trạng thái' ? '800' : '600',
                    color: k === 'Trạng thái'
                      ? (isSuccess ? 'var(--success)' : 'var(--danger)')
                      : k === 'Số tiền' ? 'var(--primary)' : 'var(--gray-800)',
                    fontSize: k === 'Số tiền' ? '15px' : '13px',
                    fontFamily: k === 'Mã GD' ? 'monospace' : 'inherit'
                  }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {isSuccess ? (
                <>
                  <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/my-tickets')}>
                    <Ticket size={15} /> Xem vé
                  </button>
                  <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/')}>
                    Về trang chủ
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/')}>
                    <Home size={15} /> Trang chủ
                  </button>
                  <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/search')}>
                    <RefreshCw size={15} /> Đặt lại
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── COD Success screen ────────────────────────────────────────────────────

  if (result) {
    const firstTicket = result.tickets?.[0];
    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', background: 'var(--success-light)',
              margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={36} color="var(--success)" />
            </div>
            <h2 style={{ fontWeight: '900', fontSize: '22px', color: 'var(--success)', marginBottom: '6px' }}>
              Đặt vé thành công!
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>
              {result.tickets?.length} vé đã được tạo
            </p>

            {firstTicket?.qrCode && (
              <img
                src={firstTicket.qrCode}
                alt="QR vé"
                style={{ width: '180px', height: '180px', borderRadius: '14px', border: '3px solid var(--gray-200)', margin: '0 auto 20px', display: 'block' }}
              />
            )}

            {/* Summary */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              {[
                ['Tuyến xe', `${trip.fromStation?.city} → ${trip.toStation?.city}`],
                ['Ngày đi', fmtDate(trip.departureTime)],
                ['Giờ đi', fmtTime(trip.departureTime)],
                ['Số ghế', seatObjs.map(s => s.seat?.seatNumber).filter(Boolean).join(', ') || `${seatIds.length} ghế`],
                ...(discount > 0 ? [
                  ['Giá gốc', `${totalPrice.toLocaleString()}đ`],
                  ['Giảm giá', `- ${discount.toLocaleString()}đ`],
                ] : []),
                ['Tổng tiền', `${finalPrice.toLocaleString()}đ`],
                ['Hành khách', name],
                ['Điện thoại', phone],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--gray-200)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight: k === 'Tổng tiền' ? '800' : '600', color: k === 'Tổng tiền' ? 'var(--primary)' : 'var(--gray-800)', fontSize: k === 'Tổng tiền' ? '15px' : '13px' }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/profile')}>
                <Ticket size={15} /> Xem vé
              </button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/')}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Multi-step booking UI ──────────────────────────────────────────────────

  const steps = ['Thông tin', 'Thanh toán', 'Xác nhận'];

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '28px', maxWidth: '400px' }}>
          {steps.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--gray-200)',
                color: step >= i + 1 ? 'white' : 'var(--gray-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '12px', transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: '600', color: step === i + 1 ? 'var(--primary)' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: step > i + 1 ? 'var(--success)' : 'var(--gray-200)', margin: '0 8px', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
          {/* Left form column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Step 1: Passenger info */}
            {step === 1 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '20px' }}>
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Thông tin hành khách
                </h3>
                {error && (
                  <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label"><User size={12} /> Họ và tên *</label>
                      <input className="form-input" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Phone size={12} /> Số điện thoại *</label>
                      <input className="form-input" type="tel" placeholder="0901234567" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Mail size={12} /> Email (để nhận vé)</label>
                    <input className="form-input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <textarea className="form-input" rows={2} placeholder="Yêu cầu đặc biệt, lưu ý..." value={note} onChange={e => setNote(e.target.value)} />
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                  onClick={() => { if (!name.trim() || !phone.trim()) { setError('Vui lòng nhập đầy đủ họ tên và số điện thoại.'); return; } setError(''); setStep(2); }}
                >
                  Tiếp theo <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Payment method */}
            {step === 2 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '20px' }}>
                  <CreditCard size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Phương thức thanh toán
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                      border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                      borderRadius: '12px', cursor: m.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                      background: paymentMethod === m.id ? 'var(--primary-bg)' : 'white',
                      opacity: m.disabled ? 0.5 : 1,
                    }}>
                      <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id}
                        onChange={() => !m.disabled && setPaymentMethod(m.id)}
                        disabled={m.disabled}
                        style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{m.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{m.note}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Promo code */}
                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '20px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gift size={15} color="var(--primary)" /> Mã khuyến mãi
                  </div>
                  {promoCode ? (
                    <div className="flex items-center justify-between" style={{ padding: '12px 16px', background: 'var(--success-light)', borderRadius: '10px', border: '1px solid var(--success)' }}>
                      <div className="flex items-center gap-2">
                        <Tag size={14} color="var(--success)" />
                        <span style={{ fontWeight: '700', color: 'var(--success)' }}>{promoCode}</span>
                        <span style={{ fontSize: '12px', color: 'var(--success)' }}>- {promoData?.discountAmount?.toLocaleString()}đ</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={handleRemovePromo} style={{ color: 'var(--danger)', padding: '2px 8px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          className="form-input"
                          placeholder="Nhập mã giảm giá (VD: SUMMER20)"
                          value={promoInput}
                          onChange={e => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                          style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
                        />
                        <button
                          className="btn btn-outline"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          style={{ flexShrink: 0 }}
                        >
                          {promoLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Áp dụng'}
                        </button>
                      </div>
                      {promoError && (
                        <div className="flex items-center gap-1" style={{ marginTop: '8px', color: 'var(--danger)', fontSize: '12px' }}>
                          <AlertCircle size={12} /> {promoError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Quay lại</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>
                    Tiếp theo <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '20px' }}>
                  <CheckCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Xác nhận đặt vé
                </h3>

                {error && (
                  <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {/* Review summary */}
                {[
                  { label: 'Hành khách', value: name },
                  { label: 'Điện thoại', value: phone },
                  { label: 'Email', value: email || '—' },
                  { label: 'Thanh toán', value: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label },
                  ...(promoCode ? [{ label: 'Mã KM', value: promoCode }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between" style={{ padding: '9px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--gray-500)', fontWeight: '500' }}>{label}</span>
                    <span style={{ fontWeight: '700', color: 'var(--gray-800)' }}>{value}</span>
                  </div>
                ))}

                <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>Quay lại</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '14px' }}
                    onClick={handleConfirm}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
                      : <><CheckCircle size={16} /> Xác nhận đặt vé</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="card" style={{ padding: '22px', position: 'sticky', top: '80px' }}>
            <h4 style={{ fontWeight: '800', fontSize: '15px', marginBottom: '16px' }}>Chi tiết hành trình</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip.departureTime)}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600' }}>{trip.fromStation?.city}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <MapPin size={12} color="var(--primary)" />
                <div style={{ width: '40px', height: '2px', background: 'var(--primary)', margin: '4px 0' }} />
                <MapPin size={12} color="var(--primary)" />
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip.arrivalTime) || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600' }}>{trip.toStation?.city}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '16px' }}>
              <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {fmtDate(trip.departureTime)}
            </div>
            <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '6px' }}>Ghế đã chọn</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {seatObjs.length > 0 ? seatObjs.map(s => (
                  <span key={s._id} className="tag" style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '12px' }}>
                    {s.seat?.seatNumber || '?'}
                    {s.seat?.type === 'vip' && <span style={{ color: 'var(--primary)', marginLeft: '3px' }}>VIP</span>}
                  </span>
                )) : <span style={{ color: 'var(--gray-500)' }}>{seatIds.length} ghế</span>}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Giá vé ({seatIds.length} ghế)</span>
                <span style={{ fontWeight: '600' }}>{totalPrice.toLocaleString()}đ</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between" style={{ marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--success)' }}>Giảm giá ({promoCode})</span>
                  <span style={{ color: 'var(--success)', fontWeight: '700' }}>- {discount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex items-center justify-between" style={{ borderTop: '2px solid var(--primary)', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontWeight: '800', fontSize: '15px' }}>Tổng thanh toán</span>
                <span style={{ fontWeight: '900', fontSize: '20px', color: 'var(--primary)' }}>{finalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
