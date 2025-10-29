import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PointOfSale as POSIcon,
  Inventory as ProductsIcon,
  People as CustomersIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MobileNavigationProps {
  value?: string;
  onChange?: (value: string) => void;
  items?: MobileNavItem[];
}

const defaultMobileNavItems: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'pos',
    label: 'POS',
    icon: <POSIcon />,
    path: '/pos',
  },
  {
    id: 'products',
    label: 'Products',
    icon: <ProductsIcon />,
    path: '/products',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <CustomersIcon />,
    path: '/customers',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ReportsIcon />,
    path: '/reports',
  },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  value,
  onChange,
  items = defaultMobileNavItems,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return null;
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            fontSize: '0.75rem',
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            value={item.id}
            icon={item.icon}
            sx={{
              color: value === item.id ? 'primary.main' : 'text.secondary',
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};