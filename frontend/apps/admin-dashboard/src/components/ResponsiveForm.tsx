import React from 'react';
import {
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  RadioGroup,
  Radio,
  Autocomplete,
  Stack
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers';
import { useResponsive, getResponsiveSpacing } from '../hooks/useResponsive';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'switch' | 'radio' | 'date' | 'autocomplete';
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: { value: any; label: string }[];
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface ResponsiveFormProps {
  title?: string;
  fields: FormField[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  fields,
  values,
  errors = {},
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false
}) => {
  const { isMobile, screenSize } = useResponsive();
  const spacing = getResponsiveSpacing(screenSize);

  const getFieldWidth = (field: FormField) => {
    if (isMobile) {
      return { xs: 12 };
    }
    return {
      xs: field.xs || 12,
      sm: field.sm || 6,
      md: field.md || 6,
      lg: field.lg || 4,
      xl: field.xl || 4
    };
  };

  const renderField = (field: FormField) => {
    const fieldProps = {
      fullWidth: field.fullWidth !== false,
      error: !!errors[field.id],
      helperText: errors[field.id] || field.helperText,
      disabled: disabled || loading,
      size: isMobile ? 'small' : 'medium' as 'small' | 'medium',
      sx: { mb: spacing.gap }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <TextField
            {...fieldProps}
            id={field.id}
            label={field.label}
            type={field.type}
            value={values[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            multiline={field.multiline}
            rows={field.rows}
          />
        );

      case 'select':
        return (
          <FormControl {...fieldProps}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl {...fieldProps}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              multiple
              value={values[field.id] || []}
              onChange={(e) => onChange(field.id, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'autocomplete':
        return (
          <Autocomplete
            {...fieldProps}
            options={field.options || []}
            getOptionLabel={(option) => option.label}
            value={field.options?.find(opt => opt.value === values[field.id]) || null}
            onChange={(_, newValue) => onChange(field.id, newValue?.value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                required={field.required}
                placeholder={field.placeholder}
                error={!!errors[field.id]}
                helperText={errors[field.id] || field.helperText}
              />
            )}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={values[field.id] || false}
                onChange={(e) => onChange(field.id, e.target.checked)}
                disabled={disabled || loading}
              />
            }
            label={field.label}
            sx={{ mb: spacing.gap }}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={values[field.id] || false}
                onChange={(e) => onChange(field.id, e.target.checked)}
                disabled={disabled || loading}
              />
            }
            label={field.label}
            sx={{ mb: spacing.gap }}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" sx={{ mb: spacing.gap }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {field.label} {field.required && '*'}
            </Typography>
            <RadioGroup
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio disabled={disabled || loading} />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {(errors[field.id] || field.helperText) && (
              <Typography variant="caption" color={errors[field.id] ? 'error' : 'text.secondary'}>
                {errors[field.id] || field.helperText}
              </Typography>
            )}
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            {...fieldProps}
            id={field.id}
            label={field.label}
            type="date"
            value={values[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            InputLabelProps={{ shrink: true }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: spacing.p }}>
        {title && (
          <Typography 
            variant={isMobile ? 'h6' : 'h5'} 
            gutterBottom 
            sx={{ mb: spacing.gap * 2 }}
          >
            {title}
          </Typography>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <Grid container spacing={spacing.gap}>
            {fields.map((field) => (
              <Grid 
                size={getFieldWidth(field)}
                key={field.id}
              >
                {renderField(field)}
              </Grid>
            ))}
            
            <Grid size={{ xs: 12 }}>
              <Stack 
                direction={isMobile ? 'column' : 'row'} 
                spacing={spacing.gap}
                sx={{ mt: spacing.gap }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={disabled || loading}
                  fullWidth={isMobile}
                  size={isMobile ? 'large' : 'medium'}
                >
                  {loading ? 'Loading...' : submitLabel}
                </Button>
                
                {onCancel && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                    fullWidth={isMobile}
                    size={isMobile ? 'large' : 'medium'}
                  >
                    {cancelLabel}
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResponsiveForm;