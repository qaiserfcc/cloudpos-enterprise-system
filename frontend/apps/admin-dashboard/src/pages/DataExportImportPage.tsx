import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  LinearProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  GetApp as DownloadIcon,
  Publish as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Transform as TransformIcon
} from '@mui/icons-material';

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
      id={`export-import-tabpanel-${index}`}
      aria-labelledby={`export-import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DataExportImportPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const exportHistory = [
    {
      id: 1,
      type: 'Products',
      format: 'CSV',
      date: '2024-01-15 10:30:00',
      recordCount: 1250,
      fileSize: '2.1 MB',
      status: 'completed',
      downloadUrl: '/exports/products_20240115.csv'
    },
    {
      id: 2,
      type: 'Sales Data',
      format: 'Excel',
      date: '2024-01-14 15:45:00',
      recordCount: 5680,
      fileSize: '4.8 MB',
      status: 'completed',
      downloadUrl: '/exports/sales_20240114.xlsx'
    },
    {
      id: 3,
      type: 'Customer List',
      format: 'JSON',
      date: '2024-01-14 09:20:00',
      recordCount: 892,
      fileSize: '1.3 MB',
      status: 'failed',
      error: 'Permission denied'
    }
  ];

  const importHistory = [
    {
      id: 1,
      fileName: 'new_products.csv',
      type: 'Products',
      date: '2024-01-15 11:00:00',
      recordCount: 450,
      successCount: 445,
      failureCount: 5,
      status: 'completed'
    },
    {
      id: 2,
      fileName: 'customer_update.xlsx',
      type: 'Customers',
      date: '2024-01-14 16:30:00',
      recordCount: 200,
      successCount: 200,
      failureCount: 0,
      status: 'completed'
    }
  ];

  const scheduledExports = [
    {
      id: 1,
      name: 'Daily Sales Report',
      type: 'Sales Data',
      format: 'CSV',
      schedule: 'Daily at 12:00 AM',
      isActive: true,
      lastRun: '2024-01-15 00:00:00',
      nextRun: '2024-01-16 00:00:00'
    }
  ];

  const integrations = [
    {
      id: 1,
      name: 'QuickBooks Integration',
      type: 'Accounting',
      status: 'connected',
      lastSync: '2024-01-15 08:30:00',
      dataTypes: ['Sales', 'Inventory', 'Customers']
    },
    {
      id: 2,
      name: 'Shopify Store',
      type: 'E-commerce',
      status: 'connected',
      lastSync: '2024-01-15 10:15:00',
      dataTypes: ['Products', 'Orders']
    }
  ];

  const simulateExport = (_exportType: string, _format: string) => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateImport = (_file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate preview data generation
      const sampleData = [
        { id: 1, name: 'Sample Product 1', price: 29.99, category: 'Electronics' },
        { id: 2, name: 'Sample Product 2', price: 39.99, category: 'Clothing' },
        { id: 3, name: 'Sample Product 3', price: 19.99, category: 'Books' }
      ];
      setPreviewData(sampleData);
      setPreviewDialogOpen(true);
    }
  };

  const renderExportTab = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select defaultValue="" label="Data Type">
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="customers">Customers</MenuItem>
                  <MenuItem value="sales">Sales Data</MenuItem>
                  <MenuItem value="inventory">Inventory</MenuItem>
                  <MenuItem value="employees">Employees</MenuItem>
                  <MenuItem value="suppliers">Suppliers</MenuItem>
                  <MenuItem value="all">All Data</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select defaultValue="csv" label="Export Format">
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="excel">Excel (XLSX)</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="xml">XML</MenuItem>
                  <MenuItem value="pdf">PDF Report</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Date From"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Date To"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Include deleted records"
              />

              {isExporting && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Exporting... {exportProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={exportProgress} />
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={() => simulateExport('products', 'csv')}
                disabled={isExporting}
                fullWidth
              >
                {isExporting ? 'Exporting...' : 'Start Export'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Export Templates
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => simulateExport('products', 'csv')}
                fullWidth
              >
                Export All Products (CSV)
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => simulateExport('sales', 'excel')}
                fullWidth
              >
                Export Today's Sales (Excel)
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => simulateExport('customers', 'json')}
                fullWidth
              >
                Export Customer List (JSON)
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.format}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.recordCount.toLocaleString()}</TableCell>
                    <TableCell>{item.fileSize}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.status === 'completed' ? 'success' : 'error'}
                        label={item.status}
                        icon={item.status === 'completed' ? <SuccessIcon /> : <ErrorIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' ? (
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title={item.error}>
                          <IconButton size="small">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderImportTab = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Data
            </Typography>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select defaultValue="" label="Data Type">
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="customers">Customers</MenuItem>
                  <MenuItem value="inventory">Inventory Updates</MenuItem>
                  <MenuItem value="employees">Employees</MenuItem>
                  <MenuItem value="suppliers">Suppliers</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.json,.xml"
                  onChange={handleFileUpload}
                  hidden
                  aria-label="Select file to import"
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Select File to Import
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: CSV, Excel (XLSX), JSON, XML
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Import Mode</InputLabel>
                <Select defaultValue="update" label="Import Mode">
                  <MenuItem value="insert">Insert Only (Add new records)</MenuItem>
                  <MenuItem value="update">Update Only (Modify existing)</MenuItem>
                  <MenuItem value="upsert">Insert & Update (Add or modify)</MenuItem>
                  <MenuItem value="replace">Replace All (Delete and import)</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch />}
                label="Validate data before import"
              />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Skip duplicate records"
              />

              {isImporting && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Importing... {importProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={importProgress} />
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<ImportIcon />}
                disabled={!previewData.length || isImporting}
                fullWidth
              >
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import Templates
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Download these templates to ensure your data is in the correct format:
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                fullWidth
              >
                Download Products Template
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                fullWidth
              >
                Download Customers Template
              </Button>
            </Stack>

            <Alert severity="info" sx={{ mt: 3 }}>
              <AlertTitle>Import Guidelines</AlertTitle>
              <Typography variant="body2">
                • Ensure all required fields are included<br/>
                • Use correct date formats (YYYY-MM-DD)<br/>
                • Avoid special characters in IDs<br/>
                • Maximum file size: 50MB<br/>
                • Maximum records: 10,000 per import
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Import History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Records</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fileName}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.recordCount}</TableCell>
                    <TableCell>{item.successCount}</TableCell>
                    <TableCell>{item.failureCount}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.status === 'completed' ? 'success' : 'error'}
                        label={item.status}
                        icon={item.status === 'completed' ? <SuccessIcon /> : <ErrorIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderScheduledTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Scheduled Exports
            </Typography>
            <Button variant="contained" startIcon={<ScheduleIcon />}>
              Create Schedule
            </Button>
          </Box>
          
          {scheduledExports.map((schedule) => (
            <Accordion key={schedule.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">
                      {schedule.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {schedule.type} • {schedule.format} • {schedule.schedule}
                    </Typography>
                  </Box>
                  <Switch
                    checked={schedule.isActive}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Data Type:</strong> {schedule.type}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Format:</strong> {schedule.format}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Schedule:</strong> {schedule.schedule}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Run:</strong> {schedule.lastRun}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Next Run:</strong> {schedule.nextRun}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong> {schedule.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" startIcon={<SettingsIcon />}>
                    Edit Schedule
                  </Button>
                  <Button size="small" startIcon={<HistoryIcon />}>
                    View History
                  </Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon />}>
                    Delete
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  const renderIntegrationsTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            External Integrations
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
            {integrations.map((integration) => (
              <Card variant="outlined" key={integration.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                      {integration.name}
                    </Typography>
                    <Chip
                      size="small"
                      color={integration.status === 'connected' ? 'success' : 'error'}
                      label={integration.status}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {integration.type}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Sync: {integration.lastSync}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    Data Types:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {integration.dataTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={integration.status === 'connected' ? 'outlined' : 'contained'}
                      startIcon={<SyncIcon />}
                      fullWidth
                    >
                      {integration.status === 'connected' ? 'Sync Now' : 'Connect'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                    >
                      Configure
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Integration Benefits</AlertTitle>
            <Typography variant="body2">
              Connect with external systems to automatically sync data, reduce manual entry, 
              and keep your business data synchronized across all platforms.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TransformIcon sx={{ mr: 2 }} />
        Data Export & Import
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Export" 
            icon={<ExportIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Import" 
            icon={<ImportIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Scheduled" 
            icon={<ScheduleIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Integrations" 
            icon={<SyncIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderExportTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderImportTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderScheduledTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {renderIntegrationsTab()}
      </TabPanel>

      {/* Data Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Preview of the first 3 rows from your file:
          </Typography>
          
          {previewData.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0]).map((key) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              simulateImport(new File([], 'sample.csv'));
            }}
          >
            Import Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportImportPage;

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
      id={`export-import-tabpanel-${index}`}
      aria-labelledby={`export-import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DataExportImportPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const exportHistory = [
    {
      id: 1,
      type: 'Products',
      format: 'CSV',
      date: '2024-01-15 10:30:00',
      recordCount: 1250,
      fileSize: '2.1 MB',
      status: 'completed',
      downloadUrl: '/exports/products_20240115.csv'
    },
    {
      id: 2,
      type: 'Sales Data',
      format: 'Excel',
      date: '2024-01-14 15:45:00',
      recordCount: 5680,
      fileSize: '4.8 MB',
      status: 'completed',
      downloadUrl: '/exports/sales_20240114.xlsx'
    },
    {
      id: 3,
      type: 'Customer List',
      format: 'JSON',
      date: '2024-01-14 09:20:00',
      recordCount: 892,
      fileSize: '1.3 MB',
      status: 'failed',
      error: 'Permission denied'
    }
  ];

  const importHistory = [
    {
      id: 1,
      fileName: 'new_products.csv',
      type: 'Products',
      date: '2024-01-15 11:00:00',
      recordCount: 450,
      successCount: 445,
      failureCount: 5,
      status: 'completed'
    },
    {
      id: 2,
      fileName: 'customer_update.xlsx',
      type: 'Customers',
      date: '2024-01-14 16:30:00',
      recordCount: 200,
      successCount: 200,
      failureCount: 0,
      status: 'completed'
    },
    {
      id: 3,
      fileName: 'inventory_bulk.json',
      type: 'Inventory',
      date: '2024-01-14 14:15:00',
      recordCount: 800,
      successCount: 0,
      failureCount: 800,
      status: 'failed'
    }
  ];

  const scheduledExports = [
    {
      id: 1,
      name: 'Daily Sales Report',
      type: 'Sales Data',
      format: 'CSV',
      schedule: 'Daily at 12:00 AM',
      isActive: true,
      lastRun: '2024-01-15 00:00:00',
      nextRun: '2024-01-16 00:00:00'
    },
    {
      id: 2,
      name: 'Weekly Inventory Report',
      type: 'Inventory',
      format: 'Excel',
      schedule: 'Weekly on Monday',
      isActive: true,
      lastRun: '2024-01-08 09:00:00',
      nextRun: '2024-01-15 09:00:00'
    }
  ];

  const integrations = [
    {
      id: 1,
      name: 'QuickBooks Integration',
      type: 'Accounting',
      status: 'connected',
      lastSync: '2024-01-15 08:30:00',
      dataTypes: ['Sales', 'Inventory', 'Customers']
    },
    {
      id: 2,
      name: 'Shopify Store',
      type: 'E-commerce',
      status: 'connected',
      lastSync: '2024-01-15 10:15:00',
      dataTypes: ['Products', 'Orders']
    },
    {
      id: 3,
      name: 'Mailchimp',
      type: 'Marketing',
      status: 'disconnected',
      lastSync: 'Never',
      dataTypes: ['Customers']
    }
  ];

  const simulateExport = (_exportType: string, _format: string) => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateImport = (_file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate preview data generation
      const sampleData = [
        { id: 1, name: 'Sample Product 1', price: 29.99, category: 'Electronics' },
        { id: 2, name: 'Sample Product 2', price: 39.99, category: 'Clothing' },
        { id: 3, name: 'Sample Product 3', price: 19.99, category: 'Books' }
      ];
      setPreviewData(sampleData);
      setPreviewDialogOpen(true);
    }
  };

  const renderExportTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Data
              </Typography>
              
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select defaultValue="" label="Data Type">
                    <MenuItem value="products">Products</MenuItem>
                    <MenuItem value="customers">Customers</MenuItem>
                    <MenuItem value="sales">Sales Data</MenuItem>
                    <MenuItem value="inventory">Inventory</MenuItem>
                    <MenuItem value="employees">Employees</MenuItem>
                    <MenuItem value="suppliers">Suppliers</MenuItem>
                    <MenuItem value="all">All Data</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select defaultValue="csv" label="Export Format">
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="excel">Excel (XLSX)</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="xml">XML</MenuItem>
                    <MenuItem value="pdf">PDF Report</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Date From"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Date To"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Include deleted records"
                />

                {isExporting && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Exporting... {exportProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={exportProgress} />
                  </Box>
                )}

                <Button
                  variant="contained"
                  startIcon={<ExportIcon />}
                  onClick={() => simulateExport('products', 'csv')}
                  disabled={isExporting}
                  fullWidth
                >
                  {isExporting ? 'Exporting...' : 'Start Export'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Export Templates
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => simulateExport('products', 'csv')}
                  fullWidth
                >
                  Export All Products (CSV)
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => simulateExport('sales', 'excel')}
                  fullWidth
                >
                  Export Today's Sales (Excel)
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => simulateExport('customers', 'json')}
                  fullWidth
                >
                  Export Customer List (JSON)
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => simulateExport('inventory', 'pdf')}
                  fullWidth
                >
                  Export Inventory Report (PDF)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.format}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.recordCount.toLocaleString()}</TableCell>
                    <TableCell>{item.fileSize}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.status === 'completed' ? 'success' : 'error'}
                        label={item.status}
                        icon={item.status === 'completed' ? <SuccessIcon /> : <ErrorIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' ? (
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title={item.error}>
                          <IconButton size="small">
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderImportTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Data
              </Typography>
              
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select defaultValue="" label="Data Type">
                    <MenuItem value="products">Products</MenuItem>
                    <MenuItem value="customers">Customers</MenuItem>
                    <MenuItem value="inventory">Inventory Updates</MenuItem>
                    <MenuItem value="employees">Employees</MenuItem>
                    <MenuItem value="suppliers">Suppliers</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.json,.xml"
                    onChange={handleFileUpload}
                    hidden
                    aria-label="Select file to import"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Select File to Import
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: CSV, Excel (XLSX), JSON, XML
                  </Typography>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Import Mode</InputLabel>
                  <Select defaultValue="update" label="Import Mode">
                    <MenuItem value="insert">Insert Only (Add new records)</MenuItem>
                    <MenuItem value="update">Update Only (Modify existing)</MenuItem>
                    <MenuItem value="upsert">Insert & Update (Add or modify)</MenuItem>
                    <MenuItem value="replace">Replace All (Delete and import)</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={<Switch />}
                  label="Validate data before import"
                />

                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Skip duplicate records"
                />

                {isImporting && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Importing... {importProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={importProgress} />
                  </Box>
                )}

                <Button
                  variant="contained"
                  startIcon={<ImportIcon />}
                  disabled={!previewData.length || isImporting}
                  fullWidth
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Templates
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Download these templates to ensure your data is in the correct format:
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Products Template
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Customers Template
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Inventory Template
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Employees Template
                </Button>
              </Stack>

              <Alert severity="info" sx={{ mt: 3 }}>
                <AlertTitle>Import Guidelines</AlertTitle>
                <Typography variant="body2">
                  • Ensure all required fields are included<br/>
                  • Use correct date formats (YYYY-MM-DD)<br/>
                  • Avoid special characters in IDs<br/>
                  • Maximum file size: 50MB<br/>
                  • Maximum records: 10,000 per import
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Import History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Records</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fileName}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.recordCount}</TableCell>
                    <TableCell>{item.successCount}</TableCell>
                    <TableCell>{item.failureCount}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.status === 'completed' ? 'success' : 'error'}
                        label={item.status}
                        icon={item.status === 'completed' ? <SuccessIcon /> : <ErrorIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderScheduledTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Scheduled Exports
            </Typography>
            <Button variant="contained" startIcon={<ScheduleIcon />}>
              Create Schedule
            </Button>
          </Box>
          
          {scheduledExports.map((schedule) => (
            <Accordion key={schedule.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">
                      {schedule.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {schedule.type} • {schedule.format} • {schedule.schedule}
                    </Typography>
                  </Box>
                  <Switch
                    checked={schedule.isActive}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Data Type:</strong> {schedule.type}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Format:</strong> {schedule.format}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Schedule:</strong> {schedule.schedule}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Run:</strong> {schedule.lastRun}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Next Run:</strong> {schedule.nextRun}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong> {schedule.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<SettingsIcon />}>
                        Edit Schedule
                      </Button>
                      <Button size="small" startIcon={<HistoryIcon />}>
                        View History
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  const renderIntegrationsTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            External Integrations
          </Typography>
          
          <Grid container spacing={3}>
            {integrations.map((integration) => (
              <Grid item xs={12} md={6} lg={4} key={integration.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" component="div">
                        {integration.name}
                      </Typography>
                      <Chip
                        size="small"
                        color={integration.status === 'connected' ? 'success' : 'error'}
                        label={integration.status}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {integration.type}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Sync: {integration.lastSync}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      Data Types:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {integration.dataTypes.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={integration.status === 'connected' ? 'outlined' : 'contained'}
                        startIcon={<SyncIcon />}
                        fullWidth
                      >
                        {integration.status === 'connected' ? 'Sync Now' : 'Connect'}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<SettingsIcon />}
                      >
                        Configure
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Integration Benefits</AlertTitle>
            <Typography variant="body2">
              Connect with external systems to automatically sync data, reduce manual entry, 
              and keep your business data synchronized across all platforms.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TransformIcon sx={{ mr: 2 }} />
        Data Export & Import
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Export" 
            icon={<ExportIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Import" 
            icon={<ImportIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Scheduled" 
            icon={<ScheduleIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Integrations" 
            icon={<SyncIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderExportTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderImportTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderScheduledTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {renderIntegrationsTab()}
      </TabPanel>

      {/* Data Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Preview of the first 3 rows from your file:
          </Typography>
          
          {previewData.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0]).map((key) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              simulateImport(new File([], 'sample.csv'));
            }}
          >
            Import Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportImportPage;