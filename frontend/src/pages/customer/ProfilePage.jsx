import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, Edit2, Save,
  Ticket, MapPin, Clock, QrCode, X, CheckCircle,
  AlertCircle, Loader, ChevronRight, LogOut,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const statusCfg = {
  valid:     { label: 'Hợp lệ',   cls: 'badge-success' },
  used:      { label: 'Đã dùng',  cls: 'badge-gray' },
  cancelled: { label: 'Đã hủy',  cls: 'badge-danger' },
};

const tabs = [
  { id: 'profile', label: 'Hồ sơ', icon: User },
  { id: 'tickets', label: 'Vé của tôi', icon: Ticket },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [tab, setTab] = useState('profile');
  // Profile state
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', phone: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsFilter, setTicketsFilter] = useState('all');
  // QR modal
  const [qrTicket, setQrTicket] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authUser) { navigate('/login', { replace: true }); }
  }, [authUser, navigate]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
      setEditForm({ username: res.data.username || '', email: res.data.email || '', phone: res.data.phone || '' });
    } catch { navigate('/login', { replace: true }); }
  }, [navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Fetch tickets when tab changes
  useEffect(() => {
    if (tab !== 'tickets') return;
    setTicketsLoading(true);
    api.get('/tickets/my')
      .then(res => setTickets(res.data || []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, [tab]);

  const handleSaveProfile = async () => {
    setSaveError('');
    if (!editForm.username || !editForm.email) { setSaveError('Tên và email là bắt buộc.'); return; }
    setSaveLoading(true);
    try {
      const res = await api.put('/users/profile', editForm);
      setProfile(res.data?.user || { ...profile, ...editForm });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelTicket = async (bookingId) => {
    if (!confirm('Hủy vé này? Không thể hoàn tác.')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      setTickets(prev => prev.map(t => t.booking?._id === bookingId || t.bookingId === bookingId
        ? { ...t, status: 'cancelled' } : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy vé.');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const filteredTickets = tickets.filter(t => ticketsFilter === 'all' || t.status === ticketsFilter);

  if (!profile) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header Card */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-16px" style={{ gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '900', color: 'white', flexShrink: 0,
                border: '3px solid rgba(255,255,255,0.4)',
              }}>
                {(profile.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{profile.username}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>{profile.email}</div>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                  {profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--gray-500)',
                fontWeight: tab === t.id ? '700' : '500', fontSize: '14px',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s',
              }}>
                <Icon size={15} /> {t.label}
                {t.id === 'tickets' && tickets.length > 0 && (
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '10px', fontSize: '11px', padding: '1px 7px', fontWeight: '700' }}>
                    {tickets.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card" style={{ padding: '28px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '18px' }}>Thông tin cá nhân</h2>
              {!editMode && (
                <button className="btn btn-ghost" onClick={() => { setEditMode(true); setSaveSuccess(false); setSaveError(''); }}>
                  <Edit2 size={15} /> Chỉnh sửa
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--success-light)', color: 'var(--success)', marginBottom: '20px' }}>
                <CheckCircle size={16} /> Cập nhật thông tin thành công!
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', marginBottom: '20px' }}>
                <AlertCircle size={16} /> {saveError}
              </div>
            )}

            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                <div className="form-group">
                  <label className="form-label"><User size={13} /> Tên tài khoản *</label>
                  <input className="form-input" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={13} /> Email *</label>
                  <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={13} /> Số điện thoại</label>
                  <input className="form-input" type="tel" placeholder="0901234567" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="flex items-center gap-3">
                  <button className="btn btn-outline" onClick={() => { setEditMode(false); setSaveError(''); }}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saveLoading}>
                    {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { icon: User, label: 'Tên tài khoản', value: profile.username },
                  { icon: Mail, label: 'Email', value: profile.email },
                  { icon: Phone, label: 'Số điện thoại', value: profile.phone || '(Chưa cập nhật)' },
                  { icon: Shield, label: 'Vai trò', value: profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'staff' ? 'Nhân viên' : 'Khách hàng' },
                  { icon: Calendar, label: 'Ngày đăng ký', value: fmtDate(profile.createdAt) },
                  { icon: CheckCircle, label: 'Trạng thái', value: 'Hoạt động' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--gray-800)' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tickets Tab */}
        {tab === 'tickets' && (
          <div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { val: 'all', label: 'Tất cả', count: tickets.length },
                { val: 'valid', label: 'Hợp lệ', count: tickets.filter(t => t.status === 'valid').length },
                { val: 'used', label: 'Đã dùng', count: tickets.filter(t => t.status === 'used').length },
                { val: 'cancelled', label: 'Đã hủy', count: tickets.filter(t => t.status === 'cancelled').length },
              ].map(f => (
                <button key={f.val} onClick={() => setTicketsFilter(f.val)} style={{
                  padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px',
                  fontWeight: ticketsFilter === f.val ? '700' : '500',
                  background: ticketsFilter === f.val ? 'var(--primary)' : 'white',
                  color: ticketsFilter === f.val ? 'white' : 'var(--gray-600)',
                  boxShadow: ticketsFilter === f.val ? '0 2px 8px rgba(255,107,53,0.3)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                }}>
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {ticketsLoading ? (
              <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <Ticket size={48} color="var(--gray-300)" />
                  <div style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Không có vé nào</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Đặt vé ngay để bắt đầu hành trình của bạn!</div>
                  <button className="btn btn-primary" onClick={() => navigate('/search')}>
                    Tìm chuyến xe
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTickets.map(ticket => {
                  const st = statusCfg[ticket.status] || statusCfg.valid;
                  const trip = ticket.booking?.trip;
                  const fromCity = trip?.fromStation?.city;
                  const toCity = trip?.toStation?.city;
                  const bookingId = ticket.booking?._id || ticket.bookingId;
                  return (
                    <div key={ticket._id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                      {/* Ticket header bar */}
                      <div style={{
                        background: ticket.status === 'valid'
                          ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                          : ticket.status === 'used'
                            ? 'linear-gradient(135deg, #64748B 0%, #475569 100%)'
                            : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>
                          {ticket.code || ticket._id?.slice(-8).toUpperCase()}
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px' }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Ticket body */}
                      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
                        <div>
                          {/* Route */}
                          <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip?.departureTime)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{fromCity}</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, var(--primary), var(--primary-light))', borderRadius: '2px', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ChevronRight size={10} color="white" />
                                </div>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{fmtDate(trip?.departureTime)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--gray-900)' }}>{fmtTime(trip?.arrivalTime)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{toCity}</div>
                            </div>
                          </div>

                          {/* Details */}
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                              { icon: MapPin, val: `${trip?.fromStation?.name || fromCity} → ${trip?.toStation?.name || toCity}` },
                              { icon: Clock, val: trip?.bus?.name || 'Nhà xe' },
                              { icon: Ticket, val: `Ghế: ${ticket.seat?.seatNumber || ticket.booking?.seats?.map(s => s.seatNumber).join(', ') || '—'}` },
                            ].map(({ icon: Icon, val }) => (
                              <div key={val} className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                                <Icon size={12} color="var(--gray-400)" /> {val}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right side — price + actions */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <div>
                            <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>
                              {ticket.booking?.totalPrice?.toLocaleString()}đ
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{ticket.booking?.paymentMethod || 'online'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {ticket.qrCode && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setQrTicket(ticket)}>
                                <QrCode size={13} /> QR
                              </button>
                            )}
                            {ticket.status === 'valid' && bookingId && (
                              <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '12px' }}
                                onClick={() => handleCancelTicket(bookingId)}>
                                Hủy vé
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrTicket && (
        <div className="modal-overlay" onClick={() => setQrTicket(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '16px' }}>Mã QR vé</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQrTicket(null)}><X size={18} /></button>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', color: 'var(--primary)', fontSize: '16px', marginBottom: '16px' }}>
              {qrTicket.code || qrTicket._id?.slice(-8).toUpperCase()}
            </div>
            <img
              src={qrTicket.qrCode}
              alt="QR Code"
              style={{ width: '220px', height: '220px', borderRadius: '16px', border: '3px solid var(--gray-200)', margin: '0 auto 16px', display: 'block' }}
            />
            <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>
              {qrTicket.booking?.trip?.fromStation?.city} → {qrTicket.booking?.trip?.toStation?.city}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
              {fmtDate(qrTicket.booking?.trip?.departureTime)} · {fmtTime(qrTicket.booking?.trip?.departureTime)}
            </div>
            <button className="btn btn-outline w-full" style={{ marginTop: '20px', justifyContent: 'center' }} onClick={() => setQrTicket(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
