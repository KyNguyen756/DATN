import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Calendar, Clock, User, Phone, FileText,
  CheckCircle, Printer, X, AlertCircle, Loader,
  ShoppingCart, Lock, DollarSign, CreditCard, Building2,
  RefreshCw, ChevronRight, MapPin, Ticket,
} from 'lucide-react';
import counterSaleApi from '../../api/counterSaleApi';
import SeatMap from '../../components/SeatMap';
import { printTickets } from '../../components/TicketPrintTemplate';

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
  : '--:--';
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })
  : '';
const fmtMoney = (n) => n != null ? `${Number(n).toLocaleString('vi-VN')}đ` : '0đ';
const minUntilDep = (trip) => Math.round((new Date(trip.departureTime) - Date.now()) / 60000);
const validatePhone = (p) => /^[0-9]{9,11}$/.test(p.replace(/\s/g, ''));

const PAYMENT_OPTS = [
  { id: 'counter',       icon: '💵', label: 'Tiền mặt' },
  { id: 'bank_transfer', icon: '🏦', label: 'Chuyển khoản' },
  { id: 'card',          icon: '💳', label: 'Quẹt thẻ' },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
      padding: '12px 18px', borderRadius: '10px',
      background: type === 'success' ? '#16A34A' : '#DC2626',
      color: 'white', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '8px',
      animation: 'csFadeUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '2px' }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ── Trip Card ─────────────────────────────────────────────────────────────────
function TripCard({ trip, isSelected, onSelect }) {
  const mins = minUntilDep(trip);
  const departed = mins < 0;
  const imminent = mins >= 0 && mins < 30;

  return (
    <div
      onClick={() => !departed && onSelect(trip)}
      style={{
        padding: '12px 14px', borderRadius: '12px', marginBottom: '6px',
        border: `2px solid ${isSelected ? 'var(--primary, #FF6B35)' : 'var(--gray-200, #E5E7EB)'}`,
        background: isSelected ? 'rgba(255,107,53,0.06)' : 'white',
        cursor: departed ? 'not-allowed' : 'pointer',
        opacity: departed ? 0.5 : 1,
        transition: 'all 0.15s',
        boxShadow: isSelected ? '0 0 0 3px rgba(255,107,53,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--primary, #FF6B35)', fontFamily: 'monospace' }}>
          {fmtTime(trip.departureTime)}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {imminent && (
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: '#FEE2E2', color: '#DC2626' }}>
              🔴 Sắp xuất bến
            </span>
          )}
          {departed && (
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: '#F3F4F6', color: '#9CA3AF' }}>
              Đã xuất bến
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--gray-600, #4B5563)', marginBottom: '4px', fontWeight: '500' }}>
        {trip.bus?.name || '—'} · {trip.bus?.licensePlate || ''}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--gray-400, #9CA3AF)' }}>
        {trip.bus?.type || ''} · {fmtDate(trip.departureTime)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontWeight: '800', color: 'var(--gray-800, #1F2937)', fontSize: '14px' }}>
          {fmtMoney(trip.price)}
        </span>
        {trip._seatCount != null && (
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
            background: trip._seatCount > 5 ? '#DCFCE7' : trip._seatCount > 0 ? '#FEF9C3' : '#FEE2E2',
            color: trip._seatCount > 5 ? '#15803D' : trip._seatCount > 0 ? '#92400E' : '#B91C1C',
          }}>
            {trip._seatCount > 0 ? `${trip._seatCount} ghế trống` : 'Hết chỗ'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CounterSalePage() {
  // ── Screen width detection ──────────────────────────────────────────────
  const [isWide, setIsWide] = useState(window.innerWidth >= 1100);
  const [mobileTab, setMobileTab] = useState('trips');
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Trip search state ───────────────────────────────────────────────────
  const [stations,      setStations]      = useState([]);
  const [searchDate,    setSearchDate]    = useState(todayStr());
  const [fromStationId, setFromStationId] = useState('');
  const [toStationId,   setToStationId]   = useState('');
  const [trips,         setTrips]         = useState([]);
  const [loadingTrips,  setLoadingTrips]  = useState(false);
  const [tripsError,    setTripsError]    = useState('');
  const [hasSearched,   setHasSearched]   = useState(false);

  // ── Selected trip & seats ───────────────────────────────────────────────
  const [selectedTrip,    setSelectedTrip]    = useState(null);
  const [seats,           setSeats]           = useState([]);
  const [loadingSeats,    setLoadingSeats]    = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [selectedSeats,   setSelectedSeats]   = useState([]);

  // ── Lock state ──────────────────────────────────────────────────────────
  const [locking,      setLocking]      = useState(false);
  const [lockedUntil,  setLockedUntil]  = useState(null);
  const [lockCountdown, setLockCountdown] = useState(null);

  // ── Form ────────────────────────────────────────────────────────────────
  const [form,          setForm]          = useState({ name: '', phone: '', idCard: '', note: '' });
  const [formError,     setFormError]     = useState('');
  const [paymentMethod, setPaymentMethod] = useState('counter');

  // ── Booking ─────────────────────────────────────────────────────────────
  const [confirming,   setConfirming]   = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [phase, setPhase] = useState('IDLE'); // IDLE | TRIP_SELECTED | SUCCESS

  // ── Toast ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Load stations on mount ──────────────────────────────────────────────
  useEffect(() => {
    counterSaleApi.getStations()
      .then(r => setStations(r.data?.stations || r.data || []))
      .catch(() => {});
  }, []);

  // ── Lock countdown timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) { setLockCountdown(null); return; }
    const tick = () => {
      const secs = Math.max(0, Math.round((new Date(lockedUntil) - Date.now()) / 1000));
      setLockCountdown(secs);
      if (secs === 0) { setLockedUntil(null); showToast('Thời gian giữ ghế đã hết — vui lòng giữ lại', 'error'); }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [lockedUntil]);

  // ── Search trips ────────────────────────────────────────────────────────
  const handleSearchTrips = useCallback(async () => {
    setLoadingTrips(true); setTripsError(''); setHasSearched(true);
    setSelectedTrip(null); setSeats([]); setSelectedSeatIds([]); setSelectedSeats([]);
    setPhase('IDLE');
    try {
      const params = { date: searchDate };
      if (fromStationId) params.fromStation = fromStationId;
      if (toStationId)   params.toStation   = toStationId;

      const { data } = await counterSaleApi.getTrips(params);
      const tripList = data?.trips || data || [];

      // Fetch seat counts in parallel
      const withCounts = await Promise.all(
        tripList.map(async (trip) => {
          try {
            const { data: cnt } = await counterSaleApi.getSeatCount(trip._id);
            return { ...trip, _seatCount: cnt.available };
          } catch { return { ...trip, _seatCount: null }; }
        })
      );
      setTrips(withCounts);
    } catch (e) {
      setTripsError(e.response?.data?.message || 'Không thể tải danh sách chuyến');
    } finally { setLoadingTrips(false); }
  }, [searchDate, fromStationId, toStationId]);

  // Load today's trips on mount
  useEffect(() => { handleSearchTrips(); }, []); // eslint-disable-line

  // ── Select trip → load seats ────────────────────────────────────────────
  const handleSelectTrip = useCallback(async (trip) => {
    setSelectedTrip(trip); setPhase('TRIP_SELECTED');
    setSelectedSeatIds([]); setSelectedSeats([]);
    setLockedUntil(null); setLockCountdown(null);
    setLoadingSeats(true); setSeats([]);
    if (!isWide) setMobileTab('seats');
    try {
      const { data } = await counterSaleApi.getSeats(trip._id);
      setSeats(data || []);
    } catch { showToast('Không thể tải sơ đồ ghế', 'error'); }
    finally { setLoadingSeats(false); }
  }, [isWide]);

  // ── SeatMap selection handler ───────────────────────────────────────────
  const handleSeatSelect = useCallback((tripSeat, action) => {
    if (action === 'select') {
      setSelectedSeatIds(prev => [...prev, tripSeat._id]);
      setSelectedSeats(prev => [...prev, tripSeat]);
    } else {
      setSelectedSeatIds(prev => prev.filter(id => id !== tripSeat._id));
      setSelectedSeats(prev => prev.filter(s => s._id !== tripSeat._id));
    }
  }, []);

  // ── Lock seats ──────────────────────────────────────────────────────────
  const handleLockSeats = async () => {
    if (selectedSeatIds.length === 0) { showToast('Chưa chọn ghế nào', 'error'); return; }
    setLocking(true);
    try {
      const results = await Promise.allSettled(selectedSeatIds.map(id => counterSaleApi.lockSeat(id)));
      const failed    = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length > 0) {
        const msg = failed[0].reason?.response?.data?.message || 'Một số ghế đã bị chiếm — vui lòng chọn lại';
        showToast(msg, 'error');
        // Reload seats to refresh statuses
        const { data } = await counterSaleApi.getSeats(selectedTrip._id);
        setSeats(data || []);
        // Remove seats that failed to lock
        const failedIds = new Set(failed.map((f, i) => selectedSeatIds[i]));
        setSelectedSeatIds(prev => prev.filter(id => !failedIds.has(id)));
        setSelectedSeats(prev => prev.filter(s => !failedIds.has(s._id)));
      }

      if (succeeded.length > 0) {
        const lu = succeeded[succeeded.length - 1].value?.data?.lockedUntil;
        if (lu) setLockedUntil(lu);
        showToast(`Đã giữ ${succeeded.length} ghế trong 15 phút`);
        if (!isWide) setMobileTab('checkout');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Không thể giữ ghế', 'error');
    } finally { setLocking(false); }
  };

  // ── Submit booking ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim())          { setFormError('Vui lòng nhập họ tên'); return; }
    if (!validatePhone(form.phone)) { setFormError('Số điện thoại không hợp lệ (9-11 chữ số)'); return; }
    if (selectedSeatIds.length === 0) { setFormError('Vui lòng chọn ít nhất 1 ghế'); return; }
    setFormError(''); setConfirming(true);
    try {
      const { data } = await counterSaleApi.createCounterBooking({
        tripId:          selectedTrip._id,
        seatIds:         selectedSeatIds,
        passengerName:   form.name.trim(),
        passengerPhone:  form.phone.trim(),
        passengerIdCard: form.idCard.trim(),
        note:            form.note.trim(),
        paymentMethod,
      });
      setBookingResult(data);
      setPhase('SUCCESS');
    } catch (e) {
      const msg = e.response?.data?.message || 'Tạo vé thất bại — vui lòng thử lại';
      showToast(msg, 'error');
    } finally { setConfirming(false); }
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase('IDLE'); setSelectedTrip(null); setSeats([]);
    setSelectedSeatIds([]); setSelectedSeats([]);
    setForm({ name: '', phone: '', idCard: '', note: '' });
    setFormError(''); setPaymentMethod('counter');
    setBookingResult(null); setLockedUntil(null); setLockCountdown(null);
    setMobileTab('trips');
  };

  const totalPrice = (selectedTrip?.price || 0) * selectedSeatIds.length;

  // ── Column 1: Trip Selector ─────────────────────────────────────────────
  const col1 = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {/* Search filters */}
      <div className="card" style={{ padding: '14px', flexShrink: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: 'var(--gray-700)' }}>
          🔍 Tìm chuyến
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>
              <Calendar size={10} /> Ngày đi *
            </label>
            <input type="date" className="form-input" value={searchDate}
              min={todayStr()}
              onChange={e => setSearchDate(e.target.value)}
              style={{ fontSize: '13px', padding: '7px 10px' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>
              <MapPin size={10} /> Bến đi
            </label>
            <select className="form-input" value={fromStationId} onChange={e => setFromStationId(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px' }}>
              <option value="">-- Tất cả --</option>
              {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>
              <MapPin size={10} /> Bến đến
            </label>
            <select className="form-input" value={toStationId} onChange={e => setToStationId(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px' }}>
              <option value="">-- Tất cả --</option>
              {stations.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearchTrips} disabled={loadingTrips}
            style={{ justifyContent: 'center', padding: '9px 0' }}>
            {loadingTrips ? <Loader size={14} style={{ animation: 'csPin 1s linear infinite' }} /> : <Search size={14} />}
            {loadingTrips ? 'Đang tìm...' : 'Tìm chuyến'}
          </button>
        </div>
      </div>

      {/* Trip list */}
      <div className="card" style={{ padding: '14px', flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Chuyến ({trips.length})</span>
          {trips.length > 0 && <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 400 }}>{searchDate}</span>}
        </div>

        {loadingTrips ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)' }}>
            <Loader size={24} style={{ animation: 'csPin 1s linear infinite', color: 'var(--primary)' }} />
          </div>
        ) : tripsError ? (
          <div style={{ padding: '12px', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', fontSize: '12px' }}>
            <AlertCircle size={13} /> {tripsError}
          </div>
        ) : !hasSearched ? null
          : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)', fontSize: '13px' }}>
            🚌 Không có chuyến nào trong ngày này
          </div>
        ) : (
          trips.map(trip => (
            <TripCard key={trip._id} trip={trip}
              isSelected={selectedTrip?._id === trip._id}
              onSelect={handleSelectTrip}
            />
          ))
        )}
      </div>
    </div>
  );

  // ── Column 2: SeatMap ───────────────────────────────────────────────────
  const col2 = (
    <div className="card" style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      {!selectedTrip ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-400)', gap: '12px' }}>
          <div style={{ fontSize: '3rem' }}>🚌</div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>Chưa chọn chuyến</div>
          <div style={{ fontSize: '12px' }}>Chọn một chuyến từ danh sách bên trái để xem sơ đồ ghế</div>
        </div>
      ) : (
        <>
          {/* Trip header */}
          <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>
              {selectedTrip.fromStation?.city} → {selectedTrip.toStation?.city}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span><Clock size={11} /> {fmtTime(selectedTrip.departureTime)} {fmtDate(selectedTrip.departureTime)}</span>
              {selectedTrip.bus?.name && <span>🚌 {selectedTrip.bus.name}</span>}
              {selectedTrip.bus?.licensePlate && <span>📋 {selectedTrip.bus.licensePlate}</span>}
              <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{fmtMoney(selectedTrip.price)}/ghế</span>
            </div>
          </div>
          <SeatMap
            tripId={selectedTrip._id}
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onSeatSelect={handleSeatSelect}
            maxSelectable={5}
            loading={loadingSeats}
            disabled={confirming}
          />
        </>
      )}
    </div>
  );

  // ── Column 3: Customer + Payment ────────────────────────────────────────
  const col3 = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'auto' }}>

      {/* Customer form */}
      <div className="card" style={{ padding: '16px', flexShrink: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} /> Thông tin hành khách
        </div>

        {formError && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={12} /> {formError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}><User size={10} /> Họ và tên *</label>
            <input className="form-input" placeholder="Nguyễn Văn A" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={{ fontSize: '13px', padding: '8px 10px' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}><Phone size={10} /> Số điện thoại *</label>
            <input className="form-input" type="tel" placeholder="0901234567" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              style={{ fontSize: '13px', padding: '8px 10px' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}><FileText size={10} /> CCCD / CMND</label>
            <input className="form-input" placeholder="Tùy chọn" value={form.idCard}
              onChange={e => setForm(p => ({ ...p, idCard: e.target.value }))}
              style={{ fontSize: '13px', padding: '8px 10px' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Ghi chú</label>
            <input className="form-input" placeholder="Tùy chọn" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              style={{ fontSize: '13px', padding: '8px 10px' }}
            />
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="card" style={{ padding: '16px', flexShrink: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={14} /> Phương thức thanh toán
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PAYMENT_OPTS.map(opt => (
            <button key={opt.id} onClick={() => setPaymentMethod(opt.id)} style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
              border: `2px solid ${paymentMethod === opt.id ? 'var(--primary, #FF6B35)' : 'var(--gray-200)'}`,
              background: paymentMethod === opt.id ? 'rgba(255,107,53,0.08)' : 'white',
              color: paymentMethod === opt.id ? 'var(--primary, #FF6B35)' : 'var(--gray-600)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>{opt.icon}</div>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="card" style={{ padding: '16px', flexShrink: 0 }}>
        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Ticket size={14} /> Tóm tắt đơn hàng
        </div>

        {selectedTrip ? (
          <>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '8px' }}>
              {selectedTrip.fromStation?.city} → {selectedTrip.toStation?.city} · {fmtTime(selectedTrip.departureTime)}
            </div>

            {selectedSeats.length === 0 ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>
                Chưa chọn ghế
              </div>
            ) : (
              <>
                {selectedSeats.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Ghế {s.seat?.seatNumber || '?'}</span>
                    <span style={{ fontWeight: '600' }}>{fmtMoney(selectedTrip.price)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', fontWeight: '800', fontSize: '16px', borderTop: '2px solid var(--gray-200)' }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: 'var(--primary, #FF6B35)' }}>{fmtMoney(totalPrice)}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--gray-400)', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>
            Chưa chọn chuyến
          </div>
        )}
      </div>

      {/* Lock countdown */}
      {lockCountdown != null && lockCountdown > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: '10px', flexShrink: 0,
          background: lockCountdown < 120 ? '#FEF2F2' : '#ECFDF5',
          border: `1px solid ${lockCountdown < 120 ? '#FECACA' : '#BBF7D0'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', fontWeight: '600',
          color: lockCountdown < 120 ? '#DC2626' : '#15803D',
        }}>
          <Clock size={14} />
          <span>Giữ ghế còn: {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}</span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <button
          className="btn"
          onClick={handleLockSeats}
          disabled={locking || selectedSeatIds.length === 0 || !selectedTrip}
          style={{
            justifyContent: 'center', padding: '11px 0',
            background: 'var(--gray-800, #1F2937)', color: 'white',
            border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px',
            cursor: selectedSeatIds.length === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedSeatIds.length === 0 ? 0.5 : 1,
          }}
        >
          {locking
            ? <><Loader size={15} style={{ animation: 'csPin 1s linear infinite' }} /> Đang giữ ghế...</>
            : <><Lock size={15} /> Giữ ghế 15 phút</>
          }
        </button>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={confirming || selectedSeatIds.length === 0 || !selectedTrip}
          style={{
            justifyContent: 'center', padding: '13px 0', fontSize: '15px', fontWeight: '800',
            borderRadius: '10px',
            opacity: (selectedSeatIds.length === 0 || !selectedTrip) ? 0.5 : 1,
            cursor: (selectedSeatIds.length === 0 || !selectedTrip) ? 'not-allowed' : 'pointer',
          }}
        >
          {confirming
            ? <><Loader size={15} style={{ animation: 'csPin 1s linear infinite' }} /> Đang tạo vé...</>
            : <><CheckCircle size={15} /> Hoàn tất bán vé</>
          }
        </button>
      </div>
    </div>
  );

  // ── Success Modal ───────────────────────────────────────────────────────
  const successModal = phase === 'SUCCESS' && bookingResult && (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      animation: 'csFadeUp 0.3s ease',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '28px',
        maxWidth: '520px', width: '100%', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} color="#16A34A" />
          </div>
          <h2 style={{ fontWeight: '800', color: '#16A34A', fontSize: '20px', marginBottom: '4px' }}>Xuất vé thành công!</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
            {bookingResult.tickets?.length} vé đã được tạo • {fmtMoney(bookingResult.summary?.totalPrice)}
          </p>
        </div>

        {/* Tickets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {(bookingResult.tickets || []).map((tkt, i) => (
            <div key={tkt._id || i} style={{
              background: 'var(--gray-50, #F9FAFB)', borderRadius: '12px', padding: '14px',
              border: '1px solid var(--gray-200)', display: 'flex', gap: '14px', alignItems: 'center',
            }}>
              {tkt.qrCode && (
                <img src={tkt.qrCode} alt="QR" style={{ width: '72px', height: '72px', borderRadius: '8px', flexShrink: 0, border: '2px solid var(--gray-200)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '17px', color: 'var(--primary, #FF6B35)', letterSpacing: '2px', marginBottom: '4px' }}>
                  {tkt.code || tkt._id?.slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  Ghế <strong>{tkt.seat?.seat?.seatNumber || '?'}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                  {selectedTrip?.fromStation?.city} → {selectedTrip?.toStation?.city} · {fmtTime(selectedTrip?.departureTime)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info summary */}
        <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px' }}>
          {[
            ['Hành khách', bookingResult.booking?.passengerName],
            ['Điện thoại', bookingResult.booking?.passengerPhone],
            ['Thanh toán', PAYMENT_OPTS.find(o => o.id === bookingResult.booking?.paymentMethod)?.label || bookingResult.booking?.paymentMethod],
            ['Staff bán', bookingResult.booking?.soldBy?.username],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--gray-200)' }}>
              <span style={{ color: 'var(--gray-500)' }}>{k}</span>
              <span style={{ fontWeight: '600' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => printTickets(bookingResult.booking, bookingResult.tickets || [])}
            style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>
            <Printer size={15} /> In vé
          </button>
          <button className="btn btn-primary" onClick={handleReset}
            style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>
            <ShoppingCart size={15} /> Bán vé mới
          </button>
        </div>
      </div>
    </div>
  );

  // ── Mobile tab bar ────────────────────────────────────────────────────
  const TABS = [
    { id: 'trips', label: 'Chuyến đi', icon: <Ticket size={14} /> },
    { id: 'seats', label: 'Sơ đồ ghế', icon: <ShoppingCart size={14} /> },
    { id: 'checkout', label: 'Thanh toán', icon: <CreditCard size={14} /> },
  ];

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Success modal */}
      {successModal}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 14px', flexShrink: 0 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '2px' }}>Bán vé tại quầy</h1>
          <p className="section-subtitle" style={{ margin: 0 }}>Bán vé nhanh cho khách vãng lai</p>
        </div>
        {phase !== 'IDLE' && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            <RefreshCw size={14} /> Bán vé mới
          </button>
        )}
      </div>

      {/* Desktop: 3-column layout */}
      {isWide ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 310px',
          gap: '14px',
          flex: 1,
          minHeight: 0,
        }}>
          {col1}
          {col2}
          {col3}
        </div>
      ) : (
        /* Mobile: tab layout */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', marginBottom: '12px', flexShrink: 0 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setMobileTab(tab.id)} style={{
                flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none',
                background: mobileTab === tab.id ? 'white' : 'transparent',
                fontWeight: '600', fontSize: '12px', cursor: 'pointer',
                color: mobileTab === tab.id ? 'var(--gray-900)' : 'var(--gray-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                boxShadow: mobileTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {mobileTab === 'trips'    && col1}
            {mobileTab === 'seats'    && col2}
            {mobileTab === 'checkout' && col3}
          </div>
          {/* Mobile next button */}
          {mobileTab !== 'checkout' && (
            <button className="btn btn-primary" onClick={() => setMobileTab(mobileTab === 'trips' ? 'seats' : 'checkout')}
              style={{ margin: '10px 0 0', justifyContent: 'center', flexShrink: 0 }}>
              Tiếp theo <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes csPin    { to { transform: rotate(360deg); } }
        @keyframes csFadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: none; } }
      `}</style>
    </div>
  );
}
