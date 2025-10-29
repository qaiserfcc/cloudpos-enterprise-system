import React, { ReactNode, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  useTheme,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const SIDEBAR_WIDTH = 280;
const COLLAPSED_SIDEBAR_WIDTH = 64;

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true,
  maxWidth = 'xl',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const sidebarWidth = showSidebar 
    ? (sidebarCollapsed && !isMobile ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH)
    : 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          ml: showSidebar ? `${sidebarWidth}px` : 0,
          width: showSidebar ? `calc(100% - ${sidebarWidth}px)` : '100%',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Header 
          onSidebarToggle={handleSidebarToggle}
          showSidebarToggle={showSidebar}
        />
      </AppBar>

      {/* Sidebar */}
      {showSidebar && (
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarCollapsed && !isMobile ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          <Toolbar /> {/* Spacer for AppBar */}
          <Sidebar collapsed={sidebarCollapsed && !isMobile} />
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: showSidebar && !isMobile && sidebarOpen ? 0 : 0,
          width: showSidebar && !isMobile && sidebarOpen 
            ? `calc(100% - ${sidebarWidth}px)` 
            : '100%',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            maxWidth: maxWidth ? theme.breakpoints.values[maxWidth] : 'none',
            mx: 'auto',
            width: '100%',
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        {showFooter && <Footer />}
      </Box>
    </Box>
  );
};