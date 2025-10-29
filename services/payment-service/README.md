# CloudPOS Payment Service

A comprehensive payment processing service that handles multiple payment gateways, transaction processing, refunds, and PCI DSS compliance for the CloudPOS system.

## 🔋 Features

### Core Payment Processing
- **Multiple Payment Gateways**: Stripe, PayPal, Square integration
- **Payment Methods**: Credit/Debit cards, Digital wallets, Bank transfers
- **Transaction Types**: Payments, Refunds, Partial refunds, Authorization, Capture
- **Real-time Processing**: Immediate payment status updates
- **Webhook Handling**: Secure webhook processing for all gateways

### Security & Compliance
- **PCI DSS Compliance**: Secure payment data handling
- **Encrypted Storage**: Sensitive data encryption at rest
- **Audit Logging**: Comprehensive security audit trails
- **Rate Limiting**: Protection against abuse and fraud
- **Signature Verification**: Webhook authenticity validation

### Business Features
- **Multi-tenant Support**: Store-level payment configuration
- **Currency Support**: 25+ international currencies
- **Payment Analytics**: Transaction reporting and insights
- **Refund Management**: Full and partial refund processing
- **Payment Sessions**: Multi-step payment workflows

## 🏗️ Architecture

### Database Schema
- **Payment Gateways**: Gateway configurations and credentials
- **Payment Intents**: Pre-payment setup and authorization
- **Payments**: Completed payment transactions
- **Refunds**: Refund transactions and status
- **Webhook Events**: Gateway event processing
- **Analytics**: Payment metrics and reporting data
- **Security Logs**: Audit trail for compliance

### Payment Flow
1. **Intent Creation**: Create payment intent with amount and currency
2. **Gateway Selection**: Choose appropriate payment gateway
3. **Payment Processing**: Process payment through selected gateway
4. **Status Updates**: Real-time status updates via webhooks
5. **Completion**: Finalize transaction and update records

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation
```bash
cd services/payment-service
npm install
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/payment_service
REDIS_URL=redis://localhost:6379

# Server
PORT=3004
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_WEBHOOK_SECRET=your-webhook-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Development
```bash
# Start development server
npm run dev

# Build production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## 📊 API Endpoints

### Payment Management
```http
# Create Payment Intent
POST /api/payments/{storeId}/intents
{
  "amount": 29.99,
  "currency": "USD",
  "description": "Order #12345",
  "customerId": "customer-uuid"
}

# Process Payment
POST /api/payments/{storeId}/process
{
  "paymentIntentId": "intent-uuid",
  "gateway": "stripe",
  "method": "card",
  "paymentData": {
    "paymentMethodId": "pm_...",
    "returnUrl": "https://yoursite.com/return"
  }
}

# Create Refund
POST /api/payments/{storeId}/refunds
{
  "paymentId": "payment-uuid",
  "amount": 29.99,
  "reason": "customer_request",
  "description": "Customer requested refund"
}

# Search Payments
GET /api/payments/{storeId}/payments?status=completed&limit=20&page=1

# Get Payment Details
GET /api/payments/{storeId}/payments/{paymentId}

# Get Payment Status
GET /api/payments/{storeId}/payments/{paymentId}/status
```

### Webhook Endpoints
```http
# Stripe Webhooks
POST /api/webhooks/stripe

# PayPal Webhooks
POST /api/webhooks/paypal

# Square Webhooks
POST /api/webhooks/square

# Webhook Management
GET /api/webhooks/events
POST /api/webhooks/retry/{eventId}
```

### Health & Monitoring
```http
# Health Check
GET /health

# Service Info
GET /
```

## 💳 Payment Gateway Integration

### Stripe
```typescript
// Payment Data Structure
{
  "paymentMethodId": "pm_1234567890",
  "confirmationToken": "ct_1234567890", // Alternative to paymentMethodId
  "returnUrl": "https://yoursite.com/return"
}

// Supported Methods
- Credit/Debit Cards
- Apple Pay, Google Pay
- SEPA Direct Debit
- Bancontact, iDEAL, etc.
```

### PayPal
```typescript
// Payment Data Structure
{
  "orderId": "paypal-order-id",
  "payerId": "paypal-payer-id",
  "returnUrl": "https://yoursite.com/return",
  "cancelUrl": "https://yoursite.com/cancel"
}

// Supported Methods
- PayPal Account
- Credit/Debit Cards via PayPal
- PayPal Credit
```

