import React from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Assessment as ReportsIcon,
  Group as EmployeesIcon,
  Business as SuppliersIcon,
  Receipt as TaxIcon,
  Payment as PaymentIcon,
  Store as StoreIcon,
  LocalOffer as PromotionIcon,
  Notifications as NotificationIcon,
  Backup as BackupIcon,
  Security as AuditIcon,
  Transform as DataIcon,
  HelpOutline as HelpIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon
} from '@mui/icons-material';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentTab: number;
  onTabChange: (tabIndex: number) => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentTab,
  onTabChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);

  const menuItems = [
    {
      id: 'core',
      label: 'Core Operations',
      items: [
        { index: 0, label: 'Product Management', icon: <DashboardIcon /> },
        { index: 1, label: 'Inventory', icon: <InventoryIcon /> },
        { index: 2, label: 'Sales/POS', icon: <SalesIcon /> },
        { index: 3, label: 'Customer Management', icon: <CustomersIcon /> }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      items: [
        { index: 4, label: 'Reports & Analytics', icon: <ReportsIcon /> }
      ]
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        { index: 5, label: 'Employee Management', icon: <EmployeesIcon /> },
        { index: 6, label: 'Supplier Management', icon: <SuppliersIcon /> }
      ]
    },
    {
      id: 'configuration',
      label: 'Configuration',
      items: [
        { index: 7, label: 'Tax Configuration', icon: <TaxIcon /> },
        { index: 8, label: 'Payment Processing', icon: <PaymentIcon /> },
        { index: 9, label: 'Store Configuration', icon: <StoreIcon /> },
        { index: 10, label: 'Promotion Engine', icon: <PromotionIcon /> }
      ]
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { index: 11, label: 'Notifications', icon: <NotificationIcon /> },
        { index: 12, label: 'Backup & Recovery', icon: <BackupIcon /> },
        { index: 13, label: 'Audit Logging', icon: <AuditIcon /> },
        { index: 14, label: 'Data Export/Import', icon: <DataIcon /> },
        { index: 15, label: 'Help & Documentation', icon: <HelpIcon /> },
        { index: 16, label: 'Advanced Security', icon: <SecurityIcon /> }
      ]
    }
  ];

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMenuClick = (index: number) => {
    onTabChange(index);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleMenuExpand = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const speedDialActions = [
    { icon: <SalesIcon />, name: 'Quick Sale', onClick: () => handleMenuClick(2) },
    { icon: <InventoryIcon />, name: 'Inventory', onClick: () => handleMenuClick(1) },
    { icon: <CustomersIcon />, name: 'Customers', onClick: () => handleMenuClick(3) },
    { icon: <ReportsIcon />, name: 'Reports', onClick: () => handleMenuClick(4) }
  ];

  const drawerContent = (
    <Box sx={{ width: isMobile ? 280 : 300, pt: isMobile ? 8 : 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2, color: 'primary.main' }}>
        CloudPOS Admin
      </Typography>
      <Divider />
      
      {menuItems.map((category) => (
        <Box key={category.id}>
          <ListItemButton 
            onClick={() => handleMenuExpand(category.id)}
            sx={{ 
              backgroundColor: 'grey.50',
              '&:hover': { backgroundColor: 'grey.100' }
            }}
          >
            <ListItemText 
              primary={category.label}
              primaryTypographyProps={{ 
                variant: 'subtitle2', 
                fontWeight: 'bold',
                color: 'text.secondary'
              }}
            />
            {expandedMenus.includes(category.id) ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          
          <Collapse in={expandedMenus.includes(category.id)} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {category.items.map((item) => (
                <ListItem key={item.index} disablePadding>
                  <ListItemButton
                    selected={currentTab === item.index}
                    onClick={() => handleMenuClick(item.index)}
                    sx={{ 
                      pl: 4,
                      minHeight: 48,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText'
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        fontSize: isMobile ? '0.875rem' : '0.9rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
          <Divider />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile/Tablet App Bar */}
      {(isMobile || isTablet) && (
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            height: 64,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              CloudPOS Admin
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : isTablet ? 'temporary' : 'permanent'}
        open={isMobile || isTablet ? mobileDrawerOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isMobile ? 280 : 300,
            background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            minHeight: 64,
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant="h6" color="primary">
              Navigation
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          ml: isMobile || isTablet ? 0 : '300px',
          mt: isMobile || isTablet ? 8 : 0,
          minHeight: '100vh',
          backgroundColor: '#fafafa',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          p: isMobile ? 1 : isTablet ? 2 : 3,
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {children}
        </Box>
      </Box>

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            '& .MuiFab-primary': {
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
            }
          }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}
    </Box>
  );
};

export default ResponsiveLayout;