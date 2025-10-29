import Joi from 'joi';
import { PaymentGateway, PaymentMethod, RefundReason, TransactionType, PaymentStatus } from '../models/types';

// Payment Intent Schemas
export const createPaymentIntentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).uppercase().required(),
  customerId: Joi.string().uuid().optional(),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
  paymentMethods: Joi.array().items(
    Joi.string().valid(...Object.values(PaymentMethod))
  ).optional()
});

// Process Payment Schemas
export const processPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().uuid().required(),
  gateway: Joi.string().valid(...Object.values(PaymentGateway)).required(),
  method: Joi.string().valid(...Object.values(PaymentMethod)).required(),
  paymentData: Joi.object().required(),
  customerId: Joi.string().uuid().optional()
});

// Refund Schemas
export const createRefundSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).optional(),
  reason: Joi.string().valid(...Object.values(RefundReason)).required(),
  description: Joi.string().max(500).optional()
});

// Payment Gateway Configuration Schema
export const paymentGatewayConfigSchema = Joi.object({
  gateway: Joi.string().valid(...Object.values(PaymentGateway)).required(),
  credentials: Joi.object().required(),
  supportedMethods: Joi.array().items(
    Joi.string().valid(...Object.values(PaymentMethod))
  ).required(),
  supportedCurrencies: Joi.array().items(
    Joi.string().length(3).uppercase()
  ).required(),
  configuration: Joi.object().optional()
});

// Search Query Schema
export const paymentSearchSchema = Joi.object({
  customerId: Joi.string().uuid().optional(),
  gateway: Joi.string().valid(...Object.values(PaymentGateway)).optional(),
  method: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
  status: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
  type: Joi.string().valid(...Object.values(TransactionType)).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  amountMin: Joi.number().min(0).precision(2).optional(),
  amountMax: Joi.number().min(Joi.ref('amountMin')).precision(2).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Webhook Schema
export const webhookEventSchema = Joi.object({
  gateway: Joi.string().valid(...Object.values(PaymentGateway)).required(),
  signature: Joi.string().required(),
  payload: Joi.alternatives().try(Joi.object(), Joi.string()).required()
});

// Analytics Query Schema
export const analyticsQuerySchema = Joi.object({
  dateFrom: Joi.date().iso().required(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  gateway: Joi.string().valid(...Object.values(PaymentGateway)).optional(),
  method: Joi.string().valid(...Object.values(PaymentMethod)).optional()
});

// Stripe-specific Payment Data Schema
export const stripePaymentDataSchema = Joi.object({
  paymentMethodId: Joi.string().optional(),
  confirmationToken: Joi.string().optional(),
  returnUrl: Joi.string().uri().optional()
}).or('paymentMethodId', 'confirmationToken');

// PayPal-specific Payment Data Schema
export const paypalPaymentDataSchema = Joi.object({
  orderId: Joi.string().optional(),
  payerId: Joi.string().optional(),
  returnUrl: Joi.string().uri().required(),
  cancelUrl: Joi.string().uri().required()
});

// Square-specific Payment Data Schema
export const squarePaymentDataSchema = Joi.object({
  sourceId: Joi.string().required(),
  verificationToken: Joi.string().optional(),
  locationId: Joi.string().required()
});

// Validation Middleware
export const validatePaymentData = (gateway: PaymentGateway) => {
  switch (gateway) {
    case PaymentGateway.STRIPE:
      return stripePaymentDataSchema;
    case PaymentGateway.PAYPAL:
      return paypalPaymentDataSchema;
    case PaymentGateway.SQUARE:
      return squarePaymentDataSchema;
    default:
      return Joi.object();
  }
};

// Middleware functions
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.params = value;
    next();
  };
};

// UUID Parameter Schema
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const storeIdParamSchema = Joi.object({
  storeId: Joi.string().uuid().required()
});

export const paymentIdParamSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  paymentId: Joi.string().uuid().required()
});