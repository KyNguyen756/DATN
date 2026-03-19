import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Zap, Copy } from 'lucide-react';

const promos = [
  { id: 1, code: 'DALATXUAN', type: 'percent', value: 20, routes: 'HCM → Đà Lạt', minPrice: 100000, uses: 45, maxUses: 100, expires: '30/03/2026', status: 'active' },
  { id: 2, code: 'VIPSALE', type: 'fixed', value: 50000, routes: 'Tất cả', minPrice: 150000, uses: 12, maxUses: 30, expires: '25/03/2026', status: 'active' },
  { id: 3, code: 'EARLY15', type: 'percent', value: 15, routes: 'HN → HCM', minPrice: 200000, uses: 78, maxUses: 200, expires: '31/03/2026', status: 'active' },
  { id: 4, code: 'TET2025', type: 'percent', value: 30, routes: 'Tất cả', minPrice: 0, uses: 500, maxUses: 500, expires: '10/02/2025', status: 'expired' },
];

const flashSales = [
  { id: 1, route: 'HCM → Đà Lạt', originalPrice: 150000, salePrice: 99000, remaining: 5, endTime: '23:59 25/03' },
  { id: 2, route: 'HCM → Vũng Tàu', originalPrice: 80000, salePrice: 55000, remaining: 2, endTime: '18:00 25/03' },
];

export default function PromotionsPage() {
  const [tab, setTab] = useState('promos');
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Khuyến mãi & Giá vé</h1>
          <p className="section-subtitle">Quản lý mã giảm giá, flash sale và giá động</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {tab === 'promos' ? 'Tạo mã giảm giá' : 'Thêm flash sale'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        {[{ id: 'promos', label: 'Mã giảm giá', icon: Tag }, { id: 'flash', label: 'Flash Sale', icon: Zap }].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 20px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? 'var(--gray-900)' : 'var(--gray-500)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'promos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Mã</th><th>Loại</th><th>Ưu đãi</th><th>Tuyến áp dụng</th><th>Lượt dùng</th><th>Hết hạn</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13px', color: 'var(--primary)', letterSpacing: '1px' }}>{p.code}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} title="Copy"><Copy size={11} /></button>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{p.type === 'percent' ? 'Phần trăm' : 'Số tiền'}</span></td>
                    <td style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '15px' }}>
                      {p.type === 'percent' ? `-${p.value}%` : `-${p.value.toLocaleString()}đ`}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{p.routes}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '50px', height: '5px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(p.uses / p.maxUses) * 100}%`, height: '100%', background: p.uses >= p.maxUses ? 'var(--danger)' : 'var(--success)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{p.uses}/{p.maxUses}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{p.expires}</td>
                    <td>
                      {p.status === 'active'
                        ? <span className="badge badge-success">Hoạt động</span>
                        : <span className="badge badge-gray">Hết hạn</span>
                      }
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'flash' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {flashSales.map(f => (
            <div key={f.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', padding: '16px 20px', color: 'white' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Zap size={16} fill="white" />
                  <span style={{ fontWeight: '800', fontSize: '14px' }}>FLASH SALE</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{f.route}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>{f.originalPrice.toLocaleString()}đ</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--danger)' }}>{f.salePrice.toLocaleString()}đ</div>
                  </div>
                  <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }}>
                    -{Math.round((1 - f.salePrice / f.originalPrice) * 100)}%
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: '700' }}>Còn {f.remaining} vé</span> · Kết thúc: {f.endTime}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm"><Edit2 size={13} /> Sửa</button>
                  <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><Trash2 size={13} /> Dừng</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{tab === 'promos' ? 'Tạo mã giảm giá' : 'Thêm Flash Sale'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tab === 'promos' ? (
                <>
                  <div className="form-group"><label className="form-label">Mã giảm giá</label><input className="form-input" placeholder="VD: SUMMER25" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Loại ưu đãi</label><select className="form-select"><option>Phần trăm (%)</option><option>Số tiền cố định</option></select></div>
                    <div className="form-group"><label className="form-label">Giá trị</label><input className="form-input" type="number" placeholder="20" /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Số lần dùng tối đa</label><input className="form-input" type="number" placeholder="100" /></div>
                    <div className="form-group"><label className="form-label">Ngày hết hạn</label><input className="form-input" type="date" /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group"><label className="form-label">Tuyến đường</label><select className="form-select"><option>HCM → Đà Lạt</option><option>HCM → Nha Trang</option></select></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Giá sale</label><input className="form-input" type="number" /></div>
                    <div className="form-group"><label className="form-label">Số vé</label><input className="form-input" type="number" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Thời gian kết thúc</label><input className="form-input" type="datetime-local" /></div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Tạo ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
