import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      percentage: number;
    };
  };
}

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check system resources
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed;
    const memoryTotal = memoryUsage.heapTotal;
    const memoryPercentage = (memoryUsed / memoryTotal) * 100;

    // Get CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    // Check external services
    const services = await checkExternalServices();

    // Determine overall health
    const allServicesHealthy = Object.values(services).every(
      (service: any) => service.status === 'healthy'
    );
    
    const overallStatus: HealthStatus = {
      status: allServicesHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || 'v1',
      services,
      system: {
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          percentage: parseFloat(memoryPercentage.toFixed(2))
        },
        cpu: {
          percentage: parseFloat(cpuPercentage.toFixed(2))
        }
      }
    };

    const responseTime = Date.now() - startTime;
    
    // Log health check
    logger.info('Health check completed', {
      status: overallStatus.status,
      responseTime,
      memoryUsage: overallStatus.system.memory.percentage,
      servicesChecked: Object.keys(services).length
    });

    // Return appropriate status code
    const statusCode = overallStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(overallStatus);

  } catch (error) {
    logger.error('Health check failed', { error });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple health check (for load balancers)
router.get('/simple', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Ready check (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are available
    const criticalServices = await checkCriticalServices();
    
    const allReady = Object.values(criticalServices).every(
      (service: any) => service.status === 'healthy'
    );

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: criticalServices
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: criticalServices
      });
    }
  } catch (error) {
    logger.error('Ready check failed', { error });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Ready check failed'
    });
  }
});

// Live check (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Check external services
async function checkExternalServices() {
  const services: any = {};
  const serviceHosts = {
    auth: `http://${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`,
    transactions: `http://${process.env.TRANSACTION_SERVICE_HOST || 'localhost'}:${process.env.TRANSACTION_SERVICE_PORT || 3003}`,
    inventory: `http://${process.env.INVENTORY_SERVICE_HOST || 'localhost'}:${process.env.INVENTORY_SERVICE_PORT || 3004}`,
    payments: `http://${process.env.PAYMENT_SERVICE_HOST || 'localhost'}:${process.env.PAYMENT_SERVICE_PORT || 3005}`,
    customers: `http://${process.env.CUSTOMER_SERVICE_HOST || 'localhost'}:${process.env.CUSTOMER_SERVICE_PORT || 3006}`,
    notifications: `http://${process.env.NOTIFICATION_SERVICE_HOST || 'localhost'}:${process.env.NOTIFICATION_SERVICE_PORT || 3007}`,
    reporting: `http://${process.env.REPORTING_SERVICE_HOST || 'localhost'}:${process.env.REPORTING_SERVICE_PORT || 3008}`
  };

  // Check each service with timeout
  const checkPromises = Object.entries(serviceHosts).map(async ([serviceName, serviceUrl]) => {
    const startTime = Date.now();
    
    try {
      // Use fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${serviceUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      services[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      services[serviceName] = {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  await Promise.allSettled(checkPromises);
  return services;
}

// Check only critical services needed for readiness
async function checkCriticalServices() {
  // For readiness, we only check essential services
  const criticalHosts = {
    auth: `http://${process.env.AUTH_SERVICE_HOST || 'localhost'}:${process.env.AUTH_SERVICE_PORT || 3001}`
  };

  const services: any = {};
  
  for (const [serviceName, serviceUrl] of Object.entries(criticalHosts)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${serviceUrl}/health`, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      services[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      services[serviceName] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  return services;
}

export { router as healthRoutes };