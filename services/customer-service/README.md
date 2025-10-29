# CloudPOS Customer Service

A comprehensive customer management microservice for the CloudPOS system, providing complete customer lifecycle management, loyalty programs, analytics, and marketing automation capabilities.

## Features

### Core Customer Management
- ✅ **Customer CRUD Operations** - Create, read, update, delete customer records
- ✅ **Customer Search & Filtering** - Advanced search with multiple criteria
- ✅ **Customer Segmentation** - Automatic segmentation based on behavior and value
- ✅ **Customer Analytics** - Detailed behavioral and transactional analytics
- ✅ **Address Management** - Multiple addresses per customer with geolocation
- ✅ **Preferences Management** - Communication and privacy preferences

### Loyalty Program
- ✅ **Points System** - Earn and redeem loyalty points
- ✅ **Tier Management** - Bronze, Silver, Gold, Platinum tiers
- ✅ **Loyalty Analytics** - Track engagement and program effectiveness
- ✅ **Expiration Management** - Automatic point expiration handling
- ✅ **Transaction History** - Complete loyalty transaction tracking

### Advanced Analytics
- ✅ **Customer Lifetime Value** - Predictive CLV calculation
- ✅ **Churn Risk Analysis** - Machine learning-based churn prediction
- ✅ **Cohort Analysis** - Customer cohort performance tracking
- ✅ **Segment Analytics** - Deep insights into customer segments
- ✅ **Purchase Behavior** - Shopping patterns and preferences

### Marketing & Automation
- ✅ **Customer Events** - Comprehensive event tracking
- ✅ **Marketing Campaigns** - Campaign management and tracking
- ✅ **Segmentation Rules** - Dynamic customer segmentation
- ✅ **Communication Preferences** - Multi-channel preference management
- ✅ **Webhook Support** - Real-time event notifications

## API Documentation

### Authentication
All endpoints require a valid JWT token in the Authorization header and a Store ID in the `x-store-id` header.

```bash
Authorization: Bearer <jwt-token>
x-store-id: <store-uuid>
```

### Core Endpoints

#### Customers
```bash
# List/Search customers
GET /api/v1/customers?query=john&status=active&page=1&limit=20

# Create customer
POST /api/v1/customers
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": {
    "street1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  }
}

# Get customer by ID
GET /api/v1/customers/{customerId}

# Update customer
PUT /api/v1/customers/{customerId}

# Delete customer
DELETE /api/v1/customers/{customerId}

# Get customer statistics
GET /api/v1/customers/stats
```

#### Addresses
```bash
# Get customer addresses
GET /api/v1/customers/{customerId}/addresses

# Add address
POST /api/v1/customers/{customerId}/addresses

# Update address
PUT /api/v1/customers/{customerId}/addresses/{addressId}

# Delete address
DELETE /api/v1/customers/{customerId}/addresses/{addressId}
```

#### Loyalty Points
```bash
# Add/Redeem loyalty points
POST /api/v1/customers/loyalty/points
{
  "customerId": "uuid",
  "type": "earned|redeemed",
  "points": 100,
  "description": "Purchase reward",
  "transactionId": "txn_123"
}
```

#### Analytics
```bash
# Customer analytics
GET /api/v1/analytics/customers/{customerId}

# Analytics overview
GET /api/v1/analytics/overview

# Segment analysis
GET /api/v1/analytics/segments

# Cohort analysis
GET /api/v1/analytics/cohorts?startDate=2024-01-01&endDate=2024-12-31

# Trigger analytics recalculation
POST /api/v1/analytics/recalculate
```

### Search Parameters

#### Customer Search
- `query` - Search in name, email, phone, customer number
- `status` - Filter by customer status (active, inactive, suspended)
- `type` - Filter by customer type (individual, business)
- `segment` - Filter by segment (new, regular, vip, at_risk, churned)
- `tier` - Filter by loyalty tier (bronze, silver, gold, platinum)
- `tags` - Filter by tags
- `createdFrom/createdTo` - Filter by creation date
- `lastVisitFrom/lastVisitTo` - Filter by last visit date
- `totalSpentMin/totalSpentMax` - Filter by total spent amount
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `sortBy` - Sort field (createdAt, name, email, lastVisitAt, totalSpent)
- `sortOrder` - Sort direction (asc, desc)

## Database Schema

### Core Tables
- **customers** - Primary customer information
- **customer_addresses** - Customer addresses with geolocation
- **customer_preferences** - Communication and privacy preferences
- **customer_analytics** - Behavioral and transactional analytics
- **customer_events** - Customer activity event log

### Loyalty Tables
- **loyalty_programs** - Loyalty program configuration
- **customer_loyalty** - Customer loyalty enrollment and status
- **loyalty_transactions** - Points earning and redemption history

### Marketing Tables
- **customer_segment_rules** - Dynamic segmentation rules
- **marketing_campaigns** - Marketing campaign definitions
- **customer_webhooks** - Webhook configuration for events

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+ (optional, for caching)

### Local Development

1. **Clone and Install**
```bash
git clone <repository-url>
cd services/customer-service
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Create database
createdb cloudpos_customers

# Run migrations (auto-runs on startup)
npm run dev
```

4. **Start Development Server**
```bash
npm run dev
```

### Docker Deployment

```bash
# Build image
docker build -t cloudpos/customer-service .

# Run container
docker run -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  cloudpos/customer-service
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Optional |
| `JWT_SECRET` | JWT signing secret | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Configuration

The service automatically creates the required database schema on startup. Ensure your PostgreSQL user has CREATE privileges.

### Security Features

- **JWT Authentication** - Secure API access
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Cross-origin request control
- **Helmet Security** - Security headers middleware

## Performance

### Optimization Features
- **Database Indexing** - Optimized database queries
- **Connection Pooling** - Efficient database connections
- **Request Compression** - Reduced response size
- **Caching** - Redis-based response caching
- **Query Optimization** - Efficient data retrieval

### Monitoring

- **Health Checks** - `/health` endpoint for monitoring
- **Structured Logging** - JSON-formatted logs
- **Error Tracking** - Comprehensive error handling
- **Performance Metrics** - Response time tracking

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details