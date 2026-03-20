import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, Printer, User, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '';

export default function QuickSalePage() {
  const [step, setStep] = useState(1);
  // Step 1 — trip selection
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [tripSearch, setTripSearch] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  // Step 2 — seat selection
  const [tripSeats, setTripSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null); // tripSeat object
  // Step 3 — customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [ticket, setTicket] = useState(null); // success

  // Fetch today's scheduled trips
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.get('/trips/search', { params: { date: today, limit: 20 } })
      .then(res => setTrips(res.data?.trips || res.data || []))
      .catch(() => api.get('/trips').then(r => setTrips(r.data?.trips || r.data || [])).catch(() => {}))
      .finally(() => setLoadingTrips(false));
  }, []);

  // Fetch seats when trip selected
  const loadSeats = useCallback(async (trip) => {
    setLoadingSeats(true);
    setTripSeats([]);
    setSelectedSeat(null);
    try {
      const res = await api.get(`/trip-seats/${trip._id}`);
      setTripSeats(res.data || []);
    } catch {}
    finally { setLoadingSeats(false); }
  }, []);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    loadSeats(trip);
  };

  const handleSelectSeat = async (seat) => {
    if (seat.status !== 'available') return;
    // Lock the seat
    if (selectedSeat && selectedSeat._id !== seat._id) {
      await api.delete(`/trip-seats/unlock/${selectedSeat._id}`).catch(() => {});
    }
    try {
      await api.post(`/trip-seats/lock/${seat._id}`);
      setSelectedSeat(seat);
      setTripSeats(prev => prev.map(s => ({
        ...s,
        status: s._id === seat._id ? 'locked' : (s._id === selectedSeat?._id ? 'available' : s.status),
      })));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể chọn ghế.');
    }
  };

  const handleConfirm = async () => {
    if (!customerName || !customerPhone) { setSaveError('Vui lòng điền tên và số điện thoại.'); return; }
    setSaveError('');
    setSaving(true);
    try {
      // Create booking
      const bookRes = await api.post('/bookings', {
        tripId: selectedTrip._id,
        seatIds: [selectedSeat._id],
        passengerName: customerName,
        passengerPhone: customerPhone,
        passengerEmail: customerEmail || undefined,
        paymentMethod: 'counter', // sold at counter
      });
      // Create ticket
      const ticketRes = await api.post(`/tickets/${bookRes.data.bookingId}`);
      setTicket(ticketRes.data.tickets?.[0] || ticketRes.data);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Tạo vé thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1); setSelectedTrip(null); setSelectedSeat(null);
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
    setSaveError(''); setTicket(null);
  };

  // Group seats into rows for seat map
  const seatsByRow = {};
  (tripSeats || []).forEach(s => {
    const row = s.seat?.seatNumber?.charAt(0) || 'X';
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(s);
  });

  const filteredTrips = trips.filter(t =>
    !tripSearch ||
    t.fromStation?.city?.toLowerCase().includes(tripSearch.toLowerCase()) ||
    t.toStation?.city?.toLowerCase().includes(tripSearch.toLowerCase()) ||
    t.bus?.name?.toLowerCase().includes(tripSearch.toLowerCase())
  );

  if (ticket) {
    return (
      <div style={{ maxWidth: '520px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontWeight: '800', marginBottom: '8px', color: 'var(--success)' }}>Xuất vé thành công!</h2>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '3px', marginBottom: '20px' }}>
            {ticket.code || ticket._id?.slice(-8).toUpperCase()}
          </div>
          {ticket.qrCode && (
            <img src={ticket.qrCode} alt="QR" style={{ width: '160px', height: '160px', borderRadius: '12px', margin: '0 auto 20px', display: 'block', border: '2px solid var(--gray-200)' }} />
          )}
          <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '13px', textAlign: 'left' }}>
            {[
              ['Hành khách', customerName],
              ['Điện thoại', customerPhone],
              ['Tuyến', `${selectedTrip?.fromStation?.city} → ${selectedTrip?.toStation?.city}`],
              ['Giờ đi', fmtTime(selectedTrip?.departureTime)],
              ['Ghế', selectedSeat?.seat?.seatNumber],
              ['Tiền vé', `${selectedTrip?.price?.toLocaleString()}đ`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--gray-200)' }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: '700' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => window.print()}>
              <Printer size={15} /> In vé
            </button>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleReset}>
              Bán vé mới
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button key={i} onClick={() => i < step - 1 && setStep(i + 1)} style={{
            flex: 1, padding: '9px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
            border: 'none', cursor: i < step - 1 ? 'pointer' : 'default', transition: 'all 0.2s',
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
          <div className="relative" style={{ maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input className="form-input" placeholder="Tìm thành phố, tuyến..." value={tripSearch} onChange={e => setTripSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          {loadingTrips ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)' }}>Hôm nay chưa có chuyến nào được lên lịch</div>
          ) : filteredTrips.map(trip => (
            <div key={trip._id} className="card card-hover" style={{ padding: '18px 22px', cursor: 'pointer', border: `2px solid ${selectedTrip?._id === trip._id ? 'var(--primary)' : 'transparent'}` }}
              onClick={() => handleSelectTrip(trip)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)' }}>
                    {(trip.bus?.name || 'X')[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{trip.bus?.name || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {trip.fromStation?.city} → {trip.toStation?.city} · {fmtTime(trip.departureTime)} ({fmtDate(trip.departureTime)})
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px' }}>{trip.price?.toLocaleString()}đ</div>
                  <span className="badge badge-info">{trip.bus?.type || 'xe'}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: '700', marginBottom: '16px' }}>Chọn ghế — {selectedTrip?.bus?.name}</div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[{ cls: 'seat-available', label: 'Trống' }, { cls: 'seat-selected', label: 'Chọn' }, { cls: 'seat-booked', label: 'Đã đặt' }].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2" style={{ fontSize: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px' }} className={cls} />
                  {label}
                </div>
              ))}
            </div>
            {loadingSeats ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Loader size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : tripSeats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)', fontSize: '13px' }}>
                Chuyến này chưa có sơ đồ ghế. Vui lòng tạo sơ đồ ghế từ trang admin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(seatsByRow).map(([row, seats]) => (
                  <div key={row} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ width: '20px', fontSize: '11px', color: 'var(--gray-400)', fontWeight: '700' }}>{row}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {seats.map(s => {
                        const isSelected = selectedSeat?._id === s._id;
                        const isBooked = s.status === 'booked';
                        const isLocked = s.status === 'locked' && !isSelected;
                        const cls = isSelected ? 'seat-selected' : isBooked || isLocked ? 'seat-booked' : 'seat-available';
                        return (
                          <button key={s._id} onClick={() => handleSelectSeat(s)}
                            className={cls}
                            style={{ width: '40px', height: '36px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: isBooked || isLocked ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                            {s.seat?.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Quay lại</button>
            <button className="btn btn-primary" disabled={!selectedSeat} style={{ opacity: selectedSeat ? 1 : 0.5 }} onClick={() => setStep(3)}>
              Tiếp (Ghế: {selectedSeat?.seat?.seatNumber || '--'}) <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Info & Print */}
      {step === 3 && (
        <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: '700', marginBottom: '16px' }}>Thông tin hành khách</div>
            {saveError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '14px' }}>
                <AlertCircle size={14} />{saveError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label"><User size={12} /> Họ và tên *</label>
                <input className="form-input" placeholder="Nhập tên khách..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại *</label>
                <input className="form-input" type="tel" placeholder="0901234567" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (không bắt buộc)</label>
                <input className="form-input" type="email" placeholder="khach@email.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px', background: 'var(--gray-50)' }}>
            <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Tóm tắt vé</div>
            {[
              ['Tuyến xe', `${selectedTrip?.fromStation?.city} → ${selectedTrip?.toStation?.city}`],
              ['Xe', selectedTrip?.bus?.name],
              ['Ngày', fmtDate(selectedTrip?.departureTime)],
              ['Giờ đi', fmtTime(selectedTrip?.departureTime)],
              ['Ghế', selectedSeat?.seat?.seatNumber],
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
            <button className="btn btn-primary" onClick={handleConfirm} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              {saving ? <Loader size={15} /> : <Printer size={15} />} {saving ? 'Đang tạo vé...' : 'Xuất vé & In'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}