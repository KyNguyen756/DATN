import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Container, Card, Paper, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import { seatService } from '../services/seatService';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SeatSelection() {
  const query = useQuery();
  const navigate = useNavigate();
  const tripId = query.get('tripId');
  const [layout, setLayout] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const [rawLayout, setRawLayout] = useState([]);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        const res = await seatService.getLayout(tripId);
        const data = res.data || [];
        setRawLayout(data);
        setLayout(data.map((ts) => ({
          _id: ts._id,
          seatNumber: ts.seat?.seatNumber || '',
          status: ts.status,
        })));
      } catch (err) {
        console.error(err);
        setLayout([]);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) loadLayout();
  }, [tripId]);

  const toggleSeat = async (item) => {
    const tripSeat = rawLayout.find((r) => r._id === item._id);
    if (!tripSeat || tripSeat.status !== 'available') return;
    const already = selected.find((s) => s.tripSeatId === item._id);
    if (already) {
      try {
        setLocking(true);
        await seatService.unlock(item._id);
        setSelected(selected.filter((s) => s.tripSeatId !== item._id));
      } catch (e) {
        console.error(e);
      } finally {
        setLocking(false);
      }
    } else {
      try {
        setLocking(true);
        await seatService.lock(item._id);
        setSelected([...selected, { tripSeatId: item._id, seatNumber: item.seatNumber }]);
      } catch (e) {
        alert(e.response?.data?.message || 'Không thể chọn ghế. Vui lòng đăng nhập.');
      } finally {
        setLocking(false);
      }
    }
  };

  const handleNext = () => {
    const ids = selected.map((s) => s.tripSeatId);
    const nums = selected.map((s) => s.seatNumber);
    navigate(`/booking?tripId=${tripId}&seatIds=${ids.join(',')}&seats=${nums.join(',')}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#333', mb: 1 }}>
            🪑 Chọn ghế
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '1rem' }}>
            Chọn ghế ngồi cho chuyến xe của bạn
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Legend */}
            <Paper sx={{ p: 2.5, mb: 4, borderRadius: '12px', bg: '#fff' }}>
              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#f0f4ff',
                      border: '2px solid #667eea'
                    }} />
                    <Typography sx={{ fontSize: '0.9rem' }}>Ghế trống</Typography>
                  </Stack>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#ff6b6b'
                    }} />
                    <Typography sx={{ fontSize: '0.9rem' }}>Đã đặt</Typography>
                  </Stack>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }} />
                    <Typography sx={{ fontSize: '0.9rem' }}>Đã chọn</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Seat Grid */}
            <Card sx={{
              borderRadius: '12px',
              p: 3,
              mb: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              background: '#fff'
            }}>
              {/* Bus Front */}
              <Box sx={{
                textAlign: 'center',
                mb: 3,
                py: 1.5,
                borderBottom: '2px solid #667eea',
                color: '#667eea',
                fontWeight: 600
              }}>
                Phía trước xe
              </Box>

              {/* Seat Layout */}
              <Grid container spacing={1.5} sx={{ justifyContent: 'center' }}>
                {layout.map((seat) => {
                  const isSelected = selected.some((s) => s.tripSeatId === seat._id);
                  const isBooked = seat.status === 'booked' || (seat.status === 'reserved' && !isSelected);

                  let bgColor = '#f0f4ff';
                  let borderColor = '#667eea';
                  let cursor = 'pointer';

                  if (isBooked) {
                    bgColor = '#ff6b6b';
                    borderColor = '#ff6b6b';
                    cursor = 'not-allowed';
                  } else if (isSelected) {
                    bgColor = '#667eea';
                    borderColor = '#667eea';
                  }

                  return (
                    <Grid xs="auto" key={seat._id || seat.seatNumber}>
                      <Button
                        onClick={() => toggleSeat(seat)}
                        disabled={locking || isBooked}
                        sx={{
                          minWidth: '48px',
                          width: '48px',
                          height: '48px',
                          p: 0,
                          borderRadius: '8px',
                          border: `2px solid ${borderColor}`,
                          background: bgColor,
                          color: isBooked ? '#fff' : isSelected ? '#fff' : '#667eea',
                          fontWeight: 600,
                          cursor,
                          transition: 'all 0.2s ease',
                          '&:hover': isBooked ? {} : {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                          }
                        }}
                      >
                        {seat.seatNumber.split('-')[1] || seat.seatNumber}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Bus Back */}
              <Box sx={{
                textAlign: 'center',
                mt: 3,
                py: 1.5,
                borderTop: '2px solid #667eea',
                color: '#667eea',
                fontWeight: 600
              }}>
                Phía sau xe
              </Box>
            </Card>

            {/* Selection Summary & Action */}
            <Paper sx={{
              p: 3,
              borderRadius: '12px',
              background: selected.length > 0 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#f5f5f5',
              color: selected.length > 0 ? '#fff' : '#666',
              textAlign: 'center',
              mb: 2
            }}>
              <Typography sx={{ fontSize: '0.95rem', opacity: 0.9, mb: 1 }}>
                Ghế được chọn
              </Typography>
              <Typography sx={{
                fontSize: '1.8rem',
                fontWeight: 800,
                mb: 2
              }}>
                {selected.length > 0 ? selected.map((s) => s.seatNumber).join(', ') : 'Chưa chọn'}
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                disabled={selected.length === 0}
                onClick={handleNext}
                sx={{
                  background: selected.length > 0 ? '#fff' : '#ccc',
                  color: selected.length > 0 ? '#667eea' : '#999',
                  fontWeight: 600,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {selected.length > 0 ? `Tiếp tục (${selected.length} ghế)` : 'Chọn ghế để tiếp tục'}
              </Button>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}