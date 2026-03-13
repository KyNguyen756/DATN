import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tripService } from '../services/tripService';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Container,
  Chip,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchTrip() {
  const query = useQuery();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const from = query.get('from') || '';
    const to = query.get('to') || '';
    const date = query.get('date') || '';
    if (from && to && date) {
      fetchTrips({ from, to, date });
    }
  }, [query]);

  const fetchTrips = async (params) => {
    try {
      setLoading(true);
      const res = await tripService.search(params);
      const raw = res.data || [];
      setTrips(raw.map((t) => ({
        id: t._id,
        companyName: t.bus?.name || 'Nhà xe',
        busType: t.bus?.type || 'N/A',
        departureTime: t.departureTime ? new Date(t.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        price: t.price,
        availableSeats: t.availableSeats ?? 0,
      })));
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (trip) => {
    navigate(`/seat-selection?tripId=${trip.id}`);
  };

  const from = query.get('from') || '';
  const to = query.get('to') || '';
  const date = query.get('date') || '';

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#333', mb: 2 }}>
            🚌 Tìm chuyến hàng
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Chip label={`📍 Từ: ${from}`} sx={{ py: 2.5, fontSize: '1rem' }} />
            <Chip label={`📍 Đến: ${to}`} sx={{ py: 2.5, fontSize: '1rem' }} />
            <Chip label={`📅 ${date}`} sx={{ py: 2.5, fontSize: '1rem' }} />
          </Stack>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Trip Results */}
        {!loading && trips.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" sx={{ color: '#999' }}>
              Không tìm thấy chuyến xe phù hợp
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {trips.map((trip) => (
              <Grid xs={12} key={trip.id || trip._id}>
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
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Trip Info */}
                      <Grid xs={12} sm={6}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
                          🚌 {trip.companyName || 'Nhà xe'}
                        </Typography>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: '#667eea', fontWeight: 600, minWidth: '80px' }}>
                              Khởi hành:
                            </Typography>
                            <Typography sx={{ fontWeight: 500, fontSize: '1.1rem', color: '#333' }}>
                              {trip.departureTime || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: '#667eea', fontWeight: 600, minWidth: '80px' }}>
                              Loại xe:
                            </Typography>
                            <Chip 
                              label={trip.busType || 'N/A'} 
                              sx={{ background: '#f0f4ff', color: '#667eea', fontWeight: 500 }}
                            />
                          </Box>
                        </Stack>
                      </Grid>

                      {/* Price & Availability */}
                      <Grid xs={12} sm={6}>
                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Box sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            px: 3,
                            py: 2,
                            borderRadius: '12px',
                            mb: 2
                          }}>
                            <Typography sx={{ fontSize: '0.85rem', opacity: 0.9 }}>
                              Giá vé
                            </Typography>
                            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800 }}>
                              {trip.price?.toLocaleString()} VND
                            </Typography>
                          </Box>
                          <Box sx={{
                            background: trip.availableSeats > 0 ? '#f0f4ff' : '#ffebee',
                            color: trip.availableSeats > 0 ? '#667eea' : '#d32f2f',
                            px: 3,
                            py: 1.5,
                            borderRadius: '12px',
                            textAlign: 'center'
                          }}>
                            <Typography sx={{ fontWeight: 600 }}>
                              {trip.availableSeats} ghế trống
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Action Button */}
                      <Grid xs={12}>
                        <Button 
                          variant="contained" 
                          fullWidth
                          onClick={() => handleSelect(trip)}
                          disabled={trip.availableSeats === 0}
                          sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            background: trip.availableSeats === 0 
                              ? '#ccc' 
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            transition: 'all 0.3s ease',
                            '&:hover': trip.availableSeats > 0 ? {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)'
                            } : {}
                          }}
                        >
                          {trip.availableSeats === 0 ? 'Hết vé' : 'Chọn chuyến xe'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}