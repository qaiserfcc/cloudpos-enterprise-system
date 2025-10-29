# Cloud POS System - Docker Configuration

This directory contains comprehensive Docker configuration for the Cloud POS system, enabling both development and production deployments.

## 🐳 Docker Architecture

### Services Overview
- **PostgreSQL** - Primary relational database
- **Redis** - Caching and session management
- **MongoDB** - Analytics and logging
- **API Gateway** - Request routing and load balancing
- **Auth Service** - Authentication and authorization
- **Transaction Service** - Transaction processing
- **Inventory Service** - Inventory management
- **Payment Service** - Payment processing
- **Customer Service** - Customer management
- **Notification Service** - Email/SMS notifications

### Development Tools
- **PgAdmin** - PostgreSQL management interface
- **Redis Commander** - Redis management interface  
- **Mongo Express** - MongoDB management interface

## 🚀 Quick Start

### Development Environment

1. **Copy environment configuration:**
   ```bash
   cp .env.example .env.local
   # Update .env.local with your configuration
   ```

2. **Start development environment:**
   ```bash
   ./docker-scripts.sh dev-up
   ```

3. **Access services:**
   - API Gateway: http://localhost:3000
   - PgAdmin: http://localhost:8080 (admin@cloudpos.com / cloudpos123)
   - Redis Commander: http://localhost:8081
   - Mongo Express: http://localhost:8082 (admin / cloudpos123)

### Production Environment

1. **Copy production configuration:**
   ```bash
   cp .env.production .env
   # Update .env with secure production values
   ```

2. **Start production environment:**
   ```bash
   ./docker-scripts.sh prod-up
   ```

## 📜 Docker Scripts

The `docker-scripts.sh` provides convenient commands for managing the Docker environment:

### Development Commands
```bash
./docker-scripts.sh dev-up       # Start development environment
./docker-scripts.sh dev-down     # Stop development environment
./docker-scripts.sh dev-logs     # View all service logs
./docker-scripts.sh dev-build    # Rebuild all images
```

### Production Commands
```bash
./docker-scripts.sh prod-up      # Start production environment
./docker-scripts.sh prod-down    # Stop production environment
./docker-scripts.sh prod-logs    # View production logs
./docker-scripts.sh prod-build   # Build production images
```

### Database Commands
```bash
./docker-scripts.sh db-up        # Start only databases
./docker-scripts.sh db-down      # Stop databases
./docker-scripts.sh db-reset     # Reset all databases (⚠️ destroys data)
./docker-scripts.sh db-migrate   # Run database migrations
./docker-scripts.sh db-seed      # Seed with sample data
```

### Utility Commands
```bash
./docker-scripts.sh health       # Check service health
./docker-scripts.sh logs api-gateway  # View specific service logs
./docker-scripts.sh shell cloudpos-postgres  # Access service shell
./docker-scripts.sh clean        # Clean unused Docker resources
./docker-scripts.sh tools        # Start development tools
```

## 🏗️ Docker Files Structure

```
cloud-pos-system/
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
├── Dockerfile.service          # Base service Dockerfile
├── .dockerignore               # Docker ignore patterns
├── .env.example                # Development environment template
├── .env.production             # Production environment template
├── docker-scripts.sh           # Management script
└── services/
    ├── api-gateway/Dockerfile   # API Gateway specific Dockerfile
    ├── auth-service/Dockerfile  # Auth Service specific Dockerfile
    ├── transaction-service/Dockerfile
    ├── inventory-service/Dockerfile
    ├── payment-service/Dockerfile
    ├── customer-service/Dockerfile
    └── notification-service/Dockerfile
```

## 🔧 Configuration Details

### Development Configuration (docker-compose.yml)
- **Hot reload** enabled for all services
- **Volume mounts** for live code changes
- **Development tools** included (PgAdmin, Redis Commander, Mongo Express)
- **Debug logging** enabled
- **No resource limits** for easier development

### Production Configuration (docker-compose.prod.yml)
- **Optimized builds** with multi-stage Dockerfiles
- **Resource limits** for memory and CPU
- **Health checks** for all services
- **Restart policies** for reliability
- **Service replicas** for high availability
- **Security hardening** with non-root users

## 📊 Service Ports

### Development Ports
| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Main application entry |
| Auth Service | 3001 | Authentication endpoints |
| Transaction Service | 3002 | Transaction processing |
| Inventory Service | 3003 | Inventory management |
| Payment Service | 3004 | Payment processing |
| Customer Service | 3005 | Customer management |
| Notification Service | 3006 | Notifications |
| PostgreSQL | 5432 | Database access |
| Redis | 6379 | Cache access |
| MongoDB | 27017 | Analytics database |
| PgAdmin | 8080 | Database management |
| Redis Commander | 8081 | Redis management |
| Mongo Express | 8082 | MongoDB management |

### Production Ports
- **Port 80/443** - Load balanced application access
- **Internal service communication** via Docker network
- **Database ports** not exposed externally

## 🔒 Security Features

### Development Security
- **Default passwords** for easy setup
- **Local network access** only
- **Development tools** enabled for debugging

### Production Security
- **Environment variable secrets** (must be configured)
- **Non-root user** execution
- **Resource limits** to prevent resource exhaustion
- **Health checks** for automatic recovery
- **Internal network communication** only
- **SSL/TLS termination** at load balancer
- **Security headers** via Helmet.js

## 🚀 Performance Optimizations

### Image Optimization
- **Multi-stage builds** to minimize image size
- **Alpine Linux** base images
- **Layer caching** optimization
- **Production dependencies** only in final stage

### Runtime Optimization
- **Memory limits** per service
- **Health checks** for automatic recovery
- **Restart policies** for reliability
- **Connection pooling** for databases
- **Redis caching** for performance

## 🔍 Monitoring and Debugging

### Health Checks
All services include health check endpoints:
```
GET /health
```

### Logging
- **Structured logging** in production
- **Debug logging** in development
- **Centralized log collection** via Docker logs

### Development Tools
- **Hot reload** for instant code changes
- **Database admin interfaces** for data inspection
- **Redis monitoring** for cache analysis
- **Container shell access** for debugging

## 🔄 Deployment Workflow

### Development Workflow
1. Make code changes
2. Services automatically reload (hot reload)
3. Test changes via exposed ports
4. Use admin tools for data inspection

### Production Deployment
1. Update environment variables in `.env`
2. Build production images: `./docker-scripts.sh prod-build`
3. Deploy: `./docker-scripts.sh prod-up`
4. Monitor health: `./docker-scripts.sh health`

## 🛠️ Troubleshooting

### Common Issues

**Services won't start:**
```bash
./docker-scripts.sh logs [service-name]  # Check service logs
./docker-scripts.sh health               # Check service status
```

**Database connection issues:**
```bash
./docker-scripts.sh db-up               # Ensure databases are running
./docker-scripts.sh shell cloudpos-postgres  # Access database directly
```

**Port conflicts:**
```bash
docker ps -a                           # Check running containers
sudo netstat -tulpn | grep :3000       # Check port usage
```

**Clean slate restart:**
```bash
./docker-scripts.sh dev-down
./docker-scripts.sh clean
./docker-scripts.sh dev-up
```

This Docker configuration provides a robust, scalable, and developer-friendly environment for the Cloud POS system.