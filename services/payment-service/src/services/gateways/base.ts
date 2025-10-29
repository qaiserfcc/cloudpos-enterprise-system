import { Decimal } from 'decimal.js';
import {
  PaymentGateway,
  PaymentMethod,
  GatewayResult,
  ProcessPaymentDto,
  CreateRefundDto,
  PaymentGatewayConfig
} from '../../models/types';

export interface PaymentGatewayInterface {
  gateway: PaymentGateway;
  
  // Initialize gateway with configuration
  initialize(config: PaymentGatewayConfig): Promise<void>;
  
  // Create payment intent
  createPaymentIntent(params: {
    amount: Decimal;
    currency: string;
    customerId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<GatewayResult>;
  
  // Process payment
  processPayment(paymentData: ProcessPaymentDto): Promise<GatewayResult>;
  
  // Capture authorized payment
  capturePayment(params: {
    transactionId: string;
    amount?: Decimal;
  }): Promise<GatewayResult>;
  
  // Create refund
  createRefund(params: CreateRefundDto & {
    gatewayTransactionId: string;
  }): Promise<GatewayResult>;
  
  // Verify webhook signature
  verifyWebhook(payload: string, signature: string): boolean;
  
  // Process webhook event
  processWebhook(payload: any): Promise<{
    eventType: string;
    transactionId?: string;
    status?: string;
    data: any;
  }>;
  
  // Get payment status
  getPaymentStatus(transactionId: string): Promise<GatewayResult>;
  
  // Get supported payment methods
  getSupportedMethods(): PaymentMethod[];
  
  // Get supported currencies
  getSupportedCurrencies(): string[];
  
  // Health check
  healthCheck(): Promise<boolean>;
}

export abstract class BasePaymentGateway implements PaymentGatewayInterface {
  protected config?: PaymentGatewayConfig;
  
  abstract gateway: PaymentGateway;
  
  async initialize(config: PaymentGatewayConfig): Promise<void> {
    this.config = config;
  }
  
  abstract createPaymentIntent(params: {
    amount: Decimal;
    currency: string;
    customerId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<GatewayResult>;
  
  abstract processPayment(paymentData: ProcessPaymentDto): Promise<GatewayResult>;
  
  abstract capturePayment(params: {
    transactionId: string;
    amount?: Decimal;
  }): Promise<GatewayResult>;
  
  abstract createRefund(params: CreateRefundDto & {
    gatewayTransactionId: string;
  }): Promise<GatewayResult>;
  
  abstract verifyWebhook(payload: string, signature: string): boolean;
  
  abstract processWebhook(payload: any): Promise<{
    eventType: string;
    transactionId?: string;
    status?: string;
    data: any;
  }>;
  
  abstract getPaymentStatus(transactionId: string): Promise<GatewayResult>;
  
  abstract getSupportedMethods(): PaymentMethod[];
  
  abstract getSupportedCurrencies(): string[];
  
  abstract healthCheck(): Promise<boolean>;
  
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error('Gateway not initialized. Call initialize() first.');
    }
  }
  
  protected handleError(error: any): GatewayResult {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      data: error
    };
  }
}