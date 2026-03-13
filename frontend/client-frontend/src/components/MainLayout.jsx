import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Header from './Header';

export default function MainLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container
        maxWidth="xl"
        sx={{ flexGrow: 1, mt: 4, mb: 4, px: { xs: 2, md: 4 } }}
      >
        {children}
      </Container>
    </Box>
  );
}
