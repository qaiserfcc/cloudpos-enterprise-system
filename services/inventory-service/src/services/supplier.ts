import { v4 as uuidv4 } from 'uuid';
import { getDatabaseService } from './database';
import { logger } from '../utils/logger';
import {
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  CreateSupplierDto
} from '../models/types';

export class SupplierService {
  private db = getDatabaseService();

  async createSupplier(storeId: string, supplierData: CreateSupplierDto): Promise<Supplier> {
    try {
      const supplierId = uuidv4();

      // Check for duplicate supplier name within store
      const existingSupplier = await this.db.query(
        'SELECT id FROM suppliers WHERE store_id = $1 AND name = $2',
        [storeId, supplierData.name]
      );

      if (existingSupplier.rows.length > 0) {
        throw new Error(`Supplier with name '${supplierData.name}' already exists`);
      }

      const result = await this.db.query(`
        INSERT INTO suppliers (
          id, store_id, name, contact_person, email, phone, address,
          tax_id, payment_terms, credit_limit, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        supplierId, storeId, supplierData.name, supplierData.contactPerson,
        supplierData.email, supplierData.phone, JSON.stringify(supplierData.address),
        supplierData.taxId, supplierData.paymentTerms, supplierData.creditLimit,
        supplierData.notes
      ]);

      logger.info('Supplier created successfully', { supplierId, storeId, name: supplierData.name });
      return this.mapRowToSupplier(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to create supplier', { error: error.message, storeId, supplierData });
      throw error;
    }
  }

  async getSupplier(supplierId: string, storeId: string): Promise<Supplier | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM suppliers WHERE id = $1 AND store_id = $2',
        [supplierId, storeId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToSupplier(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get supplier', { error: error.message, supplierId, storeId });
      throw error;
    }
  }

  async getSuppliers(storeId: string, status?: string): Promise<Supplier[]> {
    try {
      const whereConditions = ['store_id = $1'];
      const values: any[] = [storeId];

      if (status) {
        whereConditions.push('status = $2');
        values.push(status);
      }

      const result = await this.db.query(`
        SELECT * FROM suppliers 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY name
      `, values);

      return result.rows.map((row: any) => this.mapRowToSupplier(row));
    } catch (error: any) {
      logger.error('Failed to get suppliers', { error: error.message, storeId, status });
      throw error;
    }
  }

  async updateSupplier(supplierId: string, storeId: string, updateData: Partial<CreateSupplierDto>): Promise<Supplier> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbColumn = this.camelToSnake(key);
          if (key === 'address') {
            updateFields.push(`${dbColumn} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${dbColumn} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      values.push(supplierId, storeId);

      const result = await this.db.query(`
        UPDATE suppliers 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount - 1} AND store_id = $${paramCount}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        throw new Error('Supplier not found');
      }

      logger.info('Supplier updated successfully', { supplierId, storeId, updateData });
      return this.mapRowToSupplier(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to update supplier', { error: error.message, supplierId, storeId, updateData });
      throw error;
    }
  }

  async deleteSupplier(supplierId: string, storeId: string): Promise<boolean> {
    try {
      // Check if supplier has any purchase orders
      const poCheck = await this.db.query(
        'SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = $1',
        [supplierId]
      );

      if (parseInt(poCheck.rows[0].count) > 0) {
        // Mark as inactive instead of deleting
        await this.db.query(
          'UPDATE suppliers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3',
          ['inactive', supplierId, storeId]
        );
        logger.info('Supplier marked as inactive instead of deleted', { supplierId, storeId });
        return true;
      }

      const result = await this.db.query(
        'DELETE FROM suppliers WHERE id = $1 AND store_id = $2',
        [supplierId, storeId]
      );

      const deleted = result.rowCount > 0;
      logger.info('Supplier deleted', { supplierId, storeId, deleted });
      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete supplier', { error: error.message, supplierId, storeId });
      throw error;
    }
  }

  // Purchase Order Management
  async createPurchaseOrder(
    storeId: string,
    supplierId: string,
    orderData: {
      orderNumber?: string;
      expectedDeliveryDate?: Date;
      items: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
      }>;
      shippingCost?: number;
      discount?: number;
      notes?: string;
    },
    userId: string
  ): Promise<PurchaseOrder> {
    try {
      return await this.db.transaction(async (client) => {
        const orderId = uuidv4();
        const orderNumber = orderData.orderNumber || `PO-${Date.now()}`;

        // Calculate totals
        let subtotal = 0;
        const items: PurchaseOrderItem[] = [];

        for (const item of orderData.items) {
          // Get product details
          const productResult = await client.query(
            'SELECT name, sku FROM products WHERE id = $1 AND store_id = $2',
            [item.productId, storeId]
          );

          if (productResult.rows.length === 0) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }

          const product = productResult.rows[0];
          const totalCost = item.quantity * item.unitCost;
          subtotal += totalCost;

          items.push({
            id: uuidv4(),
            purchaseOrderId: orderId,
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: totalCost
          });
        }

        const taxAmount = 0; // Can be calculated based on tax rules
        const shippingCost = orderData.shippingCost || 0;
        const discount = orderData.discount || 0;
        const totalAmount = subtotal + taxAmount + shippingCost - discount;

        // Create purchase order
        const poResult = await client.query(`
          INSERT INTO purchase_orders (
            id, store_id, supplier_id, order_number, order_date, expected_delivery_date,
            subtotal, tax_amount, shipping_cost, discount, total_amount, notes,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          orderId, storeId, supplierId, orderNumber, new Date(), orderData.expectedDeliveryDate,
          subtotal, taxAmount, shippingCost, discount, totalAmount, orderData.notes,
          userId, userId
        ]);

        // Create purchase order items
        for (const item of items) {
          await client.query(`
            INSERT INTO purchase_order_items (
              id, purchase_order_id, product_id, product_name, product_sku,
              quantity, unit_cost, total_cost
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            item.id, item.purchaseOrderId, item.productId, item.productName,
            item.productSku, item.quantity, item.unitCost, item.totalCost
          ]);
        }

        logger.info('Purchase order created successfully', { orderId, storeId, supplierId, orderNumber });

        const purchaseOrder = this.mapRowToPurchaseOrder(poResult.rows[0]);
        purchaseOrder.items = items;
        return purchaseOrder;
      });
    } catch (error: any) {
      logger.error('Failed to create purchase order', { error: error.message, storeId, supplierId, orderData });
      throw error;
    }
  }

  async getPurchaseOrder(orderId: string, storeId: string): Promise<PurchaseOrder | null> {
    try {
      const [poResult, itemsResult] = await Promise.all([
        this.db.query(
          'SELECT * FROM purchase_orders WHERE id = $1 AND store_id = $2',
          [orderId, storeId]
        ),
        this.db.query(
          'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY product_name',
          [orderId]
        )
      ]);

      if (poResult.rows.length === 0) {
        return null;
      }

      const purchaseOrder = this.mapRowToPurchaseOrder(poResult.rows[0]);
      purchaseOrder.items = itemsResult.rows.map((row: any) => this.mapRowToPurchaseOrderItem(row));

      return purchaseOrder;
    } catch (error: any) {
      logger.error('Failed to get purchase order', { error: error.message, orderId, storeId });
      throw error;
    }
  }

  async getPurchaseOrders(
    storeId: string,
    supplierId?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ orders: PurchaseOrder[], total: number }> {
    try {
      const whereConditions = ['store_id = $1'];
      const values: any[] = [storeId];
      let paramCount = 2;

      if (supplierId) {
        whereConditions.push(`supplier_id = $${paramCount}`);
        values.push(supplierId);
        paramCount++;
      }

      if (status) {
        whereConditions.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      const countQuery = `
        SELECT COUNT(*) FROM purchase_orders 
        WHERE ${whereConditions.join(' AND ')}
      `;

      const mainQuery = `
        SELECT po.*, s.name as supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY po.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const [countResult, ordersResult] = await Promise.all([
        this.db.query(countQuery, values),
        this.db.query(mainQuery, [...values, limit, offset])
      ]);

      const orders = ordersResult.rows.map((row: any) => this.mapRowToPurchaseOrder(row));
      const total = parseInt(countResult.rows[0].count);

      return { orders, total };
    } catch (error: any) {
      logger.error('Failed to get purchase orders', { error: error.message, storeId, supplierId, status });
      throw error;
    }
  }

  async updatePurchaseOrderStatus(orderId: string, storeId: string, status: string, userId: string): Promise<PurchaseOrder> {
    try {
      const result = await this.db.query(`
        UPDATE purchase_orders 
        SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND store_id = $4
        RETURNING *
      `, [status, userId, orderId, storeId]);

      if (result.rows.length === 0) {
        throw new Error('Purchase order not found');
      }

      logger.info('Purchase order status updated', { orderId, storeId, status });
      return this.mapRowToPurchaseOrder(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to update purchase order status', { error: error.message, orderId, storeId, status });
      throw error;
    }
  }

  // Helper mapping methods
  private mapRowToSupplier(row: any): Supplier {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address ? JSON.parse(row.address) : undefined,
      taxId: row.tax_id,
      paymentTerms: row.payment_terms,
      creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
      status: row.status,
      rating: row.rating,
      notes: row.notes,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToPurchaseOrder(row: any): PurchaseOrder {
    return {
      id: row.id,
      storeId: row.store_id,
      supplierId: row.supplier_id,
      orderNumber: row.order_number,
      status: row.status,
      orderDate: row.order_date,
      expectedDeliveryDate: row.expected_delivery_date,
      actualDeliveryDate: row.actual_delivery_date,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      shippingCost: parseFloat(row.shipping_cost || 0),
      discount: parseFloat(row.discount || 0),
      totalAmount: parseFloat(row.total_amount),
      currency: row.currency,
      notes: row.notes,
      items: [], // Will be populated separately
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToPurchaseOrderItem(row: any): PurchaseOrderItem {
    return {
      id: row.id,
      purchaseOrderId: row.purchase_order_id,
      productId: row.product_id,
      productName: row.product_name,
      productSku: row.product_sku,
      quantity: row.quantity,
      unitCost: parseFloat(row.unit_cost),
      totalCost: parseFloat(row.total_cost),
      receivedQuantity: row.received_quantity,
      notes: row.notes
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}