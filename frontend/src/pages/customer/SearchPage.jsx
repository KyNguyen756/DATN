import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Calendar, SlidersHorizontal, Bus, Clock,
  ArrowRight, ChevronRight, Loader, X, AlertCircle, Users,
  Filter, RefreshCw, TrendingUp
} from 'lucide-react';
import api from '../../api/axios';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDuration = (dep, arr) => {
  if (!dep || !arr) return '';
  const diff = Math.round((new Date(arr) - new Date(dep)) / 60000);
  return `${Math.floor(diff / 60)}h${diff % 60 ? diff % 60 + 'm' : ''}`;
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '';

const BUS_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'seater', label: 'Ghế ngồi' },
  { value: 'sleeper', label: 'Giường nằm' },
  { value: 'limousine', label: 'Limousine' },
];

const SORT_OPTIONS = [
  { value: 'depart', label: 'Giờ khởi hành' },
  { value: 'price_asc', label: 'Giá thấp nhất' },
  { value: 'price_desc', label: 'Giá cao nhất' },
  { value: 'seats', label: 'Nhiều chỗ nhất' },
];

function CityAutocomplete({ value, onChange, placeholder, id }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [allCities, setAllCities] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/stations/cities')
      .then(res => setAllCities(res.data?.cities || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = value.trim().toLowerCase();
    setSuggestions(q ? allCities.filter(c => c.toLowerCase().includes(q)).slice(0, 8) : allCities.slice(0, 8));
  }, [value, allCities]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', zIndex: 1 }} />
      <input
        id={id}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        style={{ paddingLeft: '34px' }}
        autoComplete="off"
      />
      {value && (
        <button
          onClick={() => { onChange(''); setOpen(true); }}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
        >
          <X size={14} />
        </button>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid var(--gray-200)', marginTop: '4px', overflow: 'hidden',
        }}>
          {suggestions.map(city => (
            <button key={city} onClick={() => { onChange(city); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              ':hover': { background: 'var(--gray-50)' },
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MapPin size={12} color="var(--primary)" /> {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [busType, setBusType] = useState(searchParams.get('type') || '');
  const [sortBy, setSortBy] = useState('depart');
  const [priceMax, setPriceMax] = useState(2000000);
  const [showFilters, setShowFilters] = useState(false);

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params = { limit: 50 };
      if (from) params.from = from;
      if (to) params.to = to;
      if (date) params.date = date;
      if (busType) params.type = busType;

      const endpoint = (from || to || date) ? '/trips/search' : '/trips';
      const res = await api.get(endpoint, { params });
      const data = Array.isArray(res.data) ? res.data : (res.data?.trips || []);
      setTrips(data);
      setTotalCount(data.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải chuyến xe. Vui lòng thử lại.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, date, busType]);

  // Auto-search on mount if params provided
  useEffect(() => {
    if (from || to || date) { doSearch(); }
    else { doSearch(); } // Load all trips by default
  }, []); // eslint-disable-line

  const handleSearch = () => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (date) params.date = date;
    if (busType) params.type = busType;
    setSearchParams(params);
    doSearch();
  };

  const handleSwap = () => { setFrom(to); setTo(from); };

  // Client-side sort + filter
  const sortedFiltered = [...trips]
    .filter(t => priceMax >= 2000000 || (t.price || 0) <= priceMax)
    .filter(t => !busType || t.bus?.type === busType)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'seats') return (b.availableSeats || 0) - (a.availableSeats || 0);
      return new Date(a.departureTime) - new Date(b.departureTime);
    });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      {/* ── Search bar ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #0F3460 100%)', padding: '32px 0 40px' }}>
        <div className="container">
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', marginBottom: '20px' }}>
            🔍 Tìm chuyến xe
          </h1>

          <div style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            {/* Row 1: From / To / Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 1fr', gap: '10px', alignItems: 'center' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>ĐIỂM ĐI</label>
                <CityAutocomplete id="search-from" value={from} onChange={setFrom} placeholder="Thành phố đi..." />
              </div>

              {/* Swap button */}
              <button
                onClick={handleSwap}
                title="Đổi chiều"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--primary)',
                  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '18px', color: 'var(--primary)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--primary)'; }}
              >
                <ArrowRight size={14} />
              </button>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>ĐIỂM ĐẾN</label>
                <CityAutocomplete id="search-to" value={to} onChange={setTo} placeholder="Thành phố đến..." />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>NGÀY ĐI</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input
                    id="search-date"
                    className="form-input"
                    type="date"
                    min={today}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Bus type chips + search button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600', flexShrink: 0 }}>Loại xe:</span>
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                {BUS_TYPES.map(bt => (
                  <button key={bt.value} onClick={() => setBusType(bt.value)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    border: `2px solid ${busType === bt.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                    background: busType === bt.value ? 'var(--primary)' : 'white',
                    color: busType === bt.value ? 'white' : 'var(--gray-600)',
                    transition: 'all 0.2s',
                  }}>{bt.label}</button>
                ))}
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowFilters(v => !v)}
                style={{ flexShrink: 0 }}
              >
                <Filter size={14} /> Bộ lọc
              </button>

              <button
                id="btn-search-trips"
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={loading}
                style={{ padding: '10px 28px', flexShrink: 0 }}
              >
                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                Tìm ngay
              </button>
            </div>

            {/* Advanced filters (collapsed by default) */}
            {showFilters && (
              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    GIÁ TỐI ĐA: {priceMax === 2000000 ? 'Không giới hạn' : `${priceMax.toLocaleString()}đ`}
                  </label>
                  <input
                    type="range"
                    min={100000} max={2000000} step={50000}
                    value={priceMax}
                    onChange={e => setPriceMax(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray-400)' }}>
                    <span>100k</span><span>2.000k</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => { setFrom(''); setTo(''); setDate(''); setBusType(''); setPriceMax(2000000); setSortBy('depart'); }}>
                    <RefreshCw size={13} /> Xóa bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results area ── */}
      <div className="container" style={{ padding: '24px 0', maxWidth: '900px' }}>
        {/* Results header */}
        {searched && !loading && (
          <div className="flex items-center justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontWeight: '700', color: 'var(--gray-800)', fontSize: '15px' }}>
                {sortedFiltered.length > 0
                  ? `${sortedFiltered.length} chuyến xe ${from && to ? `${from} → ${to}` : ''}`
                  : 'Không tìm thấy chuyến xe'}
              </span>
              {date && <span style={{ fontSize: '13px', color: 'var(--gray-500)', marginLeft: '8px' }}>ngày {fmtDate(date)}</span>}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <TrendingUp size={14} color="var(--gray-400)" />
              <select className="form-select" style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
              <AlertCircle size={16} />{error}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card" style={{ padding: '20px', height: '120px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '14px' }} />
            ))}
          </div>
        )}

        {/* Trip cards */}
        {!loading && sortedFiltered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedFiltered.map(trip => {
              const seats = trip.availableSeats ?? 0;
              const seatColor = seats <= 0 ? 'var(--danger)' : seats <= 5 ? '#F59E0B' : 'var(--success)';
              const seatLabel = seats <= 0 ? 'Hết chỗ' : seats <= 5 ? `${seats} chỗ cuối!` : `${seats} chỗ trống`;

              return (
                <div
                  key={trip._id}
                  className="card card-hover"
                  style={{ padding: '20px', cursor: seats > 0 ? 'pointer' : 'not-allowed', opacity: seats <= 0 ? 0.7 : 1, transition: 'all 0.2s' }}
                  onClick={() => seats > 0 && navigate(`/trip/${trip._id}`)}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '16px', alignItems: 'center' }}>
                    {/* Departure */}
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>
                        {fmtTime(trip.departureTime)}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>
                        {trip.fromStation?.city}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{trip.fromStation?.name}</div>
                    </div>

                    {/* Center */}
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '6px' }}>
                        {fmtDuration(trip.departureTime, trip.arrivalTime)}
                      </div>
                      <div style={{ position: 'relative', height: '2px', background: 'var(--gray-200)', borderRadius: '2px' }}>
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                          width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Bus size={12} color="white" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {trip.bus?.type === 'limousine' ? 'Limousine' : trip.bus?.type === 'sleeper' ? 'Giường nằm' : 'Ghế ngồi'}
                        </span>
                        <span className="badge" style={{ fontSize: '10px', background: seatColor + '20', color: seatColor }}>
                          {seatLabel}
                        </span>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>
                        {fmtTime(trip.arrivalTime)}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>
                        {trip.toStation?.city}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{trip.toStation?.name}</div>
                    </div>

                    {/* Price + CTA */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>
                        {trip.price?.toLocaleString()}đ
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '10px' }}>/ ghế</div>
                      {trip.bus?.name && (
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>{trip.bus.name}</div>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={seats <= 0}
                        onClick={e => { e.stopPropagation(); navigate(`/trip/${trip._id}`); }}
                      >
                        Chọn ghế <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && sortedFiltered.length === 0 && !error && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--gray-700)', marginBottom: '8px' }}>
              Không tìm thấy chuyến xe
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
              {from || to
                ? `Không có chuyến nào từ "${from || '...'}" đến "${to || '...'}" ${date ? 'vào ' + fmtDate(date) : ''}.`
                : 'Hiện chưa có chuyến xe nào được lên lịch.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {date && (
                <button className="btn btn-outline" onClick={() => { setDate(''); doSearch(); }}>
                  <Calendar size={14} /> Thử ngày khác
                </button>
              )}
              <button className="btn btn-primary" onClick={() => { setFrom(''); setTo(''); setDate(''); setBusType(''); doSearch(); }}>
                <Users size={14} /> Xem tất cả chuyến xe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
