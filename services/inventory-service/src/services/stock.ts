import { v4 as uuidv4 } from 'uuid';
import { getDatabaseService } from './database';
import { logger } from '../utils/logger';
import {
  StockLevel,
  StockMovement,
  StockAdjustmentDto,
  InventoryAlert
} from '../models/types';

export class StockService {
  private db = getDatabaseService();

  async getStockLevel(productId: string, storeId: string, locationId?: string): Promise<StockLevel | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM stock_levels 
        WHERE product_id = $1 AND store_id = $2 AND ($3::uuid IS NULL OR location_id = $3)
      `, [productId, storeId, locationId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToStockLevel(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get stock level', { error: error.message, productId, storeId, locationId });
      throw error;
    }
  }

  async getStockLevels(storeId: string, locationId?: string): Promise<StockLevel[]> {
    try {
      const result = await this.db.query(`
        SELECT sl.*, p.name as product_name, p.sku as product_sku
        FROM stock_levels sl
        JOIN products p ON sl.product_id = p.id
        WHERE sl.store_id = $1 AND ($2::uuid IS NULL OR sl.location_id = $2)
        ORDER BY p.name
      `, [storeId, locationId]);

      return result.rows.map((row: any) => this.mapRowToStockLevel(row));
    } catch (error: any) {
      logger.error('Failed to get stock levels', { error: error.message, storeId, locationId });
      throw error;
    }
  }

  async getLowStockProducts(storeId: string): Promise<StockLevel[]> {
    try {
      const result = await this.db.query(`
        SELECT sl.*, p.name as product_name, p.sku as product_sku, p.min_stock_level
        FROM stock_levels sl
        JOIN products p ON sl.product_id = p.id
        WHERE sl.store_id = $1 
          AND p.track_stock = true 
          AND sl.quantity <= p.min_stock_level
        ORDER BY (sl.quantity - p.min_stock_level), p.name
      `, [storeId]);

      return result.rows.map((row: any) => this.mapRowToStockLevel(row));
    } catch (error: any) {
      logger.error('Failed to get low stock products', { error: error.message, storeId });
      throw error;
    }
  }

  async adjustStock(storeId: string, adjustment: StockAdjustmentDto, userId: string): Promise<StockMovement> {
    try {
      return await this.db.transaction(async (client) => {
        // Get current stock level
        const stockResult = await client.query(`
          SELECT * FROM stock_levels 
          WHERE product_id = $1 AND store_id = $2
        `, [adjustment.productId, storeId]);

        let currentQuantity = 0;
        if (stockResult.rows.length > 0) {
          currentQuantity = stockResult.rows[0].quantity;
        }

        // Calculate new quantity based on adjustment type
        let newQuantity = currentQuantity;
        let adjustmentQuantity = adjustment.quantity;

        switch (adjustment.type) {
          case 'in':
            newQuantity = currentQuantity + adjustment.quantity;
            break;
          case 'out':
            newQuantity = currentQuantity - adjustment.quantity;
            adjustmentQuantity = -adjustment.quantity; // Make it negative for movement record
            break;
          case 'adjustment':
            newQuantity = adjustment.quantity; // Set to exact quantity
            adjustmentQuantity = adjustment.quantity - currentQuantity;
            break;
        }

        // Validate non-negative stock
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock. Current: ${currentQuantity}, Requested: ${adjustment.quantity}`);
        }

        // Update or create stock level
        if (stockResult.rows.length > 0) {
          await client.query(`
            UPDATE stock_levels 
            SET quantity = $1, unit_cost = COALESCE($2, unit_cost), updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $3 AND store_id = $4
          `, [newQuantity, adjustment.unitCost, adjustment.productId, storeId]);
        } else {
          await client.query(`
            INSERT INTO stock_levels (product_id, store_id, quantity, unit_cost)
            VALUES ($1, $2, $3, $4)
          `, [adjustment.productId, storeId, newQuantity, adjustment.unitCost || 0]);
        }

        // Create stock movement record
        const movementId = uuidv4();
        const totalCost = adjustment.unitCost ? adjustment.unitCost * Math.abs(adjustmentQuantity) : null;

        const movementResult = await client.query(`
          INSERT INTO stock_movements (
            id, product_id, store_id, type, reason, quantity, unit_cost, total_cost,
            previous_quantity, new_quantity, notes, performed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          movementId, adjustment.productId, storeId, adjustment.type, adjustment.reason,
          adjustmentQuantity, adjustment.unitCost, totalCost, currentQuantity, newQuantity,
          adjustment.notes, userId
        ]);

        // Update product stock quantity
        await client.query(`
          UPDATE products 
          SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND store_id = $3
        `, [newQuantity, adjustment.productId, storeId]);

        // Check for low stock alerts
        await this.checkLowStockAlert(client, adjustment.productId, storeId, newQuantity);

        logger.info('Stock adjusted successfully', {
          productId: adjustment.productId,
          storeId,
          type: adjustment.type,
          quantity: adjustmentQuantity,
          newQuantity
        });

        return this.mapRowToStockMovement(movementResult.rows[0]);
      });
    } catch (error: any) {
      logger.error('Failed to adjust stock', { error: error.message, storeId, adjustment });
      throw error;
    }
  }

  async reserveStock(productId: string, storeId: string, quantity: number): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE stock_levels 
        SET reserved_quantity = reserved_quantity + $1
        WHERE product_id = $2 AND store_id = $3 AND (quantity - reserved_quantity) >= $1
        RETURNING *
      `, [quantity, productId, storeId]);

      const success = result.rowCount > 0;
      logger.info('Stock reservation attempt', { productId, storeId, quantity, success });
      return success;
    } catch (error: any) {
      logger.error('Failed to reserve stock', { error: error.message, productId, storeId, quantity });
      throw error;
    }
  }

  async releaseReservedStock(productId: string, storeId: string, quantity: number): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stock_levels 
        SET reserved_quantity = GREATEST(0, reserved_quantity - $1)
        WHERE product_id = $2 AND store_id = $3
      `, [quantity, productId, storeId]);

      logger.info('Reserved stock released', { productId, storeId, quantity });
    } catch (error: any) {
      logger.error('Failed to release reserved stock', { error: error.message, productId, storeId, quantity });
      throw error;
    }
  }

  async getStockMovements(
    storeId: string,
    productId?: string,
    type?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ movements: StockMovement[], total: number }> {
    try {
      const whereConditions = ['store_id = $1'];
      const values: any[] = [storeId];
      let paramCount = 2;

      if (productId) {
        whereConditions.push(`product_id = $${paramCount}`);
        values.push(productId);
        paramCount++;
      }

      if (type) {
        whereConditions.push(`type = $${paramCount}`);
        values.push(type);
        paramCount++;
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) FROM stock_movements 
        WHERE ${whereConditions.join(' AND ')}
      `;

      // Main query
      const mainQuery = `
        SELECT sm.*, p.name as product_name, p.sku as product_sku
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY sm.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const [countResult, movementsResult] = await Promise.all([
        this.db.query(countQuery, values),
        this.db.query(mainQuery, [...values, limit, offset])
      ]);

      const movements = movementsResult.rows.map((row: any) => this.mapRowToStockMovement(row));
      const total = parseInt(countResult.rows[0].count);

      return { movements, total };
    } catch (error: any) {
      logger.error('Failed to get stock movements', { error: error.message, storeId, productId, type });
      throw error;
    }
  }

  async getInventoryValue(storeId: string): Promise<{ totalValue: number, productCount: number }> {
    try {
      const result = await this.db.query(`
        SELECT 
          COALESCE(SUM(sl.total_value), 0) as total_value,
          COUNT(DISTINCT sl.product_id) as product_count
        FROM stock_levels sl
        JOIN products p ON sl.product_id = p.id
        WHERE sl.store_id = $1 AND p.status = 'active'
      `, [storeId]);

      const { total_value, product_count } = result.rows[0];
      return {
        totalValue: parseFloat(total_value || 0),
        productCount: parseInt(product_count || 0)
      };
    } catch (error: any) {
      logger.error('Failed to get inventory value', { error: error.message, storeId });
      throw error;
    }
  }

  async getInventoryAlerts(storeId: string, status?: string): Promise<InventoryAlert[]> {
    try {
      const whereConditions = ['store_id = $1'];
      const values: any[] = [storeId];

      if (status) {
        whereConditions.push('status = $2');
        values.push(status);
      }

      const result = await this.db.query(`
        SELECT * FROM inventory_alerts 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY severity DESC, created_at DESC
      `, values);

      return result.rows.map((row: any) => this.mapRowToInventoryAlert(row));
    } catch (error: any) {
      logger.error('Failed to get inventory alerts', { error: error.message, storeId, status });
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, storeId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE inventory_alerts 
        SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND store_id = $3 AND status = 'active'
        RETURNING *
      `, [userId, alertId, storeId]);

      const success = result.rowCount > 0;
      logger.info('Alert acknowledged', { alertId, storeId, userId, success });
      return success;
    } catch (error: any) {
      logger.error('Failed to acknowledge alert', { error: error.message, alertId, storeId, userId });
      throw error;
    }
  }

  private async checkLowStockAlert(client: any, productId: string, storeId: string, currentQuantity: number): Promise<void> {
    try {
      // Get product details
      const productResult = await client.query(`
        SELECT name, min_stock_level, reorder_point, track_stock 
        FROM products 
        WHERE id = $1 AND store_id = $2
      `, [productId, storeId]);

      if (productResult.rows.length === 0 || !productResult.rows[0].track_stock) {
        return;
      }

      const { name, min_stock_level, reorder_point } = productResult.rows[0];

      // Check if alert already exists
      const existingAlert = await client.query(`
        SELECT id FROM inventory_alerts 
        WHERE product_id = $1 AND store_id = $2 AND type IN ('low_stock', 'out_of_stock') AND status = 'active'
      `, [productId, storeId]);

      // Determine alert type and severity
      let alertType: string | null = null;
      let severity: string = 'low';
      let message: string = '';

      if (currentQuantity === 0) {
        alertType = 'out_of_stock';
        severity = 'critical';
        message = `Product "${name}" is out of stock`;
      } else if (currentQuantity <= reorder_point) {
        alertType = 'reorder_point';
        severity = 'high';
        message = `Product "${name}" has reached reorder point (${currentQuantity} remaining)`;
      } else if (currentQuantity <= min_stock_level) {
        alertType = 'low_stock';
        severity = 'medium';
        message = `Product "${name}" is running low (${currentQuantity} remaining)`;
      }

      if (alertType) {
        if (existingAlert.rows.length > 0) {
          // Update existing alert
          await client.query(`
            UPDATE inventory_alerts 
            SET type = $1, current_quantity = $2, severity = $3, message = $4, created_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [alertType, currentQuantity, severity, message, existingAlert.rows[0].id]);
        } else {
          // Create new alert
          const alertId = uuidv4();
          await client.query(`
            INSERT INTO inventory_alerts (
              id, store_id, type, product_id, product_name, current_quantity, 
              threshold, severity, message
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            alertId, storeId, alertType, productId, name, currentQuantity,
            alertType === 'reorder_point' ? reorder_point : min_stock_level,
            severity, message
          ]);
        }
      } else if (existingAlert.rows.length > 0) {
        // Resolve existing alerts if stock is now sufficient
        await client.query(`
          UPDATE inventory_alerts 
          SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [existingAlert.rows[0].id]);
      }
    } catch (error: any) {
      logger.error('Failed to check low stock alert', { error: error.message, productId, storeId });
      // Don't throw error as this is a background check
    }
  }

  // Helper mapping methods
  private mapRowToStockLevel(row: any): StockLevel {
    return {
      id: row.id,
      productId: row.product_id,
      storeId: row.store_id,
      locationId: row.location_id,
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity,
      availableQuantity: row.available_quantity,
      unitCost: parseFloat(row.unit_cost || 0),
      totalValue: parseFloat(row.total_value || 0),
      lastRestockDate: row.last_restock_date,
      lastSaleDate: row.last_sale_date,
      updatedAt: row.updated_at
    };
  }

  private mapRowToStockMovement(row: any): StockMovement {
    return {
      id: row.id,
      productId: row.product_id,
      storeId: row.store_id,
      locationId: row.location_id,
      type: row.type,
      reason: row.reason,
      quantity: row.quantity,
      unitCost: row.unit_cost ? parseFloat(row.unit_cost) : undefined,
      totalCost: row.total_cost ? parseFloat(row.total_cost) : undefined,
      previousQuantity: row.previous_quantity,
      newQuantity: row.new_quantity,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      notes: row.notes,
      performedBy: row.performed_by,
      createdAt: row.created_at
    };
  }

  private mapRowToInventoryAlert(row: any): InventoryAlert {
    return {
      id: row.id,
      storeId: row.store_id,
      type: row.type,
      productId: row.product_id,
      productName: row.product_name,
      currentQuantity: row.current_quantity,
      threshold: row.threshold,
      severity: row.severity,
      message: row.message,
      status: row.status,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
    };
  }
}