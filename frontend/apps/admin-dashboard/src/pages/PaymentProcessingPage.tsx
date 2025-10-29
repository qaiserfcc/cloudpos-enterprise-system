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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  Assessment as ReportIcon,
  DevicesOther as TerminalIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
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

const PaymentProcessingPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for payment methods
  const paymentMethods = [
    {
      id: '1',
      name: 'Cash',
      type: 'cash',
      isActive: true,
      isDefault: true,
      processingTime: 'Instant',
      fees: 0,
      description: 'Traditional cash payments'
    },
    {
      id: '2',
      name: 'Credit/Debit Cards',
      type: 'card',
      isActive: true,
      isDefault: false,
      processingTime: 'Instant',
      fees: 2.9,
      description: 'Visa, MasterCard, American Express'
    },
    {
      id: '3',
      name: 'Apple Pay',
      type: 'mobile_payment',
      isActive: true,
      isDefault: false,
      processingTime: 'Instant',
      fees: 2.6,
      description: 'Contactless mobile payments'
    },
    {
      id: '4',
      name: 'Google Pay',
      type: 'mobile_payment',
      isActive: true,
      isDefault: false,
      processingTime: 'Instant',
      fees: 2.6,
      description: 'Google digital wallet'
    },
    {
      id: '5',
      name: 'PayPal',
      type: 'digital_wallet',
      isActive: false,
      isDefault: false,
      processingTime: '1-3 business days',
      fees: 3.49,
      description: 'Online payment platform'
    }
  ];

  // Mock data for recent transactions
  const recentTransactions = [
    {
      id: 'TXN001',
      amount: 125.50,
      method: 'Credit Card',
      status: 'completed',
      timestamp: '2024-01-15 14:30:22',
      reference: 'AUTH123456'
    },
    {
      id: 'TXN002',
      amount: 89.99,
      method: 'Apple Pay',
      status: 'completed',
      timestamp: '2024-01-15 14:25:15',
      reference: 'AUTH123457'
    },
    {
      id: 'TXN003',
      amount: 45.00,
      method: 'Cash',
      status: 'completed',
      timestamp: '2024-01-15 14:20:08',
      reference: 'CASH001'
    },
    {
      id: 'TXN004',
      amount: 200.00,
      method: 'Credit Card',
      status: 'failed',
      timestamp: '2024-01-15 14:15:33',
      reference: 'AUTH123458'
    },
    {
      id: 'TXN005',
      amount: 75.25,
      method: 'Google Pay',
      status: 'pending',
      timestamp: '2024-01-15 14:10:45',
      reference: 'AUTH123459'
    }
  ];

  // Mock data for payment terminals
  const paymentTerminals = [
    {
      id: 'TERM001',
      name: 'Main Counter Terminal',
      model: 'Square Terminal',
      status: 'online',
      lastHeartbeat: '2024-01-15 14:35:00',
      batteryLevel: 85,
      location: 'Counter 1'
    },
    {
      id: 'TERM002',
      name: 'Mobile Terminal 1',
      model: 'Square Reader',
      status: 'online',
      lastHeartbeat: '2024-01-15 14:34:45',
      batteryLevel: 62,
      location: 'Mobile'
    },
    {
      id: 'TERM003',
      name: 'Self-Checkout Terminal',
      model: 'Square Stand',
      status: 'offline',
      lastHeartbeat: '2024-01-15 13:15:22',
      batteryLevel: null,
      location: 'Self-Checkout'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
      online: 'success',
      offline: 'error',
      busy: 'warning'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'online':
        return <CheckCircleIcon fontSize="small" />;
      case 'failed':
      case 'offline':
        return <ErrorIcon fontSize="small" />;
      case 'pending':
      case 'busy':
        return <WarningIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Payment Processing" 
        subtitle="Manage payment methods, terminals, transactions, and security settings"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<PaymentIcon />} label="Payment Methods" />
            <Tab icon={<CreditCardIcon />} label="Transactions" />
            <Tab icon={<TerminalIcon />} label="Terminals" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<SettingsIcon />} label="Configuration" />
            <Tab icon={<ReportIcon />} label="Reports" />
          </Tabs>
        </Box>

        {/* Payment Methods Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Payment Methods</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Payment Method
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Configure and manage various payment methods including cash, cards, mobile payments, and digital wallets. Set processing fees and transaction limits.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2 }}>
              {paymentMethods.map((method) => (
                <Card key={method.id} sx={{ border: method.isDefault ? 2 : 1, borderColor: method.isDefault ? 'primary.main' : 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{method.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {method.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                        <Chip 
                          label={method.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={getStatusColor(method.isActive ? 'completed' : 'failed')}
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {method.description}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Type:</strong> {method.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Processing:</strong> {method.processingTime}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fees:</strong> {method.fees}%
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {method.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Transactions Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" defaultValue="all">
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined">Export</Button>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Today's Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $4,325.75
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +12.5% from yesterday
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    156
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +8.3% from yesterday
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main" gutterBottom>
                    Average Transaction
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $27.73
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +3.8% from yesterday
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Failed Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    3
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1.9% failure rate
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {transaction.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ${transaction.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={getStatusIcon(transaction.status)}
                          label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          size="small"
                          color={getStatusColor(transaction.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.timestamp}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {transaction.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Terminals Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Payment Terminals</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Terminal
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Monitor and manage payment terminals, check connectivity status, battery levels, and configure terminal settings.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2 }}>
              {paymentTerminals.map((terminal) => (
                <Card key={terminal.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{terminal.name}</Typography>
                      <Chip 
                        icon={getStatusIcon(terminal.status)}
                        label={terminal.status.charAt(0).toUpperCase() + terminal.status.slice(1)}
                        size="small"
                        color={getStatusColor(terminal.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {terminal.model}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Terminal ID:</strong> {terminal.id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {terminal.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Heartbeat:</strong> {terminal.lastHeartbeat}
                      </Typography>
                      {terminal.batteryLevel && (
                        <Typography variant="body2">
                          <strong>Battery:</strong> {terminal.batteryLevel}%
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<SettingsIcon />}>
                        Configure
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      {terminal.status === 'offline' && (
                        <Button size="small" color="warning">
                          Reconnect
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Security Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Payment Security & Compliance</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Encryption & Security</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="End-to-end encryption"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Tokenization enabled"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="PCI DSS compliance"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Advanced fraud detection"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Transaction Limits</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Max Transaction Amount"
                      defaultValue="5000"
                      size="small"
                      InputProps={{ startAdornment: '$' }}
                    />
                    <TextField
                      label="Daily Limit"
                      defaultValue="50000"
                      size="small"
                      InputProps={{ startAdornment: '$' }}
                    />
                    <TextField
                      label="Refund Window (days)"
                      defaultValue="30"
                      size="small"
                      type="number"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Risk Management</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Real-time fraud monitoring"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Velocity checking"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Geolocation verification"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Device fingerprinting"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Configuration Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Payment Configuration</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>General Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-capture payments"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow partial payments"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require signature for amounts over $25"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send payment receipts via email"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Gateway Configuration</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl size="small">
                      <InputLabel>Payment Processor</InputLabel>
                      <Select defaultValue="stripe" label="Payment Processor">
                        <MenuItem value="stripe">Stripe</MenuItem>
                        <MenuItem value="square">Square</MenuItem>
                        <MenuItem value="paypal">PayPal</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Merchant ID"
                      size="small"
                      placeholder="Enter merchant ID"
                    />
                    <TextField
                      label="API Key"
                      size="small"
                      type="password"
                      placeholder="Enter API key"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Receipt Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Print receipts automatically"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Include payment method on receipt"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Include last 4 digits of card"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Show transaction reference"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Reports Tab */}
        {tabValue === 5 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Payment Reports & Analytics</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $127,450.50
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +18.2% from last month
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    4,632
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +12.8% from last month
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    98.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +0.3% from last month
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Processing Fees
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $3,254.75
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2.55% of total revenue
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Generate detailed payment reports for accounting, reconciliation, and business analysis. Export data in various formats for external systems.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<ReportIcon />}>
                Generate Settlement Report
              </Button>
              <Button variant="outlined" startIcon={<ReportIcon />}>
                Payment Method Analysis
              </Button>
              <Button variant="outlined" startIcon={<ReportIcon />}>
                Failed Transaction Report
              </Button>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default PaymentProcessingPage;