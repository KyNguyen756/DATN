import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Shield, Edit2, Save, MapPin,
  Ticket, Clock, QrCode, X, CheckCircle, AlertCircle,
  Loader, ChevronRight, LogOut, Bus, Hash,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';
const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  : '—';

const ticketStatusCfg = {
  valid:     { label: 'Hợp lệ',   cls: 'badge-success', barColor: 'linear-gradient(135deg,#22C55E,#16A34A)' },
  used:      { label: 'Đã dùng',  cls: 'badge-gray',    barColor: 'linear-gradient(135deg,#64748B,#475569)' },
  cancelled: { label: 'Đã hủy',  cls: 'badge-danger',  barColor: 'linear-gradient(135deg,#EF4444,#DC2626)' },
};

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: User },
  { id: 'tickets', label: 'Vé của tôi', icon: Ticket },
];

/** Parse deep-populated ticket from /tickets/my */
function extractTicketInfo(ticket) {
  // ticketController returns: ticket.trip (populated), ticket.seat (TripSeat, populated with .seat sub-doc)
  const trip    = ticket.trip;
  const tripSeat = ticket.seat;           // TripSeat document
  const seat    = tripSeat?.seat;         // actual Seat document (seatNumber, type)
  const booking = ticket.booking;

  return {
    id: ticket._id,
    code: ticket.code || ticket._id?.slice(-8).toUpperCase(),
    status: ticket.status,
    qrCode: ticket.qrCode,
    // Route
    fromCity: trip?.fromStation?.city || '—',
    fromStation: trip?.fromStation?.name || '',
    toCity: trip?.toStation?.city || '—',
    toStation: trip?.toStation?.name || '',
    // Times
    departureTime: trip?.departureTime,
    arrivalTime: trip?.arrivalTime,
    // Bus
    busName: trip?.bus?.name || '—',
    busType: trip?.bus?.type || '',
    // Seat
    seatNumber: seat?.seatNumber || tripSeat?.seat?.seatNumber || '—',
    seatType: seat?.type || 'normal',
    // Booking
    bookingId: booking?._id,
    finalPrice: booking?.finalPrice ?? booking?.totalPrice ?? 0,
    totalPrice: booking?.totalPrice ?? 0,
    discountAmount: booking?.discountAmount ?? 0,
    paymentMethod: booking?.paymentMethod || '',
    promoCode: booking?.promotionId?.code || null,
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '', email: '', phone: '',
    firstName: '', lastName: '', dateOfBirth: '', address: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsFilter, setTicketsFilter] = useState('all');
  const [qrTicket, setQrTicket] = useState(null); // parsed ticket info

  // Redirect if not logged in
  useEffect(() => {
    if (!authUser) { navigate('/login', { replace: true }); }
  }, [authUser, navigate]);

  // Fetch profile (returns flat unified object from updated userController)
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      const p = res.data;
      setProfile(p);
      setEditForm({
        username: p.username || '',
        email: p.email || '',
        phone: p.phone || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        address: p.address || '',
      });
    } catch { navigate('/login', { replace: true }); }
  }, [navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Fetch tickets
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
    if (!editForm.username || !editForm.email) {
      setSaveError('Tên tài khoản và email là bắt buộc.');
      return;
    }
    setSaveLoading(true);
    try {
      await api.put('/users/profile', editForm);
      setProfile(prev => ({ ...prev, ...editForm }));
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelTicket = async (bookingId) => {
    if (!bookingId || !confirm('Hủy vé này? Không thể hoàn tác.')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      setTickets(prev => prev.map(t => {
        const info = extractTicketInfo(t);
        return info.bookingId === bookingId ? { ...t, status: 'cancelled' } : t;
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy vé.');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const parsedTickets = tickets.map(extractTicketInfo);
  const filteredTickets = ticketsFilter === 'all'
    ? parsedTickets
    : parsedTickets.filter(t => t.status === ticketsFilter);

  if (!profile) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username;
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>

        {/* ── Hero card ── */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '60px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div className="flex items-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center" style={{ gap: '20px' }}>
              {/* Avatar */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: '900', color: 'white',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}>
                {avatarLetter}
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
                  {profile.email}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px' }}>
                    {profile.role === 'admin' ? '👑 Quản trị viên' : profile.role === 'staff' ? '🔧 Nhân viên' : '👤 Khách hàng'}
                  </span>
                  {profile.phone && (
                    <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', padding: '3px 12px', borderRadius: '20px' }}>
                      📞 {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
          {TABS.map(t => {
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

        {/* ── Profile Tab ── */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label"><User size={12} /> Họ</label>
                    <input className="form-input" placeholder="Nguyễn" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><User size={12} /> Tên</label>
                    <input className="form-input" placeholder="Văn A" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label"><User size={12} /> Tên tài khoản *</label>
                  <input className="form-input" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={12} /> Email *</label>
                  <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label"><Phone size={12} /> Điện thoại</label>
                    <input className="form-input" type="tel" placeholder="0901234567" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Calendar size={12} /> Ngày sinh</label>
                    <input className="form-input" type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label"><MapPin size={12} /> Địa chỉ</label>
                  <input className="form-input" placeholder="123 Đường ABC, Quận 1, TP.HCM" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div className="flex items-center gap-3" style={{ marginTop: '8px' }}>
                  <button className="btn btn-outline" onClick={() => { setEditMode(false); setSaveError(''); }}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saveLoading}>
                    {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { icon: User,     label: 'Họ và tên',         value: displayName },
                  { icon: User,     label: 'Tên tài khoản',     value: profile.username },
                  { icon: Mail,     label: 'Email',              value: profile.email },
                  { icon: Phone,    label: 'Điện thoại',        value: profile.phone || '(Chưa cập nhật)' },
                  { icon: Calendar, label: 'Ngày sinh',          value: profile.dateOfBirth ? fmtDate(profile.dateOfBirth) : '(Chưa cập nhật)' },
                  { icon: MapPin,   label: 'Địa chỉ',           value: profile.address || '(Chưa cập nhật)' },
                  { icon: Shield,   label: 'Vai trò',            value: profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'staff' ? 'Nhân viên' : 'Khách hàng' },
                  { icon: Calendar, label: 'Ngày đăng ký',       value: fmtDate(profile.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--gray-800)', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tickets Tab ── */}
        {tab === 'tickets' && (
          <div>
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { val: 'all', label: 'Tất cả', count: parsedTickets.length },
                { val: 'valid', label: 'Hợp lệ', count: parsedTickets.filter(t => t.status === 'valid').length },
                { val: 'used', label: 'Đã dùng', count: parsedTickets.filter(t => t.status === 'used').length },
                { val: 'cancelled', label: 'Đã hủy', count: parsedTickets.filter(t => t.status === 'cancelled').length },
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
                <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto' }} />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <Ticket size={48} color="var(--gray-300)" />
                  <div style={{ fontWeight: '600', color: 'var(--gray-500)' }}>Không có vé nào</div>
                  <button className="btn btn-primary" onClick={() => navigate('/search')}>Tìm chuyến xe</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTickets.map(info => {
                  const st = ticketStatusCfg[info.status] || ticketStatusCfg.valid;
                  return (
                    <div key={info.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                      {/* Color bar */}
                      <div style={{ background: st.barColor, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>
                          {info.code}
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px' }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
                        <div>
                          {/* Route timeline */}
                          <div className="flex items-center gap-3" style={{ marginBottom: '14px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{fmtTime(info.departureTime)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>{info.fromCity}</div>
                              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{info.fromStation}</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, var(--primary), rgba(255,107,53,0.3))', borderRadius: '2px', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ChevronRight size={9} color="white" />
                                </div>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{fmtDate(info.departureTime)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{fmtTime(info.arrivalTime)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>{info.toCity}</div>
                              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{info.toStation}</div>
                            </div>
                          </div>

                          {/* Info row */}
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                              <Bus size={12} color="var(--gray-400)" />
                              {info.busName} · {info.busType === 'limousine' ? 'Limousine' : info.busType === 'sleeper' ? 'Giường nằm' : 'Ghế ngồi'}
                            </div>
                            <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                              <Hash size={12} color="var(--gray-400)" />
                              Ghế {info.seatNumber}
                              {info.seatType === 'vip' && <span style={{ color: '#F59E0B', fontWeight: '700', marginLeft: '3px' }}>VIP</span>}
                            </div>
                            <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                              <Clock size={12} color="var(--gray-400)" />
                              {info.paymentMethod}
                            </div>
                          </div>
                        </div>

                        {/* Right: price + actions */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <div>
                            {info.discountAmount > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--gray-400)', textDecoration: 'line-through', marginBottom: '2px' }}>
                                {info.totalPrice.toLocaleString()}đ
                              </div>
                            )}
                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>
                              {info.finalPrice.toLocaleString()}đ
                            </div>
                            {info.promoCode && (
                              <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '700' }}>🏷 {info.promoCode}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {info.qrCode && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setQrTicket(info)}>
                                <QrCode size={13} /> QR
                              </button>
                            )}
                            {info.status === 'valid' && info.bookingId && (
                              <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '12px' }}
                                onClick={() => handleCancelTicket(info.bookingId)}>
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

      {/* ── QR Modal ── */}
      {qrTicket && (
        <div className="modal-overlay" onClick={() => setQrTicket(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '16px' }}>Mã QR vé</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQrTicket(null)}><X size={18} /></button>
            </div>

            <div style={{ fontFamily: 'monospace', fontWeight: '800', letterSpacing: '3px', color: 'var(--primary)', fontSize: '18px', marginBottom: '16px' }}>
              {qrTicket.code}
            </div>

            <img
              src={qrTicket.qrCode} alt="QR Code"
              style={{ width: '220px', height: '220px', borderRadius: '16px', border: '4px solid var(--gray-200)', margin: '0 auto 16px', display: 'block' }}
            />

            {/* Ticket details */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '12px', marginBottom: '16px' }}>
              {[
                ['Tuyến', `${qrTicket.fromCity} → ${qrTicket.toCity}`],
                ['Ngày', `${fmtDate(qrTicket.departureTime)} ${fmtTime(qrTicket.departureTime)}`],
                ['Xe', qrTicket.busName],
                ['Ghế', `${qrTicket.seatNumber}${qrTicket.seatType === 'vip' ? ' (VIP)' : ''}`],
                ['Giá vé', `${qrTicket.finalPrice?.toLocaleString()}đ`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between" style={{ padding: '5px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{v}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => setQrTicket(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
