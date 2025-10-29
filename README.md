# Cloud POS System

A comprehensive cloud-based Point of Sale (POS) system built with microservices architecture.

## 🏗️ Architecture Overview

This system is designed with a microservices architecture to ensure scalability, maintainability, and resilience. Each service is independently deployable and manages its own data store.

### 🔧 Technology Stack

- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL (primary), Redis (cache), MongoDB (analytics)
- **Authentication**: JWT with OAuth2 support
- **Containerization**: Docker and Docker Compose
- **Orchestration**: Kubernetes
- **Message Queue**: Redis Pub/Sub
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

### 📁 Project Structure

```
cloud-pos-system/
├── services/                    # Microservices
│   ├── api-gateway/            # API Gateway and routing
│   ├── auth-service/           # Authentication and authorization
│   ├── transaction-service/    # Transaction processing
│   ├── inventory-service/      # Inventory management
│   ├── payment-service/        # Payment processing
│   ├── customer-service/       # Customer management
│   └── notification-service/   # Notifications (email, SMS, push)
├── shared/                     # Shared utilities and types
│   ├── database/              # Database configurations and migrations
│   ├── utils/                 # Common utilities
│   └── types/                 # TypeScript type definitions
├── infrastructure/            # Infrastructure as Code
│   ├── docker/               # Docker configurations
│   ├── kubernetes/           # Kubernetes manifests
│   └── monitoring/           # Monitoring and logging setup
└── docs/                     # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- PostgreSQL
- Redis
- MongoDB

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/cloud-pos-system.git
   cd cloud-pos-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start databases with Docker**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Running Individual Services

```bash
# API Gateway
npm run dev --workspace=services/api-gateway

# Authentication Service
npm run dev --workspace=services/auth-service

# Transaction Service
npm run dev --workspace=services/transaction-service
```

### Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm test --workspace=services/auth-service
```

### Building for Production

```bash
# Build all services
npm run build

# Build Docker images
npm run docker:build
```

## 📊 Service Endpoints

### API Gateway
- **Port**: 3000
- **Health Check**: `GET /health`
- **Documentation**: `GET /api-docs`

### Authentication Service
- **Port**: 3001
- **Login**: `POST /api/v1/auth/login`
- **Register**: `POST /api/v1/auth/register`

### Transaction Service
- **Port**: 3002
- **Create Transaction**: `POST /api/v1/transactions`
- **Get Transactions**: `GET /api/v1/transactions`

### Inventory Service
- **Port**: 3003
- **Get Products**: `GET /api/v1/products`
- **Update Inventory**: `PUT /api/v1/inventory/:id`

### Payment Service
- **Port**: 3004
- **Process Payment**: `POST /api/v1/payments/process`
- **Get Payment Status**: `GET /api/v1/payments/:id`

### Customer Service
- **Port**: 3005
- **Get Customers**: `GET /api/v1/customers`
- **Create Customer**: `POST /api/v1/customers`

### Notification Service
- **Port**: 3006
- **Send Email**: `POST /api/v1/notifications/email`
- **Send SMS**: `POST /api/v1/notifications/sms`

## 🗄️ Database Schema

### PostgreSQL Tables
- `tenants` - Multi-tenant support
- `users` - User management
- `stores` - Store information
- `products` - Product catalog
- `inventory` - Stock management
- `transactions` - Transaction records
- `customers` - Customer data
- `payments` - Payment records

### Redis Usage
- Session management
- API rate limiting
- Real-time data caching
- Pub/Sub messaging

### MongoDB Collections
- Sales analytics
- User behavior tracking
- System logs
- Audit trails

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet.js for security headers

## 📈 Monitoring

- Health check endpoints for all services
- Prometheus metrics collection
- Grafana dashboards
- Winston logging
- Error tracking

## 🚢 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f infrastructure/kubernetes/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

## 🔗 Related Documentation

- [Architecture Design Document](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./docs/contributing.md)