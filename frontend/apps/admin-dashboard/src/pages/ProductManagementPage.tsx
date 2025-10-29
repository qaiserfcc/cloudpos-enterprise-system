import React, { useState } from 'react';
import {
  Box,
  Paper,
  Chip,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  Typography,
  InputAdornment,
  Tabs,
  Tab,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PhotoCamera as PhotoIcon,
  QrCodeScanner as BarcodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  ShoppingCart as ProductIcon,
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import { Product, Category, ProductStatus, StockStatus } from '@cloudpos/types';

// Mock categories data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Food & Beverages',
    description: 'Food and drink items',
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    isActive: true,
    sortOrder: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock products data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    description: 'Latest Apple smartphone with advanced features',
    sku: 'APL-IP15P-128',
    barcode: '123456789012',
    price: 999.99,
    costPrice: 750.00,
    categoryId: '1',
    category: mockCategories[0],
    brand: 'Apple',
    quantity: 25,
    minStockLevel: 5,
    maxStockLevel: 100,
    status: 'active',
    isActive: true,
    images: ['/images/iphone15pro.jpg'],
    tags: ['smartphone', 'apple', 'premium'],
    supplier: 'Apple Inc.',
    taxRate: 0.08,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    description: 'High-performance Android smartphone',
    sku: 'SAM-GS24-256',
    barcode: '234567890123',
    price: 899.99,
    costPrice: 650.00,
    categoryId: '1',
    category: mockCategories[0],
    brand: 'Samsung',
    quantity: 3,
    minStockLevel: 5,
    maxStockLevel: 80,
    status: 'active',
    isActive: true,
    images: ['/images/galaxys24.jpg'],
    tags: ['smartphone', 'android', 'samsung'],
    supplier: 'Samsung Electronics',
    taxRate: 0.08,
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  {
    id: '3',
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes',
    sku: 'NIKE-AM270-42',
    barcode: '345678901234',
    price: 150.00,
    costPrice: 90.00,
    categoryId: '2',
    category: mockCategories[1],
    brand: 'Nike',
    quantity: 0,
    minStockLevel: 10,
    maxStockLevel: 50,
    status: 'active',
    isActive: true,
    images: ['/images/nikeairmax.jpg'],
    tags: ['shoes', 'running', 'sport'],
    supplier: 'Nike Inc.',
    taxRate: 0.06,
    createdAt: '2024-01-17T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z',
  },
  {
    id: '4',
    name: 'Organic Coffee Beans',
    description: 'Premium organic coffee beans - 1kg bag',
    sku: 'COF-ORG-1KG',
    barcode: '456789012345',
    price: 24.99,
    costPrice: 15.00,
    categoryId: '3',
    category: mockCategories[2],
    brand: 'Green Mountain',
    quantity: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    status: 'active',
    isActive: true,
    images: ['/images/coffee.jpg'],
    tags: ['coffee', 'organic', 'beverage'],
    supplier: 'Green Mountain Coffee',
    taxRate: 0.04,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: '5',
    name: 'Vintage Lamp',
    description: 'Retro style table lamp - discontinued model',
    sku: 'HOME-LAMP-VTG',
    barcode: '567890123456',
    price: 89.99,
    costPrice: 45.00,
    categoryId: '4',
    category: mockCategories[3],
    brand: 'HomeStyle',
    quantity: 2,
    minStockLevel: 0,
    maxStockLevel: 10,
    status: 'discontinued',
    isActive: false,
    images: ['/images/lamp.jpg'],
    tags: ['lamp', 'home', 'vintage'],
    supplier: 'HomeStyle Furnishings',
    taxRate: 0.08,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-19T00:00:00Z',
  },
];

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  categoryId: string;
  brand: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  status: ProductStatus;
  tags: string[];
  supplier: string;
  taxRate: number;
}

