import { useTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

export interface BreakpointConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const useResponsive = (): BreakpointConfig => {
  const theme = useTheme();
  
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeMobile = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = useMemo(() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    return 'xl';
  }, [isXs, isSm, isMd, isLg]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
    screenSize
  };
};

export const getResponsiveSpacing = (screenSize: string) => {
  switch (screenSize) {
    case 'xs':
      return { p: 1, m: 0.5, gap: 1 };
    case 'sm':
      return { p: 1.5, m: 1, gap: 1.5 };
    case 'md':
      return { p: 2, m: 1.5, gap: 2 };
    case 'lg':
      return { p: 3, m: 2, gap: 3 };
    default:
      return { p: 3, m: 2, gap: 3 };
  }
};

export const getResponsiveColumns = (screenSize: string) => {
  switch (screenSize) {
    case 'xs':
      return { xs: 12, sm: 12, md: 6, lg: 4, xl: 3 };
    case 'sm':
      return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };
    case 'md':
      return { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };
    case 'lg':
      return { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };
    default:
      return { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };
  }
};

export const getResponsiveFontSize = (screenSize: string) => {
  switch (screenSize) {
    case 'xs':
      return {
        h1: '1.8rem',
        h2: '1.6rem',
        h3: '1.4rem',
        h4: '1.2rem',
        h5: '1.1rem',
        h6: '1rem',
        body1: '0.875rem',
        body2: '0.75rem'
      };
    case 'sm':
      return {
        h1: '2rem',
        h2: '1.8rem',
        h3: '1.6rem',
        h4: '1.4rem',
        h5: '1.2rem',
        h6: '1.1rem',
        body1: '0.9rem',
        body2: '0.8rem'
      };
    default:
      return {
        h1: '2.4rem',
        h2: '2rem',
        h3: '1.8rem',
        h4: '1.6rem',
        h5: '1.4rem',
        h6: '1.2rem',
        body1: '1rem',
        body2: '0.875rem'
      };
  }
};

export const getMobileTableConfig = (screenSize: string) => {
  if (screenSize === 'xs') {
    return {
      hideColumns: true,
      stackedView: true,
      pagination: { rowsPerPage: 5, showRowsPerPage: false }
    };
  }
  if (screenSize === 'sm') {
    return {
      hideColumns: false,
      stackedView: false,
      pagination: { rowsPerPage: 10, showRowsPerPage: true }
    };
  }
  return {
    hideColumns: false,
    stackedView: false,
    pagination: { rowsPerPage: 15, showRowsPerPage: true }
  };
};

export const getTouchTargetSize = (screenSize: string) => {
  // Minimum 44px touch target for mobile accessibility
  return screenSize === 'xs' || screenSize === 'sm' ? 44 : 36;
};