import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Newspaper, Eye, Pin, Clock, ChevronLeft, ChevronRight, Tag, Loader } from 'lucide-react';
import api from '../../api/axios';

const CATEGORIES = [
  { value: '', label: 'Tất cả' },
  { value: 'khuyen-mai', label: 'Khuyến mãi', icon: '🎉' },
  { value: 'thong-bao', label: 'Thông báo', icon: '📢' },
  { value: 'su-kien', label: 'Sự kiện', icon: '🎪' },
  { value: 'tin-tuc', label: 'Tin tức', icon: '📰' },
];

const catMeta = (val) => CATEGORIES.find((c) => c.value === val) || { label: val, icon: '📄' };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

export default function NewsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || '';

  const [articles, setArticles] = useState([]);
  const [pinnedArticles, setPinnedArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCat);

  const LIMIT = 9;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (category) params.category = category;
      const res = await api.get('/news', { params });
      const all = res.data.articles || [];

      // Separate pinned from regular for the first page
      if (page === 1) {
        setPinnedArticles(all.filter((a) => a.isPinned));
      }
      setArticles(all.filter((a) => !a.isPinned || page > 1));
      setTotal(res.data.total || 0);
    } catch {
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '80vh' }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
        padding: '48px 0 40px',
      }}>
        <div className="container">
          <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255,107,53,0.4)',
            }}>
              <Newspaper size={22} color="white" />
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '900', lineHeight: 1.1 }}>Tin tức & Thông báo</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Cập nhật mới nhất từ SlimBus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '0 24px', marginTop: '-20px' }}>
        {/* Category tabs */}
        <div className="card" style={{ padding: '6px', marginBottom: '24px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryChange(c.value)}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: category === c.value ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'transparent',
                color: category === c.value ? 'white' : 'var(--gray-600)',
                boxShadow: category === c.value ? '0 4px 12px rgba(255,107,53,0.3)' : 'none',
              }}
            >
              {c.icon && <span style={{ marginRight: '6px' }}>{c.icon}</span>}
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--gray-400)' }}>Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Pinned highlight section (first page only) */}
            {page === 1 && pinnedArticles.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                  <Pin size={16} color="var(--primary)" />
                  <span style={{ fontWeight: '800', color: 'var(--gray-900)', fontSize: '16px' }}>Tin nổi bật</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: pinnedArticles.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '20px',
                }}>
                  {pinnedArticles.map((item) => (
                    <div
                      key={item._id}
                      className="card card-hover"
                      onClick={() => navigate(`/news/${item.slug}`)}
                      style={{
                        cursor: 'pointer', padding: 0, overflow: 'hidden',
                        border: '2px solid var(--primary-bg)',
                        position: 'relative',
                      }}
                    >
                      {/* Pin badge */}
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px', zIndex: 2,
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        <Pin size={10} /> Ghim
                      </div>

                      {/* Thumbnail */}
                      <div style={{
                        height: '200px',
                        background: item.thumbnail
                          ? `url(${item.thumbnail}) center/cover`
                          : 'linear-gradient(135deg, var(--gray-100), var(--gray-200))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!item.thumbnail && <Newspaper size={40} color="var(--gray-300)" />}
                      </div>

                      {/* Content */}
                      <div style={{ padding: '20px' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                            {catMeta(item.category).icon} {catMeta(item.category).label}
                          </span>
                        </div>
                        <h3 style={{ fontWeight: '800', fontSize: '17px', color: 'var(--gray-900)', lineHeight: 1.4, marginBottom: '8px' }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-4" style={{ marginTop: '14px', fontSize: '12px', color: 'var(--gray-400)' }}>
                          <span className="flex items-center gap-1"><Clock size={12} /> {fmtDate(item.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {item.views?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular articles grid */}
            {articles.length > 0 ? (
              <>
                {page === 1 && pinnedArticles.length > 0 && (
                  <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <Newspaper size={16} color="var(--gray-500)" />
                    <span style={{ fontWeight: '800', color: 'var(--gray-900)', fontSize: '16px' }}>Bài viết mới nhất</span>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                }}>
                  {articles.map((item) => (
                    <div
                      key={item._id}
                      className="card card-hover"
                      onClick={() => navigate(`/news/${item.slug}`)}
                      style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        height: '160px',
                        background: item.thumbnail
                          ? `url(${item.thumbnail}) center/cover`
                          : 'linear-gradient(135deg, var(--gray-100), var(--gray-200))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!item.thumbnail && <Newspaper size={32} color="var(--gray-300)" />}
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                            {catMeta(item.category).icon} {catMeta(item.category).label}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{fmtDateShort(item.publishedAt)}</span>
                        </div>
                        <h3 style={{
                          fontWeight: '700', fontSize: '15px', color: 'var(--gray-900)', lineHeight: 1.4,
                          marginBottom: '6px',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {item.title}
                        </h3>
                        <p style={{
                          fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-3" style={{ marginTop: '12px', fontSize: '12px', color: 'var(--gray-400)' }}>
                          <span className="flex items-center gap-1"><Eye size={11} /> {item.views?.toLocaleString() || 0} lượt xem</span>
                          {item.author?.username && <span>• {item.author.username}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              total === 0 && (
                <div className="empty-state" style={{ padding: '60px 20px' }}>
                  <Newspaper size={48} color="var(--gray-300)" />
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>Chưa có bài viết nào</p>
                  <p style={{ fontSize: '13px' }}>Các bài viết mới sẽ xuất hiện tại đây.</p>
                </div>
              )
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2" style={{ marginTop: '32px', paddingBottom: '40px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Tiếp <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
