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
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Star as StarIcon,
  History as HistoryIcon,
  ShoppingBag as ShoppingBagIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Mail as MailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import { Customer, Sale } from '@cloudpos/types';

interface CustomerManagementPageProps {}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  birthDate: string;
  notes: string;
}

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
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    birthDate: '1985-06-15',
    loyaltyPoints: 1250,
    totalPurchases: 2500.75,
    averageOrderValue: 125.50,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0124',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    birthDate: '1990-03-22',
    loyaltyPoints: 850,
    totalPurchases: 1890.50,
    averageOrderValue: 95.20,
    isActive: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@email.com',
    phone: '+1-555-0125',
    address: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    birthDate: '1978-11-08',
    loyaltyPoints: 2100,
    totalPurchases: 4200.25,
    averageOrderValue: 150.75,
    isActive: true,
    createdAt: '2023-12-10T10:00:00Z',
    updatedAt: '2024-10-29T08:00:00Z'
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+1-555-0126',
    loyaltyPoints: 420,
    totalPurchases: 680.00,
    averageOrderValue: 68.00,
    isActive: false,
    createdAt: '2024-05-20T10:00:00Z',
    updatedAt: '2024-08-15T08:00:00Z'
  }
];

const mockCustomerSales: { [customerId: string]: Sale[] } = {
  '1': [
    {
      id: 'sale1',
      transactionNumber: 'TXN-2024-001',
      customerId: '1',
      cashierId: 'cashier1',
      items: [],
      subtotal: 125.50,
      tax: 10.04,
      discount: 0,
      total: 135.54,
      paymentMethod: 'card',
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: '2024-10-25T10:00:00Z',
      updatedAt: '2024-10-25T10:00:00Z'
    },
    {
      id: 'sale2',
      transactionNumber: 'TXN-2024-002',
      customerId: '1',
      cashierId: 'cashier2',
      items: [],
      subtotal: 89.99,
      tax: 7.20,
      discount: 5.00,
      total: 92.19,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: '2024-10-20T14:30:00Z',
      updatedAt: '2024-10-20T14:30:00Z'
    }
  ],
  '2': [
    {
      id: 'sale3',
      transactionNumber: 'TXN-2024-003',
      customerId: '2',
      cashierId: 'cashier1',
      items: [],
      subtotal: 199.99,
      tax: 16.00,
      discount: 10.00,
      total: 205.99,
      paymentMethod: 'digital_wallet',
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: '2024-10-22T16:15:00Z',
      updatedAt: '2024-10-22T16:15:00Z'
    }
  ]
};

