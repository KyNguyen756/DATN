import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, Phone, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [showPw, setShowPw] = useState(false);

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background circles */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: ['400px','300px','500px'][i], height: ['400px','300px','500px'][i],
          borderRadius: '50%',
          background: 'rgba(255,107,53,0.05)',
          top: ['-10%','60%','20%'][i], left: ['60%','-10%','30%'][i],
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px',
        width: '100%', maxWidth: '440px', boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(255,107,53,0.35)',
          }}>
            <Bus size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gray-900)' }}>
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '4px' }}>
            {mode === 'login' ? 'Chào mừng trở lại VéXeBus!' : 'Tham gia VéXeBus ngay hôm nay'}
          </p>
        </div>

        {/* Social login */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {[
            { name: 'Google', color: '#EA4335', bg: '#FEF2F2', emoji: '🔵' },
            { name: 'Facebook', color: '#1877F2', bg: '#EFF6FF', emoji: '📘' },
          ].map(s => (
            <button key={s.name} style={{
              padding: '10px', borderRadius: '10px', border: `1.5px solid ${s.color}20`,
              background: s.bg, fontWeight: '600', fontSize: '13px', color: s.color,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}>
              <span>{s.emoji}</span> {s.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>Hoặc dùng email</span>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label"><span className="flex items-center gap-1"><User size={12} /> Họ và tên</span></label>
              <input className="form-input" placeholder="Nguyễn Văn A" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label"><span className="flex items-center gap-1"><Mail size={12} /> Email</span></label>
            <input className="form-input" type="email" placeholder="email@example.com" />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label"><span className="flex items-center gap-1"><Phone size={12} /> Số điện thoại</span></label>
              <input className="form-input" type="tel" placeholder="0901234567" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label"><span className="flex items-center gap-1"><Lock size={12} /> Mật khẩu</span></label>
            <div className="relative">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ paddingRight: '44px' }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <a href="#" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>Quên mật khẩu?</a>
          </div>
        )}

        <button
          className="btn btn-primary w-full"
          style={{ justifyContent: 'center', padding: '13px', fontSize: '15px', marginBottom: '16px' }}
          onClick={() => navigate('/')}
        >
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <ArrowRight size={17} />
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-500)' }}>
          {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
          >
            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
