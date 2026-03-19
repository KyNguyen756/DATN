import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Clock, Copy } from 'lucide-react';

const routes = [
  { id: 1, from: 'TP.HCM', to: 'Đà Lạt', distance: '300km', duration: '7h', trips: 8, active: true },
  { id: 2, from: 'TP.HCM', to: 'Nha Trang', distance: '450km', duration: '9h', trips: 6, active: true },
  { id: 3, from: 'Hà Nội', to: 'Đà Nẵng', distance: '760km', duration: '13h', trips: 4, active: true },
  { id: 4, from: 'TP.HCM', to: 'Vũng Tàu', distance: '120km', duration: '2h', trips: 15, active: true },
  { id: 5, from: 'Hà Nội', to: 'TP.HCM', distance: '1710km', duration: '36h', trips: 3, active: false },
];

const schedules = [
  { id: 1, route: 'HCM → Đà Lạt', company: 'Phương Trang', depart: '07:00', arrive: '14:00', date: '25/03/2026', seats: 44, booked: 32, status: 'active' },
  { id: 2, route: 'HCM → Nha Trang', company: 'Kumho Samco', depart: '09:00', arrive: '18:00', date: '25/03/2026', seats: 40, booked: 28, status: 'active' },
  { id: 3, route: 'HN → Đà Nẵng', company: 'Hoàng Long', depart: '22:00', arrive: '11:00', date: '25/03/2026', seats: 38, booked: 15, status: 'active' },
  { id: 4, route: 'HCM → Vũng Tàu', company: 'Mai Linh', depart: '06:00', arrive: '08:00', date: '25/03/2026', seats: 45, booked: 40, status: 'active' },
];

export default function RoutesPage() {
  const [tab, setTab] = useState('routes');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredRoutes = routes.filter(r =>
    r.from.toLowerCase().includes(search.toLowerCase()) ||
    r.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Tuyến đường & Lịch trình</h1>
          <p className="section-subtitle">Quản lý tuyến xe và các chuyến hàng ngày</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {tab === 'routes' ? 'Thêm tuyến' : 'Thêm lịch trình'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        {[{ id: 'routes', label: 'Tuyến đường' }, { id: 'schedules', label: 'Lịch trình' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 24px', borderRadius: '9px', fontWeight: '600', fontSize: '13px',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--gray-900)' : 'var(--gray-500)',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px', maxWidth: '360px', position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input className="form-input" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
      </div>

      {tab === 'routes' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tuyến đường</th>
                  <th>Khoảng cách</th>
                  <th>Thời gian</th>
                  <th>Số chuyến/ngày</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} color="var(--primary)" />
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>{r.from}</span>
                        <span style={{ color: 'var(--gray-400)' }}>→</span>
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>{r.to}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{r.distance}</td>
                    <td>
                      <div className="flex items-center gap-1" style={{ fontSize: '13px' }}>
                        <Clock size={13} color="var(--gray-400)" /> {r.duration}
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{r.trips} chuyến</td>
                    <td>
                      {r.active
                        ? <span className="badge badge-success">Hoạt động</span>
                        : <span className="badge badge-gray">Tạm dừng</span>
                      }
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
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

      {tab === 'schedules' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tuyến</th>
                  <th>Nhà xe</th>
                  <th>Giờ đi - đến</th>
                  <th>Ngày</th>
                  <th>Lấp đầy</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => {
                  const fill = Math.round((s.booked / s.seats) * 100);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700', fontSize: '13px' }}>{s.route}</td>
                      <td style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{s.company}</td>
                      <td style={{ fontSize: '13px' }}>{s.depart} → {s.arrive}</td>
                      <td style={{ fontSize: '13px' }}>{s.date}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${fill}%`, height: '100%', borderRadius: '3px', background: fill > 80 ? 'var(--danger)' : fill > 50 ? 'var(--warning)' : 'var(--success)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{s.booked}/{s.seats}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-ghost btn-sm" title="Copy lịch trình"><Copy size={13} /></button>
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

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>{tab === 'routes' ? 'Thêm tuyến mới' : 'Thêm lịch trình'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Điểm đi</label>
                  <input className="form-input" placeholder="TP.HCM" />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm đến</label>
                  <input className="form-input" placeholder="Đà Lạt" />
                </div>
              </div>
              {tab === 'schedules' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Giờ đi</label>
                      <input className="form-input" type="time" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ngày</label>
                      <input className="form-input" type="date" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhà xe</label>
                    <select className="form-select"><option>Phương Trang</option><option>Kumho Samco</option></select>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>
                <Plus size={15} /> Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
