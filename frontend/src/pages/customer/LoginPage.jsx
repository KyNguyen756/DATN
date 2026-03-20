import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '', email: '', password: ''
  });

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password
        });
        login(res.data.token, res.data.user);

        // Redirect admin/staff to their dashboards, others to original destination
        const role = res.data.user.role;
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'staff') navigate('/staff', { replace: true });
        else navigate(from, { replace: true });

      } else {
        await api.post('/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password
        });
        // Auto-switch to login after successful register
        setMode('login');
        setForm(prev => ({ ...prev, username: '' }));
        setError('');
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background circles */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: ['400px', '300px', '500px'][i], height: ['400px', '300px', '500px'][i],
          borderRadius: '50%', background: 'rgba(255,107,53,0.05)',
          top: ['-10%', '60%', '20%'][i], left: ['60%', '-10%', '30%'][i],
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

        {/* Error alert */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'var(--danger-light)', color: 'var(--danger)',
            fontSize: '13px', fontWeight: '500',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">
                <span className="flex items-center gap-1"><User size={12} /> Tên đăng nhập</span>
              </label>
              <input
                className="form-input"
                name="username"
                placeholder="tendengnhap"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1"><Mail size={12} /> Email</span>
            </label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1"><Lock size={12} /> Mật khẩu</span>
            </label>
            <div className="relative">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '13px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-500)' }}>
          {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
          >
            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
