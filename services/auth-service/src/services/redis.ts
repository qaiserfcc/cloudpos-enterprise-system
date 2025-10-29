import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', { error: err });
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  // Token blacklist management
  async blacklistToken(token: string, expirationTime: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.setEx(key, expirationTime, 'blacklisted');
    logger.info('Token blacklisted', { tokenPrefix: token.substring(0, 10) });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.client.get(key);
    return result !== null;
  }

  // Session management
  async setSession(sessionId: string, userId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    const sessionData = {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
    };
    await this.client.setEx(key, ttl, JSON.stringify(sessionData));
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  // Rate limiting
  async incrementRateLimit(key: string, window: number, limit: number): Promise<{ count: number; ttl: number; blocked: boolean }> {
    const rateLimitKey = `rate_limit:${key}`;
    
    const count = await this.client.incr(rateLimitKey);
    
    if (count === 1) {
      await this.client.expire(rateLimitKey, window);
    }
    
    const ttl = await this.client.ttl(rateLimitKey);
    
    return {
      count,
      ttl,
      blocked: count > limit,
    };
  }

  // User login attempts tracking
  async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    const key = `login_attempts:${email}`;
    
    if (success) {
      // Clear failed attempts on successful login
      await this.client.del(key);
    } else {
      // Increment failed attempts
      const attempts = await this.client.incr(key);
      if (attempts === 1) {
        // Set expiration for first failed attempt
        await this.client.expire(key, 900); // 15 minutes
      }
    }
  }

  async getLoginAttempts(email: string): Promise<number> {
    const key = `login_attempts:${email}`;
    const attempts = await this.client.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  // Cache management
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get(key: string): Promise<any | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async getKeys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return false;
    }
  }

  // Pub/Sub for real-time notifications
  async publish(channel: string, message: any): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        logger.error('Error parsing pub/sub message', { error, message });
      }
    });
  }
}

export const redisService = new RedisService();