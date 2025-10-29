import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';

export interface ThemeProviderProps {
  children: React.ReactNode;
  mode?: 'light' | 'dark';
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  mode = 'light' 
}) => {
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;