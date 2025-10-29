import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { DatabaseManager } from '../database/connection';
import { RedisManager } from '../cache/redis';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'auth-service',
      version: process.env.API_VERSION || 'v1',
      dependencies: {
        database: 'unknown',
        cache: 'unknown'
      }
    };

    // Check database connection
    try {
      await DatabaseManager.query('SELECT 1');
      healthStatus.dependencies.database = 'healthy';
    } catch (error) {
      healthStatus.dependencies.database = 'unhealthy';
      logger.error('Database health check failed', error);
    }

    // Check Redis connection
    try {
      if (RedisManager.isConnected()) {
        await RedisManager.ping();
        healthStatus.dependencies.cache = 'healthy';
      } else {
        healthStatus.dependencies.cache = 'disconnected';
      }
    } catch (error) {
      healthStatus.dependencies.cache = 'unhealthy';
      logger.error('Redis health check failed', error);
    }

    // Determine overall status
    const allHealthy = Object.values(healthStatus.dependencies).every(status => status === 'healthy');
    healthStatus.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Health check failed', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Health check failed'
    });
  }
});

// Readiness check
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    await DatabaseManager.query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'auth-service'
    });
  } catch (error) {
    logger.error('Readiness check failed', error);
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Service not ready'
    });
  }
});

// Liveness check
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    uptime: process.uptime()
  });
});

export { router as healthRoutes };