import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { dbService } from './database';
import { redisService } from './redis';
import { cartService } from './cart';
import { logger } from '../utils/logger';

export interface Transaction {
  id: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  type: 'sale' | 'return' | 'void';
  status: 'pending' | 'completed' | 'failed' | 'voided';
  cartId?: string;
  items: TransactionItem[];
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  total: string;
  paymentMethod: string;
  paymentReference?: string;
  receiptNumber: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  taxRate: string;
  subtotal: string;
  tax: string;
  total: string;
  metadata?: Record<string, any>;
}

export interface CreateTransactionData {
  storeId: string;
  cashierId: string;
  customerId?: string;
  type: 'sale' | 'return' | 'void';
  cartId?: string;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentData {
  transactionId: string;
  paymentMethod: string;
  amount: string;
  paymentReference?: string;
  metadata?: Record<string, any>;
}

export class TransactionService {

  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    try {
      const transactionId = uuidv4();
      const receiptNumber = await this.generateReceiptNumber(data.storeId);
      const now = new Date();

      let items: TransactionItem[] = [];
      let subtotal = '0.00';
      let totalDiscount = '0.00';
      let totalTax = '0.00';
      let total = '0.00';

      // If cartId is provided, get items from cart
      if (data.cartId) {
        const cart = await cartService.getCart(data.cartId);
        if (!cart) {
          throw new Error('Cart not found');
        }

        items = cart.items.map(item => ({
          id: uuidv4(),
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          subtotal: item.subtotal,
          tax: item.tax,
          total: item.total,
          metadata: item.metadata
        }));

        subtotal = cart.subtotal;
        totalDiscount = cart.totalDiscount;
        totalTax = cart.totalTax;
        total = cart.total;
      }

      const transaction: Transaction = {
        id: transactionId,
        storeId: data.storeId,
        cashierId: data.cashierId,
        customerId: data.customerId,
        type: data.type,
        status: 'pending',
        cartId: data.cartId,
        items,
        subtotal,
        totalDiscount,
        totalTax,
        total,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        receiptNumber,
        notes: data.notes,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now
      };

      // Save to database
      await this.saveTransactionToDatabase(transaction);

      logger.info('Transaction created', { 
        transactionId, 
        storeId: data.storeId, 
        total, 
        type: data.type 
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to create transaction', { error, data });
      throw error;
    }
  }

  async processPayment(paymentData: ProcessPaymentData): Promise<Transaction> {
    try {
      // Acquire lock to prevent concurrent processing
      const lockAcquired = await redisService.acquireLock(
        `transaction_payment:${paymentData.transactionId}`, 
        30
      );

      if (!lockAcquired) {
        throw new Error('Transaction is being processed by another request');
      }

      try {
        const transaction = await this.getTransaction(paymentData.transactionId);
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        if (transaction.status !== 'pending') {
          throw new Error(`Transaction cannot be processed. Current status: ${transaction.status}`);
        }

        // Validate payment amount
        const expectedAmount = new Decimal(transaction.total);
        const paymentAmount = new Decimal(paymentData.amount);

        if (!paymentAmount.equals(expectedAmount)) {
          throw new Error(`Payment amount mismatch. Expected: ${expectedAmount}, Received: ${paymentAmount}`);
        }

        // Process inventory updates
        await this.updateInventory(transaction.items, transaction.type);

        // Update transaction status
        transaction.status = 'completed';
        transaction.paymentMethod = paymentData.paymentMethod;
        transaction.paymentReference = paymentData.paymentReference;
        transaction.completedAt = new Date();
        transaction.updatedAt = new Date();

        if (paymentData.metadata) {
          transaction.metadata = { ...transaction.metadata, ...paymentData.metadata };
        }

        // Save updated transaction
        await this.saveTransactionToDatabase(transaction);

        // Mark cart as completed if it exists
        if (transaction.cartId) {
          await cartService.deleteCart(transaction.cartId);
        }

        // Publish transaction completion event
        await redisService.publish('transaction_completed', {
          transactionId: transaction.id,
          storeId: transaction.storeId,
          total: transaction.total,
          type: transaction.type,
          completedAt: transaction.completedAt
        });

        logger.info('Transaction completed', { 
          transactionId: transaction.id, 
          total: transaction.total,
          paymentMethod: paymentData.paymentMethod
        });

        return transaction;
      } finally {
        // Release lock
        await redisService.releaseLock(`transaction_payment:${paymentData.transactionId}`);
      }
    } catch (error) {
      logger.error('Failed to process payment', { error, paymentData });
      throw error;
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const result = await dbService.query(`
        SELECT t.*,
               COALESCE(json_agg(
                 json_build_object(
                   'id', ti.id,
                   'productId', ti.product_id,
                   'productName', ti.product_name,
                   'productSku', ti.product_sku,
                   'quantity', ti.quantity,
                   'unitPrice', ti.unit_price::text,
                   'discount', ti.discount::text,
                   'taxRate', ti.tax_rate::text,
                   'subtotal', ti.subtotal::text,
                   'tax', ti.tax::text,
                   'total', ti.total::text,
                   'metadata', ti.metadata
                 )
               ) FILTER (WHERE ti.id IS NOT NULL), '[]') as items
        FROM transactions t
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        WHERE t.id = $1
        GROUP BY t.id
      `, [transactionId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        storeId: row.store_id,
        cashierId: row.cashier_id,
        customerId: row.customer_id,
        type: row.type,
        status: row.status,
        cartId: row.cart_id,
        items: row.items,
        subtotal: row.subtotal?.toString() || '0.00',
        totalDiscount: row.total_discount?.toString() || '0.00',
        totalTax: row.total_tax?.toString() || '0.00',
        total: row.total?.toString() || '0.00',
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference,
        receiptNumber: row.receipt_number,
        notes: row.notes,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
      };
    } catch (error) {
      logger.error('Failed to get transaction', { error, transactionId });
      throw error;
    }
  }

  async voidTransaction(transactionId: string, reason: string): Promise<Transaction> {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'voided') {
        throw new Error('Transaction is already voided');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Only completed transactions can be voided');
      }

      // Reverse inventory updates
      const reversedItems = transaction.items.map(item => ({
        ...item,
        quantity: -item.quantity // Reverse the quantity
      }));

      await this.updateInventory(reversedItems, 'sale'); // Use 'sale' to reverse

      // Update transaction status
      transaction.status = 'voided';
      transaction.notes = transaction.notes 
        ? `${transaction.notes}\n\nVoided: ${reason}` 
        : `Voided: ${reason}`;
      transaction.updatedAt = new Date();

      // Save updated transaction
      await this.saveTransactionToDatabase(transaction);

      // Publish void event
      await redisService.publish('transaction_voided', {
        transactionId: transaction.id,
        storeId: transaction.storeId,
        reason,
        voidedAt: transaction.updatedAt
      });

      logger.info('Transaction voided', { transactionId, reason });
      return transaction;
    } catch (error) {
      logger.error('Failed to void transaction', { error, transactionId, reason });
      throw error;
    }
  }

