import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const LoginPage: React.FC = () => {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            CloudPOS
          </Typography>
          <Typography variant="h6" gutterBottom align="center" color="text.secondary">
            Admin Dashboard
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 3 }}>
            Login functionality will be implemented in the next phase.
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
            This is a basic foundation for the admin dashboard application.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;