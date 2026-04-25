import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Users, ChevronRight,
  Clock, Zap, Shield, Headphones, ArrowRight,
  Bus, Tag, TrendingUp
} from 'lucide-react';
import api from '../../api/axios';

// Static feature cards — these are genuine product features, not fake metrics
const features = [
  { icon: Zap, title: 'Đặt vé siêu nhanh', desc: 'Chỉ 3 bước để có vé xe trong tay', color: '#FF6B35' },
  { icon: Shield, title: 'Thanh toán bảo mật', desc: 'Mã hóa SSL 256-bit, an toàn tuyệt đối', color: '#22C55E' },
  { icon: Bus, title: 'Nhiều tuyến xe', desc: 'Mạng lưới chuyến xe phủ rộng toàn quốc', color: '#F59E0B' },
  { icon: Headphones, title: 'Hỗ trợ tận tình', desc: 'Đội ngũ CSKH luôn sẵn sàng hỗ trợ bạn', color: '#3B82F6' },
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
  const [publicStats, setPublicStats] = useState(null);

  const banners = [
    { bg: 'linear-gradient(135deg, #FF6B35 0%, #E55A26 50%, #C44A18 100%)', title: 'Mùa hè về − Đặt vé ngay!', sub: 'Tìm chuyến xe tốt nhất cho chuyến đi của bạn' },
    { bg: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)', title: 'Xe Limousine hạng sang', sub: 'Trải nghiệm đẳng cấp − Giá ưu đãi hàng ngày' },
    { bg: 'linear-gradient(135deg, #14B8A6 0%, #0891B2 100%)', title: 'Đặt sớm − Giá tốt hơn!', sub: 'Lên kế hoạch sớm để có chỗ ngồi ưng ý' },
  ];

  // Auto-rotate banners
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(p => (p + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch cities for dropdown
  useEffect(() => {
    api.get('/stations/cities')
      .then(res => setCities(res.data?.cities || res.data || []))
      .catch(() => { });
  }, []);

  // Fetch recent / popular trips (first page)
  useEffect(() => {
    api.get('/trips', { params: { limit: 6 } })
      .then(res => setPopularTrips(res.data?.trips || res.data || []))
      .catch(() => { });
  }, []);

  const filteredTrips = popularTrips

  // Fetch active promotions
  useEffect(() => {
    api.get('/promotions')
      .then(res => setActivePromos((res.data || []).filter(p => {
        const notExpired = !p.expiresAt || new Date(p.expiresAt) > new Date();
        const notMaxed = p.maxUses === null || (p.usedCount || 0) < (p.maxUses || Infinity);
        return notExpired && notMaxed;
      }).slice(0, 3)))
      .catch(() => { });
  }, []);

  // Fetch real public stats (totalTickets, totalTrips, totalUsers)
  useEffect(() => {
    api.get('/stats/summary')
      .then(res => setPublicStats(res.data))
      .catch(() => { });
  }, []);

  const handleSearch = () => {
    navigate(`/search?from=${from}&to=${to}&date=${date}&seats=${seats}`);
  };

  return (
    <div>
      {/* ── Hero Banner ── */}
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
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          {/* Real stat badge */}
          {publicStats && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              padding: '6px 16px', borderRadius: '20px', marginBottom: '20px',
              color: 'white', fontSize: '13px', fontWeight: '600',
            }}>
              <TrendingUp size={14} />
              {publicStats.totalTickets?.toLocaleString()} vé đã bán •{' '}
              {publicStats.totalTrips?.toLocaleString()} chuyến xe
            </div>
          )}

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
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} ghế</option>)}
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

      {/* ── Real Stats Bar ── */}
      {publicStats && (
        <section style={{ background: 'var(--secondary)', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              {[
                { label: 'Vé đã bán', value: publicStats.totalTickets?.toLocaleString() || '—', color: 'var(--primary)' },
                { label: 'Chuyến xe hiện tại', value: publicStats.totalTrips?.toLocaleString() || '—', color: '#22C55E' },
                { label: 'Khách hàng', value: publicStats.totalUsers?.toLocaleString() || '—', color: '#3B82F6' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
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

      {/* ── Popular Routes (real data) ── */}
      <section style={{ padding: '60px 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
            <div>
              <h2 className="section-title">Chuyến xe mới nhất</h2>
              <p className="section-subtitle">Các chuyến xe đang được lên lịch</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/search')}>
              Xem tất cả <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredTrips.length > 0 ? filteredTrips.map((t, i) => (
              <div key={t._id || i} className="card card-hover" style={{ padding: '20px', cursor: 'pointer' }}
                onClick={() => navigate(`/trip/${t._id}`)}>
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
                    {new Date(t.departureTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                {t.availableSeats !== undefined && (
                  <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: t.availableSeats <= 0 ? 'var(--danger)' : t.availableSeats <= 5 ? 'var(--warning)' : 'var(--success)' }}>
                    {t.availableSeats <= 0 ? 'Hết chỗ' : t.availableSeats <= 5 ? `${t.availableSeats} chỗ cuối!` : `${t.availableSeats} chỗ trống`}
                  </div>
                )}
              </div>
            )) : [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card" style={{ padding: '20px', opacity: 0.5, height: '100px', background: 'var(--gray-100)', borderRadius: '14px' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Promotions (real data) ── */}
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
              const discountLabel = p.discountType === 'percent'
                ? `Giảm ${p.discountValue}%`
                : `Giảm ${(p.discountValue / 1000).toFixed(0)}k`;
              const remaining = p.maxUses ? p.maxUses - (p.usedCount || 0) : null;
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
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>{p.code}</h3>
                    <p style={{ opacity: 0.85, fontSize: '13px' }}>
                      {p.description || (p.expiresAt ? `Hết hạn: ${new Date(p.expiresAt).toLocaleDateString('vi-VN')}` : 'Không giới hạn thời gian')}
                    </p>
                    {remaining !== null && (
                      <p style={{ opacity: 0.8, fontSize: '12px', marginTop: '4px' }}>
                        Còn {remaining} lượt
                      </p>
                    )}
                  </div>
                  <div style={{ background: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>Mã giảm giá</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', letterSpacing: '2px', color: c }}>{p.code}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>
                      <Tag size={13} /> Dùng ngay
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: '13px' }}>
                Hiện chưa có ưu đãi nào đang hoạt động
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,107,53,0.15) 0%, transparent 60%)' }} />
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
            <button className="btn btn-outline btn-lg" style={{ borderColor: '#64748b', color: '#94a3b8' }} onClick={() => navigate('/search')}>
              Tìm chuyến xe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