### Square
```typescript
// Payment Data Structure
{
  "sourceId": "square-payment-source-id",
  "verificationToken": "verification-token",
  "locationId": "square-location-id"
}

// Supported Methods
- Credit/Debit Cards
- Square Gift Cards
- Cash App Pay
```

## 🔒 Security Features

### PCI DSS Compliance
- **Data Encryption**: All sensitive data encrypted at rest
- **Secure Transmission**: TLS 1.3 for all communications
- **Access Controls**: Role-based access and audit logging
- **Vulnerability Management**: Regular security scanning
- **Incident Response**: Automated threat detection

### Fraud Prevention
- **Rate Limiting**: Request throttling and IP blocking
- **Signature Verification**: Webhook authenticity validation
- **Transaction Monitoring**: Real-time fraud detection
- **Risk Scoring**: Payment risk assessment
- **3D Secure**: Strong customer authentication

## 📈 Monitoring & Analytics

### Health Monitoring
```bash
# Service Health
curl http://localhost:3004/health

# Database Connection
curl http://localhost:3004/health | jq '.database'

# Gateway Status
curl http://localhost:3004/api/payments/{storeId}/methods
```

### Payment Analytics
- Transaction volume and success rates
- Payment method popularity
- Geographic distribution
- Revenue trends and forecasting
- Gateway performance metrics

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Error, Warn, Info, Debug
- **Audit Trails**: Security and compliance logging
- **Performance Metrics**: Response times and throughput

## 🔧 Configuration

### Gateway Configuration
```typescript
{
  "gateway": "stripe",
  "credentials": {
    "secretKey": "sk_live_...",
    "publishableKey": "pk_live_..."
  },
  "supportedMethods": ["card", "digital_wallet"],
  "supportedCurrencies": ["USD", "EUR", "GBP"],
  "configuration": {
    "captureMethod": "automatic",
    "statementDescriptor": "YOUR STORE"
  }
}
```

### Webhook Configuration
```typescript
{
  "webhookUrl": "https://api.yourstore.com/api/webhooks/stripe",
  "webhookSecret": "whsec_...",
  "events": [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.dispute.created"
  ]
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- payment.service.test.ts

# Test with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test payment flows
npm run test:integration

# Test webhook processing
npm run test:webhooks

# Load testing
npm run test:load
```

### Test Payment Data
```typescript
// Stripe Test Cards
const testCards = {
  success: "4242424242424242",
  decline: "4000000000000002",
  requiresAuth: "4000002500003155"
};

// PayPal Sandbox
const paypalTest = {
  buyer: "buyer@example.com",
  facilitator: "facilitator@example.com"
};
```

## 📋 Deployment

### Docker
```dockerfile
# Build image
docker build -t cloudpos/payment-service .

# Run container
docker run -p 3004:3004 cloudpos/payment-service
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    spec:
      containers:
      - name: payment-service
        image: cloudpos/payment-service:latest
        ports:
        - containerPort: 3004
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: payment-db-secret
              key: url
```

## 🔗 Integration

### Transaction Service Integration
```typescript
// Create payment after transaction creation
const payment = await paymentService.createPaymentIntent(storeId, {
  amount: transaction.total,
  currency: transaction.currency,
  description: `Transaction #${transaction.id}`,
  customerId: transaction.customerId
});
```

### Notification Service Integration
```typescript
// Send payment confirmation
await notificationService.send({
  type: 'payment_completed',
  recipient: customer.email,
  data: { payment, transaction }
});
```

## 📞 Support

### Error Codes
- **4000**: Bad Request - Invalid payment data
- **4001**: Payment Failed - Gateway rejection
- **4002**: Insufficient Funds - Customer account issue
- **4003**: Fraud Detected - Risk management block
- **5000**: Gateway Error - Third-party service issue

### Troubleshooting
1. Check gateway credentials and configuration
2. Verify webhook endpoint accessibility
3. Review security audit logs
4. Validate payment data format
5. Check currency and amount limits

### Development
- **Documentation**: `/docs` endpoint with OpenAPI specs
- **Postman Collection**: Complete API testing collection
- **SDK Support**: JavaScript, Python, PHP SDKs available
- **Webhook Testing**: ngrok tunneling for local development

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure security compliance
5. Submit pull request with detailed description

---

**CloudPOS Payment Service** - Secure, scalable, and compliant payment processing for modern retail.