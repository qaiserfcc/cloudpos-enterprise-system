import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
  maxRetriesPerRequest?: number;
}

export class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor(config: RedisConfig) {
    const clientOptions: any = {
      socket: {
        host: config.host,
        port: config.port,
      },
      database: config.db || 0,
    };

    if (config.password) {
      clientOptions.password = config.password;
    }

    this.client = createClient(clientOptions);

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (error: Error) => {
      this.isConnected = false;
      logger.error('Redis connection error', { error });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis connection closed');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis connected');
    } catch (error) {
      this.isConnected = false;
      logger.error('Redis connection failed', { error });
      throw new Error('Redis connection failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit();
      }
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis', { error });
      throw error;
    }
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET failed', { error, key });
      throw error;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<string | null> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        return await this.client.setEx(key, ttl, serializedValue);
      }
      return await this.client.set(key, serializedValue);
    } catch (error) {
      logger.error('Redis SET failed', { error, key });
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL failed', { error, key });
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS failed', { error, key });
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE failed', { error, key });
      throw error;
    }
  }

  // Cart session management
  async setCartSession(cartId: string, cartData: any, ttl: number = 3600): Promise<void> {
    const key = `cart:${cartId}`;
    await this.set(key, cartData, ttl);
  }

  async getCartSession(cartId: string): Promise<any | null> {
    const key = `cart:${cartId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteCartSession(cartId: string): Promise<void> {
    const key = `cart:${cartId}`;
    await this.del(key);
  }

  // Transaction locking
  async acquireLock(resource: string, ttl: number = 30): Promise<boolean> {
    const key = `lock:${resource}`;
    const lockId = Date.now().toString();
    
    try {
      const result = await this.client.set(key, lockId, {
        NX: true, // Only set if not exists
        EX: ttl   // Expire after ttl seconds
      });
      return result === 'OK';
    } catch (error) {
      logger.error('Failed to acquire lock', { error, resource });
      return false;
    }
  }

  async releaseLock(resource: string): Promise<void> {
    const key = `lock:${resource}`;
    await this.del(key);
  }

  // Rate limiting for transactions
  async checkRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.client.multi();
      
      // Remove old entries
      pipeline.zRemRangeByScore(key, 0, windowStart);
      
      // Count current requests
      pipeline.zCard(key);
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: now.toString() });
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const currentCount = results?.[1] as number || 0;
      
      const allowed = currentCount < maxRequests;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetTime = new Date(now + windowMs);

      return { allowed, remaining, resetTime };
    } catch (error) {
      logger.error('Rate limit check failed', { error, identifier });
      // Fail open - allow the request if Redis is down
      return { allowed: true, remaining: maxRequests - 1, resetTime: new Date(now + windowMs) };
    }
  }

  // Pub/Sub for real-time notifications
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.client.publish(channel, serializedMessage);
    } catch (error) {
      logger.error('Redis PUBLISH failed', { error, channel });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(channel, (message) => {
        callback(message);
      });
      
      logger.info(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      logger.error('Redis SUBSCRIBE failed', { error, channel });
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping();
      return this.isConnected;
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Create Redis service instance
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
};

export const redisService = new RedisService(redisConfig);