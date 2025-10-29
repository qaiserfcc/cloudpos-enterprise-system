import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  useTheme,
} from '@mui/material';

export const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2,
        px: 3,
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900],
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} CloudPOS. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Help
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Privacy
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              Terms
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};