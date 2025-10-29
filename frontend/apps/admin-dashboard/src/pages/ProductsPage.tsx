import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { PageHeader } from '@cloudpos/layout';
import { Button } from '@cloudpos/shared-ui';
import { Add as AddIcon } from '@mui/icons-material';

const ProductsPage: React.FC = () => {
  // Mock products data
  const products = [
    {
      id: 1,
      name: 'Premium Coffee',
      price: '$4.99',
      stock: 45,
      category: 'Beverages',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Croissant',
      price: '$2.99',
      stock: 23,
      category: 'Bakery',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Cappuccino',
      price: '$3.99',
      stock: 67,
      category: 'Beverages',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Sugar Packets',
      price: '$0.25',
      stock: 5,
      category: 'Supplies',
      status: 'Low Stock',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Product Management"
        subtitle="Manage your product catalog, pricing, and inventory"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products' },
        ]}
        actions={
          <Button
            variant="primary"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add product')}
          >
            Add Product
          </Button>
        }
      />

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {product.name}
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {product.price}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stock} units
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {product.category}
                  </Typography>
                </Box>
                <Chip
                  label={product.status}
                  color={product.status === 'Low Stock' ? 'warning' : 'success'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Product management will include features like:
          • Product catalog with images and detailed descriptions
          • Category management and organization
          • Pricing controls and bulk price updates
          • Inventory tracking and low stock alerts
          • Barcode generation and scanning
          • Product variants and options
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProductsPage;