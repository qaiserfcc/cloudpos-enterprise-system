import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Inventory as ProductsIcon,
  ShoppingCart as SalesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  AccountBox as CustomerIcon,
  PointOfSale as POSIcon,
} from '@mui/icons-material';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  permissions?: string[];
  badge?: string | number;
  description?: string;
}

interface NavigationMenuProps {
  items?: MenuItem[];
  userRole?: string;
  userPermissions?: string[];
  onItemClick?: (item: MenuItem) => void;
  variant?: 'list' | 'grid';
}

const defaultMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    description: 'Overview and analytics',
  },
  {
    id: 'pos',
    label: 'Point of Sale',
    icon: <POSIcon />,
    path: '/pos',
    description: 'Process sales and transactions',
    roles: ['admin', 'cashier'],
  },
  {
    id: 'products',
    label: 'Products',
    icon: <ProductsIcon />,
    path: '/products',
    description: 'Manage product catalog',
    roles: ['admin'],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <SalesIcon />,
    path: '/sales',
    description: 'View sales history',
    roles: ['admin', 'cashier'],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <CustomerIcon />,
    path: '/customers',
    description: 'Customer management',
    roles: ['admin', 'cashier'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: <UsersIcon />,
    path: '/users',
    description: 'User administration',
    roles: ['admin'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ReportsIcon />,
    path: '/reports',
    description: 'Analytics and reports',
    roles: ['admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    description: 'System configuration',
    roles: ['admin'],
  },
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items = defaultMenuItems,
  userRole,
  userPermissions = [],
  onItemClick,
  variant = 'list',
}) => {
  const hasAccess = (item: MenuItem): boolean => {
    // If no roles/permissions specified, item is accessible to all
    if (!item.roles && !item.permissions) {
      return true;
    }

    // Check role-based access
    if (item.roles && userRole && item.roles.includes(userRole)) {
      return true;
    }

    // Check permission-based access
    if (item.permissions && item.permissions.some(permission => 
      userPermissions.includes(permission)
    )) {
      return true;
    }

    return false;
  };

  const accessibleItems = items.filter(hasAccess);

  const handleItemClick = (item: MenuItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  if (variant === 'grid') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 2,
          p: 2,
        }}
      >
        {accessibleItems.map((item) => (
          <Box
            key={item.id}
            onClick={() => handleItemClick(item)}
            sx={{
              p: 3,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2, color: 'primary.main' }}>
                {item.icon}
              </Box>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {item.label}
              </Typography>
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            {item.description && (
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <List>
      {accessibleItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          <ListItemButton onClick={() => handleItemClick(item)}>
            <ListItemIcon sx={{ color: 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{item.label}</Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              }
              secondary={item.description}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};