import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tag, Copy, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const emptyForm = { code: '', discountType: 'percent', discountValue: '', minOrderValue: '', maxUses: '', expiresAt: '' };

export default function PromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/promotions');
      setPromos(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khuyến mãi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const openAdd = () => { setEditPromo(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditPromo(p);
    setForm({
      code: p.code,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderValue: p.minOrderValue || '',
      maxUses: p.maxUses || '',
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.code || !form.discountValue) { setFormError('Mã giảm giá và giá trị là bắt buộc.'); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: +form.discountValue,
        minOrderValue: form.minOrderValue ? +form.minOrderValue : undefined,
        maxUses: form.maxUses ? +form.maxUses : undefined,
        expiresAt: form.expiresAt || undefined,
      };
      if (editPromo) {
        await api.put(`/promotions/${editPromo._id}`, payload);
      } else {
        await api.post('/promotions', payload);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    if (!confirm(`Xóa mã khuyến mãi ${promo.code}?`)) return;
    setActionId(promo._id);
    try {
      await api.delete(`/promotions/${promo._id}`);
      setPromos(prev => prev.filter(p => p._id !== promo._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    } finally {
      setActionId(null);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (p) => p.expiresAt && new Date(p.expiresAt) < new Date();
  const isMaxed = (p) => p.maxUses && p.usedCount >= p.maxUses;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Khuyến mãi & Mã giảm giá</h1>
          <p className="section-subtitle">Quản lý mã giảm giá ({promos.length} mã)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Tạo mã giảm giá
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng mã', value: promos.length, color: 'var(--primary)' },
          { label: 'Đang hoạt động', value: promos.filter(p => !isExpired(p) && !isMaxed(p)).length, color: 'var(--success)' },
          { label: 'Đã hết / hết hạn', value: promos.filter(p => isExpired(p) || isMaxed(p)).length, color: 'var(--gray-500)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontSize: '13px' }}>
            <AlertCircle size={16} />{error}
          </div>
        </div>
      )}

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
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Ưu đãi</th>
                  <th>Đơn tối thiểu</th>
                  <th>Lượt dùng</th>
                  <th>Hết hạn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => {
                  const expired = isExpired(p);
                  const maxed = isMaxed(p);
                  const active = !expired && !maxed;
                  const isActing = actionId === p._id;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Tag size={13} color="var(--primary)" />
                          <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13px', color: 'var(--primary)', letterSpacing: '1px' }}>{p.code}</span>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', color: copied === p.code ? 'var(--success)' : 'var(--gray-400)' }}
                            onClick={() => handleCopy(p.code)}
                          >
                            {copied === p.code ? <CheckCircle size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{p.discountType === 'percent' ? 'Phần trăm' : 'Số tiền'}</span></td>
                      <td style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '15px' }}>
                        {p.discountType === 'percent' ? `-${p.discountValue}%` : `-${p.discountValue.toLocaleString()}đ`}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        {p.minOrderValue ? p.minOrderValue.toLocaleString() + 'đ' : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {p.maxUses ? (
                            <>
                              <div style={{ width: '50px', height: '5px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(((p.usedCount || 0) / p.maxUses) * 100, 100)}%`, height: '100%', background: maxed ? 'var(--danger)' : 'var(--success)', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{p.usedCount || 0}/{p.maxUses}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{p.usedCount || 0} / ∞</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: expired ? 'var(--danger)' : 'var(--gray-500)' }}>
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('vi-VN') : 'Không hạn'}
                      </td>
                      <td>
                        {active
                          ? <span className="badge badge-success">Hoạt động</span>
                          : expired
                            ? <span className="badge badge-gray">Hết hạn</span>
                            : <span className="badge badge-danger">Hết lượt</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn btn-ghost btn-sm" disabled={isActing} onClick={() => openEdit(p)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={isActing} onClick={() => handleDelete(p)}>
                            {isActing ? <Loader size={13} /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {promos.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>Chưa có mã giảm giá nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{editPromo ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h3>

            {formError && (
              <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Mã giảm giá *</label>
                <input className="form-input" placeholder="VD: SUMMER25" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} style={{ fontFamily: 'monospace', letterSpacing: '2px', fontWeight: '700' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Loại ưu đãi</label>
                  <select className="form-select" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá trị *</label>
                  <input className="form-input" type="number" placeholder={form.discountType === 'percent' ? '20' : '50000'} value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Đơn tối thiểu (đ)</label>
                  <input className="form-input" type="number" placeholder="100000" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số lần dùng tối đa</label>
                  <input className="form-input" type="number" placeholder="100 (bỏ trống = không giới hạn)" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ngày hết hạn (để trống = không hạn)</label>
                <input className="form-input" type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} {editPromo ? 'Cập nhật' : 'Tạo mã'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
