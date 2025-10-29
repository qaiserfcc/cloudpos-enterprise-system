import React, { ReactNode } from 'react';
import { Grid, Box, useTheme } from '@mui/material';

interface ResponsiveGridProps {
  children: ReactNode;
  spacing?: number;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 3,
  columns = { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 },
  maxWidth = 'xl',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        maxWidth: maxWidth ? theme.breakpoints.values[maxWidth] : 'none',
        mx: 'auto',
        width: '100%',
      }}
    >
      <Grid container spacing={spacing}>
        {React.Children.map(children, (child, index) => (
          <Grid
            item
            xs={columns.xs || 12}
            sm={columns.sm || 6}
            md={columns.md || 4}
            lg={columns.lg || 3}
            xl={columns.xl || 3}
            key={index}
          >
            {child}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};