  async getTransactionHistory(
    storeId: string, 
    filters: {
      startDate?: Date;
      endDate?: Date;
      cashierId?: string;
      customerId?: string;
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      let whereClause = 'WHERE t.store_id = $1';
      const params: any[] = [storeId];
      let paramIndex = 2;

      if (filters.startDate) {
        whereClause += ` AND t.created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        whereClause += ` AND t.created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      if (filters.cashierId) {
        whereClause += ` AND t.cashier_id = $${paramIndex}`;
        params.push(filters.cashierId);
        paramIndex++;
      }

      if (filters.customerId) {
        whereClause += ` AND t.customer_id = $${paramIndex}`;
        params.push(filters.customerId);
        paramIndex++;
      }

      if (filters.type) {
        whereClause += ` AND t.type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND t.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      // Get total count
      const countResult = await dbService.query(`
        SELECT COUNT(*) as total FROM transactions t ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);

      // Get transactions with pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const result = await dbService.query(`
        SELECT t.*,
               COALESCE(json_agg(
                 json_build_object(
                   'id', ti.id,
                   'productId', ti.product_id,
                   'productName', ti.product_name,
                   'productSku', ti.product_sku,
                   'quantity', ti.quantity,
                   'unitPrice', ti.unit_price::text,
                   'discount', ti.discount::text,
                   'taxRate', ti.tax_rate::text,
                   'subtotal', ti.subtotal::text,
                   'tax', ti.tax::text,
                   'total', ti.total::text,
                   'metadata', ti.metadata
                 )
               ) FILTER (WHERE ti.id IS NOT NULL), '[]') as items
        FROM transactions t
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        ${whereClause}
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      const transactions = result.rows.map((row: any) => ({
        id: row.id,
        storeId: row.store_id,
        cashierId: row.cashier_id,
        customerId: row.customer_id,
        type: row.type,
        status: row.status,
        cartId: row.cart_id,
        items: row.items,
        subtotal: row.subtotal?.toString() || '0.00',
        totalDiscount: row.total_discount?.toString() || '0.00',
        totalTax: row.total_tax?.toString() || '0.00',
        total: row.total?.toString() || '0.00',
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference,
        receiptNumber: row.receipt_number,
        notes: row.notes,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
      }));

      return { transactions, total };
    } catch (error) {
      logger.error('Failed to get transaction history', { error, storeId, filters });
      throw error;
    }
  }

  private async generateReceiptNumber(storeId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the next sequence number for today
    const result = await dbService.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 12) AS INTEGER)), 0) + 1 as next_number
      FROM transactions 
      WHERE store_id = $1 AND receipt_number LIKE $2
    `, [storeId, `${storeId}-${today}%`]);

    const nextNumber = result.rows[0].next_number.toString().padStart(4, '0');
    return `${storeId}-${today}-${nextNumber}`;
  }

  private async updateInventory(items: TransactionItem[], transactionType: 'sale' | 'return' | 'void'): Promise<void> {
    for (const item of items) {
      const quantityChange = transactionType === 'sale' ? -item.quantity : item.quantity;
      
      await dbService.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [quantityChange, item.productId]);

      // Log inventory movement
      await dbService.query(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity, reference_type, reference_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        uuidv4(),
        item.productId,
        transactionType === 'sale' ? 'sale' : 'return',
        Math.abs(quantityChange),
        'transaction',
        item.id
      ]);
    }
  }

  private async saveTransactionToDatabase(transaction: Transaction): Promise<void> {
    await dbService.transaction(async (client) => {
      // Insert or update transaction
      await client.query(`
        INSERT INTO transactions (
          id, store_id, cashier_id, customer_id, type, status, cart_id,
          subtotal, total_discount, total_tax, total, payment_method, payment_reference,
          receipt_number, notes, metadata, created_at, updated_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_method = EXCLUDED.payment_method,
          payment_reference = EXCLUDED.payment_reference,
          notes = EXCLUDED.notes,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at,
          completed_at = EXCLUDED.completed_at
      `, [
        transaction.id, transaction.storeId, transaction.cashierId, transaction.customerId,
        transaction.type, transaction.status, transaction.cartId, transaction.subtotal,
        transaction.totalDiscount, transaction.totalTax, transaction.total,
        transaction.paymentMethod, transaction.paymentReference, transaction.receiptNumber,
        transaction.notes, transaction.metadata, transaction.createdAt, transaction.updatedAt,
        transaction.completedAt
      ]);

      // Delete existing transaction items
      await client.query(`DELETE FROM transaction_items WHERE transaction_id = $1`, [transaction.id]);

      // Insert transaction items
      for (const item of transaction.items) {
        await client.query(`
          INSERT INTO transaction_items (
            id, transaction_id, product_id, product_name, product_sku, quantity,
            unit_price, discount, tax_rate, subtotal, tax, total, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          item.id, transaction.id, item.productId, item.productName, item.productSku,
          item.quantity, item.unitPrice, item.discount, item.taxRate, item.subtotal,
          item.tax, item.total, item.metadata, new Date(), new Date()
        ]);
      }
    });
  }
}

export const transactionService = new TransactionService();