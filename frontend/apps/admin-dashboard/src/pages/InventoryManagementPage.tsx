import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import {
  Product,
  PurchaseOrder,
  StockMovement,
  InventoryAlert,
  Supplier
} from '@cloudpos/types';

interface InventoryManagementPageProps {}

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    sku: 'IPH15P-256-BLU',
    category: 'Electronics',
    categoryId: '1',
    price: 999.99,
    cost: 750.00,
    stock: 15,
    stockStatus: 'in_stock',
    minStock: 10,
    maxStock: 50,
    reorderPoint: 12,
    reorderQuantity: 25,
    unit: 'piece',
    status: 'active',
    description: 'Latest iPhone with Pro features',
    barcode: '123456789012',
    location: 'A1-B2',
    expiryDate: undefined,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    sku: 'SGS24-128-BLK',
    category: 'Electronics',
    categoryId: '1',
    price: 799.99,
    cost: 600.00,
    stock: 8,
    stockStatus: 'low_stock',
    minStock: 10,
    maxStock: 40,
    reorderPoint: 10,
    reorderQuantity: 20,
    unit: 'piece',
    status: 'active',
    description: 'Samsung flagship smartphone',
    barcode: '123456789013',
    location: 'A1-B3',
    expiryDate: undefined,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '3',
    name: 'Organic Coffee Beans',
    sku: 'COF-ORG-1KG',
    category: 'Food & Beverages',
    categoryId: '3',
    price: 24.99,
    cost: 12.00,
    stock: 0,
    stockStatus: 'out_of_stock',
    minStock: 20,
    maxStock: 100,
    reorderPoint: 25,
    reorderQuantity: 50,
    unit: 'kg',
    status: 'active',
    description: 'Premium organic coffee beans',
    barcode: '123456789014',
    location: 'C2-A1',
    expiryDate: '2025-06-30',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'TechCorp Distributors',
    contactPerson: 'John Smith',
    email: 'orders@techcorp.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    paymentTerms: 'Net 30',
    taxId: 'US123456789',
    website: 'https://techcorp.com',
    status: 'active',
    rating: 4.5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    name: 'Global Coffee Suppliers',
    contactPerson: 'Maria Garcia',
    email: 'supply@globalcoffee.com',
    phone: '+1-555-0124',
    address: {
      street: '456 Bean Avenue',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      country: 'USA'
    },
    paymentTerms: 'Net 15',
    status: 'active',
    rating: 4.8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    supplierId: '1',
    supplierName: 'TechCorp Distributors',
    status: 'pending',
    orderDate: '2024-10-28T10:00:00Z',
    expectedDeliveryDate: '2024-11-05T00:00:00Z',
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'iPhone 15 Pro',
        sku: 'IPH15P-256-BLU',
        quantity: 25,
        unitCost: 750.00,
        totalCost: 18750.00
      }
    ],
    subtotal: 18750.00,
    tax: 1500.00,
    total: 20250.00,
    createdBy: 'admin',
    createdAt: '2024-10-28T10:00:00Z',
    updatedAt: '2024-10-28T10:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    supplierId: '2',
    supplierName: 'Global Coffee Suppliers',
    status: 'ordered',
    orderDate: '2024-10-25T14:00:00Z',
    expectedDeliveryDate: '2024-11-01T00:00:00Z',
    items: [
      {
        id: '2',
        productId: '3',
        productName: 'Organic Coffee Beans',
        sku: 'COF-ORG-1KG',
        quantity: 50,
        unitCost: 12.00,
        totalCost: 600.00
      }
    ],
    subtotal: 600.00,
    tax: 48.00,
    total: 648.00,
    createdBy: 'admin',
    createdAt: '2024-10-25T14:00:00Z',
    updatedAt: '2024-10-25T14:00:00Z'
  }
];

