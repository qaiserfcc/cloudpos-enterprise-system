import React, { ReactNode } from 'react';
import { Container, Box } from '@mui/material';

interface ContentContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number | string;
  disableGutters?: boolean;
  centerContent?: boolean;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 3,
  disableGutters = false,
  centerContent = false,
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        py: padding,
        px: disableGutters ? 0 : padding,
        height: '100%',
        display: centerContent ? 'flex' : 'block',
        alignItems: centerContent ? 'center' : 'stretch',
        justifyContent: centerContent ? 'center' : 'flex-start',
      }}
    >
      {centerContent ? (
        <Box sx={{ width: '100%', maxWidth: 'sm' }}>
          {children}
        </Box>
      ) : (
        children
      )}
    </Container>
  );
};