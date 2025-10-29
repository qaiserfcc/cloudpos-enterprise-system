import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Clear as ClearIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  AttachMoney as CashIcon,
  Scanner as ScannerIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import {
  Product,
  Customer,
  Sale,
  SaleItem,
  PaymentMethod
} from '@cloudpos/types';

interface SalesManagementPageProps {}

interface CartItem extends SaleItem {
  product: Product;
}

interface SaleFormData {
  customerId?: string;
  paymentMethod: PaymentMethod;
  discount: number;
  discountType: 'percentage' | 'fixed';
  notes: string;
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
    unit: 'piece',
    status: 'active',
    description: 'Latest iPhone with Pro features',
    barcode: '123456789012',
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
    unit: 'piece',
    status: 'active',
    description: 'Samsung flagship smartphone',
    barcode: '123456789013',
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
    stock: 50,
    stockStatus: 'in_stock',
    minStock: 20,
    unit: 'kg',
    status: 'active',
    description: 'Premium organic coffee beans',
    barcode: '123456789014',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '4',
    name: 'Wireless Headphones',
    sku: 'WH-1000XM5',
    category: 'Electronics',
    categoryId: '1',
    price: 299.99,
    cost: 180.00,
    stock: 25,
    stockStatus: 'in_stock',
    minStock: 15,
    unit: 'piece',
    status: 'active',
    description: 'Noise-canceling wireless headphones',
    barcode: '123456789015',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  }
];

const mockCustomers: Customer[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    loyaltyPoints: 250,
    totalPurchases: 1250.00,
    averageOrderValue: 85.50,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0124',
    loyaltyPoints: 180,
    totalPurchases: 890.00,
    averageOrderValue: 95.20,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  }
];

const mockRecentSales: Sale[] = [
  {
    id: '1',
    transactionNumber: 'TXN-2024-001',
    customerId: '1',
    cashierId: 'cashier1',
    items: [
      { id: '1', productId: '1', quantity: 1, unitPrice: 999.99, discount: 0, total: 999.99 }
    ],
    subtotal: 999.99,
    tax: 80.00,
    discount: 0,
    total: 1079.99,
    paymentMethod: 'card',
    paymentStatus: 'completed',
    status: 'completed',
    createdAt: '2024-10-29T10:00:00Z',
    updatedAt: '2024-10-29T10:00:00Z'
  },
  {
    id: '2',
    transactionNumber: 'TXN-2024-002',
    customerId: '2',
    cashierId: 'cashier1',
    items: [
      { id: '2', productId: '3', quantity: 2, unitPrice: 24.99, discount: 0, total: 49.98 }
    ],
    subtotal: 49.98,
    tax: 4.00,
    discount: 5.00,
    total: 48.98,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    status: 'completed',
    createdAt: '2024-10-29T09:30:00Z',
    updatedAt: '2024-10-29T09:30:00Z'
  }
];

