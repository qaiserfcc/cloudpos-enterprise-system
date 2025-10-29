import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { createDatabaseService } from './services/database';

// Import routes
import productRoutes from './routes/products';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Initialize database service
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cloudpos_inventory',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true'
};

const dbService = createDatabaseService(dbConfig);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) }
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbService.isHealthy();
    
    res.json({
      service: 'inventory-service',
      status: dbHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth ? 'connected' : 'disconnected'
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      service: 'inventory-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'error'
    });
  }
});

// Basic authentication middleware
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }
  
  // Mock user for now (in production, verify JWT with auth service)
  (req as any).user = {
    userId: 'mock-user-id',
    email: 'manager@example.com',
    role: 'manager',
    storeId: 'mock-store-id',
    permissions: ['read_products', 'create_products', 'update_products', 'manage_inventory']
  };
  
  next();
});

// API routes
app.use('/api/products', productRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CloudPOS Inventory Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      products: '/api/products',
      categories: '/api/products/categories'
    }
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await dbService.initialize();
    logger.info('Database initialized successfully');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Inventory Service started on port ${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        try {
          await dbService.disconnect();
          logger.info('Process terminated');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;