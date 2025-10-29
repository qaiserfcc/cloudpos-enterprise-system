import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import { PageHeader } from '@cloudpos/layout';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

const ReportsPage: React.FC = () => {
  const reportTypes = [
    {
      title: 'Sales Report',
      description: 'Daily, weekly, and monthly sales analytics',
      icon: <TrendingUpIcon />,
      color: 'primary',
    },
    {
      title: 'Product Performance',
      description: 'Best selling products and inventory analysis',
      icon: <BarChartIcon />,
      color: 'secondary',
    },
    {
      title: 'Customer Analytics',
      description: 'Customer behavior and purchase patterns',
      icon: <PieChartIcon />,
      color: 'success',
    },
    {
      title: 'Financial Summary',
      description: 'Revenue, profit margins, and financial health',
      icon: <ReportIcon />,
      color: 'warning',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate insights and reports for your business"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Reports' },
        ]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reportTypes.map((report, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', cursor: 'pointer' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    mb: 2,
                    color: `${report.color}.main`,
                    fontSize: 48,
                  }}
                >
                  {report.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Today's Sales
            </Typography>
            <Typography variant="h4" color="primary">
              $1,247.50
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              This Month
            </Typography>
            <Typography variant="h4" color="secondary">
              $24,568.25
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              This Year
            </Typography>
            <Typography variant="h4" color="success.main">
              $285,420.75
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Advanced reporting features will include:
          • Interactive charts and graphs with Chart.js or Recharts
          • Customizable date ranges and filters
          • Export to PDF, Excel, and CSV formats
          • Scheduled report generation and email delivery
          • Comparative analysis and trend forecasting
          • Real-time dashboard with key metrics
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReportsPage;