import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  LocalOffer as CouponIcon,
  Discount as DiscountIcon,
  Campaign as CampaignIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';

// Header component for consistent page styling
const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {subtitle}
    </Typography>
  </Box>
);

const PromotionEnginePage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for promotions
  const promotions = [
    {
      id: 'PROMO001',
      name: 'Summer Sale 2024',
      type: 'percentage',
      value: 20,
      status: 'active',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      usage: 157,
      maxUsage: 1000,
      revenue: 15420.50,
      conditions: ['Min order $50', 'Electronics only'],
      description: '20% off all electronics with minimum order of $50'
    },
    {
      id: 'PROMO002',
      name: 'New Customer Welcome',
      type: 'fixed',
      value: 10,
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      usage: 89,
      maxUsage: 500,
      revenue: 890.00,
      conditions: ['First purchase only', 'New customers'],
      description: '$10 off first purchase for new customers'
    },
    {
      id: 'PROMO003',
      name: 'Buy 2 Get 1 Free',
      type: 'bogo',
      value: 0,
      status: 'scheduled',
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      usage: 0,
      maxUsage: 200,
      revenue: 0,
      conditions: ['Fashion items', 'Equal or lesser value'],
      description: 'Buy 2 get 1 free on all fashion items'
    },
    {
      id: 'PROMO004',
      name: 'Flash Friday',
      type: 'percentage',
      value: 30,
      status: 'expired',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      usage: 245,
      maxUsage: 300,
      revenue: 8750.25,
      conditions: ['Friday only', 'Limited time'],
      description: '30% off everything on Fridays'
    }
  ];

  // Mock data for coupons
  const coupons = [
    {
      id: 'COUP001',
      code: 'SAVE20NOW',
      name: 'Save 20% Today',
      type: 'percentage',
      value: 20,
      status: 'active',
      usageCount: 45,
      maxUsage: 100,
      expiryDate: '2024-12-31',
      minOrderValue: 30
    },
    {
      id: 'COUP002',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'fixed',
      value: 10,
      status: 'active',
      usageCount: 23,
      maxUsage: 50,
      expiryDate: '2024-12-31',
      minOrderValue: 25
    },
    {
      id: 'COUP003',
      code: 'FREESHIP',
      name: 'Free Shipping',
      type: 'shipping',
      value: 0,
      status: 'paused',
      usageCount: 78,
      maxUsage: 200,
      expiryDate: '2024-12-31',
      minOrderValue: 50
    }
  ];

  // Mock data for bulk pricing
  const bulkPricingRules = [
    {
      id: 'BULK001',
      name: 'Volume Discount - Electronics',
      category: 'Electronics',
      tiers: [
        { quantity: 5, discount: 5 },
        { quantity: 10, discount: 10 },
        { quantity: 20, discount: 15 }
      ],
      status: 'active'
    },
    {
      id: 'BULK002',
      name: 'Wholesale Pricing - Clothing',
      category: 'Clothing',
      tiers: [
        { quantity: 12, discount: 8 },
        { quantity: 24, discount: 12 },
        { quantity: 50, discount: 18 }
      ],
      status: 'active'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      active: 'success',
      scheduled: 'info',
      paused: 'warning',
      expired: 'error',
      draft: 'default'
    };
    return colors[status] || 'default';
  };

  const getPromotionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      percentage: 'Percentage',
      fixed: 'Fixed Amount',
      bogo: 'BOGO',
      shipping: 'Free Shipping'
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Promotion Engine" 
        subtitle="Create and manage discounts, coupons, bulk pricing, and promotional campaigns"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<DiscountIcon />} label="Promotions" />
            <Tab icon={<CouponIcon />} label="Coupons" />
            <Tab icon={<CartIcon />} label="Bulk Pricing" />
            <Tab icon={<CampaignIcon />} label="Campaigns" />
            <Tab icon={<ReportIcon />} label="Analytics" />
          </Tabs>
        </Box>

        {/* Promotions Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Promotional Offers</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Promotion
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Create and manage promotional offers including percentage discounts, fixed amount discounts, BOGO deals, and seasonal campaigns.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Active Promotions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {promotions.filter(p => p.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently running
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Revenue Impact
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {formatCurrency(promotions.reduce((sum, p) => sum + p.revenue, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From all promotions
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    Total Usage
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {promotions.reduce((sum, p) => sum + p.usage, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Times used
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Promotion</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {promotion.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {promotion.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getPromotionTypeLabel(promotion.type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {promotion.type === 'percentage' ? `${promotion.value}%` : 
                           promotion.type === 'fixed' ? formatCurrency(promotion.value) : 
                           promotion.type === 'bogo' ? 'BOGO' : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                          size="small"
                          color={getStatusColor(promotion.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {promotion.usage} / {promotion.maxUsage}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(promotion.usage / promotion.maxUsage) * 100}
                            sx={{ mt: 0.5, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(promotion.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={promotion.status === 'active' ? 'Pause' : 'Activate'}>
                            <IconButton size="small">
                              {promotion.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Coupons Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Coupon Management</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<CopyIcon />}>
                  Generate Codes
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Create Coupon
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Create and manage coupon codes for customers. Set usage limits, expiry dates, and minimum order requirements.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
              {coupons.map((coupon) => (
                <Card key={coupon.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{coupon.name}</Typography>
                      <Chip 
                        label={coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                        size="small"
                        color={getStatusColor(coupon.status)}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      p: 1, 
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      textAlign: 'center',
                      mb: 2,
                      bgcolor: 'primary.50'
                    }}>
                      <Typography variant="h6" color="primary" fontFamily="monospace">
                        {coupon.code}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Type:</strong> {getPromotionTypeLabel(coupon.type)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Value:</strong> {
                          coupon.type === 'percentage' ? `${coupon.value}%` :
                          coupon.type === 'fixed' ? formatCurrency(coupon.value) :
                          'Free Shipping'
                        }
                      </Typography>
                      <Typography variant="body2">
                        <strong>Min Order:</strong> {formatCurrency(coupon.minOrderValue)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Expires:</strong> {formatDate(coupon.expiryDate)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Usage: {coupon.usageCount} / {coupon.maxUsage}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(coupon.usageCount / coupon.maxUsage) * 100}
                        sx={{ height: 6 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<CopyIcon />}>
                        Copy Code
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Bulk Pricing Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Bulk Pricing Rules</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Bulk Rule
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Set up quantity-based pricing tiers to encourage larger purchases. Configure different discount levels based on purchase quantities.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
              {bulkPricingRules.map((rule) => (
                <Card key={rule.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{rule.name}</Typography>
                      <Chip 
                        label={rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
                        size="small"
                        color={getStatusColor(rule.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Category: {rule.category}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Pricing Tiers:
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Discount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rule.tiers.map((tier, index) => (
                            <TableRow key={index}>
                              <TableCell>{tier.quantity}+ items</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                  {tier.discount}% off
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<TrendingUpIcon />}>
                        Analytics
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Campaigns Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Marketing Campaigns</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Campaign
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Plan and execute comprehensive marketing campaigns combining multiple promotions, targeted customer segments, and scheduled messaging.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Campaign Builder</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Campaign Name"
                      size="small"
                      placeholder="e.g., Back to School 2024"
                    />
                    <FormControl size="small">
                      <InputLabel>Campaign Type</InputLabel>
                      <Select label="Campaign Type">
                        <MenuItem value="seasonal">Seasonal Sale</MenuItem>
                        <MenuItem value="product_launch">Product Launch</MenuItem>
                        <MenuItem value="clearance">Clearance</MenuItem>
                        <MenuItem value="loyalty">Loyalty Program</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControl size="small">
                      <InputLabel>Target Audience</InputLabel>
                      <Select label="Target Audience">
                        <MenuItem value="all">All Customers</MenuItem>
                        <MenuItem value="new">New Customers</MenuItem>
                        <MenuItem value="loyal">Loyal Customers</MenuItem>
                        <MenuItem value="inactive">Inactive Customers</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Campaign Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-apply promotions"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send email notifications"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="SMS notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Track campaign metrics"
                    />
                    <TextField
                      label="Budget Limit"
                      size="small"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                    />
                    <TextField
                      label="Expected ROI (%)"
                      size="small"
                      type="number"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Promotion Mix</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" fullWidth>
                      + Add Discount Promotion
                    </Button>
                    <Button variant="outlined" fullWidth>
                      + Add Coupon Code
                    </Button>
                    <Button variant="outlined" fullWidth>
                      + Add BOGO Offer
                    </Button>
                    <Button variant="outlined" fullWidth>
                      + Add Free Shipping
                    </Button>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Selected Promotions: 0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Impact: —
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained">Save Campaign</Button>
              <Button variant="outlined">Save as Template</Button>
              <Button variant="outlined">Preview Campaign</Button>
            </Box>
          </CardContent>
        )}

        {/* Analytics Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Promotion Analytics</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Savings Given
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $24,560.75
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +18.5% from last month
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Revenue Impact
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $125,430.25
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From promoted sales
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    12.8%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +2.1% improvement
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Average Order Value
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $78.45
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +$15.20 with promotions
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              Promotions are performing well! Your campaigns have increased overall sales by 28.5% and customer engagement by 45% this month.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<ReportIcon />}>
                Generate Detailed Report
              </Button>
              <Button variant="outlined" startIcon={<TrendingUpIcon />}>
                Performance Trends
              </Button>
              <Button variant="outlined" startIcon={<CampaignIcon />}>
                Campaign ROI Analysis
              </Button>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default PromotionEnginePage;