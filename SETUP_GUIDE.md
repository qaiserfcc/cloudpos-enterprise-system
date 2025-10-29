# CloudPOS Development Setup Guide

## 🚀 Quick Start

Follow these steps to set up your CloudPOS development environment:

### 1. Clone and Setup Environment

```bash
# Navigate to the project
cd cloud-pos-system

# Copy environment templates
cp .env.template .env.development
cp services/api-gateway/.env.template services/api-gateway/.env
cp frontend/apps/admin-dashboard/.env.template frontend/apps/admin-dashboard/.env
```

### 2. Update Environment Variables

Edit the copied `.env` files with your actual credentials:

- Database connection details
- Redis configuration  
- JWT secrets
- External service API keys (Stripe, email, etc.)

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
cd services/api-gateway && npm install
cd ../auth-service && npm install
cd ../transaction-service && npm install
cd ../inventory-service && npm install
cd ../payment-service && npm install
cd ../customer-service && npm install
cd ../notification-service && npm install
cd ../reporting-service && npm install

# Install frontend dependencies
cd ../../frontend/apps/admin-dashboard && npm install
```

### 4. Start Services

```bash
# Core services (in separate terminals)
cd services/api-gateway && npm run dev          # Port 3000
cd services/auth-service && npm run dev         # Port 3001

# Business services
cd services/transaction-service && npm run dev  # Port 3003
cd services/inventory-service && npm run dev    # Port 3004
cd services/payment-service && npm run dev      # Port 3005
cd services/customer-service && npm run dev     # Port 3006
cd services/notification-service && npm run dev # Port 3007
cd services/reporting-service && npm run dev    # Port 3008

# Frontend
cd frontend/apps/admin-dashboard && npm run dev # Port 3002
```

### 5. Verify Setup

```bash
# Check port status
./scripts/check-ports.sh

# Access applications
# API Gateway: http://localhost:3000
# Admin Dashboard: http://localhost:3002
```

## 🔒 Security Note

Environment files (`.env`) are not committed to the repository for security reasons. Always use the provided templates and never commit sensitive credentials.

## 🛠️ Port Allocation

- **3000**: API Gateway (Entry Point)
- **3001**: Authentication Service
- **3002**: Admin Dashboard (Frontend)
- **3003-3008**: Business Logic Services
- **3009+**: Reserved for future services

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- npm or yarn

For detailed configuration information, see `PORT_CONFIGURATION_SUMMARY.md`.