import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, QrCode, Clock,
  Bus, LogOut, Menu, ChevronRight, Bell, Building2, ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CompanyLogo from '../components/CompanyLogo';

const navItems = [
  { to: '/staff',              label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/staff/counter-sale', label: 'Bán vé tại quầy',   icon: ShoppingCart },
  { to: '/staff/quick-sale',   label: 'Bán vé nhanh',       icon: Ticket },
  { to: '/staff/check-in',     label: 'Check-in hành khách',icon: QrCode },
  { to: '/staff/hold-seats',   label: 'Quản lý giữ ghế',   icon: Clock },
];

export default function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  const company = user?.busCompany;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-100)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--secondary)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo / Company branding */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #334155', minHeight: '72px' }}>
          {company?.logo ? (
            <CompanyLogo logo={company.logo} name={company.name} size={40} radius="10px" />
          ) : (
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bus size={20} color="white" />
            </div>
          )}
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company?.name || 'Staff Portal'}
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Nhân viên bán vé</div>
            </div>
          )}
        </div>

        {/* Company badge (only when expanded and company exists) */}
        {!collapsed && company && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,53,0.12)', borderRadius: '8px', padding: '6px 10px' }}>
              <Building2 size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company.shortName || company.code}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to !== '/staff' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  marginBottom: '4px',
                  color: active ? 'white' : '#94a3b8',
                  background: active ? 'rgba(255,107,53,0.2)' : 'transparent',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s',
                  fontWeight: active ? '600' : '500',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, color: active ? 'var(--primary)' : '#64748b' }} />
                {!collapsed && <span style={{ fontSize: '13px' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid #334155' }}>
          {!collapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0,
              }}>{(user.username || 'S')[0].toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{user.role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
            borderRadius: '10px', color: '#94a3b8', fontSize: '13px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          background: 'white', height: '60px', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--gray-200)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-icon">
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Company badge in header */}
            {company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(255,107,53,0.08)', borderRadius: '20px', border: '1px solid rgba(255,107,53,0.2)' }}>
                <Building2 size={13} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>
                  {company.shortName || company.name}
                </span>
              </div>
            )}

            <button className="btn btn-ghost btn-icon">
              <Bell size={18} />
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--gray-200)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>{user?.username || 'Staff'}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{user?.role || 'staff'}</div>
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '14px',
              }}>{(user?.username || 'S')[0].toUpperCase()}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
