# CloudPOS Notification Service

A comprehensive, multi-channel notification delivery system for the CloudPOS platform. This service handles email, SMS, and push notifications with template management, delivery tracking, and robust error handling.

## Features

### Core Functionality
- **Multi-Channel Delivery**: Email, SMS, and Push notifications
- **Template Management**: Dynamic template system with Handlebars support
- **Queue Management**: Reliable message queuing with retry logic
- **Delivery Tracking**: Comprehensive delivery and engagement tracking
- **Provider Management**: Multiple provider support with failover capabilities

### Email Providers
- **Nodemailer**: SMTP support for any email provider
- **Amazon SES**: AWS Simple Email Service integration
- **SendGrid**: SendGrid API integration

### SMS Providers
- **Twilio**: Primary SMS provider with delivery confirmations
- **Amazon SNS**: AWS SMS service
- **Nexmo/Vonage**: Alternative SMS provider

### Push Notification Providers
- **Firebase FCM**: Google Firebase Cloud Messaging
- **Apple APNS**: Apple Push Notification Service
- **OneSignal**: Cross-platform push notification service

### Template Features
- **Handlebars Templates**: Dynamic content with helper functions
- **System Templates**: Pre-built templates for common scenarios
- **Template Versioning**: Version control for template changes
- **Preview Mode**: Test templates before deployment

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 12+
- Provider accounts (Twilio, SendGrid, etc.)

### Installation

1. **Clone and navigate to the service:**
   ```bash
   cd services/notification-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Database Setup

The service automatically creates required tables on startup. Ensure your PostgreSQL database exists and is accessible.

## Configuration

### Environment Variables

Key configuration options:

```env
# Server
PORT=3006
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudpos_notifications
DB_USER=postgres
DB_PASSWORD=password

# Email (Choose one)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# SMS (Choose one)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_PHONE=+1234567890

# Push (Choose one)
FCM_SERVER_KEY=your-fcm-server-key
```

### Provider Configuration

Each provider can be configured independently:

- **Email**: SMTP, SES, or SendGrid
- **SMS**: Twilio, SNS, or Nexmo
- **Push**: FCM, APNS, or OneSignal

## API Reference

### Base URL
```
http://localhost:3006/api/notifications
```

### Authentication
Include store ID in headers:
```
X-Store-ID: your-store-uuid
```

### Core Endpoints

#### Send Notification
```bash
POST /notifications
Content-Type: application/json

{
  "type": "email",
  "recipientEmail": "user@example.com",
  "subject": "Welcome!",
  "message": "Welcome to CloudPOS!",
  "priority": "normal"
}
```

#### Send Bulk Notifications
```bash
POST /notifications/bulk
Content-Type: application/json

{
  "type": "email",
  "subject": "Promotion Alert",
  "message": "Special offer just for you!",
  "recipients": [
    {
      "recipientEmail": "user1@example.com",
      "recipientType": "customer"
    },
    {
      "recipientEmail": "user2@example.com", 
      "recipientType": "customer"
    }
  ]
}
```

#### Template Management
```bash
# Create template
POST /templates
{
  "name": "Order Confirmation",
  "type": "email",
  "notificationType": "email",
  "subject": "Order #{{order.number}} Confirmed",
  "bodyTemplate": "Thank you {{customer.name}}! Your order for {{formatCurrency order.total}} has been confirmed.",
  "variables": ["customer.name", "order.number", "order.total"]
}

# Get templates
GET /templates?page=1&pageSize=20&type=email

# Render template
POST /templates/{templateId}/render
{
  "data": {
    "customer": { "name": "John Doe" },
    "order": { "number": "12345", "total": 99.99 }
  }
}
```

#### Settings Management
```bash
# Get notification settings
GET /settings

# Update settings (implement endpoint for updates)
PUT /settings
```

## Template System

### Handlebars Helpers

The service includes built-in Handlebars helpers:

```handlebars
{{! Currency formatting }}
{{formatCurrency order.total order.currency}}

{{! Date formatting }}
{{formatDate order.createdAt "short"}}

{{! Phone formatting }}
{{formatPhone customer.phone}}

{{! String manipulation }}
{{uppercase customer.name}}
{{lowercase customer.email}}
{{capitalize product.name}}
{{truncate description 100}}

{{! Conditionals }}
{{#ifEquals order.status "completed"}}
  Order completed!
{{/ifEquals}}

{{! Math operations }}
{{math order.subtotal "+" order.tax}}
```

### System Templates

Pre-built templates include:
- Order confirmation emails
- Payment success SMS
- Low stock alerts
- Welcome emails

## Queue Processing

The service includes a robust queue system:

### Features
- **Priority Queuing**: High, normal, low, urgent priorities
- **Retry Logic**: Exponential backoff with configurable limits
- **Failure Handling**: Dead letter queue for failed messages
- **Rate Limiting**: Provider-specific rate limits

### Manual Queue Processing
```bash
POST /queue/process
```

## Monitoring & Health

### Health Check
```bash
GET /health
```

### Logging
- **Winston Logger**: Structured logging with multiple transports
- **Request Logging**: Automatic HTTP request/response logging
- **Error Tracking**: Comprehensive error logging and tracking

## Development

### Project Structure
```
src/
├── models/          # TypeScript type definitions
├── services/        # Core business logic
│   ├── notification.ts    # Main notification service
│   ├── template.ts        # Template management
│   ├── database.ts        # Database service
│   ├── email-providers.ts # Email provider implementations
│   ├── sms-providers.ts   # SMS provider implementations
│   └── push-providers.ts  # Push provider implementations
├── routes/          # API route handlers
├── utils/           # Utility functions
└── app.ts          # Application entry point
```

### Scripts
```bash
npm run dev          # Development with hot reload
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run typecheck    # TypeScript type checking
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Production Deployment

### Docker Support
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Environment Considerations
- **Database**: Use managed PostgreSQL service
- **Providers**: Configure production API keys
- **Monitoring**: Set up logging aggregation
- **Scaling**: Use load balancer for multiple instances

### Performance Tips
- **Database Indexing**: Ensure proper indexes on notification tables
- **Queue Processing**: Run multiple queue processors for high volume
- **Template Caching**: Templates are cached in memory for performance
- **Connection Pooling**: Database connections are pooled

## Security

### Best Practices
- **API Keys**: Store securely in environment variables
- **Rate Limiting**: Protect against abuse
- **Input Validation**: All inputs are validated
- **CORS**: Properly configured for your domain
- **Helmet**: Security headers included

### Data Protection
- **PII Handling**: Minimal personal data storage
- **Encryption**: Sensitive data encrypted at rest
- **Audit Trail**: All actions logged for compliance

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running
- Check connection credentials
- Ensure database exists

#### Provider Authentication Errors
- Verify API keys are correct
- Check provider account status
- Validate provider configuration

#### Template Rendering Errors
- Check Handlebars syntax
- Verify variable names match data
- Use preview endpoint for testing

### Debugging
Enable debug logging:
```env
LOG_LEVEL=debug
```

View detailed logs:
```bash
tail -f logs/notification-service.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the CloudPOS development team
- Check the documentation for common solutions