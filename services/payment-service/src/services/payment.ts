import { Decimal } from 'decimal.js';
import { PoolClient } from 'pg';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import {
  Payment,
  PaymentIntent,
  Refund,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  CreatePaymentIntentDto,
  ProcessPaymentDto,
  CreateRefundDto,
  PaymentSearchQuery,
  PaymentResponse,
  GatewayResult
} from '../models/types';

export class PaymentService {
  private gateways: Map<PaymentGateway, any> = new Map();

  constructor() {
    // Initialize payment gateways
    this.initializeGateways();
  }

  private async initializeGateways(): Promise<void> {
    // Gateway initialization will be done when gateways are configured
    logger.info('Payment service initialized');
  }

  async createPaymentIntent(
    storeId: string,
    dto: CreatePaymentIntentDto
  ): Promise<PaymentIntent> {
    try {
      const intentId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const result = await databaseService.query(`
        INSERT INTO payment_intents (
          id, store_id, customer_id, amount, currency, description, 
          metadata, payment_methods, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        intentId,
        storeId,
        dto.customerId || null,
        dto.amount,
        dto.currency,
        dto.description || null,
        JSON.stringify(dto.metadata || {}),
        dto.paymentMethods || [PaymentMethod.CARD],
        expiresAt
      ]);

      const intent = this.mapPaymentIntent(result.rows[0]);
      
      logger.info('Payment intent created', { 
        intentId: intent.id, 
        storeId, 
        amount: dto.amount 
      });

      return intent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async processPayment(
    storeId: string,
    dto: ProcessPaymentDto
  ): Promise<PaymentResponse> {
    return await databaseService.transaction(async (client) => {
      try {
        // Get payment intent
        const intentResult = await client.query(
          'SELECT * FROM payment_intents WHERE id = $1 AND store_id = $2',
          [dto.paymentIntentId, storeId]
        );

        if (intentResult.rows.length === 0) {
          throw new Error('Payment intent not found');
        }

        const intent = this.mapPaymentIntent(intentResult.rows[0]);

        if (intent.status !== PaymentStatus.PENDING) {
          throw new Error('Payment intent is not in pending status');
        }

        if (intent.expiresAt < new Date()) {
          throw new Error('Payment intent has expired');
        }

        // Get gateway configuration
        const gatewayResult = await client.query(`
          SELECT * FROM payment_gateways 
          WHERE store_id = $1 AND gateway = $2 AND is_active = true
        `, [storeId, dto.gateway]);

        if (gatewayResult.rows.length === 0) {
          throw new Error('Payment gateway not configured or inactive');
        }

        const gatewayConfig = gatewayResult.rows[0];

        // Create payment record
        const paymentId = crypto.randomUUID();
        await client.query(`
          INSERT INTO payments (
            id, store_id, customer_id, payment_intent_id, gateway_id,
            gateway, method, type, amount, currency, description, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          paymentId,
          storeId,
          dto.customerId || null,
          intent.id,
          gatewayConfig.id,
          dto.gateway,
          dto.method,
          TransactionType.PAYMENT,
          intent.amount,
          intent.currency,
          intent.description,
          JSON.stringify(intent.metadata || {})
        ]);

        // Process payment with gateway
        const gateway = this.gateways.get(dto.gateway);
        if (!gateway) {
          throw new Error('Payment gateway not available');
        }

        const gatewayResult_payment = await gateway.processPayment(dto);

        // Update payment with gateway response
        const status = this.mapGatewayStatusToPaymentStatus(gatewayResult_payment);
        
        await client.query(`
          UPDATE payments SET 
            status = $1,
            gateway_transaction_id = $2,
            gateway_response = $3,
            processed_at = CURRENT_TIMESTAMP,
            failure_reason = $4
          WHERE id = $5
        `, [
          status,
          gatewayResult_payment.transactionId,
          JSON.stringify(gatewayResult_payment.data || {}),
          gatewayResult_payment.error || null,
          paymentId
        ]);

        // Update payment intent status
        if (status === PaymentStatus.COMPLETED) {
          await client.query(
            'UPDATE payment_intents SET status = $1 WHERE id = $2',
            [PaymentStatus.COMPLETED, intent.id]
          );
        }

        // Get updated payment
        const paymentResult = await client.query(
          'SELECT * FROM payments WHERE id = $1',
          [paymentId]
        );

        const payment = this.mapPayment(paymentResult.rows[0]);

        logger.info('Payment processed', {
          paymentId: payment.id,
          storeId,
          status: payment.status,
          gateway: dto.gateway
        });

        return {
          payment,
          clientSecret: gatewayResult_payment.data?.clientSecret,
          redirectUrl: gatewayResult_payment.data?.redirectUrl,
          requiresAction: gatewayResult_payment.requiresAction || false,
          nextAction: gatewayResult_payment.nextAction
        };
      } catch (error) {
        logger.error('Error processing payment:', error);
        throw error;
      }
    });
  }

  async createRefund(
    storeId: string,
    dto: CreateRefundDto
  ): Promise<Refund> {
    return await databaseService.transaction(async (client) => {
      try {
        // Get original payment
        const paymentResult = await client.query(
          'SELECT * FROM payments WHERE id = $1 AND store_id = $2',
          [dto.paymentId, storeId]
        );

        if (paymentResult.rows.length === 0) {
          throw new Error('Payment not found');
        }

        const payment = this.mapPayment(paymentResult.rows[0]);

        if (payment.status !== PaymentStatus.COMPLETED) {
          throw new Error('Payment is not in completed status');
        }

        const refundAmount = dto.amount ? new Decimal(dto.amount) : payment.amount;

        if (refundAmount.gt(payment.amount)) {
          throw new Error('Refund amount cannot exceed payment amount');
        }

        // Check existing refunds
        const existingRefundsResult = await client.query(
          'SELECT COALESCE(SUM(amount), 0) as total_refunded FROM refunds WHERE payment_id = $1 AND status = $2',
          [payment.id, PaymentStatus.COMPLETED]
        );

        const totalRefunded = new Decimal(existingRefundsResult.rows[0].total_refunded || 0);
        if (totalRefunded.plus(refundAmount).gt(payment.amount)) {
          throw new Error('Total refund amount would exceed payment amount');
        }

        // Create refund record
        const refundId = crypto.randomUUID();
        await client.query(`
          INSERT INTO refunds (
            id, payment_id, store_id, amount, currency, reason, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          refundId,
          payment.id,
          storeId,
          refundAmount,
          payment.currency,
          dto.reason,
          dto.description || null
        ]);

        // Process refund with gateway
        const gateway = this.gateways.get(payment.gateway);
        if (!gateway) {
          throw new Error('Payment gateway not available');
        }

        const gatewayResult = await gateway.createRefund({
          ...dto,
          gatewayTransactionId: payment.gatewayTransactionId!
        });

        // Update refund with gateway response
        const status = this.mapGatewayStatusToPaymentStatus(gatewayResult);
        
        await client.query(`
          UPDATE refunds SET 
            status = $1,
            gateway_refund_id = $2,
            gateway_response = $3,
            processed_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [
          status,
          gatewayResult.transactionId,
          JSON.stringify(gatewayResult.data || {}),
          refundId
        ]);

        // Update payment status if fully refunded
        const newTotalRefunded = totalRefunded.plus(refundAmount);
        if (newTotalRefunded.equals(payment.amount)) {
          await client.query(
            'UPDATE payments SET status = $1 WHERE id = $2',
            [PaymentStatus.REFUNDED, payment.id]
          );
        } else if (newTotalRefunded.gt(0)) {
          await client.query(
            'UPDATE payments SET status = $1 WHERE id = $2',
            [PaymentStatus.PARTIALLY_REFUNDED, payment.id]
          );
        }

        // Get updated refund
        const refundResult = await client.query(
          'SELECT * FROM refunds WHERE id = $1',
          [refundId]
        );

        const refund = this.mapRefund(refundResult.rows[0]);

        logger.info('Refund created', {
          refundId: refund.id,
          paymentId: payment.id,
          amount: refundAmount.toString()
        });

        return refund;
      } catch (error) {
        logger.error('Error creating refund:', error);
        throw error;
      }
    });
  }

  async searchPayments(
    storeId: string,
    query: PaymentSearchQuery
  ): Promise<{ payments: Payment[]; total: number }> {
    try {
      let whereClause = 'WHERE p.store_id = $1';
      const params: any[] = [storeId];
      let paramCount = 1;

      if (query.customerId) {
        whereClause += ` AND p.customer_id = $${++paramCount}`;
        params.push(query.customerId);
      }

      if (query.gateway) {
        whereClause += ` AND p.gateway = $${++paramCount}`;
        params.push(query.gateway);
      }

      if (query.method) {
        whereClause += ` AND p.method = $${++paramCount}`;
        params.push(query.method);
      }

      if (query.status) {
        whereClause += ` AND p.status = $${++paramCount}`;
        params.push(query.status);
      }

      if (query.type) {
        whereClause += ` AND p.type = $${++paramCount}`;
        params.push(query.type);
      }

      if (query.dateFrom) {
        whereClause += ` AND p.created_at >= $${++paramCount}`;
        params.push(query.dateFrom);
      }

      if (query.dateTo) {
        whereClause += ` AND p.created_at <= $${++paramCount}`;
        params.push(query.dateTo);
      }

      if (query.amountMin !== undefined) {
        whereClause += ` AND p.amount >= $${++paramCount}`;
        params.push(query.amountMin);
      }

      if (query.amountMax !== undefined) {
        whereClause += ` AND p.amount <= $${++paramCount}`;
        params.push(query.amountMax);
      }

      if (query.currency) {
        whereClause += ` AND p.currency = $${++paramCount}`;
        params.push(query.currency);
      }

      // Get total count
      const countResult = await databaseService.query(
        `SELECT COUNT(*) FROM payments p ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const offset = (page - 1) * limit;

      const result = await databaseService.query(`
        SELECT p.* FROM payments p 
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `, [...params, limit, offset]);

      const payments = result.rows.map((row: any) => this.mapPayment(row));

      return { payments, total };
    } catch (error) {
      logger.error('Error searching payments:', error);
      throw new Error('Failed to search payments');
    }
  }

  async getPayment(storeId: string, paymentId: string): Promise<Payment | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM payments WHERE id = $1 AND store_id = $2',
        [paymentId, storeId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapPayment(result.rows[0]);
    } catch (error) {
      logger.error('Error getting payment:', error);
      throw new Error('Failed to get payment');
    }
  }

  private mapPaymentIntent(row: any): PaymentIntent {
    return {
      id: row.id,
      storeId: row.store_id,
      customerId: row.customer_id,
      amount: new Decimal(row.amount),
      currency: row.currency,
      description: row.description,
      metadata: row.metadata || {},
      paymentMethods: row.payment_methods || [],
      status: row.status,
      clientSecret: row.client_secret,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapPayment(row: any): Payment {
    return {
      id: row.id,
      storeId: row.store_id,
      transactionId: row.transaction_id,
      customerId: row.customer_id,
      gatewayId: row.gateway_id,
      gateway: row.gateway,
      method: row.method,
      type: row.type,
      status: row.status,
      amount: new Decimal(row.amount),
      currency: row.currency,
      description: row.description,
      metadata: row.metadata || {},
      gatewayTransactionId: row.gateway_transaction_id,
      gatewayResponse: row.gateway_response || {},
      failureReason: row.failure_reason,
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRefund(row: any): Refund {
    return {
      id: row.id,
      paymentId: row.payment_id,
      storeId: row.store_id,
      amount: new Decimal(row.amount),
      currency: row.currency,
      reason: row.reason,
      description: row.description,
      status: row.status,
      gatewayRefundId: row.gateway_refund_id,
      gatewayResponse: row.gateway_response || {},
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapGatewayStatusToPaymentStatus(result: GatewayResult): PaymentStatus {
    if (!result.success) {
      return PaymentStatus.FAILED;
    }
    
    if (result.requiresAction) {
      return PaymentStatus.PROCESSING;
    }
    
    return PaymentStatus.COMPLETED;
  }
}

export const paymentService = new PaymentService();