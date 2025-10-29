import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { databaseService } from './services/database';
import { logger } from './utils/logger';

// Import routes
import customerRoutes from './routes/customers';
import addressRoutes from './routes/addresses';
import analyticsRoutes from './routes/analytics';

// Load environment variables
config();

class CustomerServiceApp {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3002');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-store-id', 'x-user-id'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          storeId: req.headers['x-store-id']
        });
      });

      next();
    });

    // Health check middleware
    this.app.use('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'customer-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API documentation middleware
    this.app.use('/docs', express.static('docs'));
  }

  private initializeRoutes(): void {
    // API version prefix
    const apiPrefix = '/api/v1';

    // Customer routes
    this.app.use(`${apiPrefix}/customers`, customerRoutes);
    
    // Address routes (nested under customers)
    this.app.use(`${apiPrefix}/customers`, addressRoutes);
    
    // Analytics routes
    this.app.use(`${apiPrefix}/analytics`, analyticsRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'CloudPOS Customer Service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          customers: `${apiPrefix}/customers`,
          analytics: `${apiPrefix}/analytics`,
          docs: '/docs'
        }
      });
    });

    // API info endpoint
    this.app.get(`${apiPrefix}`, (req: Request, res: Response) => {
      res.json({
        service: 'Customer Service API',
        version: 'v1',
        endpoints: {
          customers: {
            list: 'GET /customers',
            create: 'POST /customers',
            get: 'GET /customers/:id',
            update: 'PUT /customers/:id',
            delete: 'DELETE /customers/:id',
            stats: 'GET /customers/stats',
            loyaltyPoints: 'POST /customers/loyalty/points',
            bulk: 'POST /customers/bulk'
          },
          addresses: {
            list: 'GET /customers/:id/addresses',
            create: 'POST /customers/:id/addresses',
            update: 'PUT /customers/:id/addresses/:addressId',
            delete: 'DELETE /customers/:id/addresses/:addressId'
          },
          analytics: {
            customer: 'GET /analytics/customers/:id',
            overview: 'GET /analytics/overview',
            segments: 'GET /analytics/segments',
            cohorts: 'GET /analytics/cohorts',
            recalculate: 'POST /analytics/recalculate'
          }
        }
      });
    });

    // 404 handler for unknown routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers
      });

      // Don't expose error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: isDevelopment ? error.message : undefined,
        stack: isDevelopment ? error.stack : undefined
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection:', {
        reason,
        promise
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      
      // Graceful shutdown
      this.shutdown();
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await databaseService.connect();
      logger.info('Database connected successfully');

      // Initialize database schema
      await databaseService.initializeSchema();
      logger.info('Database schema initialized');

      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`Customer Service started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version
        });
      });

    } catch (error) {
      logger.error('Failed to start Customer Service:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Customer Service...');
      
      // Close database connections
      await databaseService.disconnect();
      logger.info('Database connections closed');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new CustomerServiceApp();

// Start the service if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app;