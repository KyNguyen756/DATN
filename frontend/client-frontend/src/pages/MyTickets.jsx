import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Container, Chip, Stack, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketService.getUserTickets();
      const bookings = res.data || [];
      setTickets(bookings.map((b) => ({
        id: b._id,
        tripName: b.trip ? `${b.trip.departureLocation || ''} → ${b.trip.arrivalLocation || ''}` : 'Chuyến xe',
        seat: (b.seats || []).map((ts) => ts.seat?.seatNumber).filter(Boolean).join(', '),
        status: b.status === 'confirmed' ? 'active' : b.status === 'cancelled' ? 'cancelled' : 'active',
        createdAt: b.createdAt,
      })));
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'used': { bg: '#e3f2fd', color: '#1976d2', label: '✓ Đã sử dụng' },
      'active': { bg: '#f0f4ff', color: '#667eea', label: '● Chưa sử dụng' },
      'cancelled': { bg: '#ffebee', color: '#d32f2f', label: '✕ Đã hủy' },
    };
    return statusMap[status] || { bg: '#f5f5f5', color: '#666', label: status };
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#333', mb: 1 }}>
            🎫 Vé của tôi
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '1rem' }}>
            Quản lý và xem chi tiết những vé đã đặt
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : tickets.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>📭</Typography>
            <Typography variant="h6" sx={{ color: '#999', mb: 1 }}>
              Chưa có vé nào
            </Typography>
            <Typography sx={{ color: '#bbb', mb: 3 }}>
              Hãy tìm và đặt vé chuyến xe để bắt đầu
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/search')}
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                px: 4,
                py: 1.2
              }}
            >
              Tìm chuyến xe
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 3 }}>
            {tickets.map((ticket) => {
              const statusInfo = getStatusColor(ticket.status);
              return (
                <Box key={ticket.id}>
                  <Card sx={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(102, 126, 234, 0.2)'
                    },
                    background: '#fff'
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        {/* Left Section - Trip Info */}
                        <Box sx={{
                          p: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff'
                        }}>
                          <Typography sx={{ fontSize: '0.9rem', opacity: 0.9, mb: 1 }}>
                            🚌 Thông tin chuyến xe
                          </Typography>
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, mb: 2 }}>
                            {ticket.tripName || 'Chuyến xe'}
                          </Typography>
                          
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>Ghế:</Typography>
                              <Typography sx={{ fontWeight: 600 }}>{ticket.seat}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>Mã vé:</Typography>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{ticket.id}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>Ngày đặt:</Typography>
                              <Typography sx={{ fontWeight: 600 }}>
                                {new Date(ticket.createdAt || new Date()).toLocaleDateString('vi-VN')}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        {/* Right Section - Status & Actions */}
                        <Box sx={{
                          p: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end'
                        }}>
                          <Box sx={{ width: '100%', textAlign: 'right', mb: 2 }}>
                            <Chip
                              label={statusInfo.label}
                              sx={{
                                background: statusInfo.bg,
                                color: statusInfo.color,
                                fontWeight: 600,
                                height: '32px',
                                fontSize: '0.9rem'
                              }}
                            />
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{
                                borderRadius: '8px',
                                borderColor: '#ddd',
                                color: '#666',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: '#667eea',
                                  color: '#667eea'
                                }
                              }}
                            >
                              Chi tiết
                            </Button>
                            {ticket.status === 'active' && (
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                sx={{
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  textTransform: 'none'
                                }}
                              >
                                Hủy vé
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
}