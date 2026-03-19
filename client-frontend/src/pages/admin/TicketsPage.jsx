import { useState } from 'react';
import { Search, Download, X, Eye, Filter } from 'lucide-react';

const tickets = [
  { id: 'VXB-0001', customer: 'Nguyễn Văn A', phone: '0901234567', route: 'HCM → Đà Lạt', depart: '07:00 25/03', seat: 'A1', amount: 150000, status: 'confirmed', payMethod: 'VNPAY' },
  { id: 'VXB-0002', customer: 'Trần Thị B', phone: '0912345678', route: 'HCM → Nha Trang', depart: '09:00 25/03', seat: 'B3', amount: 200000, status: 'pending', payMethod: 'MoMo' },
  { id: 'VXB-0003', customer: 'Lê Văn C', phone: '0923456789', route: 'HN → Đà Nẵng', depart: '22:00 25/03', seat: 'C2', amount: 250000, status: 'confirmed', payMethod: 'Thẻ tín dụng' },
  { id: 'VXB-0004', customer: 'Phạm Thị D', phone: '0934567890', route: 'HCM → Vũng Tàu', depart: '06:00 25/03', seat: 'D4', amount: 80000, status: 'cancelled', payMethod: 'VNPAY' },
  { id: 'VXB-0005', customer: 'Hoàng Văn E', phone: '0945678901', route: 'HCM → Đà Lạt', depart: '07:00 26/03', seat: 'E1', amount: 150000, status: 'used', payMethod: 'ZaloPay' },
  { id: 'VXB-0006', customer: 'Vũ Thị F', phone: '0956789012', route: 'HCM → Đà Lạt', depart: '09:30 26/03', seat: 'F3', amount: 130000, status: 'confirmed', payMethod: 'MoMo' },
];

const statusConfig = {
  confirmed: { label: 'Xác nhận', cls: 'badge-success' },
  pending: { label: 'Chờ xử lý', cls: 'badge-warning' },
  cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
  used: { label: 'Đã dùng', cls: 'badge-gray' },
};

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetail, setShowDetail] = useState(null);

  const filtered = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => t.id.includes(search) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.route.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = filtered.filter(t => t.status !== 'cancelled').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Vé & Đặt chỗ</h1>
          <p className="section-subtitle">Quản lý toàn bộ vé và đơn đặt chỗ</p>
        </div>
        <button className="btn btn-primary">
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tổng vé', value: tickets.length, color: 'var(--primary)', bg: 'var(--primary-bg)' },
          { label: 'Xác nhận', value: tickets.filter(t => t.status === 'confirmed').length, color: 'var(--success)', bg: 'var(--success-light)' },
          { label: 'Chờ xử lý', value: tickets.filter(t => t.status === 'pending').length, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'Doanh thu lọc', value: (totalRevenue / 1000).toFixed(0) + 'k', color: 'var(--info)', bg: 'var(--info-light)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: s.bg, fontWeight: '800', fontSize: '18px', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-3" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input className="form-input" placeholder="Tìm mã vé, tên khách..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'confirmed', 'pending', 'cancelled', 'used'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '7px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '12px',
              border: `2px solid ${filterStatus === s ? 'var(--primary)' : 'var(--gray-200)'}`,
              background: filterStatus === s ? 'var(--primary-bg)' : 'white',
              color: filterStatus === s ? 'var(--primary)' : 'var(--gray-600)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {s === 'all' ? 'Tất cả' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Mã vé</th><th>Khách hàng</th><th>Tuyến & Giờ</th><th>Ghế</th><th>Tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const st = statusConfig[t.status];
                return (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{t.id}</td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.customer}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{t.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{t.route}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{t.depart}</div>
                    </td>
                    <td><span style={{ background: 'var(--gray-100)', padding: '3px 8px', borderRadius: '5px', fontWeight: '700', fontFamily: 'monospace', fontSize: '12px' }}>{t.seat}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{t.amount.toLocaleString()}đ</td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{t.payMethod}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(t)}><Eye size={13} /></button>
                        {t.status !== 'cancelled' && t.status !== 'used' && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Hủy vé"><X size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">Không tìm thấy vé nào phù hợp</div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: '800', marginBottom: '20px' }}>Chi tiết vé - {showDetail.id}</h3>
            {[
              ['Khách hàng', showDetail.customer],
              ['Số điện thoại', showDetail.phone],
              ['Tuyến đường', showDetail.route],
              ['Giờ khởi hành', showDetail.depart],
              ['Ghế', showDetail.seat],
              ['Phương thức thanh toán', showDetail.payMethod],
              ['Số tiền', showDetail.amount.toLocaleString() + 'đ'],
              ['Trạng thái', statusConfig[showDetail.status]?.label],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: '700' }}>{v}</span>
              </div>
            ))}
            <div className="flex items-center gap-3" style={{ marginTop: '20px' }}>
              {showDetail.status !== 'cancelled' && showDetail.status !== 'used' && (
                <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }}>Hủy vé</button>
              )}
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
