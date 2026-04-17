import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Search, Loader, AlertCircle, CheckCircle,
  Eye, EyeOff, Pin, PinOff, Newspaper, Image, X,
} from 'lucide-react';
import api from '../../api/axios';

const CATEGORIES = [
  { value: 'khuyen-mai', label: 'Khuyến mãi', color: 'var(--danger)' },
  { value: 'thong-bao', label: 'Thông báo', color: 'var(--warning)' },
  { value: 'su-kien', label: 'Sự kiện', color: 'var(--info)' },
  { value: 'tin-tuc', label: 'Tin tức', color: 'var(--success)' },
];

const catLabel = (val) => CATEGORIES.find((c) => c.value === val) || { label: val, color: 'var(--gray-400)' };

const emptyForm = {
  title: '', summary: '', content: '', category: 'tin-tuc', status: 'draft', isPinned: false,
};

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionId, setActionId] = useState(null);

  const LIMIT = 10;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/news/admin/all', { params });
      setArticles(res.data.articles || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách tin tức.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCat, filterStatus]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // ── Open modals ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setThumbFile(null);
    setThumbPreview(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      content: item.content || '',
      category: item.category || 'tin-tuc',
      status: item.status || 'draft',
      isPinned: item.isPinned || false,
    });
    setThumbFile(null);
    setThumbPreview(item.thumbnail || null);
    setFormError('');
    setShowModal(true);
  };

  // ── Save (Create / Update) ────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) { setFormError('Tiêu đề là bắt buộc.'); return; }
    if (!form.summary.trim()) { setFormError('Tóm tắt là bắt buộc.'); return; }
    if (!form.content.trim()) { setFormError('Nội dung là bắt buộc.'); return; }
    if (!form.category) { setFormError('Danh mục là bắt buộc.'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('summary', form.summary);
      fd.append('content', form.content);
      fd.append('category', form.category);
      fd.append('status', form.status);
      fd.append('isPinned', form.isPinned);
      if (thumbFile) fd.append('thumbnail', thumbFile);

      if (editItem) {
        await api.put(`/news/${editItem._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/news', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      fetchArticles();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map((e) => e.message).join(', ')
        : err.response?.data?.message || 'Lưu thất bại.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!confirm(`Xóa bài viết "${item.title}"? Không thể hoàn tác.`)) return;
    setActionId(item._id);
    try {
      await api.delete(`/news/${item._id}`);
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại.');
    } finally {
      setActionId(null);
    }
  };

  const handleTogglePublish = async (item) => {
    setActionId(item._id);
    try {
      await api.patch(`/news/${item._id}/publish`);
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setActionId(null);
    }
  };

  const handleTogglePin = async (item) => {
    setActionId(item._id);
    try {
      await api.patch(`/news/${item._id}/pin`);
      fetchArticles();
    } catch (err) {
      alert(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setActionId(null);
    }
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Tổng bài viết', value: total, color: 'var(--primary)' },
    { label: 'Đã xuất bản', value: articles.filter((a) => a.status === 'published').length, color: 'var(--success)' },
    { label: 'Bản nháp', value: articles.filter((a) => a.status === 'draft').length, color: 'var(--warning)' },
    { label: 'Ghim', value: articles.filter((a) => a.isPinned).length, color: 'var(--info)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Quản lý Tin tức</h1>
          <p className="section-subtitle">Tạo & quản lý bài viết, thông báo ({total} bài)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tạo bài viết
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="relative" style={{ maxWidth: '280px', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-input"
            placeholder="Tìm tiêu đề..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="form-select" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} style={{ width: '160px' }}>
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="form-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={{ width: '160px' }}>
          <option value="">Tất cả trạng thái</option>
          <option value="published">Xuất bản</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {error && (
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Bài viết</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Lượt xem</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((item) => {
                  const cat = catLabel(item.category);
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '10px',
                            background: item.thumbnail ? `url(${item.thumbnail}) center/cover` : 'var(--gray-100)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            border: '1px solid var(--gray-200)',
                          }}>
                            {!item.thumbnail && <Newspaper size={18} color="var(--gray-400)" />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {item.isPinned && <Pin size={12} color="var(--info)" />}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px', display: 'block' }}>
                                {item.title}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                              {item.summary}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: `${cat.color}15`, color: cat.color }}>
                          {cat.label}
                        </span>
                      </td>
                      <td>
                        {item.status === 'published'
                          ? <span className="badge badge-success">Xuất bản</span>
                          : <span className="badge badge-warning">Nháp</span>}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-1">
                          <Eye size={13} color="var(--gray-400)" /> {item.views?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{fmtDate(item.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            title={item.status === 'published' ? 'Chuyển nháp' : 'Xuất bản'}
                            disabled={actionId === item._id}
                            onClick={() => handleTogglePublish(item)}
                          >
                            {item.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} color="var(--success)" />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={item.isPinned ? 'Bỏ ghim' : 'Ghim'}
                            disabled={actionId === item._id}
                            onClick={() => handleTogglePin(item)}
                          >
                            {item.isPinned ? <PinOff size={13} color="var(--info)" /> : <Pin size={13} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={actionId === item._id} onClick={() => openEdit(item)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={actionId === item._id} onClick={() => handleDelete(item)}>
                            {actionId === item._id ? <Loader size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {articles.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Chưa có bài viết nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: '20px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: '800' }}>{editItem ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {formError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Tiêu đề *</label>
                <input className="form-input" placeholder="Tiêu đề bài viết" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              {/* Summary */}
              <div className="form-group">
                <label className="form-label">Tóm tắt *</label>
                <textarea className="form-input" rows={2} placeholder="Mô tả ngắn gọn..." value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} style={{ resize: 'vertical' }} />
              </div>

              {/* Content (rich text fallback: textarea) */}
              <div className="form-group">
                <label className="form-label">Nội dung *</label>
                <textarea
                  className="form-input"
                  rows={8}
                  placeholder="Nội dung chi tiết bài viết... (hỗ trợ HTML)"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              {/* Category + Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Nháp</option>
                    <option value="published">Xuất bản ngay</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="form-group">
                <label className="form-label">Ảnh bìa</label>
                <div className="flex items-center gap-3">
                  {thumbPreview && (
                    <div style={{ position: 'relative' }}>
                      <img src={thumbPreview} alt="thumb" style={{ width: '80px', height: '54px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
                      <button
                        onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: 'none', cursor: 'pointer' }}
                      >×</button>
                    </div>
                  )}
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    <Image size={14} /> Chọn ảnh
                    <input type="file" accept="image/*" hidden onChange={handleThumbChange} />
                  </label>
                </div>
              </div>

              {/* Pin toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <Pin size={14} /> Ghim bài viết lên đầu
              </label>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} {editItem ? 'Cập nhật' : 'Tạo bài viết'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
