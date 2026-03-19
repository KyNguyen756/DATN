import { useState } from 'react';
import { Save, Shield, CreditCard, Printer, Bell, RefreshCw } from 'lucide-react';

const sections = [
  { id: 'general', label: 'Cài đặt chung', icon: RefreshCw },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard },
  { id: 'print', label: 'In vé', icon: Printer },
  { id: 'notify', label: 'Thông báo', icon: Bell },
  { id: 'rbac', label: 'Phân quyền', icon: Shield },
];

const roles = [
  { name: 'Super Admin', perms: ['Tất cả quyền'], color: 'var(--danger)' },
  { name: 'Admin', perms: ['Quản lý vé', 'Quản lý tuyến', 'Báo cáo', 'Khuyến mãi'], color: 'var(--primary)' },
  { name: 'Staff', perms: ['Bán vé', 'Check-in', 'Giữ ghế'], color: '#3B82F6' },
  { name: 'Customer', perms: ['Đặt vé', 'Xem vé', 'Hủy vé'], color: '#22C55E' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Cài đặt hệ thống</h1>
          <p className="section-subtitle">Cấu hình hệ thống và phân quyền truy cập</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ background: saved ? 'var(--success)' : undefined }}>
          <Save size={16} /> {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: '8px', height: 'fit-content', position: 'sticky', top: '80px' }}>
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: activeSection === s.id ? 'var(--primary-bg)' : 'transparent',
                color: activeSection === s.id ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeSection === s.id ? '700' : '500', fontSize: '13px',
                textAlign: 'left', transition: 'all 0.2s', marginBottom: '2px',
              }}>
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {activeSection === 'general' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Thông tin hệ thống</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tên công ty / ứng dụng</label>
                  <input className="form-input" defaultValue="VéXeBus - Đặt vé xe trực tuyến" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email hỗ trợ</label>
                    <input className="form-input" defaultValue="hotro@vexebus.vn" type="email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hotline</label>
                    <input className="form-input" defaultValue="1900 1234" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Múi giờ</label>
                  <select className="form-select">
                    <option>Asia/Ho_Chi_Minh (UTC+7)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ văn phòng</label>
                  <textarea className="form-input" rows={2} defaultValue="123 Lê Lợi, Quận 1, TP.HCM" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Cấu hình thanh toán</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'VNPAY', desc: 'Thanh toán qua VNPAY Gateway' },
                  { label: 'MoMo', desc: 'Ví điện tử MoMo' },
                  { label: 'ZaloPay', desc: 'Ví ZaloPay' },
                  { label: 'Thẻ tín dụng', desc: 'Visa/Mastercard qua Stripe' },
                  { label: 'COD tại xe', desc: 'Thanh toán tiền mặt tại xe' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{m.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{m.desc}</div>
                    </div>
                    <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{
                        position: 'absolute', inset: 0, background: 'var(--primary)', borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{
                          position: 'absolute', left: '20px', top: '2px', width: '20px', height: '20px',
                          background: 'white', borderRadius: '50%', transition: 'left 0.2s',
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'print' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Cài đặt in vé</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Loại máy in</label>
                  <select className="form-select">
                    <option>Thermal Printer - 80mm</option>
                    <option>Thermal Printer - 58mm</option>
                    <option>Laser Printer A4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nội dung footer vé</label>
                  <textarea className="form-input" rows={3} defaultValue="Cảm ơn quý khách đã sử dụng dịch vụ VéXeBus!&#10;Hotline: 1900 1234" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                  <input type="checkbox" defaultChecked id="printLogo" style={{ accentColor: 'var(--primary)' }} />
                  <label htmlFor="printLogo" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>In logo công ty lên vé</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                  <input type="checkbox" defaultChecked id="printQR" style={{ accentColor: 'var(--primary)' }} />
                  <label htmlFor="printQR" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>In mã QR lên vé giấy</label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notify' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Cài đặt thông báo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Xác nhận đặt vé qua email',
                  'Nhắc nhở trước chuyến xe 24 giờ',
                  'Nhắc nhở trước chuyến xe 2 giờ',
                  'Thông báo hủy vé / hoàn tiền',
                  'Thông báo khuyến mãi mới',
                  'Thông báo push (Web Push)',
                  'SMS xác nhận đặt vé',
                ].map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{n}</span>
                    <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ display: 'none' }} />
                      <span style={{ position: 'absolute', inset: 0, background: 'var(--primary)', borderRadius: '12px' }}>
                        <span style={{ position: 'absolute', left: '20px', top: '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%' }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'rbac' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Phân quyền truy cập (RBAC)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roles.map(role => (
                  <div key={role.name} style={{ padding: '20px', border: `2px solid ${role.color}30`, borderRadius: '12px', background: role.color + '06' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                      <Shield size={16} color={role.color} />
                      <span style={{ fontWeight: '800', fontSize: '15px', color: role.color }}>{role.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {role.perms.map(p => (
                        <span key={p} className="tag" style={{ background: role.color + '18', color: role.color, fontWeight: '600' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