const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    productId: '1',
    productName: 'iPhone 15 Pro',
    sku: 'IPH15P-256-BLU',
    type: 'sale',
    quantity: -2,
    previousStock: 17,
    newStock: 15,
    reference: 'SALE-2024-100',
    createdBy: 'cashier1',
    createdAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Samsung Galaxy S24',
    sku: 'SGS24-128-BLK',
    type: 'sale',
    quantity: -1,
    previousStock: 9,
    newStock: 8,
    reference: 'SALE-2024-101',
    createdBy: 'cashier2',
    createdAt: '2024-10-29T07:30:00Z'
  },
  {
    id: '3',
    productId: '3',
    productName: 'Organic Coffee Beans',
    sku: 'COF-ORG-1KG',
    type: 'sale',
    quantity: -5,
    previousStock: 5,
    newStock: 0,
    reference: 'SALE-2024-102',
    createdBy: 'cashier1',
    createdAt: '2024-10-29T07:00:00Z'
  }
];

const mockInventoryAlerts: InventoryAlert[] = [
  {
    id: '1',
    productId: '2',
    productName: 'Samsung Galaxy S24',
    sku: 'SGS24-128-BLK',
    type: 'low_stock',
    currentStock: 8,
    threshold: 10,
    message: 'Stock level below minimum threshold',
    priority: 'medium',
    acknowledged: false,
    createdAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    productId: '3',
    productName: 'Organic Coffee Beans',
    sku: 'COF-ORG-1KG',
    type: 'out_of_stock',
    currentStock: 0,
    threshold: 20,
    message: 'Product is out of stock',
    priority: 'critical',
    acknowledged: false,
    createdAt: '2024-10-29T07:00:00Z'
  }
];

