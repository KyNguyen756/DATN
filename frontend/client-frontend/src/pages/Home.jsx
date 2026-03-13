import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

export default function Home() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Banner Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 6, md: 10 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1
        },
        zIndex: 0
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, md: 4 } }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            🚌 Tìm Chuyến Xe Nhanh Chóng
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 300, mb: 3, opacity: 0.95 }}>
            Đặt vé xe buýt online dễ dàng - Giá tốt, an toàn, tiện lợi
          </Typography>
        </Container>
      </Box>

      {/* Search Form */}
      <Container maxWidth="xl" sx={{ mt: -4, position: 'relative', zIndex: 10, px: { xs: 2, md: 4 } }}>
        <Paper sx={{
          p: { xs: 3, md: 4 },
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          background: '#fff'
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Điểm đi"
                placeholder="Hà Nội"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Điểm đến"
                placeholder="Hải Phòng"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Ngày đi"
                type="date"
                value={date}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setDate(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleSearch}
                sx={{
                  py: 1.7,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                Tìm vé
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Services Section */}
      <Container maxWidth="xl" sx={{ mt: 8, pb: 8, px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" sx={{ textAlign: 'center', color: '#fff', fontWeight: 700, mb: 4 }}>
          Tại sao chọn BusTicket?
        </Typography>
        <Grid container spacing={3}>
          {[
            { icon: '✓', title: 'Giá tốt nhất', desc: 'Giá vé cạnh tranh, ưu đãi đặc biệt' },
            { icon: '🔒', title: 'An toàn', desc: 'Thanh toán an toàn, bảo mật dữ liệu' },
            { icon: '⚡', title: 'Nhanh chóng', desc: 'Đặt vé chỉ trong vài giây' },
            { icon: '📱', title: 'Dễ sử dụng', desc: 'Giao diện thân thiện, dễ hiểu' }
          ].map((item, idx) => (
            <Grid xs={12} sm={6} md={3} key={idx}>
              <Box sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                color: '#fff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  background: 'rgba(255,255,255,0.2)'
                }
              }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{item.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{item.title}</Typography>
                <Typography sx={{ opacity: 0.9, fontSize: '0.95rem' }}>{item.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}