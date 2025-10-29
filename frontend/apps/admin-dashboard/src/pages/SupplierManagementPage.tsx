import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import type {
  Supplier,
  SupplierPerformance,
  SupplierCategory,
  PurchaseOrder,
  PurchaseOrderStatus
} from '@cloudpos/types';

interface SupplierManagementPageProps {}

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
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data
const mockCategories: SupplierCategory[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    isActive: true,
    supplierCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Food & Beverages',
    description: 'Food items and beverages',
    isActive: true,
    supplierCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Clothing & Accessories',
    description: 'Apparel and fashion accessories',
    isActive: true,
    supplierCount: 6,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'TechHub Electronics Ltd.',
    contactPerson: 'John Smith',
    email: 'orders@techhub.com',
    phone: '+1-555-0301',
    address: {
      street: '123 Technology Ave',
      city: 'Silicon Valley',
      state: 'CA',
      zipCode: '94025',
      country: 'USA'
    },
    paymentTerms: 'Net 30 days',
    taxId: 'TAX-001234567',
    website: 'https://techhub.com',
    notes: 'Reliable electronics supplier',
    status: 'active' as const,
    rating: 4.6,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '2',
    name: 'Global Food Solutions',
    contactPerson: 'Maria Garcia',
    email: 'procurement@globalfood.com',
    phone: '+1-555-0302',
    address: {
      street: '456 Commerce Blvd',
      city: 'Food District',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    paymentTerms: 'Net 15 days with 2% discount',
    taxId: 'TAX-002345678',
    website: 'https://globalfood.com',
    notes: 'Fresh food supplier',
    status: 'active' as const,
    rating: 4.7,
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '3',
    name: 'Fashion Forward Inc.',
    contactPerson: 'David Chen',
    email: 'sales@fashionforward.com',
    phone: '+1-555-0303',
    address: {
      street: '789 Style Street',
      city: 'Fashion District',
      state: 'LA',
      zipCode: '90028',
      country: 'USA'
    },
    paymentTerms: 'Cash on Delivery',
    taxId: 'TAX-003456789',
    website: 'https://fashionforward.com',
    notes: 'Fashion and clothing supplier',
    status: 'active' as const,
    rating: 4.3,
    createdAt: '2023-03-05T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '4',
    name: 'Premium Beverages Co.',
    contactPerson: 'Sarah Johnson',
    email: 'orders@premiumbev.com',
    phone: '+1-555-0304',
    address: {
      street: '321 Beverage Way',
      city: 'Drink City',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    },
    taxId: 'TAX-004567890',
    paymentTerms: 'Net 45 days',
    notes: 'Premium beverage supplier',
    status: 'active' as const,
    rating: 4.1,
    createdAt: '2023-04-12T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '5',
    name: 'Smart Home Devices',
    contactPerson: 'Alex Kim',
    email: 'wholesale@smarthome.com',
    phone: '+1-555-0305',
    address: {
      street: '654 Innovation Drive',
      city: 'Tech Valley',
      state: 'WA',
      zipCode: '98001',
      country: 'USA'
    },
    website: 'https://smarthome.com',
    taxId: 'TAX-005678901',
    paymentTerms: 'Net 30 days',
    notes: 'Smart home devices supplier',
    status: 'inactive' as const,
    rating: 3.8,
    createdAt: '2023-05-20T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  }
];

const mockPerformance: SupplierPerformance[] = [
  {
    id: '1',
    supplierId: '1',
    evaluationPeriod: {
      startDate: '2024-07-01',
      endDate: '2024-09-30'
    },
    qualityRating: 4.8,
    deliveryRating: 4.5,
    serviceRating: 4.7,
    priceRating: 4.2,
    overallRating: 4.6,
    totalOrders: 25,
    onTimeDeliveries: 23,
    qualityIssues: 1,
    averageDeliveryDays: 3.2,
    totalOrderValue: 125000,
    returnedItems: 2,
    comments: 'Excellent quality and service. Minor delivery delays.',
    evaluatedBy: 'EMP001',
    evaluatedAt: '2024-10-01T00:00:00Z',
    createdAt: '2024-10-01T00:00:00Z'
  },
  {
    id: '2',
    supplierId: '2',
    evaluationPeriod: {
      startDate: '2024-07-01',
      endDate: '2024-09-30'
    },
    qualityRating: 4.9,
    deliveryRating: 4.8,
    serviceRating: 4.6,
    priceRating: 4.4,
    overallRating: 4.7,
    totalOrders: 18,
    onTimeDeliveries: 18,
    qualityIssues: 0,
    averageDeliveryDays: 2.1,
    totalOrderValue: 85000,
    returnedItems: 0,
    comments: 'Outstanding performance across all metrics.',
    evaluatedBy: 'EMP001',
    evaluatedAt: '2024-10-01T00:00:00Z',
    createdAt: '2024-10-01T00:00:00Z'
  }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    supplierId: '1',
    supplierName: 'TechHub Electronics Ltd.',
    items: [],
    subtotal: 12500,
    tax: 1000,
    total: 13500,
    status: 'received' as PurchaseOrderStatus,
    orderDate: '2024-10-15',
    expectedDeliveryDate: '2024-10-25',
    actualDeliveryDate: '2024-10-26',
    notes: 'Electronics purchase for Q4',
    createdBy: 'EMP001',
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-26T00:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    supplierId: '2',
    supplierName: 'Global Food Solutions',
    items: [],
    subtotal: 8500,
    tax: 680,
    total: 9180,
    status: 'pending' as PurchaseOrderStatus,
    orderDate: '2024-10-28',
    expectedDeliveryDate: '2024-11-05',
    notes: 'Food items restock',
    createdBy: 'EMP001',
    createdAt: '2024-10-28T00:00:00Z',
    updatedAt: '2024-10-28T00:00:00Z'
  }
];