export default function InventoryManagementPage({}: InventoryManagementPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [openPODialog, setOpenPODialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.stockStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Filter purchase orders
  const filteredPurchaseOrders = useMemo(() => {
    return mockPurchaseOrders.filter(po => {
      const matchesSupplier = supplierFilter === 'all' || po.supplierId === supplierFilter;
      return matchesSupplier;
    });
  }, [supplierFilter]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return mockInventoryAlerts.filter(alert => {
      const matchesFilter = alertFilter === 'all' || alert.type === alertFilter;
      return matchesFilter;
    });
  }, [alertFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = mockProducts.length;
    const lowStockProducts = mockProducts.filter(p => p.stockStatus === 'low_stock').length;
    const outOfStockProducts = mockProducts.filter(p => p.stockStatus === 'out_of_stock').length;
    const totalValue = mockProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const pendingOrders = mockPurchaseOrders.filter(po => po.status === 'pending' || po.status === 'ordered').length;
    const unacknowledgedAlerts = mockInventoryAlerts.filter(alert => !alert.acknowledged).length;
    
    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      pendingOrders,
      unacknowledgedAlerts
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Inventory Management" 
        subtitle="Track stock levels, purchase orders, and inventory movements"
      />

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h4">
                  {stats.totalProducts}
                </Typography>
              </Box>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Low Stock Alerts
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.lowStockProducts}
                </Typography>
              </Box>
              <Badge badgeContent={stats.lowStockProducts} color="warning">
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Badge>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Out of Stock
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.outOfStockProducts}
                </Typography>
              </Box>
              <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Inventory Value
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(stats.totalValue)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Pending Orders
                </Typography>
                <Typography variant="h4">
                  {stats.pendingOrders}
                </Typography>
              </Box>
              <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Alerts
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.unacknowledgedAlerts}
                </Typography>
              </Box>
              <Badge badgeContent={stats.unacknowledgedAlerts} color="error">
                <AssignmentIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Badge>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Inventory Overview" />
            <Tab label="Purchase Orders" />
            <Tab label="Stock Movements" />
            <Tab label="Alerts & Notifications" />
          </Tabs>
        </Box>

        {/* Inventory Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={statusFilter}
                label="Stock Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenPODialog(true)}
            >
              Create Purchase Order
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>

          {/* Product Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Min Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Reorder Point</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Stock Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Value</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.category}
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {product.sku}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography 
                        variant="subtitle2" 
                        color={product.stock <= product.minStock ? 'error.main' : 'text.primary'}
                      >
                        {product.stock} {product.unit}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {product.minStock} {product.unit}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {product.reorderPoint} {product.unit}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={product.stockStatus.replace('_', ' ').toUpperCase()}
                        color={getStockStatusColor(product.stockStatus) as any}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Typography variant="subtitle2">
                        {formatCurrency(product.stock * product.cost)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {product.location || 'N/A'}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Product">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Create Purchase Order">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedProduct(product);
                              setOpenPODialog(true);
                            }}
                          >
                            <ShoppingCartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </TabPanel>

        {/* Purchase Orders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierFilter}
                label="Supplier"
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <MenuItem value="all">All Suppliers</MenuItem>
                {mockSuppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenPODialog(true)}
            >
              New Purchase Order
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export Orders
            </Button>
          </Box>

          {/* Purchase Orders Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Order Number</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Supplier</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Order Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Expected Delivery</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchaseOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="subtitle2">
                        {order.orderNumber}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {order.supplierName}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={order.status.toUpperCase()}
                        color={order.status === 'pending' ? 'warning' : order.status === 'ordered' ? 'info' : 'success'}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {formatDate(order.orderDate)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'TBD'}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Typography variant="subtitle2">
                        {formatCurrency(order.total)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View Order">
                          <IconButton size="small">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Order">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Track Shipment">
                          <IconButton size="small">
                            <ShippingIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </TabPanel>

        {/* Stock Movements Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Stock Movements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track all inventory changes and transactions
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Movement Type</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Quantity Change</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Previous Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>New Stock</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                </tr>
              </thead>
              <tbody>
                {mockStockMovements.map((movement) => (
                  <tr key={movement.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="subtitle2">
                        {movement.productName}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {movement.sku}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={movement.type.toUpperCase()}
                        color={movement.type === 'sale' ? 'error' : movement.type === 'purchase' ? 'success' : 'default'}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography 
                        variant="subtitle2"
                        color={movement.quantity > 0 ? 'success.main' : 'error.main'}
                      >
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {movement.previousStock}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {movement.newStock}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {movement.reference || 'N/A'}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {formatDate(movement.createdAt)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Typography variant="body2">
                        {movement.createdBy}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </TabPanel>

        {/* Alerts & Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={alertFilter}
                label="Alert Type"
                onChange={(e) => setAlertFilter(e.target.value)}
              >
                <MenuItem value="all">All Alerts</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="overstock">Overstock</MenuItem>
                <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export Alerts
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredAlerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={getPriorityColor(alert.priority) === 'error' ? 'error' : 
                         getPriorityColor(alert.priority) === 'warning' ? 'warning' : 'info'}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      // Handle acknowledge alert
                    }}
                  >
                    Acknowledge
                  </Button>
                }
              >
                <Box>
                  <Typography variant="subtitle2">
                    {alert.productName} ({alert.sku})
                  </Typography>
                  <Typography variant="body2">
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Stock: {alert.currentStock} | Created: {formatDate(alert.createdAt)}
                  </Typography>
                </Box>
              </Alert>
            ))}
          </Box>
        </TabPanel>
      </Card>

      {/* Purchase Order Dialog */}
      <Dialog 
        open={openPODialog} 
        onClose={() => setOpenPODialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Purchase Order
          {selectedProduct && ` - ${selectedProduct.name}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                defaultValue=""
                label="Supplier"
              >
                {mockSuppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Expected Delivery Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {selectedProduct && (
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Product: {selectedProduct.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SKU: {selectedProduct.sku} | Current Stock: {selectedProduct.stock}
                </Typography>
                <TextField
                  label="Quantity to Order"
                  type="number"
                  defaultValue={selectedProduct.reorderQuantity || 1}
                  fullWidth
                  sx={{ mt: 1 }}
                />
                <TextField
                  label="Unit Cost"
                  type="number"
                  defaultValue={selectedProduct.cost}
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </Box>
            )}

            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPODialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setOpenPODialog(false);
              setSelectedProduct(null);
            }}
          >
            Create Purchase Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}