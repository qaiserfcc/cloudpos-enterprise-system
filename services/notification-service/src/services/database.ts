import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'cloudpos_notifications',
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

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled')),
        priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        template_id UUID REFERENCES notification_templates(id),
        
        -- Recipients
        recipient_id UUID,
        recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer', 'user', 'store', 'system')),
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(20),
        recipient_device_token TEXT,
        
        -- Content
        subject TEXT,
        message TEXT NOT NULL,
        html_content TEXT,
        data JSONB DEFAULT '{}',
        
        -- Scheduling
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        
        -- Tracking
        tracking_id VARCHAR(100) UNIQUE,
        external_id VARCHAR(255),
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        
        -- Metadata
        metadata JSONB DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create notification templates table
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
        subject TEXT,
        template TEXT NOT NULL,
        description TEXT,
        variables JSONB DEFAULT '[]',
        default_data JSONB DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
        is_system BOOLEAN DEFAULT FALSE,
        category VARCHAR(100) DEFAULT 'general',
        version INTEGER DEFAULT 1,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(name, type, is_system) DEFERRABLE INITIALLY DEFERRED
      );

      -- Create notification queue table
      CREATE TABLE IF NOT EXISTS notification_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID NOT NULL,
        notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
        priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'failed', 'bounced', 'rejected')),
        
        -- Queue Management
        queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processing_at TIMESTAMP WITH TIME ZONE,
        processed_at TIMESTAMP WITH TIME ZONE,
        
        -- Retry Logic
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        next_retry_at TIMESTAMP WITH TIME ZONE,
        
        -- Error Handling
        error_message TEXT,
        error_code VARCHAR(50),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_tracking_id ON notifications(tracking_id);
      
      CREATE INDEX IF NOT EXISTS idx_templates_store_id ON notification_templates(store_id);
      CREATE INDEX IF NOT EXISTS idx_templates_type ON notification_templates(type);
      CREATE INDEX IF NOT EXISTS idx_templates_status ON notification_templates(status);
      CREATE INDEX IF NOT EXISTS idx_templates_is_system ON notification_templates(is_system);
      
      CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
      CREATE INDEX IF NOT EXISTS idx_queue_priority ON notification_queue(priority);
      CREATE INDEX IF NOT EXISTS idx_queue_next_retry_at ON notification_queue(next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_queue_queued_at ON notification_queue(queued_at);
    `;

    await this.query(createTablesSQL);
    logger.info('Database tables created successfully');
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
      throw error;
    }
  }

  async initializeSchema(): Promise<void> {
    try {
      await this.createSchema();
      logger.info('Database schema initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
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

  async createSchema(): Promise<void> {
    try {
      await this.query(`
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          type VARCHAR(20) NOT NULL, -- email, sms, push, webhook, in_app
          status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed, cancelled, bounced, clicked, opened
          priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
          template_id UUID,
          
          -- Recipients
          recipient_id UUID,
          recipient_type VARCHAR(20) NOT NULL, -- customer, user, store, system
          recipient_email VARCHAR(255),
          recipient_phone VARCHAR(50),
          recipient_device_token TEXT,
          
          -- Content
          subject VARCHAR(500),
          message TEXT NOT NULL,
          html_content TEXT,
          data JSONB DEFAULT '{}',
          
          -- Scheduling
          scheduled_at TIMESTAMP WITH TIME ZONE,
          sent_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          
          -- Tracking
          tracking_id VARCHAR(100),
          external_id VARCHAR(100),
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          
          -- Metadata
          metadata JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Templates
        CREATE TABLE IF NOT EXISTS notification_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(20) NOT NULL, -- transactional, marketing, system, promotional
          notification_type VARCHAR(20) NOT NULL, -- email, sms, push, webhook, in_app
          
          -- Template Content
          subject VARCHAR(500),
          body_template TEXT NOT NULL,
          html_template TEXT,
          variables TEXT[] DEFAULT ARRAY[]::TEXT[],
          
          -- Configuration
          is_active BOOLEAN DEFAULT true,
          is_default BOOLEAN DEFAULT false,
          
          -- Metadata
          metadata JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(store_id, name)
        );

        -- Notification Queue
        CREATE TABLE IF NOT EXISTS notification_queue (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          priority VARCHAR(10) NOT NULL DEFAULT 'normal',
          status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, processing, sent, delivered, failed, bounced, rejected
          
          -- Queue Management
          queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          processing_at TIMESTAMP WITH TIME ZONE,
          processed_at TIMESTAMP WITH TIME ZONE,
          
          -- Retry Logic
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          next_retry_at TIMESTAMP WITH TIME ZONE,
          
          -- Error Handling
          error_message TEXT,
          error_code VARCHAR(50),
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Delivery
        CREATE TABLE IF NOT EXISTS notification_delivery (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          queue_id UUID NOT NULL REFERENCES notification_queue(id) ON DELETE CASCADE,
          
          -- Delivery Details
          provider VARCHAR(100) NOT NULL,
          provider_message_id VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'queued',
          delivered_at TIMESTAMP WITH TIME ZONE,
          
          -- Tracking
          opens INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          bounces INTEGER DEFAULT 0,
          
          -- Provider Response
          provider_response JSONB DEFAULT '{}',
          error_message TEXT,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Events
        CREATE TABLE IF NOT EXISTS notification_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          type VARCHAR(100) NOT NULL, -- sent, delivered, opened, clicked, bounced, failed
          
          -- Event Data
          event_data JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          -- Source
          source VARCHAR(100) NOT NULL,
          source_id VARCHAR(255),
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Settings
        CREATE TABLE IF NOT EXISTS notification_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL UNIQUE,
          
          -- Email Settings
          email_enabled BOOLEAN DEFAULT true,
          email_from VARCHAR(255),
          email_reply_to VARCHAR(255),
          smtp_host VARCHAR(255),
          smtp_port INTEGER,
          smtp_user VARCHAR(255),
          smtp_password TEXT,
          smtp_secure BOOLEAN DEFAULT true,
          
          -- SMS Settings
          sms_enabled BOOLEAN DEFAULT false,
          sms_provider VARCHAR(50),
          sms_account_sid VARCHAR(255),
          sms_auth_token TEXT,
          sms_from VARCHAR(50),
          
          -- Push Settings
          push_enabled BOOLEAN DEFAULT false,
          push_provider VARCHAR(50),
          fcm_server_key TEXT,
          apns_key TEXT,
          apns_key_id VARCHAR(50),
          apns_team_id VARCHAR(50),
          
          -- Webhook Settings
          webhook_enabled BOOLEAN DEFAULT false,
          webhook_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
          webhook_secret VARCHAR(255),
          
          -- Rate Limiting
          email_rate_limit INTEGER DEFAULT 100,
          sms_rate_limit INTEGER DEFAULT 50,
          push_rate_limit INTEGER DEFAULT 200,
          
          -- Retry Settings
          default_max_retries INTEGER DEFAULT 3,
          retry_backoff_multiplier DECIMAL(3,2) DEFAULT 2.0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Stats
        CREATE TABLE IF NOT EXISTS notification_stats (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          date DATE NOT NULL,
          
          -- Volume Stats
          total_sent INTEGER DEFAULT 0,
          total_delivered INTEGER DEFAULT 0,
          total_failed INTEGER DEFAULT 0,
          total_bounced INTEGER DEFAULT 0,
          
          -- Type Breakdown
          email_sent INTEGER DEFAULT 0,
          email_delivered INTEGER DEFAULT 0,
          email_opened INTEGER DEFAULT 0,
          email_clicked INTEGER DEFAULT 0,
          email_bounced INTEGER DEFAULT 0,
          
          sms_sent INTEGER DEFAULT 0,
          sms_delivered INTEGER DEFAULT 0,
          sms_failed INTEGER DEFAULT 0,
          
          push_sent INTEGER DEFAULT 0,
          push_delivered INTEGER DEFAULT 0,
          push_opened INTEGER DEFAULT 0,
          push_clicked INTEGER DEFAULT 0,
          
          -- Performance Metrics
          average_delivery_time INTEGER DEFAULT 0, -- in milliseconds
          delivery_rate DECIMAL(5,2) DEFAULT 0.00,
          open_rate DECIMAL(5,2) DEFAULT 0.00,
          click_rate DECIMAL(5,2) DEFAULT 0.00,
          bounce_rate DECIMAL(5,2) DEFAULT 0.00,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(store_id, date)
        );

        -- Webhook Deliveries
        CREATE TABLE IF NOT EXISTS webhook_deliveries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
          url VARCHAR(500) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'queued',
          response_code INTEGER,
          response_body TEXT,
          retry_count INTEGER DEFAULT 0,
          next_retry_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Campaigns
        CREATE TABLE IF NOT EXISTS notification_campaigns (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          
          -- Campaign Settings
          type VARCHAR(20) NOT NULL,
          template_id UUID REFERENCES notification_templates(id),
          audience_segments TEXT[] DEFAULT ARRAY[]::TEXT[],
          
          -- Scheduling
          scheduled_at TIMESTAMP WITH TIME ZONE,
          start_date TIMESTAMP WITH TIME ZONE,
          end_date TIMESTAMP WITH TIME ZONE,
          timezone VARCHAR(50) DEFAULT 'UTC',
          
          -- Status
          status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, running, paused, completed, cancelled
          
          -- Tracking
          total_recipients INTEGER DEFAULT 0,
          sent_count INTEGER DEFAULT 0,
          delivered_count INTEGER DEFAULT 0,
          opened_count INTEGER DEFAULT 0,
          clicked_count INTEGER DEFAULT 0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_type);

        CREATE INDEX IF NOT EXISTS idx_templates_store_id ON notification_templates(store_id);
        CREATE INDEX IF NOT EXISTS idx_templates_type ON notification_templates(notification_type);
        CREATE INDEX IF NOT EXISTS idx_templates_active ON notification_templates(is_active);

        CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
        CREATE INDEX IF NOT EXISTS idx_queue_priority ON notification_queue(priority);
        CREATE INDEX IF NOT EXISTS idx_queue_next_retry ON notification_queue(next_retry_at);
        CREATE INDEX IF NOT EXISTS idx_queue_created_at ON notification_queue(created_at);

        CREATE INDEX IF NOT EXISTS idx_delivery_notification_id ON notification_delivery(notification_id);
        CREATE INDEX IF NOT EXISTS idx_delivery_status ON notification_delivery(status);

        CREATE INDEX IF NOT EXISTS idx_events_notification_id ON notification_events(notification_id);
        CREATE INDEX IF NOT EXISTS idx_events_type ON notification_events(type);
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON notification_events(timestamp);

        CREATE INDEX IF NOT EXISTS idx_stats_store_date ON notification_stats(store_id, date);
        CREATE INDEX IF NOT EXISTS idx_stats_date ON notification_stats(date);

        CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_deliveries(status);
        CREATE INDEX IF NOT EXISTS idx_webhook_next_retry ON webhook_deliveries(next_retry_at);

        -- Triggers for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
        CREATE TRIGGER update_notifications_updated_at 
          BEFORE UPDATE ON notifications 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_templates_updated_at ON notification_templates;
        CREATE TRIGGER update_templates_updated_at 
          BEFORE UPDATE ON notification_templates 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_queue_updated_at ON notification_queue;
        CREATE TRIGGER update_queue_updated_at 
          BEFORE UPDATE ON notification_queue 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_delivery_updated_at ON notification_delivery;
        CREATE TRIGGER update_delivery_updated_at 
          BEFORE UPDATE ON notification_delivery 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_settings_updated_at ON notification_settings;
        CREATE TRIGGER update_settings_updated_at 
          BEFORE UPDATE ON notification_settings 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_stats_updated_at ON notification_stats;
        CREATE TRIGGER update_stats_updated_at 
          BEFORE UPDATE ON notification_stats 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_campaigns_updated_at ON notification_campaigns;
        CREATE TRIGGER update_campaigns_updated_at 
          BEFORE UPDATE ON notification_campaigns 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      logger.info('Database schema created successfully');
    } catch (error) {
      logger.error('Error creating database schema:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService();