import Redis from 'ioredis';
import { RedisManager } from './redis';

// Redis Pub/Sub Service for Real-time Communication
export class RedisPubSubService {
  private publisher: Redis;
  private subscriber: Redis;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    
    this.subscriber.on('message', this.handleMessage.bind(this));
  }

  private handleMessage(channel: string, message: string): void {
    const handlers = this.eventHandlers.get(channel);
    if (handlers) {
      try {
        const data = JSON.parse(message);
        handlers.forEach(handler => handler(data));
      } catch (error) {
        console.error(`Error parsing message from channel ${channel}:`, error);
      }
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: Function): Promise<void> {
    // Add handler to the list
    const handlers = this.eventHandlers.get(channel) || [];
    handlers.push(handler);
    this.eventHandlers.set(channel, handlers);

    // Subscribe to channel if it's the first handler
    if (handlers.length === 1) {
      await this.subscriber.subscribe(channel);
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string, handler?: Function): Promise<void> {
    const handlers = this.eventHandlers.get(channel) || [];
    
    if (handler) {
      // Remove specific handler
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers
      handlers.length = 0;
    }

    // Update or remove the handlers list
    if (handlers.length === 0) {
      this.eventHandlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
    } else {
      this.eventHandlers.set(channel, handlers);
    }
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, data: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  /**
   * POS-specific publish methods
   */

  // Transaction Events
  async publishTransactionStarted(storeId: string, transaction: any): Promise<void> {
    await this.publish(`transaction:${storeId}`, {
      type: 'TRANSACTION_STARTED',
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTransactionCompleted(storeId: string, transaction: any): Promise<void> {
    await this.publish(`transaction:${storeId}`, {
      type: 'TRANSACTION_COMPLETED',
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTransactionCancelled(storeId: string, transactionId: string): Promise<void> {
    await this.publish(`transaction:${storeId}`, {
      type: 'TRANSACTION_CANCELLED',
      data: { transactionId },
      timestamp: new Date().toISOString(),
    });
  }

  // Payment Events
  async publishPaymentProcessing(terminalId: string, paymentData: any): Promise<void> {
    await this.publish(`payment:${terminalId}`, {
      type: 'PAYMENT_PROCESSING',
      data: paymentData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPaymentSuccess(terminalId: string, paymentData: any): Promise<void> {
    await this.publish(`payment:${terminalId}`, {
      type: 'PAYMENT_SUCCESS',
      data: paymentData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishPaymentFailed(terminalId: string, paymentData: any): Promise<void> {
    await this.publish(`payment:${terminalId}`, {
      type: 'PAYMENT_FAILED',
      data: paymentData,
      timestamp: new Date().toISOString(),
    });
  }

  // Inventory Events
  async publishInventoryUpdate(storeId: string, inventoryData: any): Promise<void> {
    await this.publish(`inventory:${storeId}`, {
      type: 'INVENTORY_UPDATED',
      data: inventoryData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishLowStockAlert(storeId: string, productData: any): Promise<void> {
    await this.publish(`inventory:${storeId}`, {
      type: 'LOW_STOCK_ALERT',
      data: productData,
      timestamp: new Date().toISOString(),
    });
  }

  // System Events
  async publishSystemAlert(alertData: any): Promise<void> {
    await this.publish('system:alerts', {
      type: 'SYSTEM_ALERT',
      data: alertData,
      timestamp: new Date().toISOString(),
    });
  }

  async publishTerminalStatus(terminalId: string, status: 'online' | 'offline'): Promise<void> {
    await this.publish('system:terminals', {
      type: 'TERMINAL_STATUS',
      data: { terminalId, status },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscription helpers for POS events
   */

  // Subscribe to transaction events for a store
  async subscribeToTransactions(storeId: string, handler: Function): Promise<void> {
    await this.subscribe(`transaction:${storeId}`, handler);
  }

  // Subscribe to payment events for a terminal
  async subscribeToPayments(terminalId: string, handler: Function): Promise<void> {
    await this.subscribe(`payment:${terminalId}`, handler);
  }

  // Subscribe to inventory events for a store
  async subscribeToInventory(storeId: string, handler: Function): Promise<void> {
    await this.subscribe(`inventory:${storeId}`, handler);
  }

  // Subscribe to system alerts
  async subscribeToSystemAlerts(handler: Function): Promise<void> {
    await this.subscribe('system:alerts', handler);
  }

  // Subscribe to terminal status updates
  async subscribeToTerminalStatus(handler: Function): Promise<void> {
    await this.subscribe('system:terminals', handler);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ publisher: boolean; subscriber: boolean }> {
    try {
      await this.publisher.ping();
      await this.subscriber.ping();
      return { publisher: true, subscriber: true };
    } catch (error) {
      return { publisher: false, subscriber: false };
    }
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    await this.publisher.disconnect();
    await this.subscriber.disconnect();
    this.eventHandlers.clear();
  }
}

export default RedisPubSubService;