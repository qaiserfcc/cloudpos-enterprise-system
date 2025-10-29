import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface RedisConfig {
  url: string;
  password?: string;
  db?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

class RedisManager {
  private static client: RedisClientType | null = null;
  private static config: RedisConfig;

  static initialize() {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000')
    };

    this.client = createClient({
      url: this.config.url,
      password: this.config.password,
      database: this.config.db,
      socket: {
        connectTimeout: this.config.connectTimeout,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis reconnection attempts exceeded limit');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    // Event handlers
    this.client.on('error', (err) => {
      logger.error('Redis client error', err);
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

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  static async connect(): Promise<void> {
    if (!this.client) {
      this.initialize();
    }

    try {
      await this.client!.connect();
      await this.client!.ping();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client && this.client.isReady) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis connection closed');
    }
  }

  static getClient(): RedisClientType {
    if (!this.client || !this.client.isReady) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  // Cache operations
  static async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    const client = this.getClient();
    
    if (expireInSeconds) {
      await client.setEx(key, expireInSeconds, value);
    } else {
      await client.set(key, value);
    }
    
    logger.debug('Redis SET operation', { key, hasExpiry: !!expireInSeconds });
  }

  static async get(key: string): Promise<string | null> {
    const client = this.getClient();
    const value = await client.get(key);
    
    logger.debug('Redis GET operation', { key, found: !!value });
    return value;
  }

  static async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
    
    logger.debug('Redis DEL operation', { key });
  }

  static async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const exists = await client.exists(key);
    
    logger.debug('Redis EXISTS operation', { key, exists: !!exists });
    return !!exists;
  }

  static async expire(key: string, seconds: number): Promise<void> {
    const client = this.getClient();
    await client.expire(key, seconds);
    
    logger.debug('Redis EXPIRE operation', { key, seconds });
  }

  static async ttl(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }

  // Hash operations
  static async hSet(key: string, field: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.hSet(key, field, value);
    
    logger.debug('Redis HSET operation', { key, field });
  }

  static async hGet(key: string, field: string): Promise<string | undefined> {
    const client = this.getClient();
    const value = await client.hGet(key, field);
    
    logger.debug('Redis HGET operation', { key, field, found: !!value });
    return value;
  }

  static async hGetAll(key: string): Promise<Record<string, string>> {
    const client = this.getClient();
    const hash = await client.hGetAll(key);
    
    logger.debug('Redis HGETALL operation', { key, fieldCount: Object.keys(hash).length });
    return hash;
  }

  static async hDel(key: string, field: string): Promise<void> {
    const client = this.getClient();
    await client.hDel(key, field);
    
    logger.debug('Redis HDEL operation', { key, field });
  }

  // Set operations
  static async sAdd(key: string, member: string): Promise<void> {
    const client = this.getClient();
    await client.sAdd(key, member);
    
    logger.debug('Redis SADD operation', { key, member });
  }

  static async sRem(key: string, member: string): Promise<void> {
    const client = this.getClient();
    await client.sRem(key, member);
    
    logger.debug('Redis SREM operation', { key, member });
  }

  static async sIsMember(key: string, member: string): Promise<boolean> {
    const client = this.getClient();
    const isMember = await client.sIsMember(key, member);
    
    logger.debug('Redis SISMEMBER operation', { key, member, isMember });
    return isMember;
  }

  static async sMembers(key: string): Promise<string[]> {
    const client = this.getClient();
    const members = await client.sMembers(key);
    
    logger.debug('Redis SMEMBERS operation', { key, memberCount: members.length });
    return members;
  }

  // List operations
  static async lPush(key: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.lPush(key, value);
    
    logger.debug('Redis LPUSH operation', { key });
  }

  static async rPush(key: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.rPush(key, value);
    
    logger.debug('Redis RPUSH operation', { key });
  }

  static async lPop(key: string): Promise<string | null> {
    const client = this.getClient();
    const value = await client.lPop(key);
    
    logger.debug('Redis LPOP operation', { key, found: !!value });
    return value;
  }

  static async rPop(key: string): Promise<string | null> {
    const client = this.getClient();
    const value = await client.rPop(key);
    
    logger.debug('Redis RPOP operation', { key, found: !!value });
    return value;
  }

  static async lRange(key: string, start: number, stop: number): Promise<string[]> {
    const client = this.getClient();
    const values = await client.lRange(key, start, stop);
    
    logger.debug('Redis LRANGE operation', { key, start, stop, count: values.length });
    return values;
  }

  // Utility methods
  static async flushDb(): Promise<void> {
    const client = this.getClient();
    await client.flushDb();
    
    logger.warn('Redis database flushed');
  }

  static async ping(): Promise<string> {
    const client = this.getClient();
    return await client.ping();
  }

  static isConnected(): boolean {
    return this.client !== null && this.client.isReady;
  }
}

export { RedisManager };