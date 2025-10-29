import http from 'http';
import { Application } from 'express';
import { logger } from '../utils/logger';

interface ServiceConfig {
  name: string;
  host: string;
  port: number;
  timeout: number;
  retries: number;
  healthPath: string;
}

class ServiceProxy {
  private services: Map<string, ServiceConfig> = new Map();
  
  constructor() {
    this.initializeServices();
  }
  
  private initializeServices() {
    const services: ServiceConfig[] = [
      {
        name: 'auth',
        host: process.env.AUTH_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      },
      {
        name: 'transactions',
        host: process.env.TRANSACTION_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.TRANSACTION_SERVICE_PORT || '3002'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      },
      {
        name: 'inventory',
        host: process.env.INVENTORY_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.INVENTORY_SERVICE_PORT || '3003'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      },
      {
        name: 'payments',
        host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3004'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      },
      {
        name: 'customers',
        host: process.env.CUSTOMER_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.CUSTOMER_SERVICE_PORT || '3005'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      },
      {
        name: 'notifications',
        host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3006'),
        timeout: 30000,
        retries: 3,
        healthPath: '/health'
      }
    ];
    
    services.forEach(service => {
      this.services.set(service.name, service);
    });
    
    logger.info('Service proxy initialized', {
      serviceCount: this.services.size,
      services: Array.from(this.services.keys())
    });
  }
  
  async proxyRequest(
    serviceName: string, 
    path: string, 
    method: string, 
    headers: any, 
    body?: any
  ): Promise<{ statusCode: number; headers: any; body: any }> {
    
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    return this.makeRequest(service, path, method, headers, body);
  }
  
  private async makeRequest(
    service: ServiceConfig,
    path: string,
    method: string,
    headers: any,
    body?: any,
    attempt: number = 1
  ): Promise<{ statusCode: number; headers: any; body: any }> {
    
    return new Promise((resolve, reject) => {
      // Prepare request data
      const postData = body ? JSON.stringify(body) : undefined;
      
      const options = {
        hostname: service.host,
        port: service.port,
        path: path,
        method: method.toUpperCase(),
        headers: {
          ...headers,
          'User-Agent': 'CloudPOS-API-Gateway/1.0',
          'X-Forwarded-For': headers['x-forwarded-for'] || 'unknown',
          'X-Request-ID': headers['x-request-id'] || this.generateRequestId()
        },
        timeout: service.timeout
      };
      
      if (postData) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const startTime = Date.now();
      
      const req = http.request(options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          const duration = Date.now() - startTime;
          
          logger.info('Service request completed', {
            service: service.name,
            method,
            path,
            statusCode: res.statusCode,
            duration,
            attempt
          });
          
          let parsedBody;
          try {
            parsedBody = responseBody ? JSON.parse(responseBody) : {};
          } catch (error) {
            parsedBody = responseBody;
          }
          
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody
          });
        });
      });
      
      req.on('error', async (error) => {
        const duration = Date.now() - startTime;
        
        logger.error('Service request failed', {
          service: service.name,
          method,
          path,
          error: error.message,
          duration,
          attempt
        });
        
        // Retry logic
        if (attempt < service.retries) {
          logger.info('Retrying service request', {
            service: service.name,
            attempt: attempt + 1,
            maxRetries: service.retries
          });
          
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => {
            this.makeRequest(service, path, method, headers, body, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error(`Service ${service.name} unavailable after ${service.retries} attempts: ${error.message}`));
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        const error = new Error(`Request to ${service.name} timed out after ${service.timeout}ms`);
        
        if (attempt < service.retries) {
          logger.info('Retrying service request after timeout', {
            service: service.name,
            attempt: attempt + 1,
            maxRetries: service.retries
          });
          
          const delay = Math.pow(2, attempt) * 1000;
          setTimeout(() => {
            this.makeRequest(service, path, method, headers, body, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(error);
        }
      });
      
      // Send request body if present
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }
  
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }
    
    try {
      const response = await this.makeRequest(
        service,
        service.healthPath,
        'GET',
        {},
        undefined,
        1
      );
      
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (error) {
      logger.warn('Service health check failed', {
        service: serviceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  async checkAllServicesHealth(): Promise<{ [serviceName: string]: boolean }> {
    const healthChecks = Array.from(this.services.keys()).map(async (serviceName) => {
      const isHealthy = await this.checkServiceHealth(serviceName);
      return { serviceName, isHealthy };
    });
    
    const results = await Promise.allSettled(healthChecks);
    const healthStatus: { [serviceName: string]: boolean } = {};
    
    results.forEach((result, index) => {
      const serviceName = Array.from(this.services.keys())[index];
      if (result.status === 'fulfilled') {
        healthStatus[serviceName] = result.value.isHealthy;
      } else {
        healthStatus[serviceName] = false;
      }
    });
    
    return healthStatus;
  }
  
  getServiceList(): string[] {
    return Array.from(this.services.keys());
  }
  
  getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const serviceProxy = new ServiceProxy();

export { ServiceProxy, serviceProxy };