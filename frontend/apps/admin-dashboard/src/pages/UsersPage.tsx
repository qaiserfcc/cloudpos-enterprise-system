import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { PageHeader } from '@cloudpos/layout';
import { Button } from '@cloudpos/shared-ui';
import { Add as AddIcon } from '@mui/icons-material';

const UsersPage: React.FC = () => {
  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Manage system users, roles, and permissions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Users' },
        ]}
        actions={
          <Button
            variant="primary"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add user')}
          >
            Add User
          </Button>
        }
      />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Users List
        </Typography>
        
        {/* Mock users table */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph>
            <strong>Admin User</strong> - admin@cloudpos.com{' '}
            <Chip label="Admin" color="primary" size="small" />
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Cashier One</strong> - cashier1@cloudpos.com{' '}
            <Chip label="Cashier" color="secondary" size="small" />
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Cashier Two</strong> - cashier2@cloudpos.com{' '}
            <Chip label="Cashier" color="secondary" size="small" />
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          User management functionality will be implemented with data grid, 
          user forms, role management, and permission controls.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UsersPage;