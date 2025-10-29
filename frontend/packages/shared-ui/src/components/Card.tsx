import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps } from '@mui/material';

export interface CardProps extends MuiCardProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({ 
  padding = 'medium', 
  children, 
  sx,
  ...props 
}) => {
  const paddingMap = {
    none: 0,
    small: 1,
    medium: 2,
    large: 3,
  };

  return (
    <MuiCard
      sx={{
        p: paddingMap[padding],
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
};

export default Card;