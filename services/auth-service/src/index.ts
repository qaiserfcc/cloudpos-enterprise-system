import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

// Import middleware and routes
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import { userRoutes } from './routes/users';
import { healthRoutes } from './routes/health';
import { logger } from './utils/logger';
import { dbService } from './services/database';
import { redisService } from './services/redis';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connections
async function initializeServices() {
  try {
    // Initialize PostgreSQL
    const dbHealthy = await dbService.isHealthy();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    logger.info('PostgreSQL connected successfully');
    
    // Initialize Redis
    await redisService.connect();
    logger.info('Redis connected successfully');
    
  } catch (error) {
    logger.error('Failed to initialize services', error);
    process.exit(1);
  }
}

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true
}));

// Rate limiting - more strict for auth service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 100, // stricter for auth
  message: {
    error: 'Too many authentication attempts',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// More strict rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict for login
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again later.',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use both IP and email for more precise rate limiting
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

app.use(limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Smaller limit for auth service
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Log incoming request (but don't log sensitive data)
  const logData: any = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  // Don't log request body for security reasons in auth service
  if (!req.path.includes('/login') && !req.path.includes('/register')) {
    logData.body = req.body;
  }
  
  logger.info('Auth request received', logData);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Auth request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
});

// Health check (no auth required)
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CloudPOS Authentication Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.API_VERSION || 'v1'
  });
});

// Authentication routes
app.use('/auth', authRoutes);

// User management routes  
app.use('/users', userRoutes);

// Apply login rate limiting to specific endpoints
app.use('/auth/login', loginLimiter);
app.use('/auth/register', loginLimiter);
app.use('/auth/forgot-password', loginLimiter);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Auth route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    await initializeServices();
    
    const server = app.listen(PORT, () => {
      logger.info('Auth service started', {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        version: process.env.API_VERSION || 'v1'
      });
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(async () => {
        await dbService.close();
        await redisService.disconnect();
        logger.info('Auth service closed. Exiting process.');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(async () => {
        await dbService.close();
        await redisService.disconnect();
        logger.info('Auth service closed. Exiting process.');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start auth service', error);
    process.exit(1);
  }
}

startServer();

export default app;