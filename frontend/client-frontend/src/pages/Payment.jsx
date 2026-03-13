import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Container, Card, CardContent, Stack, Dialog, DialogContent, DialogTitle } from '@mui/material';
import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { bookingService } from '../services/bookingService';

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingId, tripId, seats, totalPrice, passenger } = state || {};
  const [loading, setLoading] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const pricePerSeat = seats?.length ? Math.round((totalPrice || 0) / seats.length) : 0;
  const total = totalPrice || (seats?.length || 0) * pricePerSeat;

  const handlePay = async () => {
    if (!bookingId) {
      alert('Không có thông tin đơn đặt vé');
      return;
    }
    setLoading(true);
    try {
      await bookingService.confirm(bookingId);
      setOpenSuccess(true);
      setTimeout(() => navigate('/my-tickets'), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!tripId || !seats || !passenger) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center', px: { xs: 2, md: 4 } }}>
        <Typography variant="h5" sx={{ color: '#666' }}>
          Không có thông tin đơn đặt vé
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#333', mb: 1 }}>
            💳 Xác nhận thanh toán
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '1rem' }}>
            Kiểm tra lại thông tin trước khi thanh toán
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Trip & Booking Details */}
          <Grid xs={12} md={7}>
            <Stack spacing={3}>
              {/* Trip Information */}
              <Card sx={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: '#333' }}>
                    🚌 Thông tin chuyến xe
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      p: 2,
                      borderRadius: '12px'
                    }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800 }}>
                        Chi tiết chuyến xe
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#999', mb: 0.5 }}>
                          Giá vé/ghế
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: '#667eea', fontSize: '1.2rem' }}>
                          {pricePerSeat.toLocaleString()} VND
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Seat Information */}
              <Card sx={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
                    🎫 Ghế đã chọn
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {seats?.map((seat) => (
                      <Box key={seat} sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        fontWeight: 600
                      }}>
                        {seat}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* Passenger Information */}
              <Card sx={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
                    👤 Thông tin hành khách
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', color: '#999', mb: 0.5 }}>
                        Họ tên
                      </Typography>
                      <Typography sx={{ fontWeight: 500, color: '#333' }}>
                        {passenger?.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', color: '#999', mb: 0.5 }}>
                        Số điện thoại
                      </Typography>
                      <Typography sx={{ fontWeight: 500, color: '#333' }}>
                        {passenger?.phone}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', color: '#999', mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography sx={{ fontWeight: 500, color: '#333' }}>
                        {passenger?.email}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column - Payment Summary */}
          <Grid xs={12} md={5}>
            <Card sx={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              position: 'sticky',
              top: '20px',
              boxShadow: '0 12px 24px rgba(102, 126, 234, 0.3)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                  🧾 Tóm tắt đơn đặt
                </Typography>

                <Stack spacing={2} sx={{ mb: 2.5, pb: 2.5, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.95rem' }}>
                      Giá vé ({seats?.length} ghế)
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {(total || 0).toLocaleString()} VND
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.95rem' }}>
                      Phí dịch vụ
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      0 VND
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Tổng cộng
                  </Typography>
                  <Typography sx={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {total.toLocaleString()} VND
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handlePay}
                  disabled={loading}
                  sx={{
                    py: 1.7,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: '#fff',
                    color: '#667eea',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </Button>

                <Typography sx={{
                  fontSize: '0.85rem',
                  mt: 2,
                  textAlign: 'center',
                  opacity: 0.8
                }}>
                  Bằng cách thanh toán, bạn đồng ý với điều khoản dịch vụ
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Success Dialog */}
      <Dialog open={openSuccess} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }} />
        <DialogContent sx={{ textAlign: 'center', pt: 2, pb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Thanh toán thành công!
          </Typography>
          <Typography sx={{ color: '#666', mb: 3 }}>
            Vé của bạn sẽ được gửi qua email trong chốc lát.
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#999' }}>
            Chuyển hướng đến danh sách vé...
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}