import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, MapPin, Clock, Star, Users,
  Bus, ArrowRight, CheckCircle, Loader, X, SlidersHorizontal,
} from 'lucide-react';
import api from '../../api/axios';

const types = ['Tất cả', 'seater', 'sleeper', 'limousine'];
const typeLabels = { seater: 'Ghế ngồi', sleeper: 'Giường nằm', limousine: 'Limousine', 'Tất cả': 'Tất cả' };

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
const fmtDuration = (dep, arr, est) => {
  if (est) return `${Math.floor(est / 60)}h${est % 60 ? est % 60 + 'm' : ''}`;
  if (!dep || !arr) return '';
  const diff = (new Date(arr) - new Date(dep)) / 60000;
  return `${Math.floor(diff / 60)}h${diff % 60 ? Math.round(diff % 60) + 'm' : ''}`;
};
const toDateInput = (d) => d.toISOString().slice(0, 10);

function TripCard({ trip, onSelect }) {
  const dep = fmtTime(trip.departureTime);
  const arr = fmtTime(trip.arrivalTime);
  const dur = fmtDuration(trip.departureTime, trip.arrivalTime, trip.estimatedDuration);
  const busType = typeLabels[trip.bus?.type] || trip.bus?.type || '';
  const company = trip.bus?.name || 'Nhà xe';
  const seats = trip.availableSeats;

  return (
    <div className="card card-hover" style={{ padding: '0', overflow: 'hidden', transition: 'all 0.25s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <div style={{ padding: '20px 24px' }}>
          {/* Company row */}
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary-bg), #fff3f0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', color: 'var(--primary)', fontSize: '16px',
                border: '1px solid rgba(255,107,53,0.15)',
              }}>{company[0]}</div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--gray-900)', fontSize: '14px' }}>{company}</div>
                <div className="flex items-center gap-4px" style={{ gap: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>{busType}</span>
                  {trip.bus?.licensePlate && (
                    <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{trip.bus.licensePlate}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--gray-700)' }}>4.5</span>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', marginLeft: '2px' }}>({trip.bus?.name?.length * 11 || 120})</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-4" style={{ marginBottom: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{dep}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{trip.fromStation?.city}</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{trip.fromStation?.name}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600' }}>{dur}</span>
              <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, var(--primary) 0%, rgba(255,107,53,0.3) 100%)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={9} color="white" />
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{fmtDate(trip.departureTime)}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{arr}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{trip.toStation?.city}</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{trip.toStation?.name}</div>
            </div>
          </div>

          {/* Amenities + seat count */}
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {(trip.bus?.amenities || []).slice(0, 3).map(a => (
              <span key={a} className="tag" style={{ fontSize: '11px' }}>
                <CheckCircle size={10} color="var(--success)" style={{ marginRight: '3px' }} />{a}
              </span>
            ))}
            {seats !== undefined && (
              <span className="tag" style={{ fontSize: '11px', background: seats <= 5 ? 'var(--danger-light)' : 'var(--success-light)', color: seats <= 5 ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>
                {seats <= 0 ? 'Hết chỗ' : seats <= 5 ? `${seats} chỗ cuối!` : `${seats} chỗ trống`}
              </span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          padding: '20px 20px', background: 'linear-gradient(180deg, var(--gray-50) 0%, white 100%)',
          minWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '10px', borderLeft: '1px solid var(--gray-100)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>
              {trip.price?.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>đ / người</div>
          </div>
          {seats !== undefined && seats <= 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '600' }}>Hết chỗ</span>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>✓ Còn chỗ</div>
          )}
          <button
            className="btn btn-primary"
            onClick={() => onSelect(trip._id)}
            disabled={seats !== undefined && seats <= 0}
            style={{ justifyContent: 'center', width: '100%', opacity: (seats !== undefined && seats <= 0) ? 0.5 : 1 }}
          >
            Chọn chuyến
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [selectedType, setSelectedType] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('departureTime');
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [showFilter, setShowFilter] = useState(true);

  const [cities, setCities] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cities for autocomplete
  useEffect(() => {
    api.get('/stations/cities')
      .then(res => setCities(res.data?.cities || res.data || []))
      .catch(() => {});
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/trips/search', {
        params: {
          from: from || undefined,
          to: to || undefined,
          date: date || undefined,
          type: selectedType !== 'Tất cả' ? selectedType : undefined,
        }
      });
      // Try to parse availableSeats from nested count responses too
      const data = res.data?.trips || res.data || [];
      // Fetch seat counts in parallel (best effort)
      const enriched = await Promise.allSettled(
        data.map(async (t) => {
          try {
            const sc = await api.get(`/trip-seats/${t._id}/count`);
            return { ...t, availableSeats: sc.data.available };
          } catch { return t; }
        })
      );
      setTrips(enriched.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chuyến xe.');
    } finally {
      setLoading(false);
    }
  }, [from, to, date, selectedType]);

  // Auto-fetch on mount if params exist
  useEffect(() => {
    if (from || to || date) fetchTrips();
    else {
      // Load all trips to show as browse mode
      setLoading(true);
      api.get('/trips', { params: { limit: 20 } })
        .then(res => setTrips(res.data?.trips || res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  const handleSearch = () => {
    setSearchParams({ ...(from && { from }), ...(to && { to }), ...(date && { date }) });
    fetchTrips();
  };

  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(toDateInput(d));
  };

  const filtered = trips
    .filter(t => t.price <= maxPrice)
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'departureTime') return new Date(a.departureTime) - new Date(b.departureTime);
      return 0;
    });

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '0' }}>
      {/* Search header banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', marginBottom: '16px' }}>
            Tìm chuyến xe
          </h1>
          <div className="card" style={{ padding: '20px' }}>
            {/* Main search row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label"><span className="flex items-center gap-1"><MapPin size={12} color="var(--primary)" /> Điểm đi</span></label>
                <input
                  className="form-input" list="cities-from"
                  value={from} onChange={e => setFrom(e.target.value)}
                  placeholder="Thành phố xuất phát"
                />
                <datalist id="cities-from">
                  {cities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label"><span className="flex items-center gap-1"><MapPin size={12} color="var(--primary)" /> Điểm đến</span></label>
                <input
                  className="form-input" list="cities-to"
                  value={to} onChange={e => setTo(e.target.value)}
                  placeholder="Thành phố đến"
                />
                <datalist id="cities-to">
                  {cities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ngày đi</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ height: '44px', padding: '0 20px' }} onClick={handleSearch}>
                <Search size={16} /> Tìm
              </button>
            </div>
            {/* Quick date shortcuts */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '600' }}>Ngày:</span>
              {[
                { label: 'Hôm nay', offset: 0 },
                { label: 'Ngày mai', offset: 1 },
                { label: 'Sau 2 ngày', offset: 2 },
              ].map(({ label, offset }) => (
                <button key={label} onClick={() => setQuickDate(offset)} style={{
                  padding: '4px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600', transition: 'all 0.15s',
                  background: date === toDateInput(new Date(Date.now() + offset * 86400000)) ? 'var(--primary)' : 'var(--gray-100)',
                  color: date === toDateInput(new Date(Date.now() + offset * 86400000)) ? 'white' : 'var(--gray-600)',
                }}>
                  {label}
                </button>
              ))}
              {(from || to || date) && (
                <button onClick={() => { setFrom(''); setTo(''); setDate(''); }} style={{
                  padding: '4px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600', background: 'var(--danger-light)', color: 'var(--danger)',
                }}>
                  <X size={11} style={{ marginRight: '3px' }} />Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Filter Sidebar */}
          {showFilter && (
            <aside style={{ width: '240px', flexShrink: 0 }}>
              <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Bộ lọc</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedType('Tất cả'); setMaxPrice(1000000); }} style={{ color: 'var(--primary)', padding: '4px 8px', fontSize: '12px' }}>Reset</button>
                </div>

                {/* Bus type filter */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-700)', marginBottom: '10px' }}>Loại xe</div>
                  {types.map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="radio" name="type" checked={selectedType === t} onChange={() => setSelectedType(t)} style={{ accentColor: 'var(--primary)' }} />
                      {typeLabels[t]}
                    </label>
                  ))}
                </div>

                {/* Price filter */}
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-700)' }}>Giá vé tối đa</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{(maxPrice / 1000).toFixed(0)}k đ</span>
                  </div>
                  <input type="range" min="50000" max="1000000" step="50000" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                    <span>50k</span><span>1000k</span>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Results */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Results header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowFilter(v => !v)}>
                  <SlidersHorizontal size={14} /> {showFilter ? 'Ẩn' : 'Bộ lọc'}
                </button>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                  {loading ? 'Đang tìm...' : <><strong style={{ color: 'var(--gray-900)' }}>{filtered.length}</strong> chuyến xe{from && to && ` (${from} → ${to})`}</>}
                </div>
              </div>
              <select className="form-select" style={{ width: 'auto', fontSize: '13px', padding: '7px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="departureTime">Khởi hành sớm nhất</option>
                <option value="price">Giá thấp nhất</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)', marginBottom: '12px' }}>
                <AlertCircle size={18} style={{ display: 'block', margin: '0 auto 8px' }} />
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="card" style={{ height: '140px', background: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '14px' }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="card">
                <div className="empty-state">
                  <Bus size={52} color="var(--gray-300)" />
                  <div style={{ fontWeight: '700', color: 'var(--gray-600)', fontSize: '16px' }}>Không tìm thấy chuyến xe</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Thử thay đổi điểm đi, điểm đến hoặc chọn ngày khác</div>
                  <button className="btn btn-outline" onClick={() => { setFrom(''); setTo(''); setDate(''); }}>Xóa bộ lọc</button>
                </div>
              </div>
            )}

            {/* Trip cards */}
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map(trip => (
                  <TripCard key={trip._id} trip={trip} onSelect={id => navigate(`/trip/${id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
