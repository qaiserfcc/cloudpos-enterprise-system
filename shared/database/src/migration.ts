import fs from 'fs';
import path from 'path';
import { pgPool } from './connection';

export class MigrationManager {
  private static migrationsPath = path.join(__dirname, '../migrations');
  private static migrationTableName = 'schema_migrations';

  /**
   * Initialize migration tracking table
   */
  static async initialize(): Promise<void> {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Get list of executed migrations
   */
  static async getExecutedMigrations(): Promise<string[]> {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT filename FROM ${this.migrationTableName} ORDER BY executed_at`
      );
      return result.rows.map(row => row.filename);
    } finally {
      client.release();
    }
  }

  /**
   * Get list of available migration files
   */
  static getAvailableMigrations(): string[] {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }
    
    return fs
      .readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Get pending migrations
   */
  static async getPendingMigrations(): Promise<string[]> {
    const executed = await this.getExecutedMigrations();
    const available = this.getAvailableMigrations();
    
    return available.filter(migration => !executed.includes(migration));
  }

  /**
   * Execute a single migration
   */
  static async executeMigration(filename: string): Promise<void> {
    const migrationPath = path.join(this.migrationsPath, filename);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute migration SQL
      await client.query(sql);
      
      // Record migration as executed
      await client.query(
        `INSERT INTO ${this.migrationTableName} (filename) VALUES ($1)`,
        [filename]
      );
      
      await client.query('COMMIT');
      console.log(`Migration executed: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  static async migrate(): Promise<void> {
    await this.initialize();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('All migrations completed successfully');
  }

  /**
   * Check migration status
   */
  static async status(): Promise<{
    executed: string[];
    pending: string[];
  }> {
    await this.initialize();
    
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    
    return { executed, pending };
  }

  /**
   * Reset database (WARNING: This will drop all tables!)
   */
  static async reset(): Promise<void> {
    const client = await pgPool.connect();
    
    try {
      console.log('WARNING: Resetting database - this will drop all tables!');
      
      // Get all table names
      const result = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename != 'schema_migrations'
      `);
      
      const tables = result.rows.map(row => row.tablename);
      
      if (tables.length > 0) {
        await client.query('BEGIN');
        
        // Drop all tables
        for (const table of tables) {
          await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
        
        // Clear migration history
        await client.query(`DELETE FROM ${this.migrationTableName}`);
        
        await client.query('COMMIT');
        console.log(`Dropped ${tables.length} tables`);
      } else {
        console.log('No tables to drop');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default MigrationManager;