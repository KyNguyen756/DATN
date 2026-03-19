import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Car, User, Settings } from 'lucide-react';

const vehicles = [
  { id: 1, plate: '51B-12345', type: 'Limousine', seats: 22, driver: 'Nguyễn Văn Bình', status: 'active', nextMaint: '01/04/2026' },
  { id: 2, plate: '51B-23456', type: 'Giường nằm', seats: 40, driver: 'Trần Văn Dũng', status: 'active', nextMaint: '15/04/2026' },
  { id: 3, plate: '30A-34567', type: 'Ghế ngồi', seats: 45, driver: 'Lê Thị Hoa', status: 'maintenance', nextMaint: '22/03/2026' },
  { id: 4, plate: '51B-45678', type: 'VIP Sleeper', seats: 18, driver: 'Phạm Văn An', status: 'active', nextMaint: '10/05/2026' },
  { id: 5, plate: '30A-56789', type: 'Limousine', seats: 22, driver: 'Hoàng Thị Mai', status: 'inactive', nextMaint: '20/03/2026' },
];

const drivers = [
  { id: 1, name: 'Nguyễn Văn Bình', phone: '0901111111', license: 'A2', exp: '8 năm', trips: 142, rating: 4.9, status: 'on-duty' },
  { id: 2, name: 'Trần Văn Dũng', phone: '0912222222', license: 'B2', exp: '5 năm', trips: 98, rating: 4.7, status: 'off-duty' },
  { id: 3, name: 'Lê Thị Hoa', phone: '0923333333', license: 'B2', exp: '3 năm', trips: 67, rating: 4.6, status: 'on-leave' },
  { id: 4, name: 'Phạm Văn An', phone: '0934444444', license: 'A2', exp: '10 năm', trips: 201, rating: 4.8, status: 'on-duty' },
];

const statusVehicle = {
  active: { label: 'Hoạt động', cls: 'badge-success' },
  maintenance: { label: 'Bảo dưỡng', cls: 'badge-warning' },
  inactive: { label: 'Ngưng hoạt động', cls: 'badge-danger' },
};

const statusDriver = {
  'on-duty': { label: 'Đang làm việc', cls: 'badge-success' },
  'off-duty': { label: 'Nghỉ ngơi', cls: 'badge-gray' },
  'on-leave': { label: 'Nghỉ phép', cls: 'badge-warning' },
};

export default function VehiclesPage() {
  const [tab, setTab] = useState('vehicles');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Xe & Tài xế</h1>
          <p className="section-subtitle">Quản lý đội xe và phân công tài xế</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {tab === 'vehicles' ? 'Thêm xe' : 'Thêm tài xế'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        {[{ id: 'vehicles', label: 'Đội xe', icon: Car }, { id: 'drivers', label: 'Tài xế', icon: User }].map(t => {
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

      {/* Search */}
      <div style={{ marginBottom: '16px', maxWidth: '360px', position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input className="form-input" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
      </div>

      {tab === 'vehicles' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Biển số</th><th>Loại xe</th><th>Số ghế</th><th>Tài xế</th><th>Bảo dưỡng tiếp</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {vehicles.filter(v => v.plate.includes(search) || v.driver.toLowerCase().includes(search.toLowerCase())).map(v => {
                  const st = statusVehicle[v.status];
                  return (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{v.plate}</td>
                      <td style={{ fontSize: '13px' }}>{v.type}</td>
                      <td style={{ fontSize: '13px' }}>{v.seats} ghế</td>
                      <td style={{ fontSize: '13px', fontWeight: '600' }}>{v.driver}</td>
                      <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{v.nextMaint}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-ghost btn-sm"><Settings size={13} /></button>
                          <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'drivers' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Tài xế</th><th>Bằng lái</th><th>Kinh nghiệm</th><th>Chuyến đã đi</th><th>Đánh giá</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => {
                  const st = statusDriver[d.status];
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{d.phone}</div>
                      </td>
                      <td><span className="badge badge-primary">{d.license}</span></td>
                      <td style={{ fontSize: '13px' }}>{d.exp}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{d.trips}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#F59E0B' }}>★</span>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{d.rating}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>
              {tab === 'vehicles' ? 'Thêm xe mới' : 'Thêm tài xế mới'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tab === 'vehicles' ? (
                <>
                  <div className="form-group"><label className="form-label">Biển số xe</label><input className="form-input" placeholder="51B-XXXXX" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Loại xe</label><select className="form-select"><option>Limousine</option><option>Giường nằm</option><option>Ghế ngồi</option></select></div>
                    <div className="form-group"><label className="form-label">Số ghế</label><input className="form-input" type="number" placeholder="40" /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group"><label className="form-label">Họ và tên</label><input className="form-input" placeholder="Nguyễn Văn A" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group"><label className="form-label">Số điện thoại</label><input className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Loại bằng</label><select className="form-select"><option>A2</option><option>B2</option></select></div>
                  </div>
                </>
              )}
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
