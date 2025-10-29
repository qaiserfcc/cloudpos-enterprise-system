import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  showDivider?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showDivider = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast || (!item.href && !item.onClick)) {
              return (
                <Typography key={index} color="text.primary">
                  {item.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                href={item.href}
                onClick={item.onClick}
                sx={{ cursor: item.onClick ? 'pointer' : 'default' }}
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 2,
        }}
      >
        {/* Title and Subtitle */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              mb: subtitle ? 0.5 : 0,
              fontSize: isMobile ? '1.75rem' : '2.125rem',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexShrink: 0,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
            }}
          >
            {actions}
          </Box>
        )}
      </Box>

      {/* Divider */}
      {showDivider && <Divider sx={{ mt: 3 }} />}
    </Box>
  );
};