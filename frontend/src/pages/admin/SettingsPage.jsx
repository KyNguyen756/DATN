import { useState, useEffect } from 'react';
import { Save, Shield, CreditCard, Printer, Bell, RefreshCw, User, CheckCircle, AlertCircle, Loader, Lock } from 'lucide-react';
import api from '../../api/axios';

const sections = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: User, live: true },
  { id: 'security', label: 'Bảo mật', icon: Lock, live: true },
  { id: 'general', label: 'Cài đặt hệ thống', icon: RefreshCw, live: false },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard, live: false },
  { id: 'print', label: 'In vé', icon: Printer, live: false },
  { id: 'notify', label: 'Thông báo', icon: Bell, live: false },
  { id: 'rbac', label: 'Phân quyền', icon: Shield, live: false },
];

const ComingSoon = ({ title }) => (
  <div className="card" style={{ padding: '28px' }}>
    <h3 style={{ fontWeight: '800', marginBottom: '12px', fontSize: '16px' }}>{title}</h3>
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', gap: '12px', borderRadius: '12px',
      background: 'linear-gradient(135deg, var(--gray-50) 0%, white 100%)',
      border: '2px dashed var(--gray-200)',
    }}>
      <div style={{ fontSize: '32px' }}>🚧</div>
      <div style={{ fontWeight: '700', color: 'var(--gray-600)', fontSize: '15px' }}>Tính năng đang phát triển</div>
      <div style={{ fontSize: '13px', color: 'var(--gray-400)', textAlign: 'center', maxWidth: '320px' }}>
        Tính năng này sẽ được triển khai trong phiên bản tiếp theo.
      </div>
      <span className="badge badge-info" style={{ marginTop: '4px' }}>Sắp có</span>
    </div>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  // ── Profile section ───────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ username: '', email: '', phone: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMeta, setProfileMeta] = useState(null); // { role, createdAt }

  useEffect(() => {
    api.get('/users/profile')
      .then(res => {
        const u = res.data;
        // /users/profile returns the User document directly
        setProfileMeta({ role: u.role, createdAt: u.createdAt });
        setProfile({
          username: u.username || '',
          email: u.email || '',
          phone: u.phone || ''
        });
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!profile.username || !profile.email) {
      setProfileError('Tên tài khoản và email là bắt buộc.');
      return;
    }
    setProfileSaving(true);
    try {
      await api.put('/users/profile', profile);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Security section ──────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Mật khẩu mới không khớp.'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
    setPwSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Cài đặt hệ thống</h1>
          <p className="section-subtitle">Cấu hình tài khoản và hệ thống</p>
        </div>
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
                <span style={{ flex: 1 }}>{s.label}</span>
                {!s.live && (
                  <span style={{ fontSize: '10px', background: 'var(--info-light)', color: 'var(--info)', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>
                    Sắp có
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>

          {/* ── Profile section ── */}
          {activeSection === 'profile' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Thông tin cá nhân</h3>

              {loadingProfile ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <Loader size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                  {profileError && (
                    <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
                      <AlertCircle size={14} />{profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--success-light)', color: 'var(--success)', fontSize: '13px' }}>
                      <CheckCircle size={14} />Cập nhật hồ sơ thành công!
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Tên tài khoản *</label>
                    <input className="form-input" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-input" type="tel" placeholder="0901234567" value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                  </div>

                  {/* Read-only meta */}
                  {profileMeta && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', background: 'var(--gray-50)', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Vai trò</div>
                        <span className="badge badge-info" style={{ marginTop: '4px' }}>{profileMeta.role}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Ngày tạo</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                          {new Date(profileMeta.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: 'fit-content' }}
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Lưu hồ sơ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Security section ── */}
          {activeSection === 'security' && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '24px', fontSize: '16px' }}>Đổi mật khẩu</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                {pwError && (
                  <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px' }}>
                    <AlertCircle size={14} />{pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--success-light)', color: 'var(--success)', fontSize: '13px' }}>
                    <CheckCircle size={14} />Đổi mật khẩu thành công!
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Mật khẩu hiện tại *</label>
                  <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới *</label>
                  <input className="form-input" type="password" placeholder="Tối thiểu 6 ký tự" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới *</label>
                  <input className="form-input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: 'fit-content' }}
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                >
                  {pwSaving ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={15} />}
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}

          {activeSection === 'general'  && <ComingSoon title="Cài đặt hệ thống" />}
          {activeSection === 'payment'  && <ComingSoon title="Cấu hình thanh toán" />}
          {activeSection === 'print'    && <ComingSoon title="Cài đặt in vé" />}
          {activeSection === 'notify'   && <ComingSoon title="Cài đặt thông báo" />}
          {activeSection === 'rbac'     && <ComingSoon title="Phân quyền truy cập" />}
        </div>
      </div>
    </div>
  );
}
