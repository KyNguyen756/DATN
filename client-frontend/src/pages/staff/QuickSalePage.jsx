import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Printer, User, MapPin, Bus, Check } from 'lucide-react';

const SEAT_ROWS = ['A','B','C','D','E','F'];
const bookedSeats = new Set(['A2','B3','C1','D4','E2','F1']);

export default function QuickSalePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);

  const trips = [
    { id: 1, company: 'Phương Trang', from: 'TP.HCM', to: 'Đà Lạt', depart: '07:00', price: 150000, seats: 14 },
    { id: 2, company: 'Thành Bưởi', from: 'TP.HCM', to: 'Đà Lạt', depart: '09:30', price: 130000, seats: 6 },
    { id: 3, company: 'Kumho Samco', from: 'TP.HCM', to: 'Nha Trang', depart: '08:00', price: 200000, seats: 20 },
  ];

  const getSeatCls = (sid) => {
    if (selectedSeat === sid) return 'seat-selected';
    if (bookedSeats.has(sid)) return 'seat-booked';
    return 'seat-available';
  };

  const handlePrint = () => {
    alert(`In vé:\nKhách: ${customerName}\nĐiện thoại: ${customerPhone}\nGhế: ${selectedSeat}\nTuyến: ${selectedTrip?.from} → ${selectedTrip?.to}`);
    setStep(1); setSelectedSeat(null); setCustomerName(''); setCustomerPhone(''); setSelectedTrip(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Bán vé nhanh</h1>
          <p className="section-subtitle">Bán vé trực tiếp tại quầy</p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', marginBottom: '24px', maxWidth: '500px' }}>
        {['Chọn chuyến', 'Chọn ghế', 'Thông tin & In'].map((label, i) => (
          <button key={i} onClick={() => i < step && setStep(i + 1)} style={{
            flex: 1, padding: '9px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
            border: 'none', cursor: i < step ? 'pointer' : 'default', transition: 'all 0.2s',
            background: step === i + 1 ? 'white' : 'transparent',
            color: step === i + 1 ? 'var(--gray-900)' : step > i + 1 ? 'var(--success)' : 'var(--gray-400)',
          }}>
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
          </button>
        ))}
      </div>

      {/* Step 1: Select trip */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '700px' }}>
          {trips.map(trip => (
            <div key={trip.id} className="card card-hover" style={{ padding: '18px 22px', cursor: 'pointer', border: `2px solid ${selectedTrip?.id === trip.id ? 'var(--primary)' : 'transparent'}` }}
              onClick={() => setSelectedTrip(trip)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)' }}>
                    {trip.company[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{trip.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.from} → {trip.to} · {trip.depart}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px' }}>{trip.price.toLocaleString()}đ</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.seats} ghế trống</div>
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" disabled={!selectedTrip} style={{ width: 'fit-content', opacity: selectedTrip ? 1 : 0.5 }}
            onClick={() => setStep(2)}>
            Tiếp theo <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Step 2: Seat */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: '700', marginBottom: '16px' }}>Chọn ghế - {selectedTrip?.company}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[{ cls: 'seat-available', label: 'Trống' }, { cls: 'seat-selected', label: 'Chọn' }, { cls: 'seat-booked', label: 'Đã đặt' }].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2" style={{ fontSize: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px' }} className={cls} />
                  {label}
                </div>
              ))}
            </div>
            {SEAT_ROWS.map(row => (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px 1fr 1fr', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                {[1, 2].map(col => {
                  const sid = `${row}${col}`;
                  return (
                    <button key={sid} onClick={() => !bookedSeats.has(sid) && setSelectedSeat(sid)}
                      className={getSeatCls(sid)}
                      style={{ padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: bookedSeats.has(sid) ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                      {sid}
                    </button>
                  );
                })}
                <div style={{ textAlign: 'center', color: 'var(--gray-300)', fontSize: '12px' }}>|</div>
                {[3, 4].map(col => {
                  const sid = `${row}${col}`;
                  return (
                    <button key={sid} onClick={() => !bookedSeats.has(sid) && setSelectedSeat(sid)}
                      className={getSeatCls(sid)}
                      style={{ padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: bookedSeats.has(sid) ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                      {sid}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Quay lại</button>
            <button className="btn btn-primary" disabled={!selectedSeat} style={{ opacity: selectedSeat ? 1 : 0.5 }} onClick={() => setStep(3)}>
              Tiếp (Ghế: {selectedSeat || '--'}) <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Info & Print */}
      {step === 3 && (
        <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: '700', marginBottom: '16px' }}>Thông tin hành khách</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label"><User size={12} /> Họ và tên</label>
                <input className="form-input" placeholder="Nhập tên khách..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" placeholder="0901234567" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px', background: 'var(--gray-50)' }}>
            <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Tóm tắt vé</div>
            {[
              ['Tuyến xe', `${selectedTrip?.from} → ${selectedTrip?.to}`],
              ['Hãng xe', selectedTrip?.company],
              ['Giờ đi', selectedTrip?.depart],
              ['Ghế', selectedSeat],
              ['Tiền vé', `${selectedTrip?.price?.toLocaleString()}đ`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)', fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: '700' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>Quay lại</button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ flex: 1, justifyContent: 'center' }}>
              <Printer size={15} /> In vé ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}