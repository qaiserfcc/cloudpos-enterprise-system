import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';

interface ReportsAnalyticsPageProps {}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data for reports
const mockSalesData = {
  daily: [
    { date: '2024-10-29', sales: 2500, orders: 45, customers: 32 },
    { date: '2024-10-28', sales: 1800, orders: 38, customers: 28 },
    { date: '2024-10-27', sales: 3200, orders: 52, customers: 41 },
    { date: '2024-10-26', sales: 2100, orders: 42, customers: 35 },
    { date: '2024-10-25', sales: 2800, orders: 48, customers: 39 },
    { date: '2024-10-24', sales: 1950, orders: 40, customers: 30 },
    { date: '2024-10-23', sales: 2650, orders: 46, customers: 37 }
  ],
  monthly: [
    { month: 'Oct 2024', sales: 65000, orders: 1200, customers: 850 },
    { month: 'Sep 2024', sales: 58000, orders: 1100, customers: 780 },
    { month: 'Aug 2024', sales: 62000, orders: 1150, customers: 820 },
    { month: 'Jul 2024', sales: 70000, orders: 1300, customers: 900 },
    { month: 'Jun 2024', sales: 55000, orders: 1050, customers: 750 },
    { month: 'May 2024', sales: 60000, orders: 1180, customers: 800 }
  ]
};

const mockProductPerformance = [
  { name: 'iPhone 15 Pro', sales: 15000, units: 15, category: 'Electronics' },
  { name: 'Samsung Galaxy S24', sales: 12000, units: 15, category: 'Electronics' },
  { name: 'Wireless Headphones', sales: 8500, units: 28, category: 'Electronics' },
  { name: 'Organic Coffee Beans', sales: 6200, units: 248, category: 'Food & Beverages' },
  { name: 'Running Shoes', sales: 4800, units: 16, category: 'Clothing' }
];

const mockCustomerSegments = [
  { segment: 'VIP Customers', count: 45, revenue: 28500, avgOrder: 633 },
  { segment: 'Regular Customers', count: 180, revenue: 42000, avgOrder: 233 },
  { segment: 'New Customers', count: 85, revenue: 12500, avgOrder: 147 },
  { segment: 'Inactive Customers', count: 32, revenue: 0, avgOrder: 0 }
];

const mockInventoryTurnover = [
  { category: 'Electronics', turnover: 8.5, value: 125000, fastMoving: 15 },
  { category: 'Clothing', turnover: 6.2, value: 45000, fastMoving: 8 },
  { category: 'Food & Beverages', turnover: 12.4, value: 25000, fastMoving: 22 },
  { category: 'Home & Garden', turnover: 4.1, value: 35000, fastMoving: 5 }
];

export default function ReportsAnalyticsPage({}: ReportsAnalyticsPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const currentData = mockSalesData.daily;
    const totalSales = currentData.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = currentData.reduce((sum, day) => sum + day.orders, 0);
    const totalCustomers = currentData.reduce((sum, day) => sum + day.customers, 0);
    const avgOrderValue = totalSales / totalOrders;
    
    // Previous period comparison (mock)
    const prevTotalSales = totalSales * 0.85; // 15% growth
    const salesGrowth = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
    
    return {
      totalSales,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      salesGrowth,
      orderGrowth: 12.5,
      customerGrowth: 8.3
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'success.main' : 'error.main';
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Comprehensive business intelligence and performance analytics"
      />

      {/* Date Range Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={dateRange}
            label="Time Period"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
            <MenuItem value="1y">Last Year</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>View</InputLabel>
          <Select
            value={selectedPeriod}
            label="View"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Export Report
        </Button>
      </Box>

      {/* Key Performance Indicators */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {formatCurrency(keyMetrics.totalSales)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getGrowthIcon(keyMetrics.salesGrowth)}
                  <Typography 
                    variant="body2" 
                    color={getGrowthColor(keyMetrics.salesGrowth)}
                    sx={{ ml: 0.5 }}
                  >
                    {formatPercentage(keyMetrics.salesGrowth)}
                  </Typography>
                </Box>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {keyMetrics.totalOrders.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getGrowthIcon(keyMetrics.orderGrowth)}
                  <Typography 
                    variant="body2" 
                    color={getGrowthColor(keyMetrics.orderGrowth)}
                    sx={{ ml: 0.5 }}
                  >
                    {formatPercentage(keyMetrics.orderGrowth)}
                  </Typography>
                </Box>
              </Box>
              <ShoppingCartIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Unique Customers
                </Typography>
                <Typography variant="h4">
                  {keyMetrics.totalCustomers}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {getGrowthIcon(keyMetrics.customerGrowth)}
                  <Typography 
                    variant="body2" 
                    color={getGrowthColor(keyMetrics.customerGrowth)}
                    sx={{ ml: 0.5 }}
                  >
                    {formatPercentage(keyMetrics.customerGrowth)}
                  </Typography>
                </Box>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Avg Order Value
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(keyMetrics.avgOrderValue)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    vs last period
                  </Typography>
                </Box>
              </Box>
              <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Sales Analytics" />
            <Tab label="Product Performance" />
            <Tab label="Customer Insights" />
            <Tab label="Inventory Reports" />
          </Tabs>
        </Box>

        {/* Sales Analytics Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Sales Performance Overview
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3, mb: 3 }}>
            {/* Sales Trend Chart Placeholder */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TimelineIcon color="primary" />
                  <Typography variant="h6">Sales Trend</Typography>
                </Box>
                <Box sx={{ 
                  height: 250, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography color="text.secondary">
                    Sales trend chart would be displayed here
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Sales by Category */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PieChartIcon color="secondary" />
                  <Typography variant="h6">Sales by Category</Typography>
                </Box>
                <Box sx={{ 
                  height: 250, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography color="text.secondary">
                    Category pie chart would be displayed here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Daily Sales Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Sales Breakdown
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Sales</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Orders</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Customers</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSalesData.daily.map((day, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="body2">
                            {formatDate(day.date)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(day.sales)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {day.orders}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {day.customers}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(day.sales / day.orders)}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Product Performance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Product Performance Analysis
          </Typography>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Products
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Units Sold</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProductPerformance.map((product, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="subtitle2">
                            {product.name}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Chip 
                            label={product.category} 
                            size="small" 
                            variant="outlined"
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(product.sales)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {product.units}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(product.sales / product.units)}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Customer Insights Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Customer Behavior & Segmentation
          </Typography>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Segments
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Segment</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Customers</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCustomerSegments.map((segment, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="subtitle2">
                            {segment.segment}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {segment.count}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(segment.revenue)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(segment.avgOrder)}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Inventory Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Inventory Performance & Turnover
          </Typography>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Performance
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Turnover Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Inventory Value</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Fast Moving Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInventoryTurnover.map((category, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="subtitle2">
                            {category.category}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Chip 
                            label={`${category.turnover}x`} 
                            color={category.turnover > 8 ? 'success' : category.turnover > 5 ? 'warning' : 'error'}
                            size="small"
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(category.value)}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Typography variant="body2">
                            {category.fastMoving} items
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Card>
    </Box>
  );
}