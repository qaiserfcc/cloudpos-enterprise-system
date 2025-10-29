import { SmsProvider } from '../models/types';
import { logger } from '../utils/logger';

export class TwilioSmsProvider implements SmsProvider {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromNumber = config.fromNumber;
  }

  async sendSms(params: {
    from: string;
    to: string;
    message: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);

      const message = await client.messages.create({
        body: params.message,
        from: params.from || this.fromNumber,
        to: params.to,
        statusCallback: params.trackingId ? `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/status?trackingId=${params.trackingId}` : undefined
      });

      logger.info('SMS sent successfully via Twilio', {
        messageId: message.sid,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: message.sid,
        providerResponse: message
      };
    } catch (error) {
      logger.error('Failed to send SMS via Twilio:', error);
      throw error;
    }
  }
}

export class AmazonSNSSmsProvider implements SmsProvider {
  name = 'sns';
  private snsClient: any;

  constructor(config: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    const { SNSClient } = require('@aws-sdk/client-sns');
    this.snsClient = new SNSClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      } : undefined
    });
  }

  async sendSms(params: {
    from: string;
    to: string;
    message: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const { PublishCommand } = require('@aws-sdk/client-sns');
      
      const command = new PublishCommand({
        PhoneNumber: params.to,
        Message: params.message,
        MessageAttributes: params.trackingId ? {
          'tracking-id': {
            DataType: 'String',
            StringValue: params.trackingId
          }
        } : undefined
      });

      const result = await this.snsClient.send(command);

      logger.info('SMS sent successfully via Amazon SNS', {
        messageId: result.MessageId,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result.MessageId,
        providerResponse: result
      };
    } catch (error) {
      logger.error('Failed to send SMS via Amazon SNS:', error);
      throw error;
    }
  }
}

export class NexmoSmsProvider implements SmsProvider {
  name = 'nexmo';
  private apiKey: string;
  private apiSecret: string;
  private fromNumber: string;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.fromNumber = config.fromNumber;
  }

  async sendSms(params: {
    from: string;
    to: string;
    message: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const { Vonage } = require('@vonage/server-sdk');
      
      const vonage = new Vonage({
        apiKey: this.apiKey,
        apiSecret: this.apiSecret
      });

      const result = await vonage.sms.send({
        to: params.to,
        from: params.from || this.fromNumber,
        text: params.message,
        callback: params.trackingId ? `${process.env.WEBHOOK_BASE_URL}/webhooks/nexmo/status?trackingId=${params.trackingId}` : undefined
      });

      logger.info('SMS sent successfully via Nexmo/Vonage', {
        messageId: result.messages[0]['message-id'],
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result.messages[0]['message-id'],
        providerResponse: result
      };
    } catch (error) {
      logger.error('Failed to send SMS via Nexmo/Vonage:', error);
      throw error;
    }
  }
}

// Mock SMS Provider for development/testing
export class MockSmsProvider implements SmsProvider {
  name = 'mock';

  async sendSms(params: {
    from: string;
    to: string;
    message: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('SMS sent via Mock Provider', {
      messageId,
      from: params.from,
      to: params.to,
      message: params.message,
      trackingId: params.trackingId
    });

    // Simulate delivery delay
    setTimeout(() => {
      logger.info('Mock SMS delivered', { messageId });
    }, 1000);

    return {
      messageId,
      providerResponse: {
        status: 'sent',
        messageId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// SMS Provider Factory
export class SmsProviderFactory {
  static createProvider(type: string, config: any): SmsProvider {
    switch (type.toLowerCase()) {
      case 'twilio':
        return new TwilioSmsProvider(config);
      case 'sns':
        return new AmazonSNSSmsProvider(config);
      case 'nexmo':
      case 'vonage':
        return new NexmoSmsProvider(config);
      case 'mock':
        return new MockSmsProvider();
      default:
        throw new Error(`Unsupported SMS provider: ${type}`);
    }
  }
}