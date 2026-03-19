import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, MapPin, Clock, Star, Users,
  ChevronDown, Bus, SlidersHorizontal, Grid, List,
  ArrowRight, Zap, CheckCircle
} from 'lucide-react';

const trips = [
  { id: 1, company: 'Phương Trang', type: 'Limousine', from: 'TP.HCM', to: 'Đà Lạt', depart: '07:00', arrive: '14:00', duration: '7h', price: 150000, seats: 12, rating: 4.8, reviews: 234, amenities: ['WiFi', 'Điều hòa', 'USB sạc'] },
  { id: 2, company: 'Thành Bưởi', type: 'Giường nằm', from: 'TP.HCM', to: 'Đà Lạt', depart: '09:30', arrive: '16:30', duration: '7h', price: 130000, seats: 5, rating: 4.6, reviews: 189, amenities: ['Điều hòa', 'Mạng WiFi'] },
  { id: 3, company: 'Kumho Samco', type: 'VIP Sleeper', from: 'TP.HCM', to: 'Đà Lạt', depart: '20:00', arrive: '03:00', duration: '7h', price: 200000, seats: 3, rating: 4.9, reviews: 412, amenities: ['WiFi', 'Điều hòa', 'Chăn gối', 'Đồ ăn'] },
  { id: 4, company: 'Mai Linh Express', type: 'Ghế ngồi', from: 'TP.HCM', to: 'Đà Lạt', depart: '14:00', arrive: '21:00', duration: '7h', price: 95000, seats: 20, rating: 4.3, reviews: 98, amenities: ['Điều hòa'] },
  { id: 5, company: 'Hoàng Anh', type: 'Limousine', from: 'TP.HCM', to: 'Đà Lạt', depart: '22:00', arrive: '05:00', duration: '7h', price: 175000, seats: 8, rating: 4.7, reviews: 267, amenities: ['WiFi', 'Điều hòa', 'USB sạc', 'Snack'] },
];

const types = ['Tất cả', 'Limousine', 'Giường nằm', 'Ghế ngồi', 'VIP'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('price');
  const [maxPrice, setMaxPrice] = useState(300000);
  const [from, setFrom] = useState(searchParams.get('from') || 'TP.HCM');
  const [to, setTo] = useState(searchParams.get('to') || 'Đà Lạt');

  const filtered = trips
    .filter(t => selectedType === 'Tất cả' || t.type === selectedType)
    .filter(t => t.price <= maxPrice)
    .sort((a, b) => sortBy === 'price' ? a.price - b.price : sortBy === 'rating' ? b.rating - a.rating : a.depart.localeCompare(b.depart));

  return (
    <div style={{ padding: '24px 0', background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="container">
        {/* Search bar */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label"><span className="flex items-center gap-1"><MapPin size={12} color="var(--primary)" /> Điểm đi</span></label>
              <input className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><span className="flex items-center gap-1"><MapPin size={12} color="var(--primary)" /> Điểm đến</span></label>
              <input className="form-input" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày đi</label>
              <input className="form-input" type="date" defaultValue="2025-03-25" />
            </div>
            <div className="form-group">
              <label className="form-label">Số ghế</label>
              <select className="form-select"><option>1 ghế</option><option>2 ghế</option></select>
            </div>
            <button className="btn btn-primary" style={{ height: '44px' }}>
              <Search size={16} /> Tìm
            </button>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Filter Sidebar */}
          <aside style={{ width: '260px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Bộ lọc</span>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px 8px' }}>Reset</button>
              </div>

              {/* Type */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-700)', marginBottom: '10px' }}>Loại xe</div>
                {types.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="radio" name="type" checked={selectedType === t} onChange={() => setSelectedType(t)}
                      style={{ accentColor: 'var(--primary)' }} />
                    {t}
                  </label>
                ))}
              </div>

              {/* Price */}
              <div style={{ marginBottom: '20px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-700)' }}>Giá vé</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{(maxPrice/1000).toFixed(0)}k</span>
                </div>
                <input
                  type="range" min="50000" max="300000" step="10000"
                  value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                  <span>50k</span><span>300k</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-700)', marginBottom: '10px' }}>Đánh giá</div>
                {[4, 3, 2].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                    <span className="flex items-center gap-1">
                      {Array(r).fill(0).map((_, i) => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                      <span style={{ color: 'var(--gray-500)' }}>trở lên</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div style={{ flex: 1 }}>
            {/* Sort + view */}
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                Tìm thấy <strong style={{ color: 'var(--gray-900)' }}>{filtered.length}</strong> chuyến xe
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="form-select"
                  style={{ width: 'auto', fontSize: '13px', padding: '7px 12px' }}
                  value={sortBy} onChange={e => setSortBy(e.target.value)}
                >
                  <option value="price">Giá thấp nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="depart">Sớm nhất</option>
                </select>
                <div className="flex items-center" style={{ border: '1.5px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setViewMode('list')} style={{
                    padding: '7px 10px', background: viewMode === 'list' ? 'var(--primary-bg)' : 'white',
                    color: viewMode === 'list' ? 'var(--primary)' : 'var(--gray-400)', border: 'none', cursor: 'pointer',
                  }}><List size={16} /></button>
                  <button onClick={() => setViewMode('grid')} style={{
                    padding: '7px 10px', background: viewMode === 'grid' ? 'var(--primary-bg)' : 'white',
                    color: viewMode === 'grid' ? 'var(--primary)' : 'var(--gray-400)', border: 'none', cursor: 'pointer',
                  }}><Grid size={16} /></button>
                </div>
              </div>
            </div>

            {/* Trip Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(trip => (
                <div key={trip.id} className="card card-hover" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0' }}>
                    <div style={{ padding: '20px 24px' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', color: 'var(--primary)',
                          }}>{trip.company[0]}</div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--gray-900)', fontSize: '14px' }}>{trip.company}</div>
                            <span className="badge badge-info">{trip.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} fill="#F59E0B" color="#F59E0B" />
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{trip.rating}</span>
                          <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>({trip.reviews})</span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-4" style={{ marginBottom: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gray-900)' }}>{trip.depart}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.from}</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{trip.duration}</span>
                          <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, var(--primary), var(--primary-light))', borderRadius: '2px' }} />
                          <Bus size={14} color="var(--primary)" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gray-900)' }}>{trip.arrive}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{trip.to}</div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex items-center gap-2">
                        {trip.amenities.map(a => (
                          <span key={a} className="tag" style={{ fontSize: '11px' }}>
                            <CheckCircle size={10} color="var(--success)" style={{ marginRight: '3px' }} />{a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side */}
                    <div style={{
                      padding: '20px 24px', background: 'var(--gray-50)', minWidth: '180px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '12px', borderLeft: '1px solid var(--gray-100)',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--primary)' }}>
                          {trip.price.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>đ / người</div>
                      </div>
                      <div style={{
                        fontSize: '12px', color: trip.seats <= 5 ? 'var(--danger)' : 'var(--success)',
                        fontWeight: '600',
                      }}>
                        {trip.seats <= 5 ? `⚡ Còn ${trip.seats} ghế` : `✓ ${trip.seats} ghế trống`}
                      </div>
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        style={{ justifyContent: 'center' }}
                      >
                        Chọn chuyến
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
