import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  AlertTitle,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  Monitor as MonitorIcon,
  NotificationsActive as AlertIcon,
  ExpandMore as ExpandMoreIcon
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
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedSecurityPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    apiRateLimit: 1000,
    dataEncryption: true,
    auditLogging: true,
    autoLogout: true,
    ipWhitelist: false,
    sslOnly: true
  });

  const [activeUsers, setActiveUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@cloudpos.com',
      role: 'Admin',
      lastActivity: '2024-10-29 10:30:00',
      location: 'New York, US',
      device: 'Chrome - Windows',
      sessionTime: '2h 15m',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@cloudpos.com',
      role: 'Manager',
      lastActivity: '2024-10-29 09:45:00',
      location: 'London, UK',
      device: 'Safari - MacOS',
      sessionTime: '3h 42m',
      status: 'Active'
    }
  ]);

  const [securityLogs] = useState([
    {
      id: 1,
      timestamp: '2024-10-29 11:15:00',
      event: 'Failed Login Attempt',
      user: 'unknown@email.com',
      ip: '192.168.1.100',
      severity: 'High',
      details: 'Multiple failed login attempts detected'
    },
    {
      id: 2,
      timestamp: '2024-10-29 10:30:00',
      event: 'Admin Panel Access',
      user: 'john@cloudpos.com',
      ip: '192.168.1.50',
      severity: 'Medium',
      details: 'User accessed security settings'
    },
    {
      id: 3,
      timestamp: '2024-10-29 09:45:00',
      event: 'Password Change',
      user: 'jane@cloudpos.com',
      ip: '192.168.1.75',
      severity: 'Low',
      details: 'User successfully changed password'
    }
  ]);

  const [threatAlerts] = useState([
    {
      id: 1,
      type: 'Brute Force Attack',
      severity: 'High',
      count: 15,
      lastSeen: '2024-10-29 11:15:00',
      status: 'Active',
      source: '192.168.1.100'
    },
    {
      id: 2,
      type: 'Suspicious API Usage',
      severity: 'Medium',
      count: 3,
      lastSeen: '2024-10-29 10:20:00',
      status: 'Investigated',
      source: '203.45.67.89'
    }
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSecuritySettingChange = (setting: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleTerminateSession = (userId: number) => {
    setActiveUsers(prev => prev.filter(user => user.id !== userId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const renderSecurityOverviewTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Security Overview
      </Typography>

      {/* Security Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SecurityIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h6">Security Score</Typography>
              <Typography variant="body2" color="text.secondary">
                Overall system security rating
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" mb={2}>
            <Box sx={{ flexGrow: 1, mr: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={85} 
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </Box>
            <Typography variant="h6" color="success.main">85%</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Excellent security posture. Minor improvements recommended.
          </Typography>
        </CardContent>
      </Card>

      {/* Security Metrics Grid */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">24</Typography>
            <Typography variant="body2" color="text.secondary">
              Active Sessions
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">3</Typography>
            <Typography variant="body2" color="text.secondary">
              Security Alerts
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ShieldIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">99.9%</Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <BlockIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">12</Typography>
            <Typography variant="body2" color="text.secondary">
              Blocked Threats
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Security Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Security Events
          </Typography>
          
          <List>
            {securityLogs.slice(0, 5).map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem>
                  <ListItemIcon>
                    {log.severity === 'High' && <ErrorIcon color="error" />}
                    {log.severity === 'Medium' && <WarningIcon color="warning" />}
                    {log.severity === 'Low' && <CheckCircleIcon color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.event}
                    secondary={`${log.timestamp} - ${log.user} (${log.ip})`}
                  />
                  <Chip 
                    label={log.severity} 
                    size="small" 
                    color={getSeverityColor(log.severity) as any}
                  />
                </ListItem>
                {index < securityLogs.slice(0, 5).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
            View All Security Logs
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  const renderSecuritySettingsTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Security Settings
      </Typography>

      {/* Authentication Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Authentication & Access Control
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onChange={(e) => handleSecuritySettingChange('twoFactorAuth', e.target.checked)}
                />
              }
              label="Two-Factor Authentication (2FA)"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.autoLogout}
                  onChange={(e) => handleSecuritySettingChange('autoLogout', e.target.checked)}
                />
              }
              label="Auto Logout on Inactivity"
            />
            
            <TextField
              label="Session Timeout (minutes)"
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
              variant="outlined"
              size="small"
            />
            
            <TextField
              label="Max Login Attempts"
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => handleSecuritySettingChange('maxLoginAttempts', parseInt(e.target.value))}
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Password Policy
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField
              label="Minimum Password Length"
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) => handleSecuritySettingChange('passwordMinLength', parseInt(e.target.value))}
              variant="outlined"
              size="small"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.requireSpecialChars}
                  onChange={(e) => handleSecuritySettingChange('requireSpecialChars', e.target.checked)}
                />
              }
              label="Require Special Characters"
            />
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Password Requirements</AlertTitle>
            Passwords must contain uppercase, lowercase, numbers, and special characters.
          </Alert>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Data Protection & Privacy
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.dataEncryption}
                  onChange={(e) => handleSecuritySettingChange('dataEncryption', e.target.checked)}
                />
              }
              label="Data Encryption at Rest"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.sslOnly}
                  onChange={(e) => handleSecuritySettingChange('sslOnly', e.target.checked)}
                />
              }
              label="SSL/TLS Only Connections"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.auditLogging}
                  onChange={(e) => handleSecuritySettingChange('auditLogging', e.target.checked)}
                />
              }
              label="Comprehensive Audit Logging"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.ipWhitelist}
                  onChange={(e) => handleSecuritySettingChange('ipWhitelist', e.target.checked)}
                />
              }
              label="IP Address Whitelisting"
            />
          </Box>
        </CardContent>
      </Card>

      {/* API Security */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            API Security
          </Typography>
          
          <TextField
            label="API Rate Limit (requests/hour)"
            type="number"
            value={securitySettings.apiRateLimit}
            onChange={(e) => handleSecuritySettingChange('apiRateLimit', parseInt(e.target.value))}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <Button variant="contained" color="primary" sx={{ mr: 2 }}>
            Save Security Settings
          </Button>
          
          <Button variant="outlined">
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  const renderUserSessionsTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Active User Sessions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Last Activity</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Session Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    size="small" 
                    color={user.role === 'Admin' ? 'error' : 'primary'}
                    icon={user.role === 'Admin' ? <AdminIcon /> : <PersonIcon />}
                  />
                </TableCell>
                <TableCell>{user.lastActivity}</TableCell>
                <TableCell>{user.location}</TableCell>
                <TableCell>{user.device}</TableCell>
                <TableCell>{user.sessionTime}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.status} 
                    size="small" 
                    color="success"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleTerminateSession(user.id)}
                  >
                    Terminate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" color="error">
          Terminate All Sessions
        </Button>
        <Button variant="outlined">
          Export Session Report
        </Button>
      </Box>
    </Box>
  );

  const renderThreatMonitoringTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Threat Monitoring & Detection
      </Typography>

      {/* Active Threats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Threat Alerts
          </Typography>
          
          {threatAlerts.map((threat) => (
            <Accordion key={threat.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Badge 
                    badgeContent={threat.count} 
                    color={threat.severity === 'High' ? 'error' : 'warning'}
                    sx={{ mr: 2 }}
                  >
                    <AlertIcon color={threat.severity === 'High' ? 'error' : 'warning'} />
                  </Badge>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">{threat.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last seen: {threat.lastSeen}
                    </Typography>
                  </Box>
                  <Chip 
                    label={threat.severity} 
                    size="small" 
                    color={getSeverityColor(threat.severity) as any}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Source:</strong> {threat.source}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Occurrences:</strong> {threat.count} attempts
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Status:</strong> {threat.status}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" size="small" sx={{ mr: 1 }}>
                    Block Source
                  </Button>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                    Investigate
                  </Button>
                  <Button variant="outlined" size="small" color="success">
                    Mark Resolved
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Security Event Logs
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.ip}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.severity} 
                        size="small" 
                        color={getSeverityColor(log.severity) as any}
                      />
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 2 }} />
        Advanced Security Features
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Security Overview" 
            icon={<MonitorIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Security Settings" 
            icon={<SettingsIcon />}
            iconPosition="start"
          />
          <Tab 
            label="User Sessions" 
            icon={<PersonIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Threat Monitoring" 
            icon={<ShieldIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderSecurityOverviewTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderSecuritySettingsTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderUserSessionsTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {renderThreatMonitoringTab()}
      </TabPanel>
    </Box>
  );
};

export default AdvancedSecurityPage;