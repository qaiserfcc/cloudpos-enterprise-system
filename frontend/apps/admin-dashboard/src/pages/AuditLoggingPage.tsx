import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  Badge,
  IconButton,
  Tooltip,
  DatePicker,
  TimePicker
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Monitoring as MonitoringIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Lock as LockIcon,
  Timeline as TimelineIcon,
  Shield as ShieldIcon,
  Gavel as ComplianceIcon,
  Refresh as RefreshIcon
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
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AuditLoggingPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:15',
      user: 'admin@cloudpos.com',
      action: 'Product Created',
      resource: 'Product ID: 12345',
      details: 'Created new product: "Premium Coffee Beans"',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      level: 'info',
      module: 'Product Management'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:25:30',
      user: 'cashier@cloudpos.com',
      action: 'Login Attempt',
      resource: 'Authentication',
      details: 'Failed login attempt - Invalid password',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      level: 'warning',
      module: 'Authentication'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:20:45',
      user: 'manager@cloudpos.com',
      action: 'Data Export',
      resource: 'Sales Report',
      details: 'Exported sales data for date range: 2024-01-01 to 2024-01-14',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      level: 'info',
      module: 'Reports'
    }
  ];

  const securityEvents = [
    {
      id: 1,
      timestamp: '2024-01-15 11:00:00',
      type: 'Multiple Failed Logins',
      severity: 'high',
      description: 'User attempted to login 5 times with wrong password',
      user: 'cashier@cloudpos.com',
      ipAddress: '192.168.1.105',
      status: 'Active',
      actions: ['Account Locked', 'Email Notification Sent']
    },
    {
      id: 2,
      timestamp: '2024-01-15 09:30:00',
      type: 'Unusual Activity',
      severity: 'medium',
      description: 'Login from new device/location',
      user: 'admin@cloudpos.com',
      ipAddress: '203.45.67.89',
      status: 'Reviewed',
      actions: ['Security Alert Sent']
    }
  ];

  const complianceReports = [
    {
      id: 1,
      name: 'GDPR Data Access Report',
      period: 'Q4 2024',
      status: 'Generated',
      createdDate: '2024-01-15',
      recordsCount: 1245,
      complianceScore: 98
    },
    {
      id: 2,
      name: 'PCI DSS Audit Trail',
      period: 'December 2024',
      status: 'In Progress',
      createdDate: '2024-01-10',
      recordsCount: 856,
      complianceScore: 95
    }
  ];

  const auditSettings = {
    retention: 365,
    realTimeMonitoring: true,
    emailAlerts: true,
    exportFormat: 'JSON',
    logLevel: 'All',
    autoArchive: true
  };

  const renderAuditLogsTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Filter by User"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Action Type</InputLabel>
            <Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              label="Action Type"
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="login">Login/Logout</MenuItem>
              <MenuItem value="create">Create</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="export">Export</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Log Level</InputLabel>
            <Select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              label="Log Level"
            >
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            fullWidth
            sx={{ height: '40px' }}
          >
            Search
          </Button>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Audit Log Entries</Typography>
            <Box>
              <Button startIcon={<FilterIcon />} sx={{ mr: 1 }}>
                Advanced Filter
              </Button>
              <Button startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          log.level === 'error' ? 'error' :
                          log.level === 'warning' ? 'warning' :
                          log.level === 'info' ? 'primary' : 'default'
                        }
                        label={log.level.toUpperCase()}
                      />
                    </TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailsOpen(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={auditLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );

  const renderSecurityMonitoringTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">3</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">12</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Warning Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LockIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">1,234</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Login Attempts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ShieldIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">99.8%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Security Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Security Events</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.timestamp}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          event.severity === 'high' ? 'error' :
                          event.severity === 'medium' ? 'warning' : 'info'
                        }
                        label={event.severity.toUpperCase()}
                      />
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>{event.user}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={event.status === 'Active' ? 'error' : 'success'}
                        label={event.status}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Real-time Security Monitoring</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Monitoring Status</AlertTitle>
            Real-time security monitoring is active. All suspicious activities are being tracked and analyzed.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Active Sessions</Typography>
                <Typography variant="h4" color="primary">24</Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently logged in users
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Failed Login Attempts</Typography>
                <Typography variant="h4" color="error">7</Typography>
                <Typography variant="body2" color="text.secondary">
                  In the last hour
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderComplianceTab = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Compliance Overview</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <ComplianceIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h6">GDPR Compliance</Typography>
                <Typography variant="h4" color="success.main">98%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Data Protection Compliance
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <ShieldIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">PCI DSS</Typography>
                <Typography variant="h4" color="primary.main">95%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment Security Standards
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <AssessmentIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">SOX Compliance</Typography>
                <Typography variant="h4" color="warning.main">92%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Financial Reporting
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Compliance Reports</Typography>
            <Button variant="contained" startIcon={<AssessmentIcon />}>
              Generate Report
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={report.status === 'Generated' ? 'success' : 'warning'}
                        label={report.status}
                      />
                    </TableCell>
                    <TableCell>{report.createdDate}</TableCell>
                    <TableCell>{report.recordsCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {report.complianceScore}%
                        </Typography>
                        <Box
                          sx={{
                            width: 50,
                            height: 8,
                            backgroundColor: 'grey.300',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${report.complianceScore}%`,
                              height: '100%',
                              backgroundColor: report.complianceScore >= 95 ? 'success.main' : 
                                             report.complianceScore >= 85 ? 'warning.main' : 'error.main'
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Compliance Requirements</Typography>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>GDPR (General Data Protection Regulation)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SuccessIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Data Processing Records"
                    secondary="All data processing activities are logged and documented"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SuccessIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Right to Access"
                    secondary="User data access requests are tracked and fulfilled"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Data Retention"
                    secondary="Some old records need review for retention compliance"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>PCI DSS (Payment Card Industry Data Security Standard)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SuccessIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Payment Data Encryption"
                    secondary="All payment data is encrypted in transit and at rest"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SuccessIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Access Control"
                    secondary="Role-based access controls are implemented"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Box>
  );

  const renderSettingsTab = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Audit Logging Configuration</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Log Retention Period (Days)"
                type="number"
                defaultValue={auditSettings.retention}
                helperText="Number of days to retain audit logs"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={auditSettings.logLevel}
                  label="Log Level"
                >
                  <MenuItem value="All">All Events</MenuItem>
                  <MenuItem value="Critical">Critical Only</MenuItem>
                  <MenuItem value="Error">Error and Above</MenuItem>
                  <MenuItem value="Warning">Warning and Above</MenuItem>
                  <MenuItem value="Info">Info and Above</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={auditSettings.exportFormat}
                  label="Export Format"
                >
                  <MenuItem value="JSON">JSON</MenuItem>
                  <MenuItem value="CSV">CSV</MenuItem>
                  <MenuItem value="XML">XML</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={auditSettings.autoArchive}
                    color="primary"
                  />
                }
                label="Auto-Archive Old Logs"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Monitoring Settings</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={auditSettings.realTimeMonitoring}
                    color="primary"
                  />
                }
                label="Real-time Monitoring"
              />
              <Typography variant="body2" color="text.secondary">
                Enable real-time monitoring and alerting
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={auditSettings.emailAlerts}
                    color="primary"
                  />
                }
                label="Email Alerts"
              />
              <Typography variant="body2" color="text.secondary">
                Send email notifications for critical events
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Event Categories</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>User Activities</Typography>
              <List dense>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Login/Logout Events"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="User Management"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Permission Changes"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Data Operations</Typography>
              <List dense>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Create Operations"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Update Operations"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Delete Operations"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <HistoryIcon sx={{ mr: 2 }} />
        Audit Logging & Compliance
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Audit Logs" 
            icon={<HistoryIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Security Monitoring" 
            icon={<SecurityIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Compliance" 
            icon={<ComplianceIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Settings" 
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderAuditLogsTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderSecurityMonitoringTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderComplianceTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {renderSettingsTab()}
      </TabPanel>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timestamp"
                  value={selectedLog.timestamp}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="User"
                  value={selectedLog.user}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Action"
                  value={selectedLog.action}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Module"
                  value={selectedLog.module}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Resource"
                  value={selectedLog.resource}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Details"
                  value={selectedLog.details}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={selectedLog.ipAddress}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Level"
                  value={selectedLog.level}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="User Agent"
                  value={selectedLog.userAgent}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLoggingPage;