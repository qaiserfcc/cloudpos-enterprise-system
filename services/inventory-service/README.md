# CloudPOS Inventory Service

A comprehensive microservice for managing products, stock levels, suppliers, and purchase orders in the CloudPOS system. This service provides complete inventory management capabilities with real-time stock tracking, automated alerts, and supplier relationship management.

## Features

### Product Management
- **Product CRUD Operations**: Complete create, read, update, delete functionality for products
- **Category Management**: Hierarchical product categorization with unlimited nesting
- **Barcode & SKU Support**: Unique identification with barcode scanning capabilities
- **Advanced Search**: Full-text search with filters for category, brand, price range, and stock levels
- **Product Variants**: Support for different product variations and attributes
- **Pricing Management**: Multiple pricing tiers with cost tracking

### Stock Management
- **Real-time Stock Tracking**: Live inventory levels with reserved quantity management
- **Stock Movements**: Complete audit trail of all stock changes with reasons
- **Automated Alerts**: Low stock, out-of-stock, and reorder point notifications
- **Stock Adjustments**: Manual adjustments with proper documentation
- **Multi-location Support**: Track inventory across different warehouse locations
- **Stock Reservations**: Temporary holds for pending transactions

### Supplier Management
- **Supplier Database**: Complete vendor information with contact details
- **Purchase Orders**: Create, track, and manage purchase orders
- **Supplier Performance**: Rating and performance tracking
- **Payment Terms**: Manage credit limits and payment conditions
- **Order Status Tracking**: From draft to delivery with status updates

### Analytics & Reporting
- **Inventory Valuation**: Real-time calculation of total inventory value
- **Stock Movement Reports**: Detailed movement history and trends
- **Low Stock Reports**: Proactive inventory management alerts
- **Supplier Analytics**: Performance metrics and purchase history

## API Endpoints

### Product Management
- `POST /api/products` - Create new product
- `GET /api/products` - Search products with filters
- `GET /api/products/:productId` - Get product by ID
- `GET /api/products/sku/:sku` - Get product by SKU
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `PUT /api/products/:productId` - Update product
- `DELETE /api/products/:productId` - Delete product

### Category Management
- `POST /api/products/categories` - Create product category
- `GET /api/products/categories` - Get all categories

### Stock Management
- `GET /api/stock/levels` - Get stock levels
- `POST /api/stock/adjust` - Adjust stock levels
- `POST /api/stock/reserve` - Reserve stock
- `GET /api/stock/movements` - Get stock movement history
- `GET /api/stock/alerts` - Get inventory alerts
- `POST /api/stock/alerts/:alertId/acknowledge` - Acknowledge alert

### Supplier Management
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - Get suppliers list
- `GET /api/suppliers/:supplierId` - Get supplier details
- `PUT /api/suppliers/:supplierId` - Update supplier
- `DELETE /api/suppliers/:supplierId` - Delete supplier

### Purchase Orders
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders` - Get purchase orders
- `GET /api/purchase-orders/:orderId` - Get purchase order details
- `PUT /api/purchase-orders/:orderId/status` - Update order status

## Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with advanced indexing
- **Validation**: Joi for comprehensive input validation
- **Logging**: Winston for structured logging
- **Authentication**: JWT integration ready
- **Math**: Decimal.js for precise financial calculations

## Database Schema

### Core Tables
- **products**: Product master data with pricing and specifications
- **product_categories**: Hierarchical category structure
- **stock_levels**: Real-time inventory levels per location
- **stock_movements**: Complete audit trail of all stock changes
- **suppliers**: Vendor master data and contact information
- **purchase_orders**: Purchase order header information
- **purchase_order_items**: Line items for purchase orders
- **inventory_alerts**: Automated alert system for stock issues

### Key Features
- **ACID Transactions**: Ensures data consistency across operations
- **Optimized Indexes**: High-performance queries for search and reporting
- **Audit Trails**: Complete tracking of all data changes
- **Referential Integrity**: Maintains data relationships and prevents orphaned records

## Installation

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
\`\`\`

## Configuration

Create a `.env` file with the following variables:

\`\`\`
NODE_ENV=development
PORT=3004
LOG_LEVEL=info

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudpos_inventory
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Authentication
JWT_SECRET=your_jwt_secret

# Redis (if using for caching)
REDIS_URL=redis://localhost:6379
\`\`\`

## Development

\`\`\`bash
# Build the service
npm run build

# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
\`\`\`

## API Authentication

All API endpoints require authentication via Bearer token:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

The service expects the following user context:
- **User ID**: For audit trails
- **Store ID**: For multi-tenant data isolation
- **Role**: For permission-based access control

## Data Models

### Product
- Complete product information with pricing and specifications
- Category assignment and brand information
- Stock tracking settings and reorder points
- Custom attributes and metadata support

### Stock Level
- Current quantity and reserved amounts
- Location-specific tracking
- Cost basis and valuation
- Last restock and sale dates

### Supplier
- Complete vendor contact information
- Payment terms and credit limits
- Performance ratings and notes
- Address and tax information

### Purchase Order
- Order lifecycle from draft to received
- Line item details with costs
- Delivery tracking and notes
- Financial totals and tax calculations

## Performance Features

- **Database Connection Pooling**: Efficient database resource management
- **Optimized Queries**: Index-optimized database queries for fast response times
- **Pagination Support**: Handle large datasets efficiently
- **Caching Ready**: Redis integration for frequently accessed data
- **Bulk Operations**: Efficient batch processing for large updates

## Error Handling

- **Structured Error Responses**: Consistent error format across all endpoints
- **Validation Errors**: Detailed field-level validation messages
- **Database Constraints**: Proper handling of referential integrity violations
- **Logging**: Comprehensive error logging for debugging and monitoring

## Integration Points

### Authentication Service
- JWT token verification
- User role and permission validation
- Store-based access control

### Transaction Service
- Real-time stock updates during sales
- Stock reservation for pending transactions
- Inventory impact tracking

### Reporting Service
- Inventory valuation data
- Stock movement analytics
- Supplier performance metrics

This service provides enterprise-grade inventory management capabilities with high performance, data integrity, and comprehensive feature coverage for modern point-of-sale systems.