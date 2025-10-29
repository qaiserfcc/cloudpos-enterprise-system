import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    mobile: true;
    tablet: true;
    laptop: true;
    desktop: true;
  }
}

const responsiveTheme: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      mobile: 320,
      sm: 600,
      tablet: 768,
      md: 900,
      laptop: 1024,
      lg: 1200,
      desktop: 1440,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 300,
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 300,
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.625rem',
      fontWeight: 400,
      lineHeight: 1.167,
      '@media (max-width:600px)': {
        fontSize: '1.375rem',
      },
    },
    h4: {
      fontSize: '1.375rem',
      fontWeight: 400,
      lineHeight: 1.235,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.334,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
      },
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      '@media (max-width:600px)': {
        fontSize: '0.675rem',
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 36,
          '@media (max-width:768px)': {
            minHeight: 44, // Larger touch targets for mobile
            fontSize: '0.875rem',
          },
        },
        sizeLarge: {
          minHeight: 48,
          '@media (max-width:768px)': {
            minHeight: 52,
          },
        },
        sizeSmall: {
          minHeight: 32,
          '@media (max-width:768px)': {
            minHeight: 40,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: 12, // Larger touch targets
          },
        },
        sizeSmall: {
          '@media (max-width:768px)': {
            padding: 8,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '@media (max-width:768px)': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '@media (max-width:768px)': {
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:768px)': {
            padding: '8px 4px',
            fontSize: '0.75rem',
          },
        },
        head: {
          fontWeight: 600,
          '@media (max-width:768px)': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '@media (max-width:768px)': {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:768px)': {
            padding: '12px',
          },
          '&:last-child': {
            paddingBottom: '16px',
            '@media (max-width:768px)': {
              paddingBottom: '12px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:768px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '1.125rem',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: '8px 16px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            padding: '8px 16px 16px',
            flexDirection: 'column',
            '& > :not(:first-of-type)': {
              marginLeft: 0,
              marginTop: 8,
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            minHeight: 48,
          },
        },
        scroller: {
          '@media (max-width:768px)': {
            '& .MuiTabs-indicator': {
              height: 3,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 48,
          '@media (max-width:768px)': {
            minHeight: 48,
            fontSize: '0.75rem',
            padding: '6px 8px',
            minWidth: 80,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            fontSize: '0.6875rem',
            height: 24,
          },
        },
        sizeSmall: {
          '@media (max-width:768px)': {
            fontSize: '0.625rem',
            height: 20,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            width: 56,
            height: 56,
          },
        },
        sizeSmall: {
          '@media (max-width:768px)': {
            width: 40,
            height: 40,
          },
        },
      },
    },
    MuiSpeedDial: {
      styleOverrides: {
        fab: {
          '@media (max-width:768px)': {
            width: 56,
            height: 56,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            height: 64,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        regular: {
          '@media (max-width:768px)': {
            minHeight: 64,
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
  },
};

export const createResponsiveTheme = () => createTheme(responsiveTheme);

export default createResponsiveTheme;