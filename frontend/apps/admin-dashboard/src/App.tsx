import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import SimpleLoginPage from './pages/SimpleLoginPage';
import ProductManagementPage from './pages/ProductManagementPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import SalesManagementPage from './pages/SalesManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import TaxConfigurationPage from './pages/TaxConfigurationPage';
import PaymentProcessingPage from './pages/PaymentProcessingPage';
import StoreConfigurationPage from './pages/StoreConfigurationPage';
import PromotionEnginePage from './pages/PromotionEnginePage';
import NotificationSystemPage from './pages/NotificationSystemPage';
import BackupRecoveryPage from './pages/BackupRecoveryPage';
import AuditLoggingPage from './pages/AuditLoggingPage';
import DataExportImportPage from './pages/DataExportImportPage';
import HelpDocumentationPage from './pages/HelpDocumentationPage';
import AdvancedSecurityPage from './pages/AdvancedSecurityPage';
import ResponsiveLayout from './components/ResponsiveLayout';
import { createResponsiveTheme } from './theme/responsiveTheme';
import { useState } from 'react';

const theme = createResponsiveTheme();

function App() {
  // For now, we'll use a simple boolean to simulate authentication
  const isAuthenticated = true;
  const [tabValue, setTabValue] = useState(0);

  if (!isAuthenticated) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SimpleLoginPage />
        </ThemeProvider>
      </Provider>
    );
  }

  const renderCurrentPage = () => {
    switch (tabValue) {
      case 0: return <ProductManagementPage />;
      case 1: return <InventoryManagementPage />;
      case 2: return <SalesManagementPage />;
      case 3: return <CustomerManagementPage />;
      case 4: return <ReportsAnalyticsPage />;
      case 5: return <EmployeeManagementPage />;
      case 6: return <SupplierManagementPage />;
      case 7: return <TaxConfigurationPage />;
      case 8: return <PaymentProcessingPage />;
      case 9: return <StoreConfigurationPage />;
      case 10: return <PromotionEnginePage />;
      case 11: return <NotificationSystemPage />;
      case 12: return <BackupRecoveryPage />;
      case 13: return <AuditLoggingPage />;
      case 14: return <DataExportImportPage />;
      case 15: return <HelpDocumentationPage />;
      case 16: return <AdvancedSecurityPage />;
      default: return <ProductManagementPage />;
    }
  };

  // Show both Product Management and Inventory Management pages
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ResponsiveLayout 
          currentTab={tabValue} 
          onTabChange={setTabValue}
        >
          {renderCurrentPage()}
        </ResponsiveLayout>
      </ThemeProvider>
    </Provider>
  );
}

export default App;