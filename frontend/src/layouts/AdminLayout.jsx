import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route, Car, Ticket, Users,
  Tag, BarChart3, Settings, LogOut, Menu,
  ChevronRight, Bell, Bus, MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/routes', label: 'Chuyến đi', icon: Route },
  { to: '/admin/vehicles', label: 'Xe & Phương tiện', icon: Car },
  { to: '/admin/stations', label: 'Bến xe', icon: MapPin },
  { to: '/admin/tickets', label: 'Vé & Đặt chỗ', icon: Ticket },
  { to: '/admin/customers', label: 'Khách hàng & NV', icon: Users },
  { to: '/admin/promotions', label: 'Khuyến mãi', icon: Tag },
  { to: '/admin/reports', label: 'Báo cáo', icon: BarChart3 },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '72px' : '260px',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
          }}>
            <Bus size={22} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', lineHeight: 1 }}>VéXeBus</div>
              <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>Admin Dashboard</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  marginBottom: '3px',
                  color: active ? 'white' : '#64748B',
                  background: active ? 'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,107,53,0.1))' : 'transparent',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s',
                  fontWeight: active ? '600' : '500',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  fontSize: '13px',
                }}
              >
                <Icon size={17} style={{ flexShrink: 0, color: active ? 'var(--primary)' : '#64748B' }} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
            borderRadius: '10px', color: '#64748B', fontSize: '13px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
          }}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Right content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          background: 'white', height: '64px', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderBottom: '1px solid var(--gray-200)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-icon">
              {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
            </button>
            {/* Breadcrumb */}
            <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
              {navItems.find(n => n.to === location.pathname || (n.to !== '/admin' && location.pathname.startsWith(n.to)))?.label || 'Tổng quan'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--danger)', border: '2px solid white',
              }} />
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--gray-200)' }} />

            <div className="flex items-center gap-2">
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '14px',
              }}>{(user?.username || 'A')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>{user?.username || 'Admin'}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{user?.role || 'admin'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