export default function SupplierManagementPage({}: SupplierManagementPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter suppliers based on search and filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const searchMatch = searchTerm === '' || 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === '' || 
        (statusFilter === 'active' && supplier.status === 'active') ||
        (statusFilter === 'inactive' && supplier.status === 'inactive');
      
      return searchMatch && statusMatch;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Calculate key metrics
  const supplierMetrics = useMemo(() => {
    const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
    const totalOrders = mockPurchaseOrders.length;
    const avgPerformance = mockPerformance.reduce((sum, perf) => sum + perf.overallRating, 0) / mockPerformance.length || 0;
    const totalOrderValue = mockPurchaseOrders.reduce((sum, order) => sum + order.total, 0);
    const onTimeDeliveryRate = mockPerformance.reduce((sum, perf) => sum + (perf.onTimeDeliveries / perf.totalOrders), 0) / mockPerformance.length * 100 || 0;
    
    return {
      activeSuppliers,
      totalOrders,
      avgPerformance,
      totalOrderValue,
      onTimeDeliveryRate
    };
  }, [suppliers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'success' : 'error';
    }
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'error',
      pending: 'warning',
      approved: 'info',
      received: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 4.0) return 'warning';
    if (rating >= 3.5) return 'info';
    return 'error';
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsSupplierDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierDialogOpen(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
  };

  const handleCloseSupplierDialog = () => {
    setIsSupplierDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Supplier Management" 
        subtitle="Manage suppliers, contacts, contracts, and performance"
      />

      {/* Key Metrics Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Suppliers
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {supplierMetrics.activeSuppliers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {suppliers.length - supplierMetrics.activeSuppliers} inactive
                </Typography>
              </Box>
              <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                  {supplierMetrics.totalOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This quarter
                </Typography>
              </Box>
              <ShippingIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Avg Performance
                </Typography>
                <Typography variant="h4" color="success.main">
                  {supplierMetrics.avgPerformance.toFixed(1)}/5.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall rating
                </Typography>
              </Box>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Order Value
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(supplierMetrics.totalOrderValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This quarter
                </Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {mockCategories.map(category => (
              <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
        >
          Add Supplier
        </Button>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Supplier Directory" />
            <Tab label="Performance Analytics" />
            <Tab label="Purchase Orders" />
            <Tab label="Categories" />
          </Tabs>
        </Box>

        {/* Supplier Directory Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {supplier.name}
                        </Typography>
                        <Chip
                          label={supplier.status === 'active' ? 'Active' : 'Inactive'}
                          size="small"
                          color={getStatusColor(supplier.status) as any}
                        />
                      </Box>
                      
                      {supplier.contactPerson && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {supplier.contactPerson}
                          </Typography>
                        </Box>
                      )}
                      
                      {supplier.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {supplier.email}
                          </Typography>
                        </Box>
                      )}
                      
                      {supplier.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {supplier.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {supplier.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Typography variant="body2" color="text.secondary">
                            {supplier.address.street}, {supplier.address.city}, {supplier.address.state} {supplier.address.zipCode}, {supplier.address.country}
                          </Typography>
                        </Box>
                      )}
                      
                      {supplier.paymentTerms && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Payment Terms:</strong> {supplier.paymentTerms}
                          </Typography>
                        </Box>
                      )}
                      
                      {supplier.website && (
                        <Typography variant="body2" color="primary.main" sx={{ mb: 1 }}>
                          {supplier.website}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewSupplier(supplier)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Supplier">
                        <IconButton size="small" onClick={() => handleEditSupplier(supplier)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Supplier">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Since {formatDate(supplier.createdAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          {filteredSuppliers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No suppliers found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search criteria or add a new supplier.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Performance Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2 }}>
            {mockPerformance.map((performance) => {
              const supplier = suppliers.find(s => s.id === performance.supplierId);
              return (
                <Card key={performance.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{supplier?.name}</Typography>
                      <Chip
                        label={`${performance.overallRating.toFixed(1)}/5.0`}
                        color={getPerformanceColor(performance.overallRating) as any}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Evaluation Period: {formatDate(performance.evaluationPeriod.startDate)} - {formatDate(performance.evaluationPeriod.endDate)}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Quality</Typography>
                        <Typography variant="body2">{performance.qualityRating}/5.0</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={performance.qualityRating * 20} 
                        color={getPerformanceColor(performance.qualityRating) as any}
                        sx={{ mb: 1 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Delivery</Typography>
                        <Typography variant="body2">{performance.deliveryRating}/5.0</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={performance.deliveryRating * 20} 
                        color={getPerformanceColor(performance.deliveryRating) as any}
                        sx={{ mb: 1 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Service</Typography>
                        <Typography variant="body2">{performance.serviceRating}/5.0</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={performance.serviceRating * 20} 
                        color={getPerformanceColor(performance.serviceRating) as any}
                        sx={{ mb: 1 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Price</Typography>
                        <Typography variant="body2">{performance.priceRating}/5.0</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={performance.priceRating * 20} 
                        color={getPerformanceColor(performance.priceRating) as any}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                        <Typography variant="subtitle2">{performance.totalOrders}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">On-Time Rate</Typography>
                        <Typography variant="subtitle2">
                          {((performance.onTimeDeliveries / performance.totalOrders) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Order Value</Typography>
                        <Typography variant="subtitle2">{formatCurrency(performance.totalOrderValue)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Avg Delivery</Typography>
                        <Typography variant="subtitle2">{performance.averageDeliveryDays} days</Typography>
                      </Box>
                    </Box>
                    
                    {performance.comments && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Comments</Typography>
                        <Typography variant="body2">{performance.comments}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </TabPanel>

        {/* Purchase Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            {mockPurchaseOrders.map((order) => (
              <Card key={order.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{order.orderNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.supplierName}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status) as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(150px, 1fr))', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Order Total</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(order.total)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Expected Delivery</Typography>
                      <Typography variant="body2">
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Actual Delivery</Typography>
                      <Typography variant="body2">
                        {order.actualDeliveryDate ? formatDate(order.actualDeliveryDate) : 'Pending'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
                    </Box>
                  </Box>
                  
                  {order.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Notes</Typography>
                      <Typography variant="body2">{order.notes}</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined">
                      View Details
                    </Button>
                    {order.status === 'pending' && (
                      <Button size="small" variant="contained">
                        Process Order
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Categories Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(300px, 1fr))', gap: 2 }}>
            {mockCategories.map((category) => (
              <Card key={category.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{category.name}</Typography>
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  {category.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {category.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {category.supplierCount} suppliers
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>
      </Card>

      {/* Supplier Details Dialog */}
      <Dialog
        open={Boolean(viewingSupplier)}
        onClose={() => setViewingSupplier(null)}
        maxWidth="md"
        fullWidth
      >
        {viewingSupplier && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">{viewingSupplier.name}</Typography>
                <Chip
                  label={viewingSupplier.status === 'active' ? 'Active' : 'Inactive'}
                  color={getStatusColor(viewingSupplier.status) as any}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                  <Typography variant="body2">Contact: {viewingSupplier.contactPerson || 'N/A'}</Typography>
                  <Typography variant="body2">Email: {viewingSupplier.email || 'N/A'}</Typography>
                  <Typography variant="body2">Phone: {viewingSupplier.phone || 'N/A'}</Typography>
                  <Typography variant="body2">Website: {viewingSupplier.website || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Business Details</Typography>
                  <Typography variant="body2">Tax ID: {viewingSupplier.taxId || 'N/A'}</Typography>
                  <Typography variant="body2">Payment Terms: {viewingSupplier.paymentTerms || 'N/A'}</Typography>
                  <Typography variant="body2">Status: {viewingSupplier.status === 'active' ? 'Active' : 'Inactive'}</Typography>
                  <Typography variant="body2">Member Since: {formatDate(viewingSupplier.createdAt)}</Typography>
                </Box>
              </Box>
              {viewingSupplier.address && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Address</Typography>
                  <Typography variant="body2">
                    {viewingSupplier.address.street}, {viewingSupplier.address.city}, {viewingSupplier.address.state} {viewingSupplier.address.zipCode}, {viewingSupplier.address.country}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewingSupplier(null)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setViewingSupplier(null);
                  handleEditSupplier(viewingSupplier);
                }}
              >
                Edit Supplier
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={isSupplierDialogOpen}
        onClose={handleCloseSupplierDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Supplier form would be implemented here with all necessary fields
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSupplierDialog}>Cancel</Button>
          <Button variant="contained">
            {editingSupplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}