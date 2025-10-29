import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/customer_service',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
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
        
        -- Customers table
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          customer_number VARCHAR(50) UNIQUE NOT NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'individual',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          
          -- Personal Information
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          date_of_birth DATE,
          gender VARCHAR(10),
          
          -- Business Information
          company_name VARCHAR(255),
          tax_id VARCHAR(50),
          business_type VARCHAR(100),
          
          -- Metadata
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          notes TEXT,
          custom_fields JSONB DEFAULT '{}',
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_visit_at TIMESTAMP WITH TIME ZONE
        );

        -- Customer Addresses
        CREATE TABLE IF NOT EXISTS customer_addresses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL DEFAULT 'home',
          is_default BOOLEAN DEFAULT false,
          street1 VARCHAR(255) NOT NULL,
          street2 VARCHAR(255),
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) NOT NULL DEFAULT 'US',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Customer Preferences
        CREATE TABLE IF NOT EXISTS customer_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          contact_method VARCHAR(20) DEFAULT 'email',
          marketing_opt_in BOOLEAN DEFAULT false,
          sms_opt_in BOOLEAN DEFAULT false,
          email_opt_in BOOLEAN DEFAULT false,
          push_notifications_opt_in BOOLEAN DEFAULT false,
          language VARCHAR(10) DEFAULT 'en',
          currency VARCHAR(3) DEFAULT 'USD',
          timezone VARCHAR(50) DEFAULT 'UTC',
          communication_frequency VARCHAR(20) DEFAULT 'weekly',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id)
        );

        -- Loyalty Programs
        CREATE TABLE IF NOT EXISTS loyalty_programs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          
          -- Point System
          points_per_dollar DECIMAL(5,2) DEFAULT 1.00,
          minimum_points_to_redeem INTEGER DEFAULT 100,
          point_value DECIMAL(5,4) DEFAULT 0.01, -- Value of 1 point in dollars
          points_expiration_days INTEGER,
          
          -- Configuration
          rules JSONB DEFAULT '[]',
          tier_requirements JSONB DEFAULT '{}',
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Customer Loyalty
        CREATE TABLE IF NOT EXISTS customer_loyalty (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
          tier VARCHAR(20) DEFAULT 'bronze',
          points DECIMAL(12,2) DEFAULT 0,
          total_points_earned DECIMAL(12,2) DEFAULT 0,
          total_points_redeemed DECIMAL(12,2) DEFAULT 0,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE,
          last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id, program_id)
        );

        -- Loyalty Transactions
        CREATE TABLE IF NOT EXISTS loyalty_transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
          transaction_id UUID, -- Reference to actual purchase transaction
          type VARCHAR(20) NOT NULL, -- earned, redeemed, expired, adjusted
          points DECIMAL(12,2) NOT NULL,
          description TEXT NOT NULL,
          reference VARCHAR(255),
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Customer Analytics
        CREATE TABLE IF NOT EXISTS customer_analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          segment VARCHAR(20) DEFAULT 'new',
          
          -- Transaction Analytics
          total_transactions INTEGER DEFAULT 0,
          total_spent DECIMAL(12,2) DEFAULT 0,
          average_order_value DECIMAL(12,2) DEFAULT 0,
          last_purchase_amount DECIMAL(12,2) DEFAULT 0,
          
          -- Visit Analytics
          total_visits INTEGER DEFAULT 0,
          average_visits_per_month DECIMAL(5,2) DEFAULT 0,
          days_since_last_visit INTEGER DEFAULT 0,
          
          -- Product Analytics
          favorite_category VARCHAR(255),
          favorite_product VARCHAR(255),
          most_purchased_products TEXT[] DEFAULT ARRAY[]::TEXT[],
          
          -- Behavior Analytics
          average_session_duration INTEGER DEFAULT 0, -- in minutes
          preferred_shopping_time VARCHAR(20), -- morning, afternoon, evening
          preferred_shopping_day VARCHAR(20), -- monday, weekend, etc.
          
          -- Engagement Analytics
          email_open_rate DECIMAL(5,4) DEFAULT 0,
          sms_click_rate DECIMAL(5,4) DEFAULT 0,
          loyalty_engagement DECIMAL(5,4) DEFAULT 0,
          
          -- Risk Analytics
          churn_risk VARCHAR(10) DEFAULT 'low', -- low, medium, high
          lifetime_value DECIMAL(12,2) DEFAULT 0,
          predicted_value DECIMAL(12,2) DEFAULT 0,
          
          calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id)
        );

        -- Customer Segments
        CREATE TABLE IF NOT EXISTS customer_segment_rules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          segment VARCHAR(20) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          criteria JSONB NOT NULL DEFAULT '[]',
          auto_assign BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Marketing Campaigns
        CREATE TABLE IF NOT EXISTS marketing_campaigns (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(20) NOT NULL, -- email, sms, push, direct_mail
          
          -- Targeting
          target_segments TEXT[] DEFAULT ARRAY[]::TEXT[],
          target_customers UUID[] DEFAULT ARRAY[]::UUID[],
          
          -- Content
          subject VARCHAR(500),
          content TEXT NOT NULL,
          template_id UUID,
          
          -- Scheduling
          scheduled_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sent, cancelled
          
          -- Results
          sent INTEGER DEFAULT 0,
          delivered INTEGER DEFAULT 0,
          opened INTEGER DEFAULT 0,
          clicked INTEGER DEFAULT 0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Customer Events (for tracking customer interactions)
        CREATE TABLE IF NOT EXISTS customer_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          store_id UUID NOT NULL,
          type VARCHAR(50) NOT NULL, -- created, updated, purchased, visited, etc.
          data JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Customer Webhooks
        CREATE TABLE IF NOT EXISTS customer_webhooks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          url VARCHAR(500) NOT NULL,
          events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          is_active BOOLEAN DEFAULT true,
          secret VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await this.query(`
        -- Customer indexes
        CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
        CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
        CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
        CREATE INDEX IF NOT EXISTS idx_customers_last_visit_at ON customers(last_visit_at);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_store_email ON customers(store_id, email) WHERE email IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_store_phone ON customers(store_id, phone) WHERE phone IS NOT NULL;

        -- Customer Address indexes
        CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_addresses_type ON customer_addresses(type);
        CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);

        -- Customer Preferences indexes
        CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);
        
        -- Loyalty indexes
        CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store_id ON loyalty_programs(store_id);
        CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_loyalty_program_id ON customer_loyalty(program_id);
        CREATE INDEX IF NOT EXISTS idx_customer_loyalty_tier ON customer_loyalty(tier);
        
        -- Loyalty Transaction indexes
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON loyalty_transactions(customer_id);
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_program_id ON loyalty_transactions(program_id);
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
        
        -- Analytics indexes
        CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer_id ON customer_analytics(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_analytics_segment ON customer_analytics(segment);
        CREATE INDEX IF NOT EXISTS idx_customer_analytics_total_spent ON customer_analytics(total_spent);
        CREATE INDEX IF NOT EXISTS idx_customer_analytics_churn_risk ON customer_analytics(churn_risk);
        
        -- Events indexes
        CREATE INDEX IF NOT EXISTS idx_customer_events_customer_id ON customer_events(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_events_store_id ON customer_events(store_id);
        CREATE INDEX IF NOT EXISTS idx_customer_events_type ON customer_events(type);
        CREATE INDEX IF NOT EXISTS idx_customer_events_created_at ON customer_events(created_at);
        
        -- Campaign indexes
        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_store_id ON marketing_campaigns(store_id);
        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_at ON marketing_campaigns(scheduled_at);
      `);

      // Create triggers for updated_at
      await this.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
        CREATE TRIGGER update_customers_updated_at
          BEFORE UPDATE ON customers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
        CREATE TRIGGER update_customer_addresses_updated_at
          BEFORE UPDATE ON customer_addresses
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_preferences_updated_at ON customer_preferences;
        CREATE TRIGGER update_customer_preferences_updated_at
          BEFORE UPDATE ON customer_preferences
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_loyalty_programs_updated_at ON loyalty_programs;
        CREATE TRIGGER update_loyalty_programs_updated_at
          BEFORE UPDATE ON loyalty_programs
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_loyalty_updated_at ON customer_loyalty;
        CREATE TRIGGER update_customer_loyalty_updated_at
          BEFORE UPDATE ON customer_loyalty
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_analytics_updated_at ON customer_analytics;
        CREATE TRIGGER update_customer_analytics_updated_at
          BEFORE UPDATE ON customer_analytics
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_segment_rules_updated_at ON customer_segment_rules;
        CREATE TRIGGER update_customer_segment_rules_updated_at
          BEFORE UPDATE ON customer_segment_rules
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
        CREATE TRIGGER update_marketing_campaigns_updated_at
          BEFORE UPDATE ON marketing_campaigns
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_customer_webhooks_updated_at ON customer_webhooks;
        CREATE TRIGGER update_customer_webhooks_updated_at
          BEFORE UPDATE ON customer_webhooks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      // Create functions for automatic customer number generation
      await this.query(`
        CREATE OR REPLACE FUNCTION generate_customer_number(store_uuid UUID)
        RETURNS TEXT AS $$
        DECLARE
          next_number INTEGER;
          customer_number TEXT;
        BEGIN
          -- Get the next customer number for this store
          SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM 'CX([0-9]+)$') AS INTEGER)), 0) + 1
          INTO next_number
          FROM customers 
          WHERE store_id = store_uuid 
          AND customer_number ~ '^CX[0-9]+$';
          
          -- Format with leading zeros
          customer_number := 'CX' || LPAD(next_number::TEXT, 6, '0');
          
          RETURN customer_number;
        END;
        $$ LANGUAGE plpgsql;

        -- Trigger to auto-generate customer number
        CREATE OR REPLACE FUNCTION set_customer_number()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
            NEW.customer_number := generate_customer_number(NEW.store_id);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_set_customer_number ON customers;
        CREATE TRIGGER trigger_set_customer_number
          BEFORE INSERT ON customers
          FOR EACH ROW EXECUTE FUNCTION set_customer_number();
      `);

      logger.info('Customer service database schema created successfully');
    } catch (error) {
      logger.error('Error creating customer service database schema:', error);
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

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const databaseService = new DatabaseService();