export default function CustomerManagementPage({}: CustomerManagementPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    birthDate: '',
    notes: ''
  });

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? customer.isActive : !customer.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const inactiveCustomers = customers.filter(c => !c.isActive).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
    const averageOrderValue = customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length;
    const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    
    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalRevenue,
      averageOrderValue,
      totalLoyaltyPoints
    };
  }, [customers]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      birthDate: '',
      notes: ''
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        birthDate: customer.birthDate || '',
        notes: ''
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSaveCustomer = () => {
    if (editingCustomer) {
      // Update existing customer
      setCustomers(prev => prev.map(customer =>
        customer.id === editingCustomer.id
          ? {
              ...customer,
              ...formData,
              updatedAt: new Date().toISOString()
            }
          : customer
      ));
    } else {
      // Add new customer
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData,
        loyaltyPoints: 0,
        totalPurchases: 0,
        averageOrderValue: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    
    setOpenDialog(false);
    resetForm();
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenDetailsDialog(true);
  };

  const getCustomerSales = (customerId: string): Sale[] => {
    return mockCustomerSales[customerId] || [];
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

  const getCustomerInitials = (customer: Customer) => {
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Customer Management" 
        subtitle="Manage customer profiles, purchase history, and loyalty programs"
      />

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4">
                  {stats.totalCustomers}
                </Typography>
              </Box>
              <GroupsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Customers
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.activeCustomers}
                </Typography>
              </Box>
              <Badge badgeContent={stats.activeCustomers} color="success">
                <PersonIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Badge>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                  {formatCurrency(stats.averageOrderValue)}
                </Typography>
              </Box>
              <ShoppingBagIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Loyalty Points
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.totalLoyaltyPoints.toLocaleString()}
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
                  Inactive Customers
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.inactiveCustomers}
                </Typography>
              </Box>
              <PersonIcon sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Customer List" />
            <Tab label="Customer Analytics" />
          </Tabs>
        </Box>

        {/* Customer List Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Customer
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>

            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
            >
              Import
            </Button>
          </Box>

          {/* Customer Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Purchases</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Loyalty Points</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Avg Order Value</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Join Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getCustomerInitials(customer)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {customer.firstName} {customer.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {customer.id}
                          </Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Box>
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{customer.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="primary">
                        {formatCurrency(customer.totalPurchases)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <StarIcon fontSize="small" color="warning" />
                        <Typography variant="subtitle2">
                          {customer.loyaltyPoints}
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {formatCurrency(customer.averageOrderValue)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={customer.isActive ? 'Active' : 'Inactive'}
                        color={getStatusColor(customer.isActive) as any}
                        size="small"
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Typography variant="body2">
                        {formatDate(customer.createdAt)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton size="small" onClick={() => handleViewDetails(customer)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenDialog(customer)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCustomer(customer.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <MailIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </TabPanel>

        {/* Customer Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Customer Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Advanced analytics and insights about customer behavior, purchasing patterns, and loyalty metrics.
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Customers by Revenue
                </Typography>
                <List dense>
                  {customers
                    .sort((a, b) => b.totalPurchases - a.totalPurchases)
                    .slice(0, 5)
                    .map((customer, index) => (
                    <ListItem key={customer.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${customer.firstName} ${customer.lastName}`}
                        secondary={formatCurrency(customer.totalPurchases)}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Loyalty Point Holders
                </Typography>
                <List dense>
                  {customers
                    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                    .slice(0, 5)
                    .map((customer, index) => (
                    <ListItem key={customer.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <StarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${customer.firstName} ${customer.lastName}`}
                        secondary={`${customer.loyaltyPoints} points`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                fullWidth
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                fullWidth
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>
              Address
            </Typography>
            <TextField
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: e.target.value }
              }))}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value }
                }))}
                fullWidth
              />
              <TextField
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: e.target.value }
                }))}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="ZIP Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, zipCode: e.target.value }
                }))}
                fullWidth
              />
              <TextField
                label="Country"
                value={formData.address.country}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, country: e.target.value }
                }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Birth Date"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCustomer}
            disabled={!formData.firstName || !formData.lastName}
          >
            {editingCustomer ? 'Update' : 'Add'} Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Customer Details
          {selectedCustomer && ` - ${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {getCustomerInitials(selectedCustomer)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip 
                      label={selectedCustomer.isActive ? 'Active' : 'Inactive'} 
                      color={getStatusColor(selectedCustomer.isActive) as any}
                    />
                    <Chip 
                      icon={<StarIcon />} 
                      label={`${selectedCustomer.loyaltyPoints} Points`} 
                      color="warning" 
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Purchases
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedCustomer.totalPurchases)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Average Order Value
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(selectedCustomer.averageOrderValue)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Member Since
                      </Typography>
                      <Typography variant="h6">
                        {formatDate(selectedCustomer.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
                {selectedCustomer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography>{selectedCustomer.email}</Typography>
                  </Box>
                )}
                {selectedCustomer.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography>{selectedCustomer.phone}</Typography>
                  </Box>
                )}
                {selectedCustomer.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    <Typography>
                      {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Purchase History
              </Typography>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                {getCustomerSales(selectedCustomer.id).length > 0 ? (
                  getCustomerSales(selectedCustomer.id).map((sale) => (
                    <Card key={sale.id} sx={{ mb: 1, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {sale.transactionNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(sale.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(sale.total)}
                          </Typography>
                          <Chip 
                            label={sale.paymentMethod.toUpperCase()} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Card>
                  ))
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    No purchase history available
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          <Button startIcon={<MailIcon />}>Send Email</Button>
          <Button startIcon={<SmsIcon />}>Send SMS</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}