interface ProductFormErrors {
  name?: string;
  sku?: string;
  price?: string;
  costPrice?: string;
  categoryId?: string;
  quantity?: string;
  minStockLevel?: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  sku: '',
  barcode: '',
  price: 0,
  costPrice: 0,
  categoryId: '',
  brand: '',
  quantity: 0,
  minStockLevel: 0,
  maxStockLevel: 0,
  status: 'active',
  tags: [],
  supplier: '',
  taxRate: 0,
};

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
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories] = useState<Category[]>(mockCategories);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);

  // Get stock status
  const getStockStatus = (product: Product): StockStatus => {
    if (product.quantity === 0) return 'out_of_stock';
    if (product.quantity <= product.minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  // Stock status chip colors
  const getStockStatusColor = (status: StockStatus): 'error' | 'warning' | 'success' => {
    switch (status) {
      case 'out_of_stock':
        return 'error';
      case 'low_stock':
        return 'warning';
      case 'in_stock':
        return 'success';
      default:
        return 'success';
    }
  };

  // Product status chip colors
  const getProductStatusColor = (status: ProductStatus): 'success' | 'default' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'discontinued':
        return 'error';
      default:
        return 'default';
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: ProductFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    } else if (products.some(p => p.sku === formData.sku && p.id !== editingProduct?.id)) {
      errors.sku = 'SKU already exists';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (formData.costPrice < 0) {
      errors.costPrice = 'Cost price cannot be negative';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    if (formData.minStockLevel < 0) {
      errors.minStockLevel = 'Minimum stock level cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get paginated products
  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Event handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price,
      costPrice: product.costPrice || 0,
      categoryId: product.categoryId,
      brand: product.brand || '',
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel || 0,
      status: product.status,
      tags: product.tags,
      supplier: product.supplier || '',
      taxRate: product.taxRate || 0,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      setProducts(prev => prev.filter(p => p.id !== product.id));
    }
  };

  const handleSaveProduct = () => {
    if (!validateForm()) return;

    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? {
              ...product,
              ...formData,
              category: categories.find(c => c.id === formData.categoryId),
              isActive: formData.status === 'active',
              updatedAt: new Date().toISOString(),
            }
          : product
      ));
    } else {
      // Create new product
      const newProduct: Product = {
        id: (products.length + 1).toString(),
        ...formData,
        category: categories.find(c => c.id === formData.categoryId),
        isActive: formData.status === 'active',
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts(prev => [...prev, newProduct]);
    }

    setOpenDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Quick stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => getStockStatus(p) === 'low_stock').length;
  const outOfStockProducts = products.filter(p => getStockStatus(p) === 'out_of_stock').length;

  return (
    <>
      <PageHeader 
        title="Product Management" 
        subtitle="Manage your product catalog, inventory, and pricing"
        actions={
          <Stack direction="row" spacing={2}>
            <MuiButton
              variant="outlined"
              startIcon={<BarcodeIcon />}
              onClick={() => console.log('Barcode scanner')}
            >
              Scan Barcode
            </MuiButton>
            <MuiButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              Add Product
            </MuiButton>
          </Stack>
        }
      />

      <Box sx={{ p: 3 }}>
        {/* Quick Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3 
        }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {totalProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                </Box>
                <ProductIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {activeProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Products
                  </Typography>
                </Box>
                <CategoryIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {lowStockProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
                <InventoryIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {outOfStockProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                </Box>
                <InventoryIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' },
            gap: 2,
            alignItems: 'center'
          }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="discontinued">Discontinued</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <MuiButton
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => console.log('Advanced filters')}
            >
              Filters
            </MuiButton>
          </Box>
        </Paper>

        {/* Products Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          {product.brand && (
                            <Typography variant="body2" color="text.secondary">
                              {product.brand}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {product.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.category?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(product.price)}
                        </Typography>
                        {product.costPrice && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cost: {formatCurrency(product.costPrice)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {product.quantity} units
                          </Typography>
                          <Chip
                            label={stockStatus.replace('_', ' ').toUpperCase()}
                            color={getStockStatusColor(stockStatus)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          color={getProductStatusColor(product.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(product.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Product">
                            <IconButton 
                              size="small" 
                              onClick={() => console.log('View', product.id)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Product">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditProduct(product)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Product Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="Pricing & Inventory" />
              <Tab label="Additional Details" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  error={!!formErrors.sku}
                  helperText={formErrors.sku}
                  required
                />
                <TextField
                  fullWidth
                  label="Barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end">
                          <BarcodeIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    error={!!formErrors.categoryId}
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProductStatus }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Cost Price"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  error={!!formErrors.costPrice}
                  helperText={formErrors.costPrice}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Current Stock"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                />
                <TextField
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                  error={!!formErrors.minStockLevel}
                  helperText={formErrors.minStockLevel}
                />
                <TextField
                  fullWidth
                  label="Max Stock Level"
                  type="number"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStockLevel: parseInt(e.target.value) || 0 }))}
                />
              </Box>

              <TextField
                fullWidth
                label="Tax Rate"
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ step: 0.01, min: 0, max: 1 }}
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              />

              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                    helperText="Press Enter to add tags"
                  />
                )}
              />

              <Divider />

              <Typography variant="h6">Product Images</Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                }}
              >
                <PhotoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Drag and drop images here, or click to select files
                </Typography>
                <MuiButton variant="outlined" size="small">
                  Choose Files
                </MuiButton>
              </Box>
            </Stack>
          </TabPanel>

          {Object.keys(formErrors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please fix the errors above before saving.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDialog}>
            Cancel
          </MuiButton>
          <MuiButton 
            variant="contained" 
            onClick={handleSaveProduct}
          >
            {editingProduct ? 'Update Product' : 'Create Product'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductManagementPage;