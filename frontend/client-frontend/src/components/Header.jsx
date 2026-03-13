import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const goHome = () => navigate('/');
  const goSearch = () => navigate('/search');
  const goMyTickets = () => navigate('/my-tickets');
  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ py: 2, gap: 2 }}>
        <Box
          onClick={goHome}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            🚌 BusTicket
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            gap: 1,
            justifyContent: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Button
            color="inherit"
            onClick={goHome}
            sx={{
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Trang chủ
          </Button>
          <Button
            color="inherit"
            onClick={goSearch}
            sx={{
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Tìm chuyến xe
          </Button>
          <Button
            color="inherit"
            onClick={goMyTickets}
            sx={{
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              px: 2,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Vé của tôi
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={goLogin}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#667eea',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              },
            }}
          >
            Đăng nhập
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
