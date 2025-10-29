import React from 'react';
import { Box, Paper, Typography, Grid, Avatar, Card, CardContent } from '@mui/material';
import { PageHeader } from '@cloudpos/layout';
import { Button } from '@cloudpos/shared-ui';
import { Add as AddIcon } from '@mui/icons-material';

const CustomersPage: React.FC = () => {
  // Mock customers data
  const customers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      totalSpent: '$1,245.50',
      visits: 23,
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 (555) 987-6543',
      totalSpent: '$856.25',
      visits: 15,
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1 (555) 456-7890',
      totalSpent: '$632.75',
      visits: 12,
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1 (555) 321-0987',
      totalSpent: '$423.10',
      visits: 8,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer relationships and loyalty programs"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Customers' },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add customer')}
          >
            Add Customer
          </Button>
        }
      />

      <Grid container spacing={3}>
        {customers.map((customer) => (
          <Grid item xs={12} sm={6} md={4} key={customer.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer.visits} visits
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {customer.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {customer.phone}
                </Typography>
                <Typography variant="h6" color="primary">
                  Total Spent: {customer.totalSpent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Customer management features will include:
          • Customer profiles with purchase history
          • Loyalty points and rewards program
          • Customer segmentation and targeting
          • Communication tools and notifications
          • Birthday and anniversary tracking
          • Customer feedback and reviews
        </Typography>
      </Paper>
    </Box>
  );
};

export default CustomersPage;