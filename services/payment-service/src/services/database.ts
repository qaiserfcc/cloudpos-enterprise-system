import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/payment_service',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
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
        
        -- Payment Gateways Configuration
        CREATE TABLE IF NOT EXISTS payment_gateways (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          gateway VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          credentials JSONB NOT NULL, -- Encrypted gateway credentials
          webhook_url VARCHAR(500),
          webhook_secret VARCHAR(255),
          supported_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
          supported_currencies TEXT[] DEFAULT ARRAY[]::TEXT[],
          configuration JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, gateway)
        );

        -- Payment Intents
        CREATE TABLE IF NOT EXISTS payment_intents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          customer_id UUID,
          amount DECIMAL(12, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          description TEXT,
          metadata JSONB DEFAULT '{}',
          payment_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          client_secret VARCHAR(255),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Payments
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          transaction_id UUID,
          customer_id UUID,
          payment_intent_id UUID REFERENCES payment_intents(id),
          gateway_id UUID REFERENCES payment_gateways(id),
          gateway VARCHAR(50) NOT NULL,
          method VARCHAR(50) NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'payment',
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          amount DECIMAL(12, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          description TEXT,
          metadata JSONB DEFAULT '{}',
          gateway_transaction_id VARCHAR(255),
          gateway_response JSONB DEFAULT '{}',
          failure_reason TEXT,
          processed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Refunds
        CREATE TABLE IF NOT EXISTS refunds (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          payment_id UUID NOT NULL REFERENCES payments(id),
          store_id UUID NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          reason VARCHAR(100) NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          gateway_refund_id VARCHAR(255),
          gateway_response JSONB DEFAULT '{}',
          processed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Payment Sessions (for multi-step payments)
        CREATE TABLE IF NOT EXISTS payment_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          customer_id UUID,
          items JSONB NOT NULL,
          total_amount DECIMAL(12, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          gateway VARCHAR(50) NOT NULL,
          method VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          session_data JSONB DEFAULT '{}',
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Webhook Events
        CREATE TABLE IF NOT EXISTS webhook_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          gateway VARCHAR(50) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          event_id VARCHAR(255) NOT NULL,
          data JSONB NOT NULL,
          signature VARCHAR(500),
          processed BOOLEAN DEFAULT false,
          processed_at TIMESTAMP WITH TIME ZONE,
          retry_count INTEGER DEFAULT 0,
          last_retry_at TIMESTAMP WITH TIME ZONE,
          received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(gateway, event_id)
        );

        -- Payment Analytics (Daily aggregations)
        CREATE TABLE IF NOT EXISTS payment_analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          date DATE NOT NULL,
          total_transactions INTEGER DEFAULT 0,
          total_amount DECIMAL(12, 2) DEFAULT 0,
          successful_transactions INTEGER DEFAULT 0,
          failed_transactions INTEGER DEFAULT 0,
          refund_amount DECIMAL(12, 2) DEFAULT 0,
          average_transaction_amount DECIMAL(12, 2) DEFAULT 0,
          payment_methods_stats JSONB DEFAULT '{}',
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(store_id, date, currency)
        );

        -- Security Audit Logs
        CREATE TABLE IF NOT EXISTS security_audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          store_id UUID NOT NULL,
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          resource VARCHAR(100) NOT NULL,
          resource_id UUID,
          ip_address INET NOT NULL,
          user_agent TEXT,
          success BOOLEAN NOT NULL,
          failure_reason TEXT,
          additional_data JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Encrypted Data Storage
        CREATE TABLE IF NOT EXISTS encrypted_data (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key_id VARCHAR(100) NOT NULL,
          encrypted_value TEXT NOT NULL,
          algorithm VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await this.query(`
        -- Payment Intents indexes
        CREATE INDEX IF NOT EXISTS idx_payment_intents_store_id ON payment_intents(store_id);
        CREATE INDEX IF NOT EXISTS idx_payment_intents_customer_id ON payment_intents(customer_id);
        CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
        CREATE INDEX IF NOT EXISTS idx_payment_intents_expires_at ON payment_intents(expires_at);

        -- Payments indexes
        CREATE INDEX IF NOT EXISTS idx_payments_store_id ON payments(store_id);
        CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
        CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
        CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);

        -- Refunds indexes
        CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
        CREATE INDEX IF NOT EXISTS idx_refunds_store_id ON refunds(store_id);
        CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

        -- Payment Sessions indexes
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_store_id ON payment_sessions(store_id);
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_customer_id ON payment_sessions(customer_id);
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires_at ON payment_sessions(expires_at);

        -- Webhook Events indexes
        CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway ON webhook_events(gateway);
        CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
        CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);

        -- Analytics indexes
        CREATE INDEX IF NOT EXISTS idx_payment_analytics_store_date ON payment_analytics(store_id, date);
        CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);

        -- Security Audit indexes
        CREATE INDEX IF NOT EXISTS idx_security_audit_store_id ON security_audit_logs(store_id);
        CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_security_audit_action ON security_audit_logs(action);
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

        DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON payment_gateways;
        CREATE TRIGGER update_payment_gateways_updated_at
          BEFORE UPDATE ON payment_gateways
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_payment_intents_updated_at ON payment_intents;
        CREATE TRIGGER update_payment_intents_updated_at
          BEFORE UPDATE ON payment_intents
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
        CREATE TRIGGER update_payments_updated_at
          BEFORE UPDATE ON payments
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
        CREATE TRIGGER update_refunds_updated_at
          BEFORE UPDATE ON refunds
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_payment_sessions_updated_at ON payment_sessions;
        CREATE TRIGGER update_payment_sessions_updated_at
          BEFORE UPDATE ON payment_sessions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_payment_analytics_updated_at ON payment_analytics;
        CREATE TRIGGER update_payment_analytics_updated_at
          BEFORE UPDATE ON payment_analytics
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      logger.info('Payment service database schema created successfully');
    } catch (error) {
      logger.error('Error creating payment service database schema:', error);
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