import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Newspaper, Eye, Clock, User, ArrowLeft, Tag, Share2, Loader } from 'lucide-react';
import api from '../../api/axios';

const CATEGORIES = {
  'khuyen-mai': { label: 'Khuyến mãi', icon: '🎉', color: 'var(--danger)' },
  'thong-bao': { label: 'Thông báo', icon: '📢', color: 'var(--warning)' },
  'su-kien': { label: 'Sự kiện', icon: '🎪', color: 'var(--info)' },
  'tin-tuc': { label: 'Tin tức', icon: '📰', color: 'var(--success)' },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchArticle = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/news/${slug}`);
        if (!cancelled) {
          setArticle(res.data);

          // Fire-and-forget view increment
          api.patch(`/news/${slug}/view`).catch(() => {});

          // Fetch related articles in same category
          try {
            const relRes = await api.get('/news', {
              params: { category: res.data.category, limit: 4 },
            });
            const others = (relRes.data.articles || []).filter((a) => a._id !== res.data._id).slice(0, 3);
            if (!cancelled) setRelated(others);
          } catch {
            // non-critical
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Bài viết không tồn tại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);

    return () => { cancelled = true; };
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết!');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--gray-400)' }}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Newspaper size={48} color="var(--gray-300)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontWeight: '800', color: 'var(--gray-700)', marginBottom: '8px' }}>Không tìm thấy bài viết</h2>
        <p style={{ color: 'var(--gray-400)', marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/news')}>
          <ArrowLeft size={16} /> Quay lại tin tức
        </button>
      </div>
    );
  }

  const cat = CATEGORIES[article.category] || { label: article.category, icon: '📄', color: 'var(--gray-400)' };

  return (
    <div style={{ background: 'var(--gray-50)' }}>
      {/* Hero thumbnail */}
      <div style={{
        height: article.thumbnail ? '360px' : '200px',
        background: article.thumbnail
          ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${article.thumbnail}) center/cover`
          : 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
        display: 'flex', alignItems: 'flex-end',
      }}>
        <div className="container" style={{ paddingBottom: '32px' }}>
          <button
            className="btn btn-sm"
            onClick={() => navigate('/news')}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
          <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
            <span style={{
              background: `${cat.color}20`, color: cat.color, padding: '4px 12px',
              borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700',
              backdropFilter: 'blur(8px)',
            }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <h1 style={{
            color: 'white', fontSize: '32px', fontWeight: '900', lineHeight: 1.3,
            maxWidth: '720px', textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {article.title}
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: related.length > 0 ? '1fr 320px' : '1fr',
          gap: '32px',
          marginTop: '-20px',
        }}>
          {/* Main article */}
          <div>
            {/* Meta bar */}
            <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div className="flex items-center gap-4" style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                {article.author?.username && (
                  <span className="flex items-center gap-1">
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '10px', fontWeight: '800',
                    }}>
                      {article.author.username[0]?.toUpperCase()}
                    </div>
                    {article.author.username}
                  </span>
                )}
                <span className="flex items-center gap-1"><Clock size={13} /> {fmtDate(article.publishedAt)}, {fmtTime(article.publishedAt)}</span>
                <span className="flex items-center gap-1"><Eye size={13} /> {article.views?.toLocaleString()} lượt xem</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleShare}>
                <Share2 size={14} /> Chia sẻ
              </button>
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', borderLeft: `4px solid ${cat.color}` }}>
              <p style={{ fontSize: '15px', color: 'var(--gray-600)', fontStyle: 'italic', lineHeight: 1.7 }}>
                {article.summary}
              </p>
            </div>

            {/* Content body */}
            <div
              className="card"
              style={{ padding: '32px', marginBottom: '40px' }}
            >
              <div
                className="news-content"
                style={{
                  fontSize: '15px', lineHeight: 1.8, color: 'var(--gray-700)',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </div>

          {/* Sidebar: Related articles */}
          {related.length > 0 && (
            <div style={{ marginTop: '0' }}>
              <div className="card" style={{ padding: '20px', position: 'sticky', top: '80px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '15px', marginBottom: '16px', color: 'var(--gray-900)' }}>
                  Bài viết liên quan
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {related.map((r) => (
                    <Link
                      key={r._id}
                      to={`/news/${r.slug}`}
                      style={{
                        display: 'flex', gap: '12px', textDecoration: 'none',
                        padding: '10px', borderRadius: 'var(--radius)', transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '64px', height: '48px', borderRadius: '8px', flexShrink: 0,
                        background: r.thumbnail
                          ? `url(${r.thumbnail}) center/cover`
                          : 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!r.thumbnail && <Newspaper size={16} color="var(--gray-300)" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600', fontSize: '13px', color: 'var(--gray-800)',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          lineHeight: 1.4,
                        }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                          {fmtDate(r.publishedAt)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/news"
                  className="btn btn-outline btn-sm w-full"
                  style={{ justifyContent: 'center', marginTop: '16px' }}
                >
                  Xem tất cả tin tức
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
