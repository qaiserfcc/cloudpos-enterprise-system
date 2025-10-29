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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  AccountBalance as TaxIcon,
  Category as CategoryIcon,
  Rule as RuleIcon,
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

const TaxConfigurationPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Tax Configuration" 
        subtitle="Manage tax rates, categories, exemptions, and automation rules"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<TaxIcon />} label="Tax Rates" />
            <Tab icon={<CategoryIcon />} label="Tax Categories" />
            <Tab icon={<ReceiptIcon />} label="Tax Exemptions" />
            <Tab icon={<RuleIcon />} label="Tax Rules" />
            <Tab icon={<SettingsIcon />} label="Configuration" />
            <Tab icon={<ReportIcon />} label="Tax Reports" />
          </Tabs>
        </Box>

        {/* Tax Rates Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tax Rates Management</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Tax Rate
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure tax rates for different jurisdictions, product categories, and locations. Set up federal, state, local, and city tax rates with automated calculations.
            </Alert>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>State Sales Tax</Typography>
                  <Typography variant="h4" color="primary" sx={{ mb: 1 }}>8.25%</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    California state sales tax
                  </Typography>
                  <Typography variant="body2">
                    <strong>Jurisdiction:</strong> State<br />
                    <strong>Status:</strong> Active<br />
                    <strong>Type:</strong> Percentage
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Local Tax</Typography>
                  <Typography variant="h4" color="primary" sx={{ mb: 1 }}>2.5%</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    San Francisco local tax
                  </Typography>
                  <Typography variant="body2">
                    <strong>Jurisdiction:</strong> Local<br />
                    <strong>Status:</strong> Active<br />
                    <strong>Type:</strong> Percentage
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Federal Excise Tax</Typography>
                  <Typography variant="h4" color="primary" sx={{ mb: 1 }}>$50.00</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Federal excise tax on tobacco products
                  </Typography>
                  <Typography variant="body2">
                    <strong>Jurisdiction:</strong> Federal<br />
                    <strong>Status:</strong> Active<br />
                    <strong>Type:</strong> Fixed Amount
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Tax Categories Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tax Categories</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Category
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Create and manage tax categories to group products with similar tax requirements. Define default rates and applicable product types.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>General Sales Tax</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Standard sales tax for most products
                  </Typography>
                  <Typography variant="body2">
                    <strong>Default Rate:</strong> 8.25%<br />
                    <strong>Applicable Products:</strong> General merchandise<br />
                    <strong>Status:</strong> Active
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Food & Beverages</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Reduced tax rate for food items
                  </Typography>
                  <Typography variant="body2">
                    <strong>Default Rate:</strong> 5.0%<br />
                    <strong>Applicable Products:</strong> Food, beverages<br />
                    <strong>Status:</strong> Active
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Luxury Items</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Higher tax rate for luxury goods
                  </Typography>
                  <Typography variant="body2">
                    <strong>Default Rate:</strong> 15.0%<br />
                    <strong>Applicable Products:</strong> Jewelry, electronics<br />
                    <strong>Status:</strong> Active
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Tax Exemptions Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tax Exemptions</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Exemption
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Set up tax exemptions for non-profit organizations, senior citizens, and other qualifying entities. Configure partial or full exemptions.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Non-Profit Organizations</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Full tax exemption for registered non-profit organizations
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> Customer Type<br />
                    <strong>Exemption:</strong> Full (100%)<br />
                    <strong>Status:</strong> Active
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Senior Citizen Discount</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    50% tax reduction for senior citizens
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> Customer Type<br />
                    <strong>Exemption:</strong> Partial (50%)<br />
                    <strong>Status:</strong> Active
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Tax Rules Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tax Rules</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Rule
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Create automated tax rules based on conditions like customer type, product category, order amount, location, or date ranges.
            </Alert>
            <Typography variant="body1" color="text.secondary">
              No tax rules configured yet. Create your first rule to automate tax calculations.
            </Typography>
          </CardContent>
        )}

        {/* Configuration Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Tax Configuration</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>General Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Include tax in displayed prices"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Display tax separately on receipts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require tax exemption numbers"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Round tax to nearest cent"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Automation</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-calculate tax"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-apply exemptions"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Validate tax numbers"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable audit trail"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Tax Reports Tab */}
        {tabValue === 5 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Tax Reports</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Monthly Sales Tax
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $2,450.75
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tax collected this month
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    Tax Exemptions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $125.50
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exempted this month
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Net Tax Due
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    $2,325.25
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount owed to authorities
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    1,248
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxable transactions
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Tax reports help you track tax collection, generate compliance reports, and analyze tax performance across different periods and locations.
            </Alert>

            <Button variant="contained" startIcon={<ReportIcon />}>
              Generate Detailed Report
            </Button>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default TaxConfigurationPage;