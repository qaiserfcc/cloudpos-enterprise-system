# CloudPOS Reporting Service

A comprehensive business intelligence and reporting service for the CloudPOS system, providing advanced analytics, dynamic dashboards, automated reports, and intelligent alerting.

## 🚀 Features

### Core Capabilities
- **Advanced Analytics**: Sales, customer, inventory, and financial analytics with trend analysis
- **Dynamic Reports**: Generate reports in multiple formats (PDF, Excel, CSV, JSON)
- **Interactive Dashboards**: Real-time dashboards with customizable widgets
- **Intelligent Alerts**: Threshold, trend, and anomaly detection with automated notifications
- **Report Scheduling**: Automated report generation and delivery
- **Data Caching**: Optimized performance with intelligent caching strategies

### Analytics Modules
- **Sales Analytics**: Revenue trends, product performance, seasonal analysis
- **Customer Analytics**: Behavior analysis, segmentation, lifetime value
- **Inventory Analytics**: Stock levels, turnover rates, demand forecasting
- **Financial Analytics**: Profit margins, cash flow, expense tracking

### Report Types
- Sales reports (daily, weekly, monthly, yearly)
- Customer reports (acquisition, retention, segmentation)
- Inventory reports (stock levels, movement, valuation)
- Financial reports (P&L, cash flow, budget variance)
- Custom reports with flexible parameters

### Dashboard Features
- Real-time data visualization
- Customizable widget layouts
- Interactive charts and graphs
- KPI monitoring
- Mobile-responsive design

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with advanced indexing
- **Caching**: Redis for performance optimization
- **File Generation**: PDF-lib, ExcelJS, CSV-Writer
- **Logging**: Winston with structured logging
- **Testing**: Jest with comprehensive coverage

### Service Structure
```
src/
├── models/          # TypeScript interfaces and types
├── services/        # Core business logic
│   ├── analytics.ts # Analytics engine
│   ├── report.ts    # Report generation
│   ├── dashboard.ts # Dashboard management
│   ├── alert.ts     # Alert system
│   └── database.ts  # Database operations
├── utils/           # Utility functions
└── app.ts          # Express application
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher (optional, for caching)

### Installation

1. **Clone and navigate to the service**:
   ```bash
   cd services/reporting-service
   ```

2. **Run the setup script**:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Manual Setup

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Set up database
./scripts/migrate.sh

# Build the project
npm run build

# Start the service
npm start
```

## 📊 API Documentation

### Health Check
```bash
GET /health
```

### Reports API

#### Generate Report
```bash
POST /api/reports/generate
Content-Type: application/json

{
  "type": "sales",
  "format": "pdf",
  "parameters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "storeId": "store-123"
  }
}
```

#### Get Reports
```bash
GET /api/reports?page=1&limit=10&type=sales
```

#### Get Report by ID
```bash
GET /api/reports/:id
```

#### Export Report
```bash
GET /api/reports/:id/export/:format
```

### Analytics API

#### Sales Analytics
```bash
GET /api/analytics/sales?startDate=2024-01-01&endDate=2024-01-31&storeId=store-123
```

#### Customer Analytics
```bash
GET /api/analytics/customers?startDate=2024-01-01&endDate=2024-01-31
```

### Dashboards API

#### Create Dashboard
```bash
POST /api/dashboards
Content-Type: application/json

{
  "name": "Sales Overview",
  "description": "Main sales dashboard",
  "layout": {
    "columns": 3,
    "rows": 2
  }
}
```

#### Get Dashboards
```bash
GET /api/dashboards
```

#### Add Widget to Dashboard
```bash
POST /api/dashboards/:id/widgets
Content-Type: application/json

{
  "name": "Revenue Chart",
  "type": "line_chart",
  "config": {
    "dataSource": "sales",
    "metric": "revenue"
  }
}
```

### Alerts API

#### Create Alert
```bash
POST /api/alerts
Content-Type: application/json

{
  "name": "Low Stock Alert",
  "type": "threshold",
  "metric": "inventory_level",
  "conditionConfig": {
    "operator": "less_than",
    "value": 10
  }
}
```

## 🏃‍♂️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:watch        # Start with file watching

