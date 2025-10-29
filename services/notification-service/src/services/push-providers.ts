import { PushProvider } from '../models/types';
import { logger } from '../utils/logger';

export class FCMPushProvider implements PushProvider {
  name = 'fcm';
  private serverKey: string;

  constructor(serverKey: string) {
    this.serverKey = serverKey;
  }

  async sendPush(params: {
    to: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const admin = require('firebase-admin');
      
      // Initialize Firebase Admin if not already done
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            // This would typically come from environment variables or config file
            projectId: process.env.FCM_PROJECT_ID,
            clientEmail: process.env.FCM_CLIENT_EMAIL,
            privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
      }

      const message = {
        token: params.to,
        notification: {
          title: params.title,
          body: params.body
        },
        data: {
          ...params.data,
          trackingId: params.trackingId || ''
        },
        android: {
          priority: 'high' as const
        },
        apns: {
          headers: {
            'apns-priority': '10'
          }
        }
      };

      const result = await admin.messaging().send(message);

      logger.info('Push notification sent successfully via FCM', {
        messageId: result,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: result,
        providerResponse: { messageId: result }
      };
    } catch (error) {
      logger.error('Failed to send push notification via FCM:', error);
      throw error;
    }
  }
}

export class APNSPushProvider implements PushProvider {
  name = 'apns';
  private keyId: string;
  private teamId: string;
  private key: string;

  constructor(config: {
    keyId: string;
    teamId: string;
    key: string;
  }) {
    this.keyId = config.keyId;
    this.teamId = config.teamId;
    this.key = config.key;
  }

  async sendPush(params: {
    to: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const apn = require('node-apn');
      
      const provider = new apn.Provider({
        token: {
          key: this.key,
          keyId: this.keyId,
          teamId: this.teamId
        },
        production: process.env.NODE_ENV === 'production'
      });

      const notification = new apn.Notification({
        alert: {
          title: params.title,
          body: params.body
        },
        sound: 'default',
        badge: 1,
        payload: {
          ...params.data,
          trackingId: params.trackingId
        }
      });

      const result = await provider.send(notification, params.to);
      const messageId = `apns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Push notification sent successfully via APNS', {
        messageId,
        to: params.to,
        trackingId: params.trackingId,
        sent: result.sent.length,
        failed: result.failed.length
      });

      provider.shutdown();

      return {
        messageId,
        providerResponse: result
      };
    } catch (error) {
      logger.error('Failed to send push notification via APNS:', error);
      throw error;
    }
  }
}

export class OneSignalPushProvider implements PushProvider {
  name = 'onesignal';
  private appId: string;
  private apiKey: string;

  constructor(config: {
    appId: string;
    apiKey: string;
  }) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;
  }

  async sendPush(params: {
    to: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    try {
      const axios = require('axios');

      const payload = {
        app_id: this.appId,
        include_player_ids: [params.to],
        headings: { en: params.title || 'Notification' },
        contents: { en: params.body },
        data: {
          ...params.data,
          trackingId: params.trackingId
        }
      };

      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        payload,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Push notification sent successfully via OneSignal', {
        messageId: response.data.id,
        to: params.to,
        trackingId: params.trackingId
      });

      return {
        messageId: response.data.id,
        providerResponse: response.data
      };
    } catch (error) {
      logger.error('Failed to send push notification via OneSignal:', error);
      throw error;
    }
  }
}

// Mock Push Provider for development/testing
export class MockPushProvider implements PushProvider {
  name = 'mock';

  async sendPush(params: {
    to: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }> {
    const messageId = `mock_push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Push notification sent via Mock Provider', {
      messageId,
      to: params.to,
      title: params.title,
      body: params.body,
      data: params.data,
      trackingId: params.trackingId
    });

    // Simulate delivery delay
    setTimeout(() => {
      logger.info('Mock push notification delivered', { messageId });
    }, 500);

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

// Push Provider Factory
export class PushProviderFactory {
  static createProvider(type: string, config: any): PushProvider {
    switch (type.toLowerCase()) {
      case 'fcm':
      case 'firebase':
        return new FCMPushProvider(config.serverKey);
      case 'apns':
        return new APNSPushProvider(config);
      case 'onesignal':
        return new OneSignalPushProvider(config);
      case 'mock':
        return new MockPushProvider();
      default:
        throw new Error(`Unsupported push provider: ${type}`);
    }
  }
}