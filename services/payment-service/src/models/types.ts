import { Decimal } from 'decimal.js';

// Payment Gateway Types
export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square'
}

export enum PaymentMethod {
  CARD = 'card',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  GIFT_CARD = 'gift_card'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
  AUTHORIZATION = 'authorization',
  CAPTURE = 'capture'
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  DUPLICATE_CHARGE = 'duplicate_charge',
  FRAUDULENT = 'fraudulent',
  PRODUCT_DEFECT = 'product_defect',
  OTHER = 'other'
}

// Core Payment Interfaces
export interface Payment {
  id: string;
  storeId: string;
  transactionId: string;
  customerId?: string;
  gatewayId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  type: TransactionType;
  status: PaymentStatus;
  amount: Decimal;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  storeId: string;
  customerId?: string;
  amount: Decimal;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethods: PaymentMethod[];
  status: PaymentStatus;
  clientSecret?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  storeId: string;
  amount: Decimal;
  currency: string;
  reason: RefundReason;
  description?: string;
  status: PaymentStatus;
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentGatewayConfig {
  id: string;
  storeId: string;
  gateway: PaymentGateway;
  isActive: boolean;
  credentials: Record<string, string>; // Encrypted
  webhookUrl?: string;
  webhookSecret?: string;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  gatewayCustomerIds: Record<PaymentGateway, string>;
}

export interface PaymentSession {
  id: string;
  storeId: string;
  customerId?: string;
  items: PaymentItem[];
  totalAmount: Decimal;
  currency: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  status: PaymentStatus;
  expiresAt: Date;
  createdAt: Date;
}

export interface PaymentItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  taxAmount?: Decimal;
  discountAmount?: Decimal;
}

export interface WebhookEvent {
  id: string;
  gateway: PaymentGateway;
  eventType: string;
  eventId: string;
  data: Record<string, any>;
  signature?: string;
  processed: boolean;
  processedAt?: Date;
  receivedAt: Date;
}

export interface PaymentAnalytics {
  storeId: string;
  date: Date;
  totalTransactions: number;
  totalAmount: Decimal;
  successfulTransactions: number;
  failedTransactions: number;
  refundAmount: Decimal;
  averageTransactionAmount: Decimal;
  topPaymentMethods: Array<{
    method: PaymentMethod;
    count: number;
    amount: Decimal;
  }>;
}

// DTOs and Request/Response Types
export interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethods?: PaymentMethod[];
}

export interface ProcessPaymentDto {
  paymentIntentId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  paymentData: Record<string, any>;
  customerId?: string;
}

export interface CreateRefundDto {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason: RefundReason;
  description?: string;
}

export interface PaymentGatewayConfigDto {
  gateway: PaymentGateway;
  credentials: Record<string, string>;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  configuration?: Record<string, any>;
}

export interface PaymentSearchQuery {
  storeId?: string;
  customerId?: string;
  gateway?: PaymentGateway;
  method?: PaymentMethod;
  status?: PaymentStatus;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  page?: number;
  limit?: number;
}

export interface PaymentResponse {
  payment: Payment;
  clientSecret?: string;
  redirectUrl?: string;
  requiresAction?: boolean;
  nextAction?: Record<string, any>;
}

export interface GatewayResult {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
  requiresAction?: boolean;
  nextAction?: Record<string, any>;
}

// Stripe-specific types
export interface StripePaymentData {
  paymentMethodId?: string;
  confirmationToken?: string;
  returnUrl?: string;
}

// PayPal-specific types
export interface PayPalPaymentData {
  orderId?: string;
  payerId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

// Square-specific types
export interface SquarePaymentData {
  sourceId: string;
  verificationToken?: string;
  locationId: string;
}

// PCI DSS Compliance Types
export interface SecurityAuditLog {
  id: string;
  storeId: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
}

export interface EncryptedData {
  encryptedValue: string;
  keyId: string;
  algorithm: string;
  createdAt: Date;
}