import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, QrCode, Clock,
  Bus, LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';

const navItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff/quick-sale', label: 'Bán vé nhanh', icon: Ticket },
  { to: '/staff/check-in', label: 'Check-in hành khách', icon: QrCode },
  { to: '/staff/hold-seats', label: 'Quản lý giữ ghế', icon: Clock },
];

export default function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
        {/* Logo */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #334155' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Bus size={20} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', lineHeight: 1 }}>Staff Portal</div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>Nhân viên bán vé</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
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

        {/* Bottom */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid #334155' }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
            borderRadius: '10px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px',
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && 'Thoát nhân viên'}
          </Link>
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
          <div className="flex items-center gap-3">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>Nguyễn Văn A</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Nhân viên bán vé</div>
            </div>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '700', fontSize: '14px',
            }}>A</div>
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
