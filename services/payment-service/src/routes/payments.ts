import { Router } from 'express';
import { paymentService } from '../services/payment';
import { logger } from '../utils/logger';
import {
  validateBody,
  validateQuery,
  validateParams,
  createPaymentIntentSchema,
  processPaymentSchema,
  createRefundSchema,
  paymentSearchSchema,
  storeIdParamSchema,
  paymentIdParamSchema
} from '../validation/schemas';

const router = Router();

// Create Payment Intent
router.post(
  '/:storeId/intents',
  validateParams(storeIdParamSchema),
  validateBody(createPaymentIntentSchema),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const paymentIntent = await paymentService.createPaymentIntent(storeId, req.body);
      
      res.status(201).json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      logger.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment intent'
      });
    }
  }
);

// Process Payment
router.post(
  '/:storeId/process',
  validateParams(storeIdParamSchema),
  validateBody(processPaymentSchema),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const result = await paymentService.processPayment(storeId, req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment'
      });
    }
  }
);

// Create Refund
router.post(
  '/:storeId/refunds',
  validateParams(storeIdParamSchema),
  validateBody(createRefundSchema),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const refund = await paymentService.createRefund(storeId, req.body);
      
      res.status(201).json({
        success: true,
        data: refund
      });
    } catch (error) {
      logger.error('Create refund error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create refund'
      });
    }
  }
);

// Search Payments
router.get(
  '/:storeId/payments',
  validateParams(storeIdParamSchema),
  validateQuery(paymentSearchSchema),
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const result = await paymentService.searchPayments(storeId, req.query);
      
      res.json({
        success: true,
        data: result.payments,
        pagination: {
          total: result.total,
          page: req.query.page || 1,
          limit: req.query.limit || 20,
          totalPages: Math.ceil(result.total / Number(req.query.limit || 20))
        }
      });
    } catch (error) {
      logger.error('Search payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search payments'
      });
    }
  }
);

// Get Payment by ID
router.get(
  '/:storeId/payments/:paymentId',
  validateParams(paymentIdParamSchema),
  async (req, res) => {
    try {
      const { storeId, paymentId } = req.params;
      const payment = await paymentService.getPayment(storeId, paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment'
      });
    }
  }
);

// Get Payment Status
router.get(
  '/:storeId/payments/:paymentId/status',
  validateParams(paymentIdParamSchema),
  async (req, res) => {
    try {
      const { storeId, paymentId } = req.params;
      const payment = await paymentService.getPayment(storeId, paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          gateway: payment.gateway,
          method: payment.method,
          processedAt: payment.processedAt,
          failureReason: payment.failureReason
        }
      });
    } catch (error) {
      logger.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status'
      });
    }
  }
);

// Cancel Payment Intent
router.post(
  '/:storeId/intents/:intentId/cancel',
  validateParams(paymentIdParamSchema),
  async (req, res) => {
    try {
      const { storeId, intentId } = req.params;
      
      // Implementation would cancel the payment intent
      // This is a placeholder for the actual implementation
      
      res.json({
        success: true,
        message: 'Payment intent cancelled'
      });
    } catch (error) {
      logger.error('Cancel payment intent error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment intent'
      });
    }
  }
);

// Get Payment Methods
router.get(
  '/:storeId/methods',
  validateParams(storeIdParamSchema),
  async (req, res) => {
    try {
      // This would return available payment methods for the store
      // Based on configured gateways
      
      res.json({
        success: true,
        data: {
          methods: ['card', 'digital_wallet'],
          gateways: ['stripe', 'paypal', 'square']
        }
      });
    } catch (error) {
      logger.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment methods'
      });
    }
  }
);

// Health Check
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'payment-service'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { router as paymentRoutes };