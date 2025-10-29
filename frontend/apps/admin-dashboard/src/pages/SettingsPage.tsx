import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { PageHeader } from '@cloudpos/layout';
import { Button } from '@cloudpos/shared-ui';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState({
    notifications: true,
    emailAlerts: false,
    lowStockAlerts: true,
    autoBackup: true,
    darkMode: false,
    soundEffects: true,
  });

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked,
    });
  };

  const settingCategories = [
    {
      title: 'Business Information',
      icon: <BusinessIcon />,
      description: 'Store name, address, contact information',
    },
    {
      title: 'Receipt Settings',
      icon: <ReceiptIcon />,
      description: 'Receipt templates, logos, footer text',
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      description: 'Email alerts, push notifications, SMS',
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      description: 'Password policies, two-factor authentication',
    },
    {
      title: 'Appearance',
      icon: <ThemeIcon />,
      description: 'Themes, colors, layout preferences',
    },
    {
      title: 'Localization',
      icon: <LanguageIcon />,
      description: 'Language, currency, date formats',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="System Settings"
        subtitle="Configure your CloudPOS system preferences"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Settings' },
        ]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {settingCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', cursor: 'pointer' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h6">
                    {category.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={handleSettingChange('notifications')}
                />
              }
              label="Enable notifications"
            />
            <br />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailAlerts}
                  onChange={handleSettingChange('emailAlerts')}
                />
              }
              label="Email alerts"
            />
            <br />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.lowStockAlerts}
                  onChange={handleSettingChange('lowStockAlerts')}
                />
              }
              label="Low stock alerts"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              System
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoBackup}
                  onChange={handleSettingChange('autoBackup')}
                />
              }
              label="Automatic backup"
            />
            <br />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleSettingChange('darkMode')}
                />
              }
              label="Dark mode"
            />
            <br />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEffects}
                  onChange={handleSettingChange('soundEffects')}
                />
              }
              label="Sound effects"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="primary" onClick={() => console.log('Save settings')}>
            Save Changes
          </Button>
          <Button variant="outlined" onClick={() => console.log('Reset settings')}>
            Reset to Default
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Settings functionality will include:
          • Business profile configuration
          • Tax and currency settings
          • Receipt template customization
          • User preferences and themes
          • Backup and restore options
          • Integration settings for third-party services
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;