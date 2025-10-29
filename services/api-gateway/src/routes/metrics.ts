import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

interface MetricsData {
  timestamp: string;
  uptime: number;
  requests: {
    total: number;
    perMinute: number;
    errors: number;
    errorRate: number;
  };
  response: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
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
    connections: {
      active: number;
    };
  };
  services: {
    [key: string]: {
      requestCount: number;
      errorCount: number;
      averageResponseTime: number;
    };
  };
}

// In-memory metrics storage (in production, use Redis or proper metrics store)
let metrics = {
  totalRequests: 0,
  totalErrors: 0,
  requestTimes: [] as number[],
  serviceMetrics: {} as any,
  startTime: Date.now()
};

// Middleware to track metrics (this would be imported and used in main app)
export function trackMetrics(req: Request, res: Response, next: Function) {
  const startTime = Date.now();
  
  metrics.totalRequests++;
  
  // Track response time and errors
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metrics.requestTimes.push(responseTime);
    
    // Keep only last 1000 response times for calculation
    if (metrics.requestTimes.length > 1000) {
      metrics.requestTimes = metrics.requestTimes.slice(-1000);
    }
    
    // Track errors
    if (res.statusCode >= 400) {
      metrics.totalErrors++;
    }
    
    // Track service-specific metrics if route contains service info
    if (req.route?.path?.includes('/api/')) {
      const servicePath = req.route.path.split('/')[2];
      if (!metrics.serviceMetrics[servicePath]) {
        metrics.serviceMetrics[servicePath] = {
          requestCount: 0,
          errorCount: 0,
          responseTimes: []
        };
      }
      
      metrics.serviceMetrics[servicePath].requestCount++;
      metrics.serviceMetrics[servicePath].responseTimes.push(responseTime);
      
      if (res.statusCode >= 400) {
        metrics.serviceMetrics[servicePath].errorCount++;
      }
      
      // Keep only last 100 response times per service
      if (metrics.serviceMetrics[servicePath].responseTimes.length > 100) {
        metrics.serviceMetrics[servicePath].responseTimes = 
          metrics.serviceMetrics[servicePath].responseTimes.slice(-100);
      }
    }
  });
  
  next();
}

// Get application metrics
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const uptimeMs = now - metrics.startTime;
    const uptimeMinutes = uptimeMs / (1000 * 60);
    
    // Calculate response time percentiles
    const sortedTimes = [...metrics.requestTimes].sort((a, b) => a - b);
    const averageTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length 
      : 0;
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    const p95Time = sortedTimes[p95Index] || 0;
    const p99Time = sortedTimes[p99Index] || 0;
    
    // Calculate requests per minute
    const requestsPerMinute = uptimeMinutes > 0 ? metrics.totalRequests / uptimeMinutes : 0;
    const errorRate = metrics.totalRequests > 0 ? (metrics.totalErrors / metrics.totalRequests) * 100 : 0;
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed;
    const memoryTotal = memoryUsage.heapTotal;
    const memoryPercentage = (memoryUsed / memoryTotal) * 100;
    
    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000;
    
    // Service metrics
    const serviceMetrics: any = {};
    for (const [serviceName, serviceData] of Object.entries(metrics.serviceMetrics) as any[]) {
      const avgResponseTime = serviceData.responseTimes.length > 0
        ? serviceData.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / serviceData.responseTimes.length
        : 0;
        
      serviceMetrics[serviceName] = {
        requestCount: serviceData.requestCount,
        errorCount: serviceData.errorCount,
        averageResponseTime: Math.round(avgResponseTime)
      };
    }
    
    const metricsData: MetricsData = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      requests: {
        total: metrics.totalRequests,
        perMinute: Math.round(requestsPerMinute),
        errors: metrics.totalErrors,
        errorRate: parseFloat(errorRate.toFixed(2))
      },
      response: {
        averageTime: Math.round(averageTime),
        p95Time: Math.round(p95Time),
        p99Time: Math.round(p99Time)
      },
      system: {
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          percentage: parseFloat(memoryPercentage.toFixed(2))
        },
        cpu: {
          percentage: parseFloat(cpuPercentage.toFixed(2))
        },
        connections: {
          active: 0 // Would need proper connection tracking
        }
      },
      services: serviceMetrics
    };
    
    logger.info('Metrics requested', {
      totalRequests: metrics.totalRequests,
      errorRate: errorRate.toFixed(2) + '%',
      avgResponseTime: Math.round(averageTime) + 'ms'
    });
    
    res.json(metricsData);
    
  } catch (error) {
    logger.error('Failed to generate metrics', { error });
    
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Prometheus-style metrics
router.get('/prometheus', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const uptimeSeconds = Math.floor(process.uptime());
    
    // Calculate response time metrics
    const sortedTimes = [...metrics.requestTimes].sort((a, b) => a - b);
    const averageTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length 
      : 0;
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed;
    const memoryTotal = memoryUsage.heapTotal;
    
    // Generate Prometheus format
    const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.totalRequests}

# HELP http_request_errors_total Total number of HTTP request errors
# TYPE http_request_errors_total counter
http_request_errors_total ${metrics.totalErrors}

# HELP http_request_duration_ms Average HTTP request duration in milliseconds
# TYPE http_request_duration_ms gauge
http_request_duration_ms ${averageTime.toFixed(2)}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptimeSeconds}

# HELP process_memory_used_bytes Process memory usage in bytes
# TYPE process_memory_used_bytes gauge
process_memory_used_bytes ${memoryUsed}

# HELP process_memory_total_bytes Process memory total in bytes
# TYPE process_memory_total_bytes gauge
process_memory_total_bytes ${memoryTotal}

# HELP api_gateway_healthy API Gateway health status (1 = healthy, 0 = unhealthy)
# TYPE api_gateway_healthy gauge
api_gateway_healthy 1
    `.trim();
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
    
  } catch (error) {
    logger.error('Failed to generate Prometheus metrics', { error });
    res.status(500).send('# Error generating metrics');
  }
});

// Reset metrics (for testing/debugging)
router.post('/reset', (req: Request, res: Response) => {
  metrics = {
    totalRequests: 0,
    totalErrors: 0,
    requestTimes: [],
    serviceMetrics: {},
    startTime: Date.now()
  };
  
  logger.info('Metrics reset');
  
  res.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  });
});

export { router as metricsRoutes };