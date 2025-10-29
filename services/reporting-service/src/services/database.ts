import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'cloudpos_reporting',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Create tables
      await this.createTables();
      logger.info('Database connection established and tables created');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createTablesSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create reports table
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL CHECK (type IN ('sales', 'financial', 'inventory', 'customer', 'payment', 'custom')),
        format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'csv', 'pdf', 'excel')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
        
        -- Configuration
        config JSONB NOT NULL DEFAULT '{}',
        filters JSONB DEFAULT '{}',
        
        -- Data
        data JSONB,
        data_url TEXT,
        
        -- Metadata
        generated_by UUID,
        generated_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        file_size BIGINT,
        
        -- Scheduling
        is_scheduled BOOLEAN DEFAULT FALSE,
        schedule_config JSONB,
        
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create dashboards table
      CREATE TABLE IF NOT EXISTS dashboards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL CHECK (type IN ('executive', 'sales', 'operations', 'financial', 'customer', 'custom')),
        layout JSONB NOT NULL DEFAULT '{}',
        widgets JSONB NOT NULL DEFAULT '[]',
        
        -- Access Control
        is_public BOOLEAN DEFAULT FALSE,
        allowed_users TEXT[],
        allowed_roles TEXT[],
        
        -- Settings
        refresh_interval INTEGER, -- seconds
        auto_refresh BOOLEAN DEFAULT FALSE,
        
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create metrics table
      CREATE TABLE IF NOT EXISTS metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        
        -- Configuration
        type VARCHAR(20) NOT NULL CHECK (type IN ('count', 'sum', 'average', 'percentage', 'ratio')),
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        calculation JSONB NOT NULL DEFAULT '{}',
        
        -- Current Value
        current_value DECIMAL(20,4),
        previous_value DECIMAL(20,4),
        percentage_change DECIMAL(10,4),
        
        -- Target & Thresholds
        target DECIMAL(20,4),
        thresholds JSONB DEFAULT '[]',
        
        -- Metadata
        is_active BOOLEAN DEFAULT TRUE,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(store_id, name)
      );

      -- Create metric_data table for historical data
      CREATE TABLE IF NOT EXISTS metric_data (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
        store_id UUID NOT NULL,
        
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        value DECIMAL(20,4) NOT NULL,
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(metric_id, timestamp)
      );

      -- Create alerts table
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('threshold', 'trend', 'anomaly')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'resolved', 'disabled')),
        
        -- Configuration
        condition JSONB NOT NULL DEFAULT '{}',
        actions JSONB NOT NULL DEFAULT '[]',
        
        -- Timing
        check_interval INTEGER NOT NULL DEFAULT 300, -- seconds
        last_checked TIMESTAMP WITH TIME ZONE,
        last_triggered TIMESTAMP WITH TIME ZONE,
        next_check TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        is_active BOOLEAN DEFAULT TRUE,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create alert_instances table
      CREATE TABLE IF NOT EXISTS alert_instances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
        store_id UUID NOT NULL,
        
        triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        
        trigger_value DECIMAL(20,4) NOT NULL,
        threshold DECIMAL(20,4) NOT NULL,
        
        message TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        
        actions_executed JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create report_cache table for caching report results
      CREATE TABLE IF NOT EXISTS report_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cache_key VARCHAR(255) NOT NULL UNIQUE,
        store_id UUID NOT NULL,
        
        data JSONB NOT NULL,
        tags TEXT[] DEFAULT '{}',
        
        cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create scheduled_reports table
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        store_id UUID NOT NULL,
        
        schedule_config JSONB NOT NULL,
        next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_run_at TIMESTAMP WITH TIME ZONE,
        
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
        failure_count INTEGER DEFAULT 0,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create data_sources table for external data connections
      CREATE TABLE IF NOT EXISTS data_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('postgresql', 'mysql', 'api', 'csv', 'json')),
        
        connection_config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        
        last_sync_at TIMESTAMP WITH TIME ZONE,
        sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'failed')),
        sync_error TEXT,
        
        metadata JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(store_id, name)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_reports_store_id ON reports(store_id);
      CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_dashboards_store_id ON dashboards(store_id);
      CREATE INDEX IF NOT EXISTS idx_dashboards_type ON dashboards(type);
      CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_metrics_store_id ON metrics(store_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_category ON metrics(category);
      CREATE INDEX IF NOT EXISTS idx_metrics_is_active ON metrics(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_metric_data_metric_id ON metric_data(metric_id);
      CREATE INDEX IF NOT EXISTS idx_metric_data_timestamp ON metric_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_metric_data_store_id ON metric_data(store_id);
      
      CREATE INDEX IF NOT EXISTS idx_alerts_store_id ON alerts(store_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
      CREATE INDEX IF NOT EXISTS idx_alerts_next_check ON alerts(next_check);
      CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_alert_instances_alert_id ON alert_instances(alert_id);
      CREATE INDEX IF NOT EXISTS idx_alert_instances_triggered_at ON alert_instances(triggered_at);
      CREATE INDEX IF NOT EXISTS idx_alert_instances_store_id ON alert_instances(store_id);
      
      CREATE INDEX IF NOT EXISTS idx_report_cache_key ON report_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_report_cache_expires_at ON report_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_report_cache_store_id ON report_cache(store_id);
      
      CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run_at ON scheduled_reports(next_run_at);
      CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status ON scheduled_reports(status);
      
      CREATE INDEX IF NOT EXISTS idx_data_sources_store_id ON data_sources(store_id);
      CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);
    `;

    await this.query(createTablesSQL);
    logger.info('Database tables created successfully');
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          query: text.substring(0, 100),
          duration: `${duration}ms`,
          rowCount: result.rowCount
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error', {
        query: text.substring(0, 100),
        params: params?.slice(0, 5),
        error
      });
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
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

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
}

export const databaseService = new DatabaseService();