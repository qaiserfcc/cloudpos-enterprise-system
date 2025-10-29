import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseManager {
  private static pool: Pool | null = null;
  private static config: DatabaseConfig;

  static initialize() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cloudpos_db',
      user: process.env.DB_USER || 'pos_user',
      password: process.env.DB_PASSWORD || 'pos_password',
      ssl: process.env.DB_SSL === 'true',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
    };

    this.pool = new Pool(this.config);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('PostgreSQL pool error', err);
    });

    this.pool.on('connect', () => {
      logger.debug('New PostgreSQL client connected');
    });

    this.pool.on('remove', () => {
      logger.debug('PostgreSQL client removed from pool');
    });
  }

  static async connect(): Promise<void> {
    if (!this.pool) {
      this.initialize();
    }

    try {
      // Test connection
      const client = await this.pool!.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('PostgreSQL connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  static async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text,
        duration,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        query: text,
        duration,
        error
      });
      throw error;
    }
  }

  static async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    
    return await this.pool.connect();
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('PostgreSQL connection pool closed');
    }
  }

  static isConnected(): boolean {
    return this.pool !== null;
  }

  static getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

export { DatabaseManager, DatabaseConfig };