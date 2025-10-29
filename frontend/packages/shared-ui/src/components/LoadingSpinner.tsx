import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

export interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  centered?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  message, 
  centered = true 
}) => {
  const content = (
    <>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </>
  );

  if (centered) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
      >
        {content}
      </Box>
    );
  }

  return <Box display="flex" alignItems="center" gap={1}>{content}</Box>;
};

export default LoadingSpinner;