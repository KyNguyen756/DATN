import { useState } from 'react';
import { Clock, X, User, Bus, AlertCircle } from 'lucide-react';

const heldSeats = [
  { id: 1, seat: 'A1', customer: 'Nguyễn Văn A', phone: '0901234567', route: 'TP.HCM → Đà Lạt', depart: '07:00', expiresIn: 18, trip: 'Phương Trang - 25/03' },
  { id: 2, seat: 'B3', customer: 'Trần Thị B', phone: '0912345678', route: 'TP.HCM → Nha Trang', depart: '09:00', expiresIn: 7, trip: 'Kumho Samco - 25/03' },
  { id: 3, seat: 'C2', customer: 'Lê Văn C', phone: '0923456789', route: 'Hà Nội → Đà Nẵng', depart: '22:00', expiresIn: 2, trip: 'Hoàng Long - 25/03' },
];

export default function HoldSeatPage() {
  const [seats, setSeats] = useState(heldSeats);
  const [showAddModal, setShowAddModal] = useState(false);

  const release = (id) => setSeats(prev => prev.filter(s => s.id !== id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Quản lý giữ ghế</h1>
          <p className="section-subtitle">Theo dõi các ghế đang được giữ chờ thanh toán</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Clock size={16} /> Giữ ghế mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Đang giữ', value: seats.length, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'Sắp hết hạn (< 5 phút)', value: seats.filter(s => s.expiresIn < 5).length, color: 'var(--danger)', bg: 'var(--danger-light)' },
          { label: 'Còn thời gian', value: seats.filter(s => s.expiresIn >= 5).length, color: 'var(--success)', bg: 'var(--success-light)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px' }}>Danh sách ghế đang giữ</h3>
        </div>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Ghế</th>
                <th>Khách hàng</th>
                <th>Chuyến xe</th>
                <th>Tuyến đường</th>
                <th>Thời gian còn lại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {seats.map(seat => (
                <tr key={seat.id}>
                  <td>
                    <span style={{
                      background: 'var(--primary-bg)', color: 'var(--primary)',
                      padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace',
                    }}>{seat.seat}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{seat.customer}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{seat.phone}</div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{seat.trip}</td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{seat.route}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Khởi hành: {seat.depart}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '60px', height: '6px', borderRadius: '3px', background: 'var(--gray-200)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${(seat.expiresIn / 30) * 100}%`, height: '100%',
                          borderRadius: '3px',
                          background: seat.expiresIn < 5 ? 'var(--danger)' : seat.expiresIn < 10 ? 'var(--warning)' : 'var(--success)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{
                        fontWeight: '700', fontSize: '13px',
                        color: seat.expiresIn < 5 ? 'var(--danger)' : seat.expiresIn < 10 ? 'var(--warning)' : 'var(--success)',
                      }}>
                        {seat.expiresIn} phút
                      </span>
                      {seat.expiresIn < 5 && <AlertCircle size={14} color="var(--danger)" />}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-primary btn-sm">Xác nhận</button>
                      <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }} onClick={() => release(seat.id)}>
                        <X size={13} /> Huỷ giữ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {seats.length === 0 && (
            <div className="empty-state">
              <Clock size={40} color="var(--gray-300)" />
              <div>Không có ghế nào đang được giữ</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Hold Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>Giữ ghế mới</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Tuyến xe</label>
                <select className="form-select">
                  <option>TP.HCM → Đà Lạt - 07:00 - 25/03</option>
                  <option>TP.HCM → Nha Trang - 09:00 - 25/03</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Số ghế</label>
                <input className="form-input" placeholder="VD: A1, B2" />
              </div>
              <div className="form-group">
                <label className="form-label">Tên khách hàng</label>
                <input className="form-input" placeholder="Nguyễn Văn A" />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" placeholder="0901234567" />
              </div>
              <div className="form-group">
                <label className="form-label">Thời gian giữ</label>
                <select className="form-select">
                  <option value="15">15 phút</option>
                  <option value="30">30 phút</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
                <Clock size={15} /> Xác nhận giữ ghế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
