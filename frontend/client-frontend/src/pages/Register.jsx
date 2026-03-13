import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container, Stack, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu không khớp');
      return;
    }

    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || parts[0] || '';

    setLoading(true);
    try {
      await authService.register({
        firstName,
        lastName,
        username: email,
        email,
        password,
        phoneNumber: phone || undefined,
      });
      alert('Đăng ký thành công');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : 'Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="sm" sx={{ px: { xs: 2, md: 0 } }}>
        <Paper sx={{
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Top Accent */}
          <Box sx={{
            height: '8px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
          }} />

          {/* Form Content */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography sx={{ fontSize: { xs: '2.5rem', md: '3rem' }, mb: 1 }}>🚌</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#333', mb: 1, fontSize: { xs: '1.75rem', md: '2rem' } }}>
                BusTicket
              </Typography>
              <Typography sx={{ color: '#666', fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
                Tạo tài khoản để bắt đầu đặt vé
              </Typography>
            </Box>

            {/* Form Fields */}
            <Stack spacing={2.5} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Số điện thoại"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                placeholder="abc@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
            </Stack>

            {/* Submit Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                py: 1.7,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'all 0.3s ease',
                mb: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>

            {/* Divider */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              '&::before, &::after': {
                content: '""',
                flex: 1,
                height: '1px',
                background: '#ddd'
              }
            }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#999' }}>HOẶC</Typography>
            </Box>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>
                Đã có tài khoản?{' '}
                <Link
                  href="/login"
                  sx={{
                    color: '#667eea',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#764ba2',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Đăng nhập
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer Text */}
        <Typography sx={{
          textAlign: 'center',
          mt: 4,
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.85rem'
        }}>
          Bằng cách đăng ký, bạn đồng ý với điều khoản dịch vụ của chúng tôi
        </Typography>
      </Container>
    </Box>
  );
}