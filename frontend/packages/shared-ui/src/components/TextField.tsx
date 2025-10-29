import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';

export interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  variant?: 'standard' | 'outlined' | 'filled';
}

const TextField: React.FC<TextFieldProps> = ({ variant = 'outlined', ...props }) => {
  return <MuiTextField variant={variant} {...props} />;
};

export default TextField;