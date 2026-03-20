import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, ChevronRight,
  Star, Clock, Zap, Shield, Headphones, ArrowRight,
  TrendingUp, Bus, Tag
} from 'lucide-react';
import api from '../../api/axios';

const popularRoutes = [
  { from: 'Hà Nội', to: 'TP.HCM', price: '350.000', time: '36h', trips: 24 },
  { from: 'TP.HCM', to: 'Đà Lạt', price: '120.000', time: '7h', trips: 18 },
  { from: 'Hà Nội', to: 'Đà Nẵng', price: '200.000', time: '13h', trips: 15 },
  { from: 'TP.HCM', to: 'Nha Trang', price: '150.000', time: '9h', trips: 20 },
  { from: 'TP.HCM', to: 'Vũng Tàu', price: '80.000', time: '2h', trips: 30 },
  { from: 'Hà Nội', to: 'Hải Phòng', price: '70.000', time: '2h', trips: 40 },
];

const features = [
  { icon: Zap, title: 'Đặt vé siêu nhanh', desc: 'Chỉ 3 bước để có vé xe trong tay', color: '#FF6B35' },
  { icon: Shield, title: 'Thanh toán bảo mật', desc: 'Mã hóa SSL 256-bit, an toàn tuyệt đối', color: '#22C55E' },
  { icon: Star, title: 'Hơn 500+ tuyến xe', desc: 'Mạng lưới rộng khắp toàn quốc', color: '#F59E0B' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Tổng đài miễn phí 1900 1234', color: '#3B82F6' },
];

const hotBuses = [
  { name: 'Phương Trang', routes: 'TP.HCM ↔ Tây Nguyên', rating: 4.8, reviews: 2340, type: 'Limousine' },
  { name: 'Thành Bưởi', routes: 'TP.HCM ↔ Đà Lạt', rating: 4.7, reviews: 1890, type: 'Giường nằm' },
  { name: 'Hoàng Long', routes: 'Hà Nội ↔ Thanh Hóa', rating: 4.6, reviews: 1560, type: 'Ghế ngồi' },
  { name: 'Kumho Samco', routes: 'TP.HCM ↔ Nha Trang', rating: 4.9, reviews: 3210, type: 'VIP' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(1);
  const [bannerIdx, setBannerIdx] = useState(0);
  // Real data from API
  const [cities, setCities] = useState([]);
  const [popularTrips, setPopularTrips] = useState([]);
  const [activePromos, setActivePromos] = useState([]);

  const banners = [
    { bg: 'linear-gradient(135deg, #FF6B35 0%, #E55A26 50%, #C44A18 100%)', title: 'Mùa xuân về − Đặt vé ngay!', sub: 'Giảm đến 30% tất cả tuyến dịp Tết' },
    { bg: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)', title: 'Limousine hạng sang', sub: 'Trải nghiệm đẳng cấp − Giá ưu đãi' },
    { bg: 'linear-gradient(135deg, #14B8A6 0%, #0891B2 100%)', title: 'Đặt vé sớm − Giá rẻ!', sub: 'Đặt trước 7 ngày giảm thêm 15%' },
  ];

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(p => (p + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch cities for dropdown
  useEffect(() => {
    api.get('/stations/cities')
      .then(res => setCities(res.data?.cities || res.data || []))
      .catch(() => {}); // silently fail — users can still type
  }, []);

  // Fetch popular trips (first page of all trips)
  useEffect(() => {
    api.get('/trips', { params: { limit: 6 } })
      .then(res => setPopularTrips(res.data?.trips || res.data || []))
      .catch(() => {});
  }, []);

  // Fetch active promotions
  useEffect(() => {
    api.get('/promotions')
      .then(res => setActivePromos((res.data || []).filter(p => {
        const notExpired = !p.expiresAt || new Date(p.expiresAt) > new Date();
        const notMaxed = !p.maxUses || (p.usedCount || 0) < p.maxUses;
        return notExpired && notMaxed;
      }).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    navigate(`/search?from=${from}&to=${to}&date=${date}&seats=${seats}`);
  };

  return (
    <div>
      {/* Hero Banner */}
      <section style={{
        background: banners[bannerIdx].bg,
        minHeight: '520px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.8s ease',
        overflow: 'hidden',
        padding: '60px 24px',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            padding: '6px 16px', borderRadius: '20px', marginBottom: '20px',
            color: 'white', fontSize: '13px', fontWeight: '600',
          }}>
            <TrendingUp size={14} /> Hơn 1 triệu vé đã bán
          </div>

          <h1 style={{
            color: 'white', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '900',
            lineHeight: '1.15', marginBottom: '16px', textShadow: '0 2px 20px rgba(0,0,0,0.2)',
          }}>
            {banners[bannerIdx].title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', marginBottom: '32px' }}>
            {banners[bannerIdx].sub}
          </p>

          {/* Banner dots */}
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: '32px' }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                style={{
                  width: i === bannerIdx ? '24px' : '8px', height: '8px',
                  borderRadius: '4px', border: 'none',
                  background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.3s ease', cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        {/* Search Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '860px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 100px auto',
          gap: '16px',
          alignItems: 'end',
        }}>
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}><MapPin size={13} /> Điểm đi</span>
            </label>
            <input
              className="form-input"
              list="cities-from"
              placeholder="Hà Nội, TP.HCM..."
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
            <datalist id="cities-from">
              {cities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}><MapPin size={13} /> Điểm đến</span>
            </label>
            <input
              className="form-input"
              list="cities-to"
              placeholder="Đà Lạt, Nha Trang..."
              value={to}
              onChange={e => setTo(e.target.value)}
            />
            <datalist id="cities-to">
              {cities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}><Calendar size={13} /> Ngày đi</span>
            </label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}><Users size={13} /> Số ghế</span>
            </label>
            <select className="form-select" value={seats} onChange={e => setSeats(e.target.value)}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ghế</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSearch}
            style={{ padding: '12px 24px', height: '46px', fontSize: '15px' }}
          >
            <Search size={18} />
            Tìm
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 0', background: 'white' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                  padding: '20px', borderRadius: '14px', transition: 'all 0.3s',
                  border: '1px solid var(--gray-100)',
                }}
                  className="card-hover">
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                    background: f.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-900)', marginBottom: '4px' }}>{f.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section style={{ padding: '60px 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
            <div>
              <h2 className="section-title">Tuyến phổ biến</h2>
              <p className="section-subtitle">Các tuyến được đặt nhiều nhất</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/search')}>
              Xem tất cả <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {popularTrips.length > 0 ? popularTrips.map((t, i) => (
              <div key={t._id || i} className="card card-hover" style={{ padding: '20px', cursor: 'pointer' }}
                onClick={() => navigate(`/search?from=${t.fromStation?.city}&to=${t.toStation?.city}`)}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--gray-900)' }}>{t.fromStation?.city}</span>
                    <ArrowRight size={16} color="var(--primary)" />
                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--gray-900)' }}>{t.toStation?.city}</span>
                  </div>
                  <span className="badge badge-info">{t.bus?.type || 'xe'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Từ </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{t.price?.toLocaleString()}đ</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                    <Clock size={13} />
                    {t.estimatedDuration ? `~${Math.floor(t.estimatedDuration / 60)}h` : `${new Date(t.departureTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}`}
                  </div>
                </div>
              </div>
            )) : [1,2,3,4,5,6].map(i => (
              <div key={i} className="card" style={{ padding: '20px', opacity: 0.5, height: '100px', background: 'var(--gray-100)', borderRadius: '14px' }} />
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section style={{ padding: '60px 0', background: 'white' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <h2 className="section-title">Ưu đãi hôm nay</h2>
            <p className="section-subtitle">Đặt nhanh kẻo hết</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {activePromos.length > 0 ? activePromos.map((p, i) => {
              const colors = ['#FF6B35', '#8B5CF6', '#14B8A6'];
              const c = colors[i % colors.length];
              const discountLabel = p.discountType === 'percent' ? `Giảm ${p.discountValue}%` : `Giảm ${(p.discountValue/1000).toFixed(0)}k`;
              return (
                <div key={p._id} style={{
                  borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)', transition: 'all 0.3s',
                }} className="card-hover">
                  <div style={{ background: c, padding: '24px', color: 'white' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
                      borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      display: 'inline-block', marginBottom: '12px',
                    }}>{discountLabel}</span>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
                      {p.code}
                    </h3>
                    <p style={{ opacity: 0.85, fontSize: '13px' }}>
                      {p.expiresAt ? `Hết hạn: ${new Date(p.expiresAt).toLocaleDateString('vi-VN')}` : 'Không giới hạn thời gian'}
                    </p>
                  </div>
                  <div style={{ background: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>Mã giảm giá</div>
                      <div style={{
                        fontFamily: 'monospace', fontWeight: '800', fontSize: '16px',
                        letterSpacing: '2px', color: c,
                      }}>{p.code}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>Dùng ngay</button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: '13px' }}>Hiện chưa có ưu đãi nào đang hoạt động</div>
            )}
          </div>
        </div>
      </section>

      {/* Hot Buses */}
      <section style={{ padding: '60px 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <h2 className="section-title">Nhà xe nổi bật</h2>
            <p className="section-subtitle">Được đánh giá cao bởi hành khách</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {hotBuses.map((b, i) => (
              <div key={i} className="card card-hover" style={{ padding: '20px', cursor: 'pointer' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '18px', color: 'var(--primary)',
                  }}>{b.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{b.name}</div>
                    <span className="badge badge-gray" style={{ marginTop: '2px' }}>{b.type}</span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>{b.routes}</div>
                <div className="flex items-center gap-2">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{b.rating}</span>
                  <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>({b.reviews.toLocaleString()} đánh giá)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,107,53,0.15) 0%, transparent 60%)',
        }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Bus size={48} color="var(--primary)" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>
            Chưa có tài khoản?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            Đăng ký miễn phí để nhận ưu đãi độc quyền và quản lý vé dễ dàng hơn
          </p>
          <div className="flex items-center justify-center gap-3" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Đăng ký ngay
            </button>
            <button className="btn btn-outline btn-lg" style={{ borderColor: '#64748b', color: '#94a3b8' }}>
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
