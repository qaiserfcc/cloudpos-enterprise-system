import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
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

const StoreConfigurationPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for store locations
  const storeLocations = [
    {
      id: '1',
      name: 'Main Store',
      type: 'flagship',
      address: '123 Main Street, Downtown, City 12345',
      phone: '+1 (555) 123-4567',
      email: 'main@cloudpos.com',
      manager: 'John Smith',
      isActive: true,
      isDefault: true,
      openingHours: {
        monday: { open: '09:00', close: '21:00', isOpen: true },
        tuesday: { open: '09:00', close: '21:00', isOpen: true },
        wednesday: { open: '09:00', close: '21:00', isOpen: true },
        thursday: { open: '09:00', close: '21:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '10:00', close: '22:00', isOpen: true },
        sunday: { open: '12:00', close: '18:00', isOpen: true }
      }
    },
    {
      id: '2',
      name: 'North Branch',
      type: 'branch',
      address: '456 North Avenue, Northside, City 12346',
      phone: '+1 (555) 234-5678',
      email: 'north@cloudpos.com',
      manager: 'Sarah Johnson',
      isActive: true,
      isDefault: false,
      openingHours: {
        monday: { open: '10:00', close: '20:00', isOpen: true },
        tuesday: { open: '10:00', close: '20:00', isOpen: true },
        wednesday: { open: '10:00', close: '20:00', isOpen: true },
        thursday: { open: '10:00', close: '20:00', isOpen: true },
        friday: { open: '10:00', close: '21:00', isOpen: true },
        saturday: { open: '10:00', close: '21:00', isOpen: true },
        sunday: { open: '12:00', close: '17:00', isOpen: true }
      }
    },
    {
      id: '3',
      name: 'Express Kiosk',
      type: 'kiosk',
      address: 'Mall Food Court, Shopping Center, City 12347',
      phone: '+1 (555) 345-6789',
      email: 'kiosk@cloudpos.com',
      manager: 'Mike Wilson',
      isActive: false,
      isDefault: false,
      openingHours: {
        monday: { open: '10:00', close: '22:00', isOpen: true },
        tuesday: { open: '10:00', close: '22:00', isOpen: true },
        wednesday: { open: '10:00', close: '22:00', isOpen: true },
        thursday: { open: '10:00', close: '22:00', isOpen: true },
        friday: { open: '10:00', close: '23:00', isOpen: true },
        saturday: { open: '10:00', close: '23:00', isOpen: true },
        sunday: { open: '11:00', close: '21:00', isOpen: true }
      }
    }
  ];

  // Mock business settings
  const businessSettings = {
    businessName: 'CloudPOS Retail Store',
    legalName: 'CloudPOS Technologies LLC',
    taxId: '12-3456789',
    businessType: 'Retail',
    industry: 'General Merchandise',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    fiscalYearStart: 'January',
    language: 'English'
  };

  const getStoreTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      flagship: 'primary',
      branch: 'secondary',
      kiosk: 'info',
      warehouse: 'warning'
    };
    return colors[type] || 'default';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (key: string) => {
    const days: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };
    return days[key] || key;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Store Configuration" 
        subtitle="Manage store settings, business hours, locations, and operational preferences"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<BusinessIcon />} label="Business Settings" />
            <Tab icon={<StoreIcon />} label="Store Locations" />
            <Tab icon={<ScheduleIcon />} label="Business Hours" />
            <Tab icon={<SettingsIcon />} label="Operational Settings" />
            <Tab icon={<LocationIcon />} label="Multi-Location" />
          </Tabs>
        </Box>

        {/* Business Settings Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Business Information</Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure your business information, legal details, and company preferences. This information will be used for receipts, reports, and compliance.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Company Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Business Name"
                      defaultValue={businessSettings.businessName}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Legal Name"
                      defaultValue={businessSettings.legalName}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Tax ID / EIN"
                      defaultValue={businessSettings.taxId}
                      fullWidth
                      size="small"
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Business Type</InputLabel>
                      <Select defaultValue={businessSettings.businessType} label="Business Type">
                        <MenuItem value="Retail">Retail</MenuItem>
                        <MenuItem value="Restaurant">Restaurant</MenuItem>
                        <MenuItem value="Service">Service</MenuItem>
                        <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                        <MenuItem value="Wholesale">Wholesale</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Industry</InputLabel>
                      <Select defaultValue={businessSettings.industry} label="Industry">
                        <MenuItem value="General Merchandise">General Merchandise</MenuItem>
                        <MenuItem value="Food & Beverage">Food & Beverage</MenuItem>
                        <MenuItem value="Clothing & Apparel">Clothing & Apparel</MenuItem>
                        <MenuItem value="Electronics">Electronics</MenuItem>
                        <MenuItem value="Health & Beauty">Health & Beauty</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Regional Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select defaultValue={businessSettings.currency} label="Currency">
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                        <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                        <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select defaultValue={businessSettings.timezone} label="Timezone">
                        <MenuItem value="America/New_York">Eastern Time (US)</MenuItem>
                        <MenuItem value="America/Chicago">Central Time (US)</MenuItem>
                        <MenuItem value="America/Denver">Mountain Time (US)</MenuItem>
                        <MenuItem value="America/Los_Angeles">Pacific Time (US)</MenuItem>
                        <MenuItem value="Europe/London">London</MenuItem>
                        <MenuItem value="Asia/Riyadh">Riyadh</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Date Format</InputLabel>
                      <Select defaultValue={businessSettings.dateFormat} label="Date Format">
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Time Format</InputLabel>
                      <Select defaultValue={businessSettings.timeFormat} label="Time Format">
                        <MenuItem value="12-hour">12-hour (AM/PM)</MenuItem>
                        <MenuItem value="24-hour">24-hour</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select defaultValue={businessSettings.language} label="Language">
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Spanish">Español</MenuItem>
                        <MenuItem value="French">Français</MenuItem>
                        <MenuItem value="Arabic">العربية</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained">Save Business Settings</Button>
              <Button variant="outlined">Reset to Defaults</Button>
            </Box>
          </CardContent>
        )}

        {/* Store Locations Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Store Locations</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add New Location
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Manage all your store locations including flagship stores, branches, kiosks, and warehouses. Configure location-specific settings and contact information.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 2 }}>
              {storeLocations.map((location) => (
                <Card key={location.id} sx={{ border: location.isDefault ? 2 : 1, borderColor: location.isDefault ? 'primary.main' : 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{location.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {location.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                        <Chip 
                          label={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                          size="small"
                          color={getStoreTypeColor(location.type)}
                        />
                        <Chip 
                          label={location.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={location.isActive ? 'success' : 'error'}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">{location.address}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{location.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{location.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">Manager: {location.manager}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<ScheduleIcon />}>
                        Hours
                      </Button>
                      <Button size="small" startIcon={<MapIcon />}>
                        Map
                      </Button>
                      {!location.isDefault && (
                        <Button size="small" color="error" startIcon={<DeleteIcon />}>
                          Remove
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Business Hours Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Business Hours Configuration</Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Set opening hours for each day of the week. Hours can be configured per location or use global settings for all locations.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Location</InputLabel>
                <Select defaultValue="1" label="Select Location">
                  {storeLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="all">All Locations</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Weekly Schedule - Main Store</Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Opening Time</TableCell>
                        <TableCell>Closing Time</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(storeLocations[0].openingHours).map(([day, hours]) => (
                        <TableRow key={day}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {getDayName(day)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={<Switch checked={hours.isOpen} size="small" />}
                              label={hours.isOpen ? 'Open' : 'Closed'}
                            />
                          </TableCell>
                          <TableCell>
                            {hours.isOpen ? (
                              <TextField
                                type="time"
                                defaultValue={hours.open}
                                size="small"
                                sx={{ width: 120 }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {hours.isOpen ? (
                              <TextField
                                type="time"
                                defaultValue={hours.close}
                                size="small"
                                sx={{ width: 120 }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {hours.isOpen ? (
                              <Typography variant="body2">
                                {formatTime(hours.open)} - {formatTime(hours.close)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">Closed</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Copy to all days">
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

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button variant="contained">Save Hours</Button>
                  <Button variant="outlined">Copy to All Locations</Button>
                  <Button variant="outlined">Set Holiday Hours</Button>
                </Box>
              </CardContent>
            </Card>
          </CardContent>
        )}

        {/* Operational Settings Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Operational Preferences</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Point of Sale Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-print receipts"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable barcode scanning"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require customer signature"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow cash discounts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable loyalty program"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Inventory Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-update inventory on sale"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Low stock alerts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Allow negative inventory"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Track product expiry dates"
                    />
                    <TextField
                      label="Low stock threshold"
                      defaultValue="10"
                      size="small"
                      type="number"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Customer Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Require customer info for sales"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Auto-create customer accounts"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send email receipts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable customer feedback"
                    />
                    <TextField
                      label="Default customer group"
                      defaultValue="Regular"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Financial Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Include tax in product prices"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Round to nearest cent"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable multi-currency"
                    />
                    <TextField
                      label="Default tax rate (%)"
                      defaultValue="8.25"
                      size="small"
                      type="number"
                    />
                    <FormControl size="small">
                      <InputLabel>Rounding Method</InputLabel>
                      <Select defaultValue="nearest" label="Rounding Method">
                        <MenuItem value="up">Round Up</MenuItem>
                        <MenuItem value="down">Round Down</MenuItem>
                        <MenuItem value="nearest">Round to Nearest</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained">Save Settings</Button>
              <Button variant="outlined">Reset to Defaults</Button>
            </Box>
          </CardContent>
        )}

        {/* Multi-Location Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Multi-Location Management</Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure settings for managing multiple store locations including inventory synchronization, pricing variations, and centralized reporting.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Inventory Sync</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable cross-location inventory"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-transfer low stock items"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Real-time inventory sync"
                    />
                    <FormControl size="small">
                      <InputLabel>Sync Frequency</InputLabel>
                      <Select defaultValue="hourly" label="Sync Frequency">
                        <MenuItem value="realtime">Real-time</MenuItem>
                        <MenuItem value="hourly">Every Hour</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="manual">Manual</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Pricing Management</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Centralized pricing"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Allow location-specific pricing"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Regional promotion support"
                    />
                    <FormControl size="small">
                      <InputLabel>Pricing Strategy</InputLabel>
                      <Select defaultValue="uniform" label="Pricing Strategy">
                        <MenuItem value="uniform">Uniform Pricing</MenuItem>
                        <MenuItem value="regional">Regional Pricing</MenuItem>
                        <MenuItem value="competitive">Competitive Pricing</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Reporting & Analytics</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Consolidated reporting"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Location performance comparison"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Cross-location customer tracking"
                    />
                    <FormControl size="small">
                      <InputLabel>Default Report Scope</InputLabel>
                      <Select defaultValue="all" label="Default Report Scope">
                        <MenuItem value="all">All Locations</MenuItem>
                        <MenuItem value="active">Active Locations Only</MenuItem>
                        <MenuItem value="selected">Selected Locations</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Access Control</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Location-based user access"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Manager cross-location access"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Centralized user management"
                    />
                    <FormControl size="small">
                      <InputLabel>Default Access Level</InputLabel>
                      <Select defaultValue="location" label="Default Access Level">
                        <MenuItem value="location">Single Location</MenuItem>
                        <MenuItem value="region">Regional</MenuItem>
                        <MenuItem value="all">All Locations</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Location Performance Summary</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Daily Sales</TableCell>
                    <TableCell>Inventory Value</TableCell>
                    <TableCell>Staff Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {storeLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {location.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                          size="small"
                          color={getStoreTypeColor(location.type)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={location.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={location.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${Math.floor(Math.random() * 5000 + 1000).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {Math.floor(Math.random() * 15 + 5)}
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

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained">Save Multi-Location Settings</Button>
              <Button variant="outlined">Sync All Locations</Button>
              <Button variant="outlined">Generate Location Report</Button>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default StoreConfigurationPage;