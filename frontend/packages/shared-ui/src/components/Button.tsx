import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading = false, 
  children,
  disabled,
  ...props 
}) => {
  const muiVariant = variant === 'primary' ? 'contained' : 
                     variant === 'secondary' ? 'contained' : 
                     variant === 'outlined' ? 'outlined' : 'text';
  
  const color = variant === 'secondary' ? 'secondary' : 'primary';

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </MuiButton>
  );
};

export default Button;