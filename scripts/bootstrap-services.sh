#!/bin/bash

# Bootstrap script for CloudPOS microservices
echo "🚀 Bootstrapping CloudPOS Microservices..."

# Services to bootstrap
services=("transaction-service" "inventory-service" "payment-service" "customer-service" "notification-service")
ports=(3002 3003 3004 3005 3006)

for i in "${!services[@]}"; do
    service="${services[$i]}"
    port="${ports[$i]}"
    
    echo "Setting up $service on port $port..."
    
    # Create src directory structure if it doesn't exist
    mkdir -p "/Users/qaisu/Desktop/Saudi Work/CloudPos/cloud-pos-system/services/$service/src/utils"
    mkdir -p "/Users/qaisu/Desktop/Saudi Work/CloudPos/cloud-pos-system/services/$service/src/middleware"
    mkdir -p "/Users/qaisu/Desktop/Saudi Work/CloudPos/cloud-pos-system/services/$service/src/routes"
    
    # Create basic index.ts if it doesn't exist
    if [ ! -f "/Users/qaisu/Desktop/Saudi Work/CloudPos/cloud-pos-system/services/$service/src/index.ts" ]; then
        cat > "/Users/qaisu/Desktop/Saudi Work/CloudPos/cloud-pos-system/services/$service/src/index.ts" << EOF
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || $port;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    service: '$service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'CloudPOS ${service^}',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: \`Cannot \${req.method} \${req.originalUrl}\`,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(\`🚀 ${service^} started on port \${PORT}\`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export default app;
EOF
    fi
    
    echo "✅ $service structure created"
done

echo "🎉 All microservices bootstrapped successfully!"
echo ""
echo "📋 Services Summary:"
echo "- API Gateway:         Port 3000 ✅ (Complete)"
echo "- Auth Service:        Port 3001 ✅ (Complete)"
echo "- Transaction Service: Port 3002 ⚡ (Bootstrap)"
echo "- Inventory Service:   Port 3003 ⚡ (Bootstrap)"
echo "- Payment Service:     Port 3004 ⚡ (Bootstrap)"
echo "- Customer Service:    Port 3005 ⚡ (Bootstrap)"
echo "- Notification Service:Port 3006 ⚡ (Bootstrap)"
echo ""
echo "Next: Install dependencies and implement business logic for each service"