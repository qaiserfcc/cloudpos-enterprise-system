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
  Badge,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Campaign as CampaignIcon,
  PersonAdd as PersonAddIcon,
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon
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

const NotificationSystemPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for notifications
  const notifications = [
    {
      id: 'NOTIF001',
      title: 'Low Stock Alert: iPhone 15',
      message: 'iPhone 15 Pro Max stock is running low (only 3 units left)',
      type: 'warning',
      category: 'inventory',
      isRead: false,
      timestamp: '2024-01-15 14:30:00',
      priority: 'high',
      actionRequired: true
    },
    {
      id: 'NOTIF002',
      title: 'New Customer Registration',
      message: 'Sarah Johnson has created a new customer account',
      type: 'info',
      category: 'customer',
      isRead: false,
      timestamp: '2024-01-15 14:15:00',
      priority: 'medium',
      actionRequired: false
    },
    {
      id: 'NOTIF003',
      title: 'Payment Failed',
      message: 'Payment of $125.50 failed for order #ORD001234',
      type: 'error',
      category: 'payment',
      isRead: true,
      timestamp: '2024-01-15 13:45:00',
      priority: 'high',
      actionRequired: true
    },
    {
      id: 'NOTIF004',
      title: 'Promotion Campaign Started',
      message: 'Summer Sale 2024 campaign is now active',
      type: 'success',
      category: 'marketing',
      isRead: true,
      timestamp: '2024-01-15 09:00:00',
      priority: 'low',
      actionRequired: false
    },
    {
      id: 'NOTIF005',
      title: 'Employee Clock-in Reminder',
      message: 'Mike Wilson has not clocked in for scheduled shift',
      type: 'warning',
      category: 'employee',
      isRead: false,
      timestamp: '2024-01-15 08:30:00',
      priority: 'medium',
      actionRequired: true
    }
  ];

  // Mock data for notification templates
  const notificationTemplates = [
    {
      id: 'TEMP001',
      name: 'Low Stock Alert',
      category: 'inventory',
      trigger: 'stock_level',
      channels: ['email', 'in_app'],
      isActive: true,
      template: 'Stock for {product_name} is running low. Only {quantity} units left.'
    },
    {
      id: 'TEMP002',
      name: 'New Customer Welcome',
      category: 'customer',
      trigger: 'customer_registration',
      channels: ['email', 'sms'],
      isActive: true,
      template: 'Welcome to CloudPOS, {customer_name}! Thank you for joining us.'
    },
    {
      id: 'TEMP003',
      name: 'Payment Failure Alert',
      category: 'payment',
      trigger: 'payment_failed',
      channels: ['email', 'in_app'],
      isActive: true,
      template: 'Payment of {amount} failed for order {order_id}. Please review.'
    },
    {
      id: 'TEMP004',
      name: 'Shift Reminder',
      category: 'employee',
      trigger: 'shift_start',
      channels: ['sms', 'in_app'],
      isActive: false,
      template: 'Hi {employee_name}, your shift starts in 30 minutes.'
    }
  ];

  // Mock data for email campaigns
  const emailCampaigns = [
    {
      id: 'CAMP001',
      name: 'Monthly Newsletter',
      subject: 'CloudPOS Updates - January 2024',
      recipients: 'All Customers',
      status: 'sent',
      sentDate: '2024-01-01',
      openRate: 32.5,
      clickRate: 8.2,
      totalSent: 1250
    },
    {
      id: 'CAMP002',
      name: 'Promotion Announcement',
      subject: 'Limited Time: 20% Off Everything!',
      recipients: 'Active Customers',
      status: 'scheduled',
      sentDate: '2024-01-20',
      openRate: 0,
      clickRate: 0,
      totalSent: 0
    },
    {
      id: 'CAMP003',
      name: 'Abandoned Cart Recovery',
      subject: 'Complete Your Purchase - Items Waiting!',
      recipients: 'Cart Abandoners',
      status: 'active',
      sentDate: '2024-01-15',
      openRate: 28.7,
      clickRate: 12.3,
      totalSent: 89
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return <InventoryIcon />;
      case 'customer':
        return <PersonAddIcon />;
      case 'payment':
        return <CartIcon />;
      case 'marketing':
        return <CampaignIcon />;
      case 'employee':
        return <PersonAddIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      sent: 'success',
      scheduled: 'info',
      active: 'warning',
      draft: 'default',
      failed: 'error'
    };
    return colors[status] || 'default';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Notification System" 
        subtitle="Manage real-time notifications, email alerts, SMS integration, and communication preferences"
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              icon={
                <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
                  <NotificationsIcon />
                </Badge>
              } 
              label="Notifications" 
            />
            <Tab icon={<EmailIcon />} label="Email Campaigns" />
            <Tab icon={<SmsIcon />} label="SMS Messages" />
            <Tab icon={<SettingsIcon />} label="Templates" />
            <Tab icon={<HistoryIcon />} label="History" />
          </Tabs>
        </Box>

        {/* Notifications Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Recent Notifications</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<MarkReadIcon />}>
                  Mark All Read
                </Button>
                <Button variant="contained" startIcon={<SendIcon />}>
                  Send Notification
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Notifications
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {notifications.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This week
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Unread
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {notifications.filter(n => !n.isRead).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Require attention
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    High Priority
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {notifications.filter(n => n.priority === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Urgent actions
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Action Items
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {notifications.filter(n => n.actionRequired).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Need response
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      opacity: notification.isRead ? 0.7 : 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'transparent' }}>
                        {getCategoryIcon(notification.category)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          {getNotificationIcon(notification.type)}
                          <Chip 
                            label={notification.priority}
                            size="small"
                            color={notification.priority === 'high' ? 'error' : notification.priority === 'medium' ? 'warning' : 'default'}
                          />
                          {notification.actionRequired && (
                            <Chip label="Action Required" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={notification.isRead ? 'Mark as Unread' : 'Mark as Read'}>
                          <IconButton size="small">
                            <MarkReadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        )}

        {/* Email Campaigns Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Email Campaigns</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Campaign
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Create and manage email marketing campaigns, newsletters, and automated email sequences to engage with your customers.
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent Date</TableCell>
                    <TableCell>Open Rate</TableCell>
                    <TableCell>Click Rate</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emailCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {campaign.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {campaign.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {campaign.recipients}
                        </Typography>
                        {campaign.totalSent > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {campaign.totalSent.toLocaleString()} sent
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          size="small"
                          color={getStatusColor(campaign.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(campaign.sentDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={campaign.openRate > 25 ? 'success.main' : 'text.secondary'}>
                          {campaign.openRate > 0 ? `${campaign.openRate}%` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={campaign.clickRate > 10 ? 'success.main' : 'text.secondary'}>
                          {campaign.clickRate > 0 ? `${campaign.clickRate}%` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Report">
                            <IconButton size="small">
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate">
                            <IconButton size="small">
                              <CampaignIcon />
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

        {/* SMS Messages Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">SMS Messaging</Typography>
              <Button variant="contained" startIcon={<SendIcon />}>
                Send SMS
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Send SMS notifications for urgent alerts, order confirmations, and appointment reminders. Manage SMS templates and delivery preferences.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(350px, 1fr))', gap: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>SMS Configuration</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable SMS notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Order confirmations"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Low stock alerts"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Payment reminders"
                    />
                    <TextField
                      label="SMS Provider"
                      defaultValue="Twilio"
                      size="small"
                      disabled
                    />
                    <TextField
                      label="Sender ID"
                      defaultValue="CLOUDPOS"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Quick SMS</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl size="small">
                      <InputLabel>Template</InputLabel>
                      <Select label="Template">
                        <MenuItem value="order_confirmation">Order Confirmation</MenuItem>
                        <MenuItem value="payment_reminder">Payment Reminder</MenuItem>
                        <MenuItem value="appointment_reminder">Appointment Reminder</MenuItem>
                        <MenuItem value="custom">Custom Message</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Recipients"
                      placeholder="Enter phone numbers or select customer group"
                      size="small"
                      multiline
                      rows={2}
                    />
                    <TextField
                      label="Message"
                      placeholder="Enter your message..."
                      size="small"
                      multiline
                      rows={3}
                      helperText="160 characters remaining"
                    />
                    <Button variant="contained" startIcon={<SendIcon />}>
                      Send SMS
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>SMS Statistics</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Messages Sent Today:</Typography>
                      <Typography variant="body2" fontWeight="bold">47</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Delivery Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">98.5%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold">12.3%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Monthly Credits:</Typography>
                      <Typography variant="body2" fontWeight="bold">1,847 / 2,500</Typography>
                    </Box>
                    <Divider />
                    <Button variant="outlined" size="small">
                      View Detailed Report
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        )}

        {/* Templates Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Notification Templates</Typography>
              <Button variant="contained" startIcon={<AddIcon />}>
                Create Template
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Create and manage notification templates for automated messages. Use variables like {'{product_name}'}, {'{customer_name}'}, and {'{amount}'} for dynamic content.
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(400px, 1fr))', gap: 2 }}>
              {notificationTemplates.map((template) => (
                <Card key={template.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{template.name}</Typography>
                      <Chip 
                        label={template.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={template.isActive ? 'success' : 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={template.category} size="small" variant="outlined" />
                      <Chip label={template.trigger} size="small" variant="outlined" />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Template:</strong> {template.template}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Channels:</strong>
                      </Typography>
                      {template.channels.map((channel) => (
                        <Chip 
                          key={channel}
                          label={channel.charAt(0).toUpperCase() + channel.slice(1)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<SendIcon />}>
                        Test
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

        {/* History Tab */}
        {tabValue === 4 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Notification History</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(250px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Sent
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    15,247
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time notifications
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Delivery Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    97.8%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully delivered
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="info.main" gutterBottom>
                    Open Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    68.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email notifications
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    Response Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    14.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer interactions
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<HistoryIcon />}>
                Download History
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />}>
                Export Settings
              </Button>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default NotificationSystemPage;