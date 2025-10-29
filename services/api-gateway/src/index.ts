import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// API Documentation (Swagger)
if (process.env.ENABLE_SWAGGER === 'true') {
  try {
    const swaggerDocument = YAML.load('./api-docs/swagger.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logger.info('API Documentation available at /api-docs');
  } catch (error) {
    logger.warn('Could not load swagger documentation');
  }
}

// Health check and metrics (no auth required)
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// API routes with version prefix
const apiRouter = express.Router();

// Service proxy configurations
const serviceConfig = {
  auth: {
    target: `http://${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/auth`]: '',
    },
  },
  transactions: {
    target: `http://${process.env.TRANSACTION_SERVICE_HOST || 'localhost'}:${process.env.TRANSACTION_SERVICE_PORT || 3002}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/transactions`]: '',
    },
  },
  inventory: {
    target: `http://${process.env.INVENTORY_SERVICE_HOST || 'localhost'}:${process.env.INVENTORY_SERVICE_PORT || 3003}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/inventory`]: '',
    },
  },
  payments: {
    target: `http://${process.env.PAYMENT_SERVICE_HOST || 'localhost'}:${process.env.PAYMENT_SERVICE_PORT || 3004}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/payments`]: '',
    },
  },
  customers: {
    target: `http://${process.env.CUSTOMER_SERVICE_HOST || 'localhost'}:${process.env.CUSTOMER_SERVICE_PORT || 3005}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/customers`]: '',
    },
  },
  notifications: {
    target: `http://${process.env.NOTIFICATION_SERVICE_HOST || 'localhost'}:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`,
    pathRewrite: {
      [`^/api/${API_VERSION}/notifications`]: '',
    },
  },
};

// Authentication service routes (no auth middleware for login/register)
apiRouter.use('/auth/login', createProxyMiddleware(serviceConfig.auth));
apiRouter.use('/auth/register', createProxyMiddleware(serviceConfig.auth));
apiRouter.use('/auth/refresh', createProxyMiddleware(serviceConfig.auth));
apiRouter.use('/auth/forgot-password', createProxyMiddleware(serviceConfig.auth));

// Protected routes (require authentication)
apiRouter.use('/auth', authMiddleware, createProxyMiddleware(serviceConfig.auth));
apiRouter.use('/transactions', authMiddleware, createProxyMiddleware(serviceConfig.transactions));
apiRouter.use('/inventory', authMiddleware, createProxyMiddleware(serviceConfig.inventory));
apiRouter.use('/payments', authMiddleware, createProxyMiddleware(serviceConfig.payments));
apiRouter.use('/customers', authMiddleware, createProxyMiddleware(serviceConfig.customers));
apiRouter.use('/notifications', authMiddleware, createProxyMiddleware(serviceConfig.notifications));

// Apply API routes
app.use(`/api/${API_VERSION}`, apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Cloud POS API Gateway',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    services: {
      auth: '/api/v1/auth',
      transactions: '/api/v1/transactions',
      inventory: '/api/v1/inventory',
      payments: '/api/v1/payments',
      customers: '/api/v1/customers',
      notifications: '/api/v1/notifications',
    },
    documentation: process.env.ENABLE_SWAGGER === 'true' ? '/api-docs' : null,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway started on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Version: ${API_VERSION}`);
  
  if (process.env.ENABLE_SWAGGER === 'true') {
    logger.info(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;