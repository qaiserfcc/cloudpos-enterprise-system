import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}) => {
  const theme = useTheme();

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.contrastText`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" component="div" fontWeight="bold">
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    ml: 0.5,
                  }}
                >
                  {trend.value}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Total Revenue',
      value: '$24,568',
      icon: <RevenueIcon />,
      trend: { value: 12.5, isPositive: true },
      color: 'success' as const,
    },
    {
      title: 'Total Sales',
      value: '1,234',
      icon: <SalesIcon />,
      trend: { value: 8.2, isPositive: true },
      color: 'primary' as const,
    },
    {
      title: 'Customers',
      value: '856',
      icon: <CustomersIcon />,
      trend: { value: 15.3, isPositive: true },
      color: 'secondary' as const,
    },
    {
      title: 'Products',
      value: '342',
      icon: <ProductsIcon />,
      trend: { value: 2.1, isPositive: false },
      color: 'warning' as const,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your store."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
      />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Analytics Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1">
                Sales chart will be implemented with Chart.js or Recharts
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • New sale completed: $125.50
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Customer registered: John Doe
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Product added: Premium Coffee
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Low stock alert: Sugar packets
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Sale completed: $45.25
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Top Products
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" paragraph>
                1. Premium Coffee - 124 sales
              </Typography>
              <Typography variant="body2" paragraph>
                2. Croissant - 98 sales
              </Typography>
              <Typography variant="body2" paragraph>
                3. Cappuccino - 87 sales
              </Typography>
              <Typography variant="body2" paragraph>
                4. Sandwich - 76 sales
              </Typography>
              <Typography variant="body2" paragraph>
                5. Tea - 65 sales
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Add New Product
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Register Customer
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → View Sales Report
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → Manage Inventory
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                → System Settings
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;