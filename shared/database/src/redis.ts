import { redisClient } from './connection';

export class RedisManager {
  /**
   * Session Management
   */
  static async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.del(key);
  }

  static async refreshSession(sessionId: string, ttl: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.expire(key, ttl);
  }

  /**
   * User Cache Management
   */
  static async cacheUser(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    const key = `user:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(userData));
  }

  static async getCachedUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async invalidateUser(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await redisClient.del(key);
  }

  /**
   * Product Cache Management
   */
  static async cacheProduct(productId: string, productData: any, ttl: number = 7200): Promise<void> {
    const key = `product:${productId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(productData));
  }

  static async getCachedProduct(productId: string): Promise<any | null> {
    const key = `product:${productId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async invalidateProduct(productId: string): Promise<void> {
    const key = `product:${productId}`;
    await redisClient.del(key);
  }

  /**
   * Inventory Cache Management
   */
  static async cacheInventory(storeId: string, productId: string, inventoryData: any, ttl: number = 300): Promise<void> {
    const key = `inventory:${storeId}:${productId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(inventoryData));
  }

  static async getCachedInventory(storeId: string, productId: string): Promise<any | null> {
    const key = `inventory:${storeId}:${productId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async invalidateInventory(storeId: string, productId?: string): Promise<void> {
    if (productId) {
      const key = `inventory:${storeId}:${productId}`;
      await redisClient.del(key);
    } else {
      // Invalidate all inventory for store
      const pattern = `inventory:${storeId}:*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  }

  /**
   * Rate Limiting
   */
  static async checkRateLimit(
    identifier: string,
    windowMs: number = 900000, // 15 minutes
    maxRequests: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;

    const current = await redisClient.get(windowKey);
    const currentCount = current ? parseInt(current) : 0;

    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + windowMs,
      };
    }

    const newCount = currentCount + 1;
    const ttl = Math.ceil((windowStart + windowMs - now) / 1000);
    
    await redisClient.setEx(windowKey, ttl, newCount.toString());

    return {
      allowed: true,
      remaining: maxRequests - newCount,
      resetTime: windowStart + windowMs,
    };
  }

  /**
   * Real-time POS Terminal Status
   */
  static async setTerminalStatus(terminalId: string, status: 'online' | 'offline', ttl: number = 60): Promise<void> {
    const key = `terminal:${terminalId}:status`;
    const data = {
      status,
      lastHeartbeat: new Date().toISOString(),
    };
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  }

  static async getTerminalStatus(terminalId: string): Promise<any | null> {
    const key = `terminal:${terminalId}:status`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async getActiveTerminals(storeId?: string): Promise<string[]> {
    const pattern = storeId ? `terminal:${storeId}:*:status` : 'terminal:*:status';
    const keys = await redisClient.keys(pattern);
    
    const activeTerminals: string[] = [];
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const status = JSON.parse(data);
        if (status.status === 'online') {
          const terminalId = key.split(':')[1];
          activeTerminals.push(terminalId);
        }
      }
    }
    
    return activeTerminals;
  }

  /**
   * Active Transactions Cache
   */
  static async addActiveTransaction(storeId: string, transactionId: string, ttl: number = 1800): Promise<void> {
    const key = `active_transactions:${storeId}`;
    await redisClient.sAdd(key, transactionId);
    await redisClient.expire(key, ttl);
  }

  static async removeActiveTransaction(storeId: string, transactionId: string): Promise<void> {
    const key = `active_transactions:${storeId}`;
    await redisClient.sRem(key, transactionId);
  }

  static async getActiveTransactions(storeId: string): Promise<string[]> {
    const key = `active_transactions:${storeId}`;
    return await redisClient.sMembers(key);
  }

  /**
   * Pub/Sub for Real-time Updates
   */
  static async publishTransactionUpdate(storeId: string, transactionData: any): Promise<void> {
    const channel = `transaction_updates:${storeId}`;
    await redisClient.publish(channel, JSON.stringify(transactionData));
  }

  static async publishInventoryUpdate(storeId: string, inventoryData: any): Promise<void> {
    const channel = `inventory_updates:${storeId}`;
    await redisClient.publish(channel, JSON.stringify(inventoryData));
  }

  static async publishPaymentStatus(terminalId: string, paymentData: any): Promise<void> {
    const channel = `payment_status:${terminalId}`;
    await redisClient.publish(channel, JSON.stringify(paymentData));
  }

  /**
   * Cache Statistics and Metrics
   */
  static async incrementCounter(key: string, increment: number = 1, ttl?: number): Promise<number> {
    const result = await redisClient.incrBy(key, increment);
    if (ttl) {
      await redisClient.expire(key, ttl);
    }
    return result;
  }

  static async getCounter(key: string): Promise<number> {
    const value = await redisClient.get(key);
    return value ? parseInt(value) : 0;
  }

  /**
   * Temporary Data Storage
   */
  static async setTemporaryData(key: string, data: any, ttl: number = 3600): Promise<void> {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  }

  static async getTemporaryData(key: string): Promise<any | null> {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cache Health Check
   */
  static async healthCheck(): Promise<{
    connected: boolean;
    latency?: number;
    memory?: any;
  }> {
    try {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;

      const info = await redisClient.info('memory');
      const memoryInfo = this.parseRedisInfo(info);

      return {
        connected: true,
        latency,
        memory: memoryInfo,
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }

  private static parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    await redisClient.flushAll();
  }

  /**
   * Clear cache by pattern
   */
  static async clearCacheByPattern(pattern: string): Promise<number> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(keys);
    }
    return 0;
  }
}

export default RedisManager;