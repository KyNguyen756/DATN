import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bus, Search, Ticket, User, Menu, X, Phone, Mail, MapPin, Facebook, Youtube, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/search', label: 'Tìm chuyến xe' },
  { to: '/news', label: 'Tin tức' },
];

export default function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user, logout, isAdmin, isStaff } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--secondary)', color: '#94a3b8', fontSize: '12px', padding: '6px 0' }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone size={12} /> 1900 1234</span>
            <span className="flex items-center gap-1"><Mail size={12} /> hotro@vexebus.vn</span>
          </div>
          <div className="flex items-center gap-4">
            {isStaff && <Link to="/staff" style={{ color: '#94a3b8' }}>Nhân viên</Link>}
            {isAdmin && <Link to="/admin" style={{ color: '#94a3b8' }}>Quản trị</Link>}
          </div>
        </div>
      </div>

      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: 'var(--shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{ padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bus size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gray-900)', lineHeight: 1 }}>Slim<span style={{ color: 'var(--primary)' }}>Bus</span></div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: 500 }}>Đặt vé trực tuyến</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1" style={{ display: 'flex' }}>
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: location.pathname === l.to ? 'var(--primary)' : 'var(--gray-600)',
                  background: location.pathname === l.to ? 'var(--primary-bg)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {token ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '800'
                  }}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {user?.username}
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '110%', background: 'white',
                    borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '8px',
                    minWidth: '180px', zIndex: 200,
                  }}>
                    <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      color: 'var(--gray-700)',
                    }}>
                      <User size={14} /> Hồ sơ cá nhân
                    </button>
                    <button onClick={() => { navigate('/my-tickets'); setUserMenuOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      color: 'var(--gray-700)',
                    }}>
                      <Ticket size={14} /> Vé của tôi
                    </button>
                    <div style={{ height: '1px', background: 'var(--gray-100)', margin: '4px 0' }} />
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      color: 'var(--danger)',
                    }}>
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/login')}
              >
                <User size={15} /> Đăng nhập
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/search')}
            >
              <Search size={15} /> Tìm vé
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--secondary)', color: '#94a3b8', padding: '48px 0 24px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bus size={18} color="white" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>VéXeBus</span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.8' }}>Hệ thống đặt vé xe trực tuyến hàng đầu Việt Nam. Đặt vé nhanh, an toàn, tiện lợi.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px' }}>Hỗ trợ</h4>
              {['Hướng dẫn đặt vé', 'Chính sách hủy vé', 'Câu hỏi thường gặp', 'Liên hệ hỗ trợ'].map(t => (
                <div key={t} style={{ marginBottom: '10px', fontSize: '13px' }}><a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t}</a></div>
              ))}
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px' }}>Tuyến phổ biến</h4>
              {['Hà Nội - TP.HCM', 'TP.HCM - Đà Lạt', 'Hà Nội - Đà Nẵng', 'TP.HCM - Nha Trang'].map(t => (
                <div key={t} style={{ marginBottom: '10px', fontSize: '13px' }}><a href="#" style={{ color: '#94a3b8' }}>{t}</a></div>
              ))}
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '16px' }}>Liên hệ</h4>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span className="flex items-center gap-2"><Phone size={14} /> 1900 1234</span>
                <span className="flex items-center gap-2"><Mail size={14} /> hotro@vexebus.vn</span>
                <span className="flex items-center gap-2"><MapPin size={14} /> 123 Lê Lợi, TP.HCM</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '13px' }}>© 2025 VéXeBus. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <Facebook size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} />
              <Youtube size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
