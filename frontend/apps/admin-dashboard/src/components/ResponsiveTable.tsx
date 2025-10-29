import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useResponsive } from '../hooks/useResponsive';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
  hideOnMobile?: boolean;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

export interface ResponsiveTableProps {
  columns: Column[];
  rows: any[];
  title?: string;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  emptyMessage?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  rows,
  title,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  actions,
  emptyMessage = 'No data available'
}) => {
  const { isMobile, isTablet, screenSize } = useResponsive();
  const theme = useTheme();
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

  const visibleColumns = columns.filter(col => 
    !isMobile || !col.hideOnMobile
  );

  const handleExpandRow = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const renderMobileCard = (row: any, index: number) => {
    const mainColumn = columns[0];
    const secondaryColumn = columns[1];
    const hiddenColumns = columns.filter(col => col.hideOnMobile);
    
    return (
      <Card key={index} sx={{ mb: 1, cursor: onRowClick ? 'pointer' : 'default' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box onClick={() => onRowClick?.(row)}>
            <Typography variant="subtitle1" fontWeight="bold">
              {mainColumn.renderCell 
                ? mainColumn.renderCell(row[mainColumn.id], row)
                : mainColumn.format 
                  ? mainColumn.format(row[mainColumn.id])
                  : row[mainColumn.id]
              }
            </Typography>
            
            {secondaryColumn && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {secondaryColumn.renderCell 
                  ? secondaryColumn.renderCell(row[secondaryColumn.id], row)
                  : secondaryColumn.format 
                    ? secondaryColumn.format(row[secondaryColumn.id])
                    : row[secondaryColumn.id]
                }
              </Typography>
            )}

            {/* Show first few visible columns as chips */}
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              {visibleColumns.slice(2, 4).map((column) => (
                <Chip
                  key={column.id}
                  size="small"
                  label={`${column.label}: ${
                    column.renderCell 
                      ? column.renderCell(row[column.id], row)
                      : column.format 
                        ? column.format(row[column.id])
                        : row[column.id]
                  }`}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          {/* Expandable section for hidden columns */}
          {hiddenColumns.length > 0 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {hiddenColumns.length} more details
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleExpandRow(index)}
                >
                  {expandedRows.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedRows.has(index)}>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  {hiddenColumns.map((column) => (
                    <Box key={column.id} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {column.label}:
                      </Typography>
                      <Typography variant="body2" align="right">
                        {column.renderCell 
                          ? column.renderCell(row[column.id], row)
                          : column.format 
                            ? column.format(row[column.id])
                            : row[column.id]
                        }
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </>
          )}

          {/* Actions */}
          {actions && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              {actions(row)}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDesktopTable = () => (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ 
                  minWidth: column.minWidth,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {actions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow 
              hover 
              key={index}
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {visibleColumns.map((column) => (
                <TableCell 
                  key={column.id} 
                  align={column.align}
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  {column.renderCell 
                    ? column.renderCell(row[column.id], row)
                    : column.format 
                      ? column.format(row[column.id])
                      : row[column.id]
                  }
                </TableCell>
              ))}
              {actions && (
                <TableCell align="center">
                  {actions(row)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
            {emptyMessage}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom sx={{ 
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          mb: 2
        }}>
          {title}
        </Typography>
      )}
      
      {isMobile ? (
        <Box>
          {rows.map((row, index) => renderMobileCard(row, index))}
        </Box>
      ) : (
        renderDesktopTable()
      )}

      {(onPageChange || onRowsPerPageChange) && (
        <TablePagination
          rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
          component="div"
          count={totalCount || rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
          sx={{
            '& .MuiTablePagination-toolbar': {
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }
          }}
        />
      )}
    </Box>
  );
};

export default ResponsiveTable;