import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Database pool error', { error: err.message });
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.createTables();
      this.isConnected = true;
      logger.info('Database initialized successfully');
    } catch (error: any) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
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

  async isHealthy(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error: any) {
      logger.error('Error disconnecting from database', { error: error.message });
    }
  }

  private async createTables(): Promise<void> {
    const createTablesSQL = `
      -- Product Categories Table
      CREATE TABLE IF NOT EXISTS product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
        level INTEGER NOT NULL DEFAULT 0,
        path TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, name, parent_id)
      );

      -- Products Table
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(255) NOT NULL,
        barcode VARCHAR(255),
        category_id UUID REFERENCES product_categories(id) ON DELETE RESTRICT,
        brand VARCHAR(255),
        unit_price DECIMAL(12,2) NOT NULL,
        cost_price DECIMAL(12,2) NOT NULL,
        taxable BOOLEAN DEFAULT true,
        tax_rate DECIMAL(5,2),
        track_stock BOOLEAN DEFAULT true,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        max_stock_level INTEGER,
        reorder_point INTEGER DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'piece',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
        image_url TEXT,
        weight DECIMAL(10,3),
        dimensions JSONB,
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        UNIQUE(store_id, sku),
        UNIQUE(barcode) WHERE barcode IS NOT NULL
      );

      -- Stock Levels Table
      CREATE TABLE IF NOT EXISTS stock_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id UUID NOT NULL,
        location_id UUID,
        quantity INTEGER NOT NULL DEFAULT 0,
        reserved_quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
        unit_cost DECIMAL(12,2),
        total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
        last_restock_date TIMESTAMP WITH TIME ZONE,
        last_sale_date TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, store_id, location_id)
      );

      -- Stock Movements Table
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id UUID NOT NULL,
        location_id UUID,
        type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer', 'return', 'damaged', 'expired')),
        reason VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(12,2),
        total_cost DECIMAL(12,2),
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        notes TEXT,
        performed_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Suppliers Table
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address JSONB,
        tax_id VARCHAR(100),
        payment_terms VARCHAR(255),
        credit_limit DECIMAL(12,2),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, name)
      );

      -- Purchase Orders Table
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
        order_number VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        subtotal DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        shipping_cost DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        notes TEXT,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, order_number)
      );

      -- Purchase Order Items Table
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(12,2) NOT NULL,
        total_cost DECIMAL(12,2) NOT NULL,
        received_quantity INTEGER DEFAULT 0,
        notes TEXT
      );

      -- Inventory Alerts Table
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('low_stock', 'out_of_stock', 'overstock', 'expired', 'reorder_point')),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        current_quantity INTEGER NOT NULL,
        threshold INTEGER,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
        acknowledged_by UUID,
        acknowledged_at TIMESTAMP WITH TIME ZONE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('english', name));
      
      CREATE INDEX IF NOT EXISTS idx_stock_levels_product_id ON stock_levels(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_levels_store_id ON stock_levels(store_id);
      
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_store_id ON stock_movements(store_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON suppliers(store_id);
      CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
      
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_store_id ON purchase_orders(store_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
      
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_store_id ON inventory_alerts(store_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);

      -- Create triggers for updated_at timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Apply triggers to tables that need updated_at maintenance
      DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
      CREATE TRIGGER update_product_categories_updated_at
        BEFORE UPDATE ON product_categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_products_updated_at ON products;
      CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_stock_levels_updated_at ON stock_levels;
      CREATE TRIGGER update_stock_levels_updated_at
        BEFORE UPDATE ON stock_levels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
      CREATE TRIGGER update_suppliers_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
      CREATE TRIGGER update_purchase_orders_updated_at
        BEFORE UPDATE ON purchase_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await this.query(createTablesSQL);
    logger.info('Database tables created successfully');
  }
}

// Create singleton instance
let dbInstance: DatabaseService | null = null;

export const createDatabaseService = (config: DatabaseConfig): DatabaseService => {
  if (!dbInstance) {
    dbInstance = new DatabaseService(config);
  }
  return dbInstance;
};

export const getDatabaseService = (): DatabaseService => {
  if (!dbInstance) {
    throw new Error('Database service not initialized. Call createDatabaseService first.');
  }
  return dbInstance;
};