import React from 'react';
import {
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';

interface HeaderProps {
  onSidebarToggle: () => void;
  showSidebarToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSidebarToggle,
  showSidebarToggle = true,
}) => {
  return (
    <Toolbar>
      {/* Sidebar Toggle */}
      {showSidebarToggle && (
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={onSidebarToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* App Title */}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        CloudPOS
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton color="inherit" aria-label="notifications">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Settings">
          <IconButton color="inherit" aria-label="settings">
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Tooltip title="Account">
          <IconButton color="inherit" aria-label="account">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
};