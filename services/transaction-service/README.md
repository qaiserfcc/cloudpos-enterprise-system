# CloudPOS Transaction Service

A comprehensive microservice for handling point-of-sale transactions, cart management, and payment processing in the CloudPOS system.

## Features

- **Cart Management**: Shopping cart operations with precise decimal calculations
- **Transaction Processing**: Complete transaction lifecycle management
- **Payment Handling**: Multiple payment method support
- **Inventory Integration**: Real-time inventory updates during transactions
- **Redis Integration**: High-performance caching and session management
- **Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: API protection and performance optimization
- **Validation**: Comprehensive request validation using Joi schemas

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Cart Operations
- `POST /api/cart` - Create new cart
- `POST /api/cart/:cartId/items` - Add item to cart
- `PUT /api/cart/:cartId/items/:itemId` - Update cart item
- `DELETE /api/cart/:cartId/items/:itemId` - Remove cart item
- `GET /api/cart/:cartId` - Get cart details
- `DELETE /api/cart/:cartId` - Clear cart

### Transaction Operations
- `POST /api/transactions` - Create transaction from cart
- `POST /api/transactions/:transactionId/payment` - Process payment
- `GET /api/transactions/:transactionId` - Get transaction details
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions/:transactionId/void` - Void transaction
- `GET /api/transactions/sales-summary` - Sales summary report

## Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Validation**: Joi
- **Authentication**: JWT
- **Math**: Decimal.js for precise calculations

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Create a `.env` file with:

\`\`\`
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudpos_transactions
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
\`\`\`

## Development

\`\`\`bash
# Build
npm run build

# Start development server
npm run dev

# Start production server
npm start
\`\`\`

## Architecture

The transaction service follows a layered architecture:

- **Routes**: API endpoint definitions
- **Services**: Business logic and database operations
- **Middleware**: Authentication, validation, and rate limiting
- **Utils**: Shared utilities and logging

## Data Models

### Cart
- Cart ID, store ID, customer information
- Cart items with product details, quantities, prices
- Calculated totals including taxes and discounts

### Transaction
- Transaction metadata and status
- Payment information and processing results
- Inventory impact tracking
- Audit trail for compliance

## Performance

- Redis caching for frequently accessed data
- Connection pooling for database efficiency
- Rate limiting to prevent abuse
- Optimized queries with proper indexing

This service is designed to handle high-volume transaction processing with enterprise-grade reliability and performance.