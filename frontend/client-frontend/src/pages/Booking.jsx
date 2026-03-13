import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { bookingService } from '../services/bookingService';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Booking() {
  const query = useQuery();
  const navigate = useNavigate();
  const tripId = query.get('tripId');
  const seatIds = query.get('seatIds') ? query.get('seatIds').split(',').filter(Boolean) : [];
  const seats = query.get('seats') ? query.get('seats').split(',') : [];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !email) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!tripId || seatIds.length === 0) {
      alert('Thiếu thông tin ghế. Vui lòng chọn ghế lại.');
      return;
    }
    try {
      setLoading(true);
      const res = await bookingService.create({
        tripId,
        seatIds,
        passengerName: name,
        passengerPhone: phone,
        passengerEmail: email,
      });
      const booking = res.data;
      navigate('/payment', {
        state: {
          bookingId: booking._id,
          tripId,
          seats,
          totalPrice: booking.totalPrice,
          passenger: { name, phone, email },
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      alert(typeof msg === 'string' ? msg : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#333', mb: 1 }}>
            📋 Thông tin hành khách
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '1rem' }}>
            Nhập thông tin để hoàn tất đặt vé
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Booking Info */}
          <Grid xs={12} md={6}>
            <Card sx={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#333' }}>
                  🎫 Chi tiết đơn đặt
                </Typography>

                {/* Trip Info */}
                <Box sx={{
                  background: '#f0f4ff',
                  p: 2.5,
                  borderRadius: '12px',
                  mb: 3
                }}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#667', mb: 1 }}>
                    Mã chuyến xe
                  </Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>
                    {tripId}
                  </Typography>
                </Box>

                {/* Seats Info */}
                <Box sx={{
                  background: '#f0f4ff',
                  p: 2.5,
                  borderRadius: '12px',
                  mb: 3
                }}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#667', mb: 2 }}>
                    Ghế đã chọn ({seats.length || seatIds.length})
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {seats.map((seat) => (
                      <Chip
                        key={seat}
                        label={`Ghế ${seat}`}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Summary */}
                <Box sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  p: 2.5,
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Tổng vé
                  </Typography>
                  <Typography sx={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {seats.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Passenger Form */}
          <Grid xs={12} md={6}>
            <Card sx={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#333' }}>
                  👤 Thông tin hành khách chính
                </Typography>

                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Họ tên"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    label="Số điện thoại"
                    placeholder="0901234567"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)'
                      }
                    }}
                  >
                    {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}