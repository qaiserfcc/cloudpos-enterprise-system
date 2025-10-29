import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Transform as TransformIcon } from '@mui/icons-material';

const DataExportImportPage: React.FC = () => {
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TransformIcon sx={{ mr: 2 }} />
        Data Export & Import
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Data Export & Import Module
          </Typography>
          <Typography variant="body1">
            This module allows you to export and import data for the CloudPOS system. 
            Features include:
          </Typography>
          <ul>
            <li>Export transaction data, inventory, and customer information</li>
            <li>Import data from CSV, Excel, and JSON formats</li>
            <li>Scheduled exports and imports</li>
            <li>Data validation and preview</li>
            <li>Integration with external systems</li>
          </ul>
          
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Note: This is a simplified view. The full feature implementation is being restored.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default DataExportImportPage;