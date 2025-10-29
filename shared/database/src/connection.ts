import { Pool } from 'pg';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import { RedisManager } from './redis';
import { MongoManager } from './mongo';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Connection Pool
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'cloudpos',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Redis Connection with legacy Redis client (for compatibility)
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
  },
});

// MongoDB Connection Manager
let mongoClient: MongoClient;

export const connectMongo = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(
      process.env.MONGODB_URL || 'mongodb://localhost:27017',
      {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
        retryReads: true,
      }
    );
    await mongoClient.connect();
  }
  return mongoClient;
};

export const getMongoDb = (dbName: string = 'cloudpos_analytics') => {
  if (!mongoClient) {
    throw new Error('MongoDB client not connected');
  }
  return mongoClient.db(dbName);
};

// Enhanced Database Manager
export class DatabaseManager {
  static async initialize(): Promise<void> {
    console.log('Initializing database connections...');

    try {
      // Initialize PostgreSQL
      const pgClient = await pgPool.connect();
      await pgClient.query('SELECT NOW()');
      pgClient.release();
      console.log('✅ PostgreSQL connected successfully');

      // Initialize Redis
      await redisClient.connect();
      console.log('✅ Redis connected successfully');

      // Initialize MongoDB
      await MongoManager.connect();
      await MongoManager.createIndexes();
      console.log('✅ MongoDB connected and indexed successfully');

      console.log('🚀 All databases initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    console.log('Closing database connections...');

    const promises: Promise<void>[] = [];

    // Close PostgreSQL
    promises.push(
      pgPool.end().then(() => console.log('✅ PostgreSQL connection closed'))
        .catch(err => console.error('❌ Error closing PostgreSQL:', err))
    );

    // Close Redis
    promises.push(
      redisClient.quit().then(() => console.log('✅ Redis connection closed'))
        .catch(err => console.error('❌ Error closing Redis:', err))
    );

    // Close MongoDB
    promises.push(
      MongoManager.disconnect().then(() => console.log('✅ MongoDB connection closed'))
        .catch(err => console.error('❌ Error closing MongoDB:', err))
    );

    await Promise.all(promises);
    console.log('All database connections closed.');
  }

  static async healthCheck(): Promise<{
    postgres: { connected: boolean; latency?: number; error?: string };
    redis: { connected: boolean; latency?: number; memory?: any; error?: string };
    mongodb: { connected: boolean; collections?: string[]; error?: string };
    overall: boolean;
  }> {
    const health = {
      postgres: { connected: false } as any,
      redis: { connected: false } as any,
      mongodb: { connected: false } as any,
      overall: false,
    };

    // Check PostgreSQL
    try {
      const start = Date.now();
      const pgClient = await pgPool.connect();
      await pgClient.query('SELECT 1');
      pgClient.release();
      const latency = Date.now() - start;
      health.postgres = { connected: true, latency };
    } catch (error) {
      health.postgres = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Check Redis
    try {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      health.redis = { connected: true, latency };
    } catch (error) {
      health.redis = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Check MongoDB
    try {
      const mongoHealth = await MongoManager.healthCheck();
      health.mongodb = mongoHealth;
    } catch (error) {
      health.mongodb = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Overall health
    health.overall = health.postgres.connected && health.redis.connected && health.mongodb.connected;

    return health;
  }

  static async getConnectionStats(): Promise<{
    postgres: {
      totalConnections: number;
      idleConnections: number;
      waitingConnections: number;
    };
    redis: {
      connected: boolean;
      uptime?: number;
      memoryUsage?: any;
    };
    mongodb: {
      connected: boolean;
      serverStatus?: any;
    };
  }> {
    const stats = {
      postgres: {
        totalConnections: pgPool.totalCount,
        idleConnections: pgPool.idleCount,
        waitingConnections: pgPool.waitingCount,
      },
      redis: { connected: false } as any,
      mongodb: { connected: false } as any,
    };

    try {
      const redisInfo = await redisClient.info();
      stats.redis = {
        connected: true,
        uptime: parseInt(redisInfo.split('\r\n').find(line => line.startsWith('uptime_in_seconds:'))?.split(':')[1] || '0'),
        memoryUsage: redisInfo.split('\r\n').filter(line => line.includes('memory')),
      };
    } catch (error) {
      // Redis stats not available
    }

    try {
      const mongoHealth = await MongoManager.healthCheck();
      stats.mongodb = { connected: mongoHealth.connected };
    } catch (error) {
      // MongoDB stats not available
    }

    return stats;
  }
}

// Event Handlers for Connection Events
pgPool.on('connect', () => {
  console.log('PostgreSQL client connected');
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Process handlers for graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await DatabaseManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await DatabaseManager.disconnect();
  process.exit(0);
});

// Export managers for easy access
export { RedisManager, MongoManager };
export default DatabaseManager;