# Building
npm run build           # Build for production
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format with Prettier

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Database
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data
```

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Server
NODE_ENV=development
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudpos_reporting
DB_USER=postgres
DB_PASSWORD=postgres

# External Services
PAYMENT_SERVICE_URL=http://localhost:3001
CUSTOMER_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3004

# Security
JWT_SECRET=your_secret_key
API_RATE_LIMIT=100

# Features
CACHE_ENABLED=true
METRICS_ENABLED=true
```

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t cloudpos-reporting-service .
```

### Run with Docker
```bash
docker run -p 3003:3003 \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=cloudpos_reporting \
  cloudpos-reporting-service
```

### Docker Compose
```yaml
version: '3.8'
services:
  reporting-service:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
      - redis
```

## 📈 Monitoring and Observability

### Health Checks
The service provides comprehensive health checks:
- Database connectivity
- External service availability
- Redis connection (if enabled)
- Memory and disk usage

### Logging
Structured logging with Winston:
- Request/response logging
- Error tracking
- Performance metrics
- Audit trails

### Metrics
Built-in metrics collection:
- Request rates and latency
- Database query performance
- Cache hit/miss ratios
- Alert trigger frequencies

## 🧪 Testing

### Test Structure
```
src/__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data
```

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests
npm test -- --testPathPattern=integration

# With coverage
npm run test:coverage
```

## 📝 Database Schema

### Core Tables
- `reports`: Report definitions and metadata
- `report_instances`: Generated report instances
- `dashboards`: Dashboard configurations
- `widgets`: Dashboard widgets
- `analytics_cache`: Analytics data caching
- `alerts`: Alert definitions
- `alert_instances`: Alert occurrences
- `audit_logs`: System audit trail

### Key Relationships
- Reports → Report Instances (1:many)
- Dashboards → Widgets (1:many)
- Alerts → Alert Instances (1:many)

## 🔧 Configuration

### Report Generation
- Supports PDF, Excel, CSV, and JSON formats
- Configurable templates and styling
- Async processing for large reports
- File storage with cleanup policies

### Caching Strategy
- Analytics data caching with TTL
- Report result caching
- Dashboard widget caching
- Configurable cache invalidation

### Alert System
- Threshold-based alerts
- Trend analysis alerts
- Anomaly detection
- Multiple notification channels

## 🤝 Integration with Other Services

### Payment Service
- Transaction data for financial analytics
- Revenue and profit calculations
- Payment method analysis

### Customer Service
- Customer behavior analytics
- Loyalty program insights
- Marketing campaign effectiveness

### Notification Service
- Alert delivery
- Report distribution
- System notifications

## 📚 API Examples

### Generate Sales Report
```javascript
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'sales',
    format: 'pdf',
    parameters: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      storeId: 'store-123',
      groupBy: 'day'
    }
  })
});
```

### Create Dashboard Widget
```javascript
const widget = await fetch('/api/dashboards/dash-123/widgets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Daily Revenue',
    type: 'line_chart',
    config: {
      dataSource: 'sales',
      metric: 'revenue',
      timeframe: '7d'
    },
    position: { x: 0, y: 0, width: 6, height: 4 }
  })
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Verify credentials in .env
   DB_HOST=localhost
   DB_USER=postgres
   ```

2. **TypeScript Compilation Errors**
   ```bash
   # Clean and rebuild
   rm -rf dist/
   npm run build
   ```

3. **High Memory Usage**
   ```bash
   # Check analytics cache size
   # Adjust REPORT_CACHE_TTL in .env
   REPORT_CACHE_TTL=1800
   ```

### Performance Optimization
- Enable Redis caching for better performance
- Adjust database connection pool size
- Configure report generation limits
- Use database indexes for common queries

## 📞 Support

For issues and questions:
- Check the logs in `./logs/` directory
- Review the health check endpoint: `GET /health`
- Verify environment configuration
- Check database connectivity

## 🚀 Future Enhancements

- Machine learning-based anomaly detection
- Advanced data visualization options
- Real-time streaming analytics
- Multi-tenant reporting capabilities
- Advanced export formats (PowerBI, Tableau)
- Mobile app integration

---

**CloudPOS Reporting Service** - Empowering business decisions with intelligent analytics and reporting.