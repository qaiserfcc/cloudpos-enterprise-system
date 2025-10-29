import React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { PageHeader } from '@cloudpos/layout';

const SalesPage: React.FC = () => {
  // Mock sales data
  const recentSales = [
    {
      id: '#001234',
      customer: 'John Doe',
      amount: '$125.50',
      items: 5,
      time: '2 hours ago',
      status: 'Completed',
    },
    {
      id: '#001235',
      customer: 'Jane Smith',
      amount: '$45.25',
      items: 2,
      time: '3 hours ago',
      status: 'Completed',
    },
    {
      id: '#001236',
      customer: 'Mike Johnson',
      amount: '$89.75',
      items: 3,
      time: '4 hours ago',
      status: 'Completed',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Sales Management"
        subtitle="View and manage sales transactions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Sales' },
        ]}
      />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Sales
        </Typography>
        
        <List>
          {recentSales.map((sale) => (
            <ListItem key={sale.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {sale.id} - {sale.customer}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {sale.amount}
                      </Typography>
                      <Chip label={sale.status} color="success" size="small" />
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {sale.items} items • {sale.time}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Sales management will include:
          • Complete transaction history with filtering
          • Customer purchase tracking
          • Refund and return processing
          • Payment method analytics
          • Sales performance metrics
        </Typography>
      </Paper>
    </Box>
  );
};

export default SalesPage;