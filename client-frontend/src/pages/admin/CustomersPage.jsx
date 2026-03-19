import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, UserX } from 'lucide-react';

const customers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'vana@gmail.com', phone: '0901234567', role: 'vip', tickets: 24, spent: 4200000, joinDate: '10/01/2024', status: 'active' },
  { id: 2, name: 'Trần Thị B', email: 'tranb@gmail.com', phone: '0912345678', role: 'normal', tickets: 8, spent: 960000, joinDate: '05/03/2024', status: 'active' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@gmail.com', phone: '0923456789', role: 'staff', tickets: 0, spent: 0, joinDate: '01/01/2025', status: 'active' },
  { id: 4, name: 'Phạm Thị D', email: 'phamd@gmail.com', phone: '0934567890', role: 'blacklist', tickets: 3, spent: 450000, joinDate: '20/06/2023', status: 'blocked' },
  { id: 5, name: 'Hoàng Văn E', email: 'hoange@gmail.com', phone: '0945678901', role: 'normal', tickets: 15, spent: 1800000, joinDate: '12/07/2024', status: 'active' },
];

const roleConfig = {
  vip: { label: 'VIP', cls: 'badge-warning' },
  normal: { label: 'Thường', cls: 'badge-gray' },
  staff: { label: 'Nhân viên', cls: 'badge-info' },
  blacklist: { label: 'Blacklist', cls: 'badge-danger' },
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = customers
    .filter(c => roleFilter === 'all' || c.role === roleFilter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Khách hàng & Nhân viên</h1>
          <p className="section-subtitle">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Thêm tài khoản
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng tài khoản', value: customers.length, color: 'var(--primary)' },
          { label: 'Khách VIP', value: customers.filter(c => c.role === 'vip').length, color: 'var(--warning)' },
          { label: 'Nhân viên', value: customers.filter(c => c.role === 'staff').length, color: 'var(--info)' },
          { label: 'Blacklist', value: customers.filter(c => c.role === 'blacklist').length, color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input className="form-input" placeholder="Tên, SĐT..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'vip', 'normal', 'staff', 'blacklist'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: '7px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '12px',
              border: `2px solid ${roleFilter === r ? 'var(--primary)' : 'var(--gray-200)'}`,
              background: roleFilter === r ? 'var(--primary-bg)' : 'white',
              color: roleFilter === r ? 'var(--primary)' : 'var(--gray-600)',
              cursor: 'pointer',
            }}>
              {r === 'all' ? 'Tất cả' : roleConfig[r]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Khách hàng</th><th>Liên hệ</th><th>Phân quyền</th><th>Số vé</th><th>Tổng chi</th><th>Ngày tham gia</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const rc = roleConfig[c.role];
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '13px', flexShrink: 0 }}>
                          {c.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: c.status === 'blocked' ? 'var(--danger)' : 'var(--gray-400)' }}>
                            {c.status === 'blocked' ? '⛔ Đã khóa' : 'Đang hoạt động'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{c.phone}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{c.email}</div>
                    </td>
                    <td><span className={`badge ${rc.cls}`}>{rc.label}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{c.tickets}</td>
                    <td style={{ fontSize: '13px', fontWeight: '600' }}>{c.spent.toLocaleString()}đ</td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{c.joinDate}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm" title="Đổi quyền"><Shield size={13} /></button>
                        <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Blacklist"><UserX size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>Thêm tài khoản mới</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Họ và tên</label><input className="form-input" placeholder="Nguyễn Văn A" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Số điện thoại</label><input className="form-input" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" /></div>
              </div>
              <div className="form-group"><label className="form-label">Phân quyền</label>
                <select className="form-select"><option>Khách hàng thường</option><option>Khách VIP</option><option>Nhân viên</option></select>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
