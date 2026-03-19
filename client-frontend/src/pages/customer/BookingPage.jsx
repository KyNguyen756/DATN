import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User, Phone, Mail, CreditCard, Smartphone,
  QrCode, CheckCircle, ChevronRight, Shield
} from 'lucide-react';

const paymentMethods = [
  { id: 'vnpay', label: 'VNPAY', color: '#E31837', icon: '💳' },
  { id: 'momo', label: 'MoMo', color: '#A0027F', icon: '💜' },
  { id: 'zalopay', label: 'ZaloPay', color: '#0068FF', icon: '💙' },
  { id: 'card', label: 'Thẻ tín dụng', color: '#1A1A2E', icon: '🏦' },
  { id: 'cod', label: 'Thanh toán tại xe', color: '#22C55E', icon: '💵' },
];

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState('vnpay');
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });
  const [done, setDone] = useState(false);

  const trip = location.state?.trip || {
    company: 'Phương Trang', from: 'TP.HCM', to: 'Đà Lạt',
    depart: '07:00', arrive: '14:00', price: 150000,
  };
  const seats = location.state?.seats || ['A1', 'B2'];
  const total = seats.length * trip.price;

  const handleSubmit = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else setDone(true);
  };

  if (done) {
    return (
      <div style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--gray-50)' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '48px 40px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <CheckCircle size={40} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '8px' }}>Đặt vé thành công!</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Mã vé đã được gửi đến email và số điện thoại của bạn</p>

          {/* QR Code placeholder */}
          <div style={{
            width: '160px', height: '160px', borderRadius: '12px', border: '3px solid var(--gray-200)',
            display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)',
            margin: '0 auto 20px', padding: '12px', gap: '2px',
          }}>
            {Array(64).fill(0).map((_, i) => (
              <div key={i} style={{
                borderRadius: '1px',
                background: Math.random() > 0.5 ? 'var(--gray-900)' : 'transparent',
              }} />
            ))}
          </div>

          <div style={{
            background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '24px',
            fontFamily: 'monospace', fontSize: '20px', fontWeight: '800', letterSpacing: '4px', color: 'var(--primary)',
          }}>
            VXB-{Math.floor(100000 + Math.random() * 900000)}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/my-tickets')}>
              Xem vé của tôi
            </button>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
          {['Thông tin', 'Thanh toán', 'Xác nhận'].map((label, i) => (
            <div key={i} className="flex items-center">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--gray-200)',
                  color: step >= i + 1 ? 'white' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '14px', transition: 'all 0.3s',
                }}>
                  {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: step === i + 1 ? 'var(--primary)' : 'var(--gray-400)' }}>{label}</span>
              </div>
              {i < 2 && <div style={{ width: '80px', height: '2px', background: step > i + 1 ? 'var(--success)' : 'var(--gray-200)', marginBottom: '20px', transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          {/* Left */}
          <div>
            {/* Step 1: Passenger info */}
            {step === 1 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', marginBottom: '20px', fontSize: '16px' }}>Thông tin hành khách</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label"><span className="flex items-center gap-1"><User size={12} /> Họ và tên *</span></label>
                    <input className="form-input" placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="flex items-center gap-1"><Phone size={12} /> Số điện thoại *</span></label>
                    <input className="form-input" placeholder="0901234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label"><span className="flex items-center gap-1"><Mail size={12} /> Email</span></label>
                    <input className="form-input" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Ghi chú</label>
                    <textarea className="form-input" rows={3} placeholder="Yêu cầu đặc biệt..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', marginBottom: '20px', fontSize: '16px' }}>Phương thức thanh toán</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {paymentMethods.map(m => (
                    <label key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                      border: `2px solid ${payment === m.id ? m.color : 'var(--gray-200)'}`,
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      background: payment === m.id ? m.color + '08' : 'white',
                    }}>
                      <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} style={{ accentColor: m.color }} />
                      <span style={{ fontSize: '20px' }}>{m.icon}</span>
                      <span style={{ fontWeight: '700', color: 'var(--gray-800)' }}>{m.label}</span>
                      {payment === m.id && <CheckCircle size={18} color={m.color} style={{ marginLeft: 'auto' }} />}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: '800', marginBottom: '20px', fontSize: '16px' }}>Xác nhận thông tin</h3>
                {[
                  ['Họ tên', form.name || 'Nguyễn Văn A'],
                  ['Điện thoại', form.phone || '0901234567'],
                  ['Email', form.email || 'vana@email.com'],
                  ['Ghế đã chọn', seats.join(', ')],
                  ['Thanh toán', paymentMethods.find(m => m.id === payment)?.label],
                  ['Tổng tiền', total.toLocaleString() + 'đ'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>{k}</span>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px' }}>Chi tiết chuyến</h4>
              <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '14px', marginBottom: '14px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>{trip.company}</div>
                <div style={{ color: 'var(--gray-600)', marginBottom: '4px' }}>{trip.from} → {trip.to}</div>
                <div style={{ color: 'var(--gray-600)' }}>{trip.depart} - {trip.arrive}</div>
              </div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Ghế đã chọn</span>
                  <span style={{ fontWeight: '600' }}>{seats.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{seats.length} x {trip.price.toLocaleString()}đ</span>
                  <span style={{ fontWeight: '600' }}>{total.toLocaleString()}đ</span>
                </div>
              </div>
              <div className="divider" />
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <span style={{ fontWeight: '700' }}>Tổng cộng</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>{total.toLocaleString()}đ</span>
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSubmit}>
                {step === 3 ? 'Xác nhận đặt vé' : 'Tiếp theo'} <ChevronRight size={16} />
              </button>
              <div className="flex items-center gap-2" style={{ marginTop: '10px', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '11px' }}>
                <Shield size={12} /> Bảo mật SSL 256-bit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
