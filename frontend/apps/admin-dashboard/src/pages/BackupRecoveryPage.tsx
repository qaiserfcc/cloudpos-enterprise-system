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
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Backup as BackupIcon,
  CloudDownload as DownloadIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DeleteForever as DeleteIcon
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

const BackupRecoveryPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for backups
  const backupHistory = [
    {
      id: 'BACKUP001',
      name: 'Auto Backup - Daily',
      type: 'automatic',
      status: 'completed',
      size: '2.5 GB',
      duration: '12 minutes',
      timestamp: '2024-01-15 02:00:00',
      location: 'AWS S3',
      includes: ['Products', 'Customers', 'Sales', 'Inventory', 'Settings'],
      retention: '30 days'
    },
    {
      id: 'BACKUP002',
      name: 'Manual Full Backup',
      type: 'manual',
      status: 'completed',
      size: '2.7 GB',
      duration: '15 minutes',
      timestamp: '2024-01-14 16:45:00',
      location: 'Local Storage',
      includes: ['All Data', 'System Configuration', 'User Settings'],
      retention: '90 days'
    },
    {
      id: 'BACKUP003',
      name: 'Weekly Full Backup',
      type: 'scheduled',
      status: 'in_progress',
      size: '—',
      duration: '—',
      timestamp: '2024-01-15 14:30:00',
      location: 'Google Drive',
      includes: ['Products', 'Sales', 'Customers', 'Reports'],
      retention: '60 days'
    },
    {
      id: 'BACKUP004',
      name: 'Pre-Update Backup',
      type: 'manual',
      status: 'failed',
      size: '—',
      duration: '—',
      timestamp: '2024-01-14 10:15:00',
      location: 'Local Storage',
      includes: ['System Configuration', 'Database'],
      retention: '7 days'
    }
  ];

  // Mock data for backup schedules
  const backupSchedules = [
    {
      id: 'SCHED001',
      name: 'Daily Auto Backup',
      frequency: 'daily',
      time: '02:00',
      isActive: true,
      lastRun: '2024-01-15 02:00:00',
      nextRun: '2024-01-16 02:00:00',
      location: 'AWS S3',
      retention: 30,
      includes: ['products', 'customers', 'sales', 'inventory']
    },
    {
      id: 'SCHED002',
      name: 'Weekly Full Backup',
      frequency: 'weekly',
      time: '01:00',
      isActive: true,
      lastRun: '2024-01-14 01:00:00',
      nextRun: '2024-01-21 01:00:00',
      location: 'Google Drive',
      retention: 90,
      includes: ['all_data', 'system_config', 'user_settings']
    },
    {
      id: 'SCHED003',
      name: 'Monthly Archive',
      frequency: 'monthly',
      time: '00:00',
      isActive: false,
      lastRun: '2024-01-01 00:00:00',
      nextRun: '2024-02-01 00:00:00',
      location: 'Local Storage',
      retention: 365,
      includes: ['all_data', 'reports', 'analytics']
    }
  ];

  // Mock data for disaster recovery plans
  const recoveryPlans = [
    {
      id: 'PLAN001',
      name: 'Complete System Recovery',
      priority: 'high',
      rto: '4 hours',
      rpo: '1 hour',
      status: 'active',
      lastTested: '2024-01-01',
      steps: [
        'Restore database from latest backup',
        'Restore application files',
        'Verify data integrity',
        'Test system functionality',
        'Switch DNS to recovery site'
      ]
    },
    {
      id: 'PLAN002',
      name: 'Data Corruption Recovery',
      priority: 'medium',
      rto: '2 hours',
      rpo: '30 minutes',
      status: 'active',
      lastTested: '2024-01-10',
      steps: [
        'Identify corrupted data',
        'Restore from point-in-time backup',
        'Validate data integrity',
        'Resume operations'
      ]
    },
    {
      id: 'PLAN003',
      name: 'Partial Service Recovery',
      priority: 'low',
      rto: '1 hour',
      rpo: '15 minutes',
      status: 'draft',
      lastTested: null,
      steps: [
        'Isolate affected service',
        'Restore service-specific data',
        'Test service functionality',
        'Monitor for issues'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      completed: 'success',
      in_progress: 'info',
      failed: 'error',
      scheduled: 'warning',
      active: 'success',
      draft: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'in_progress':
        return <InfoIcon fontSize="small" />;
      case 'scheduled':
        return <WarningIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Backup & Recovery" 
        subtitle="Manage automated backups, data export/import, system restore, and disaster recovery"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<BackupIcon />} label="Backups" />
            <Tab icon={<ScheduleIcon />} label="Schedules" />
            <Tab icon={<RestoreIcon />} label="Recovery" />
            <Tab icon={<ExportIcon />} label="Export/Import" />
            <Tab icon={<SecurityIcon />} label="Disaster Recovery" />
          </Tabs>
        </Box>

        {/* Backups Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Backup Management</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<PlayIcon />}>
                  Run Backup Now
                </Button>
                <Button variant="contained" startIcon={<BackupIcon />}>
                  Create Backup
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Automated backups ensure your data is safely stored and can be restored when needed. Configure backup schedules and monitor backup status.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Backups
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {backupHistory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available backups
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Last Backup
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {formatDateTime(backupHistory[0]?.timestamp || '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {backupHistory[0]?.size || '—'}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Storage Used
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    12.5 GB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Of 50 GB available
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="info.main" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    95.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Backup Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {backup.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {backup.includes.join(', ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getStatusIcon(backup.status)}
                          label={backup.status.replace('_', ' ').charAt(0).toUpperCase() + backup.status.replace('_', ' ').slice(1)}
                          size="small"
                          color={getStatusColor(backup.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {backup.size}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {backup.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(backup.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {backup.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Download">
                            <IconButton size="small">
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restore">
                            <IconButton size="small">
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Schedules Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Backup Schedules</Typography>
              <Button variant="contained" startIcon={<ScheduleIcon />}>
                Create Schedule
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Configure automated backup schedules to ensure regular data protection. Set frequency, timing, and retention policies.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(400px, 1fr))', gap: 3 }}>
              {backupSchedules.map((schedule) => (
                <Card key={schedule.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{schedule.name}</Typography>
                      <FormControlLabel
                        control={<Switch checked={schedule.isActive} />}
                        label={schedule.isActive ? 'Active' : 'Inactive'}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Frequency:</strong> {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time:</strong> {schedule.time}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {schedule.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Retention:</strong> {schedule.retention} days
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Includes:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {schedule.includes.map((item) => (
                          <Chip 
                            key={item}
                            label={item.replace('_', ' ').charAt(0).toUpperCase() + item.replace('_', ' ').slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last Run:</strong> {formatDateTime(schedule.lastRun)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Next Run:</strong> {formatDateTime(schedule.nextRun)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<PlayIcon />}>
                        Run Now
                      </Button>
                      <Button size="small" startIcon={<SettingsIcon />}>
                        Configure
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        )}

        {/* Recovery Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>System Recovery</Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              Recovery operations will restore data from backups. Ensure you have a recent backup before proceeding with recovery operations.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(350px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Quick Recovery</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl size="small">
                      <InputLabel>Select Backup</InputLabel>
                      <Select label="Select Backup">
                        {backupHistory.filter(b => b.status === 'completed').map((backup) => (
                          <MenuItem key={backup.id} value={backup.id}>
                            {backup.name} - {formatDateTime(backup.timestamp)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>Recovery Type</InputLabel>
                      <Select label="Recovery Type">
                        <MenuItem value="full">Full System Recovery</MenuItem>
                        <MenuItem value="partial">Partial Data Recovery</MenuItem>
                        <MenuItem value="database">Database Only</MenuItem>
                        <MenuItem value="files">Files Only</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Recovery Point"
                      size="small"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="contained" color="warning" startIcon={<RestoreIcon />}>
                      Start Recovery
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recovery Status</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Last Recovery: January 10, 2024
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: Partial Data Recovery
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Status: Completed Successfully
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Recovery Time Objective (RTO): 4 hours
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Recovery Point Objective (RPO): 1 hour
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        System Health: Normal
                      </Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<HistoryIcon />}>
                      View Recovery History
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recovery Options</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Verify data integrity after recovery"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Create backup before recovery"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable maintenance mode during recovery"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send notifications on completion"
                    />
                    <TextField
                      label="Recovery Notes"
                      size="small"
                      multiline
                      rows={3}
                      placeholder="Enter recovery notes..."
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Export/Import Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Data Export & Import</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(400px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Data Export</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl size="small">
                      <InputLabel>Data Type</InputLabel>
                      <Select label="Data Type">
                        <MenuItem value="all">All Data</MenuItem>
                        <MenuItem value="products">Products</MenuItem>
                        <MenuItem value="customers">Customers</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                        <MenuItem value="inventory">Inventory</MenuItem>
                        <MenuItem value="employees">Employees</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>Export Format</InputLabel>
                      <Select label="Export Format">
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="excel">Excel (XLSX)</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="sql">SQL Dump</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Date Range From"
                      size="small"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Date Range To"
                      size="small"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="contained" startIcon={<ExportIcon />}>
                      Export Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Data Import</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Importing data will overwrite existing records. Create a backup before proceeding.
                    </Alert>
                    <FormControl size="small">
                      <InputLabel>Import Type</InputLabel>
                      <Select label="Import Type">
                        <MenuItem value="products">Products</MenuItem>
                        <MenuItem value="customers">Customers</MenuItem>
                        <MenuItem value="inventory">Inventory Updates</MenuItem>
                        <MenuItem value="employees">Employees</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>File Format</InputLabel>
                      <Select label="File Format">
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="excel">Excel (XLSX)</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" component="label">
                      Choose File
                      <input type="file" hidden />
                    </Button>
                    <FormControlLabel
                      control={<Switch />}
                      label="Validate data before import"
                    />
                    <Button variant="contained" startIcon={<ImportIcon />}>
                      Import Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Operations</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ExportIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Product Export"
                        secondary="January 15, 2024 - 1,247 records"
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ImportIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Customer Import"
                        secondary="January 14, 2024 - 89 records"
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <HistoryIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ExportIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Sales Report Export"
                        secondary="January 13, 2024 - 2,156 records"
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Disaster Recovery Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Disaster Recovery Plans</Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Disaster recovery plans ensure business continuity in case of system failures. Define recovery procedures and test them regularly.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(400px, 1fr))', gap: 3 }}>
              {recoveryPlans.map((plan) => (
                <Card key={plan.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{plan.name}</Typography>
                      <Chip 
                        label={plan.priority.charAt(0).toUpperCase() + plan.priority.slice(1) + ' Priority'}
                        size="small"
                        color={plan.priority === 'high' ? 'error' : plan.priority === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>RTO:</strong> {plan.rto}
                      </Typography>
                      <Typography variant="body2">
                        <strong>RPO:</strong> {plan.rpo}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Tested:</strong> {plan.lastTested || 'Never'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recovery Steps:
                      </Typography>
                      <List dense>
                        {plan.steps.map((step, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Typography variant="body2" color="primary">
                                {index + 1}.
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {step}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<PlayIcon />}>
                        Test Plan
                      </Button>
                      <Button size="small" startIcon={<SettingsIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<HistoryIcon />}>
                        History
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<SecurityIcon />}>
                Create Recovery Plan
              </Button>
              <Button variant="outlined" startIcon={<PlayIcon />}>
                Run Disaster Recovery Test
              </Button>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default BackupRecoveryPage;