export default function SalesManagementPage({}: SalesManagementPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    paymentMethod: 'cash',
    discount: 0,
    discountType: 'fixed',
    notes: ''
  });
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
  }, [searchTerm]);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = saleFormData.discountType === 'percentage' 
      ? (subtotal * saleFormData.discount / 100)
      : saleFormData.discount;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * 0.08; // 8% tax rate
    const total = discountedSubtotal + tax;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      tax,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart, saleFormData.discount, saleFormData.discountType]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more items than available in stock');
        return;
      }
      
      setCart(prev => prev.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * item.unitPrice
            }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            quantity,
            total: quantity * item.unitPrice
          }
        : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSaleFormData({
      paymentMethod: 'cash',
      discount: 0,
      discountType: 'fixed',
      notes: ''
    });
  };

  // Process barcode scan
  const handleBarcodeSubmit = () => {
    const product = mockProducts.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('Product not found');
    }
  };

  // Process sale
  const processSale = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const sale: Sale = {
      id: Date.now().toString(),
      transactionNumber: `TXN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomer?.id,
      cashierId: 'current-user',
      items: cart.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total
      })),
      subtotal: cartTotals.subtotal,
      tax: cartTotals.tax,
      discount: cartTotals.discountAmount,
      total: cartTotals.total,
      paymentMethod: saleFormData.paymentMethod,
      paymentStatus: 'completed',
      status: 'completed',
      notes: saleFormData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentSale(sale);
    setShowReceipt(true);
    setOpenPaymentDialog(false);
    clearCart();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <CashIcon />;
      case 'card': return <CardIcon />;
      case 'digital_wallet': return <WalletIcon />;
      default: return <PaymentIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Sales Management" 
        subtitle="Point of Sale interface for transactions and customer management"
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Product Selection Panel */}
        <Box sx={{ flex: '1 1 60%', minWidth: '600px' }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ minWidth: 300 }}
                />
                
                <TextField
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                  InputProps={{
                    startAdornment: <ScannerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ minWidth: 200 }}
                />

                <Button
                  variant="outlined"
                  startIcon={<ScannerIcon />}
                  onClick={handleBarcodeSubmit}
                  disabled={!barcodeInput.trim()}
                >
                  Add
                </Button>
              </Box>

              {/* Product Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: 2,
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { boxShadow: 4 },
                      opacity: product.stock <= 0 ? 0.5 : 1
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        SKU: {product.sku}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {product.stock} {product.unit}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(product.price)}
                        </Typography>
                        <Chip
                          label={product.stockStatus.replace('_', ' ').toUpperCase()}
                          color={
                            product.stockStatus === 'in_stock' ? 'success' :
                            product.stockStatus === 'low_stock' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Cart Panel */}
        <Box sx={{ flex: '1 1 35%', minWidth: '400px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Shopping Cart
                  <Badge badgeContent={cartTotals.itemCount} color="primary" sx={{ ml: 1 }}>
                    <CartIcon />
                  </Badge>
                </Typography>
                <IconButton onClick={clearCart} disabled={cart.length === 0}>
                  <ClearIcon />
                </IconButton>
              </Box>

              {/* Customer Selection */}
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonIcon />}
                  onClick={() => setOpenCustomerDialog(true)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {selectedCustomer ? 
                    `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 
                    'Select Customer (Optional)'
                  }
                </Button>
              </Box>

              {/* Cart Items */}
              <Box sx={{ mb: 2, maxHeight: '40vh', overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Cart is empty
                  </Typography>
                ) : (
                  cart.map((item) => (
                    <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {item.product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.unitPrice)} each
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {formatCurrency(item.total)}
                          </Typography>
                          <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {/* Discount Section */}
              {cart.length > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Discount
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      value={saleFormData.discount}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                      sx={{ width: 100 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={saleFormData.discountType}
                        onChange={(e) => setSaleFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                      >
                        <MenuItem value="fixed">$</MenuItem>
                        <MenuItem value="percentage">%</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}

              {/* Cart Totals */}
              {cart.length > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>{formatCurrency(cartTotals.subtotal)}</Typography>
                  </Box>
                  {cartTotals.discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="error">Discount:</Typography>
                      <Typography color="error">-{formatCurrency(cartTotals.discountAmount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax (8%):</Typography>
                    <Typography>{formatCurrency(cartTotals.tax)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(cartTotals.total)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Checkout Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PaymentIcon />}
                onClick={() => setOpenPaymentDialog(true)}
                disabled={cart.length === 0}
                sx={{ mb: 2 }}
              >
                Checkout
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sales
              </Typography>
              {mockRecentSales.map((sale) => (
                <Box key={sale.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    {sale.transactionNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(sale.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle2">
                      {formatCurrency(sale.total)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPaymentMethodIcon(sale.paymentMethod)}
                      <Chip 
                        label={sale.status.toUpperCase()} 
                        color="success" 
                        size="small" 
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Customer Selection Dialog */}
      <Dialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {mockCustomers.map((customer) => (
              <Box 
                key={customer.id} 
                sx={{ 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setOpenCustomerDialog(false);
                }}
              >
                <Typography variant="subtitle1">
                  {customer.firstName} {customer.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {customer.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Loyalty Points: {customer.loyaltyPoints}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            setSelectedCustomer(null);
            setOpenCustomerDialog(false);
          }}>No Customer</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={saleFormData.paymentMethod}
                label="Payment Method"
                onChange={(e) => setSaleFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="digital_wallet">Digital Wallet</MenuItem>
                <MenuItem value="store_credit">Store Credit</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={saleFormData.notes}
              onChange={(e) => setSaleFormData(prev => ({ ...prev, notes: e.target.value }))}
            />

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" color="primary">
                Total: {formatCurrency(cartTotals.total)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={processSale}>
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onClose={() => setShowReceipt(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Receipt</DialogTitle>
        <DialogContent>
          {currentSale && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" align="center" gutterBottom>
                CloudPOS Receipt
              </Typography>
              <Typography align="center" color="text.secondary" gutterBottom>
                Transaction: {currentSale.transactionNumber}
              </Typography>
              <Typography align="center" color="text.secondary" gutterBottom>
                {formatDate(currentSale.createdAt)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {currentSale.items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography>{mockProducts.find(p => p.id === item.productId)?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Typography>
                  </Box>
                  <Typography>{formatCurrency(item.total)}</Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(currentSale.subtotal)}</Typography>
              </Box>
              {currentSale.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="error">Discount:</Typography>
                  <Typography color="error">-{formatCurrency(currentSale.discount)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax:</Typography>
                <Typography>{formatCurrency(currentSale.tax)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatCurrency(currentSale.total)}</Typography>
              </Box>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Method: {currentSale.paymentMethod.replace('_', ' ').toUpperCase()}
                </Typography>
                {selectedCustomer && (
                  <Typography variant="body2" color="text.secondary">
                    Customer: {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PrintIcon />}>Print</Button>
          <Button startIcon={<EmailIcon />}>Email</Button>
          <Button variant="contained" onClick={() => setShowReceipt(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}