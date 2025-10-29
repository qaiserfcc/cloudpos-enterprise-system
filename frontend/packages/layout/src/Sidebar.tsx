import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Inventory as ProductsIcon,
  ShoppingCart as SalesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  AccountBox as CustomerIcon,
  ExpandLess,
  ExpandMore,
  PointOfSale as POSIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavigationItem[];
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'pos',
    label: 'Point of Sale',
    icon: <POSIcon />,
    children: [
      {
        id: 'pos-terminal',
        label: 'POS Terminal',
        icon: <ReceiptIcon />,
        path: '/pos',
      },
      {
        id: 'sales',
        label: 'Sales',
        icon: <SalesIcon />,
        path: '/sales',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <ProductsIcon />,
    children: [
      {
        id: 'products',
        label: 'Products',
        icon: <ProductsIcon />,
        path: '/products',
      },
      {
        id: 'inventory-management',
        label: 'Stock Management',
        icon: <WarehouseIcon />,
        path: '/inventory',
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <CustomerIcon />,
    path: '/customers',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <UsersIcon />,
    path: '/users',
    roles: ['admin'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ReportsIcon />,
    children: [
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        icon: <TrendingUpIcon />,
        path: '/reports/sales',
      },
      {
        id: 'inventory-reports',
        label: 'Inventory Reports',
        icon: <ProductsIcon />,
        path: '/reports/inventory',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    roles: ['admin'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const handleExpandToggle = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    const content = (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          onClick={() => {
            if (hasChildren) {
              handleExpandToggle(item.id);
            } else {
              // Navigate to path
              console.log('Navigate to:', item.path);
            }
          }}
          sx={{
            minHeight: 48,
            pl: level * 2 + 2,
            pr: collapsed ? 2 : 3,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 'auto' : 56,
              mr: collapsed ? 0 : 3,
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>
          
          {!collapsed && (
            <>
              <ListItemText 
                primary={item.label}
                sx={{ opacity: 1 }}
              />
              {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
            </>
          )}
        </ListItemButton>
      </ListItem>
    );

    if (collapsed && hasChildren) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right">
          {content}
        </Tooltip>
      );
    }

    return (
      <React.Fragment key={item.id}>
        {collapsed ? (
          <Tooltip title={item.label} placement="right">
            {content}
          </Tooltip>
        ) : (
          content
        )}
        
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo/Brand Section */}
      {!collapsed && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            CloudPOS
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Point of Sale System
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {navigationItems.map(item => renderNavigationItem(item))}
        </List>
      </Box>

      {/* Footer Section */}
      <Divider />
      <Box sx={{ p: collapsed ? 1 : 2, textAlign: 'center' }}>
        {!collapsed && (
          <Typography variant="caption" color="text.secondary">
            v1.0.0
          </Typography>
        )}
      </Box>
    </Box>
  );
};