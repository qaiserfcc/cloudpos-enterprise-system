import { Decimal } from 'decimal.js';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import {
  Notification,
  NotificationTemplate,
  NotificationQueue,
  NotificationDelivery,
  NotificationEvent,
  NotificationSettings,
  NotificationStats,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  DeliveryStatus,
  CreateNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  SendBulkNotificationDto,
  NotificationSearchQuery,
  NotificationStatsQuery,
  NotificationStatsResponse,
  EmailProvider,
  SmsProvider,
  PushProvider
} from '../models/types';
import { EmailProviderFactory } from './email-providers';
import { SmsProviderFactory } from './sms-providers';
import { PushProviderFactory } from './push-providers';

export class NotificationService {
  private emailProvider?: EmailProvider;
  private smsProvider?: SmsProvider;
  private pushProvider?: PushProvider;

  constructor() {
    logger.info('Notification service initialized');
  }

  async initializeProviders(storeId: string): Promise<void> {
    try {
      const settings = await this.getNotificationSettings(storeId);
      
      if (settings.emailEnabled && settings.smtpHost) {
        this.emailProvider = EmailProviderFactory.createProvider('nodemailer', {
          host: settings.smtpHost,
          port: settings.smtpPort || 587,
          secure: settings.smtpSecure,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPassword
          }
        });
      }

      if (settings.smsEnabled && settings.smsProvider) {
        this.smsProvider = SmsProviderFactory.createProvider(settings.smsProvider, {
          accountSid: settings.smsAccountSid,
          authToken: settings.smsAuthToken,
          fromNumber: settings.smsFrom
        });
      }

      if (settings.pushEnabled && settings.pushProvider) {
        this.pushProvider = PushProviderFactory.createProvider(settings.pushProvider, {
          serverKey: settings.fcmServerKey,
          keyId: settings.apnsKeyId,
          teamId: settings.apnsTeamId,
          key: settings.apnsKey
        });
      }

      logger.info('Notification providers initialized', { storeId });
    } catch (error) {
      logger.error('Failed to initialize notification providers:', error);
    }
  }

  async createNotification(storeId: string, dto: CreateNotificationDto): Promise<Notification> {
    return await databaseService.transaction(async (client) => {
      try {
        const notificationId = uuidv4();
        const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create notification record
        const result = await client.query(`
          INSERT INTO notifications (
            id, store_id, type, priority, template_id, recipient_id, recipient_type,
            recipient_email, recipient_phone, recipient_device_token, subject, message,
            html_content, data, scheduled_at, tracking_id, metadata, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *
        `, [
          notificationId,
          storeId,
          dto.type,
          dto.priority || NotificationPriority.NORMAL,
          dto.templateId || null,
          dto.recipientId || null,
          dto.recipientType,
          dto.recipientEmail || null,
          dto.recipientPhone || null,
          dto.recipientDeviceToken || null,
          dto.subject || null,
          dto.message,
          dto.htmlContent || null,
          JSON.stringify(dto.data || {}),
          dto.scheduledAt || null,
          trackingId,
          JSON.stringify(dto.metadata || {}),
          dto.tags || []
        ]);

        // Queue for immediate sending if not scheduled
        if (!dto.scheduledAt) {
          await this.queueNotification(client, notificationId, dto.type, dto.priority || NotificationPriority.NORMAL);
        }

        // Log creation event
        await this.logNotificationEvent(client, notificationId, storeId, 'created', {
          notificationData: dto
        });

        const notification = this.mapNotification(result.rows[0]);

        logger.info('Notification created successfully', {
          notificationId,
          storeId,
          type: dto.type,
          recipientType: dto.recipientType
        });

        return notification;
      } catch (error) {
        logger.error('Error creating notification:', error);
        throw error;
      }
    });
  }

  async sendBulkNotifications(storeId: string, dto: SendBulkNotificationDto): Promise<{ 
    success: number; 
    failed: number; 
    notificationIds: string[] 
  }> {
    const results = {
      success: 0,
      failed: 0,
      notificationIds: [] as string[]
    };

    for (const recipient of dto.recipients) {
      try {
        const notification = await this.createNotification(storeId, {
          type: dto.type,
          priority: dto.priority,
          templateId: dto.templateId,
          recipientId: recipient.recipientId,
          recipientType: recipient.recipientType,
          recipientEmail: recipient.recipientEmail,
          recipientPhone: recipient.recipientPhone,
          recipientDeviceToken: recipient.recipientDeviceToken,
          subject: dto.subject,
          message: dto.message || '',
          htmlContent: dto.htmlContent,
          data: { ...dto.globalData, ...recipient.data },
          scheduledAt: dto.scheduledAt,
          tags: dto.tags,
          metadata: dto.metadata
        });

        results.success++;
        results.notificationIds.push(notification.id);
      } catch (error) {
        logger.error('Failed to create bulk notification:', error);
        results.failed++;
      }
    }

    logger.info('Bulk notifications created', {
      storeId,
      totalRecipients: dto.recipients.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  async processNotificationQueue(): Promise<void> {
    try {
      const queueItems = await databaseService.query(`
        SELECT nq.*, n.store_id, n.type, n.recipient_email, n.recipient_phone, 
               n.recipient_device_token, n.subject, n.message, n.html_content, 
               n.tracking_id, n.data
        FROM notification_queue nq
        JOIN notifications n ON nq.notification_id = n.id
        WHERE nq.status = 'queued' 
        AND (nq.next_retry_at IS NULL OR nq.next_retry_at <= CURRENT_TIMESTAMP)
        ORDER BY nq.priority DESC, nq.queued_at ASC
        LIMIT 100
      `);

      for (const item of queueItems.rows) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      logger.error('Error processing notification queue:', error);
    }
  }

  private async processQueueItem(queueItem: any): Promise<void> {
    try {
      // Update queue status to processing
      await databaseService.query(
        'UPDATE notification_queue SET status = $1, processing_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['processing', queueItem.id]
      );

      // Initialize providers if needed
      await this.initializeProviders(queueItem.store_id);

      let result: { messageId: string; providerResponse: any } | null = null;

      switch (queueItem.type) {
        case NotificationType.EMAIL:
          result = await this.sendEmail(queueItem);
          break;
        case NotificationType.SMS:
          result = await this.sendSms(queueItem);
          break;
        case NotificationType.PUSH:
          result = await this.sendPush(queueItem);
          break;
        default:
          throw new Error(`Unsupported notification type: ${queueItem.type}`);
      }

      if (result) {
        // Update notification status
        await databaseService.query(
          'UPDATE notifications SET status = $1, sent_at = CURRENT_TIMESTAMP, external_id = $2 WHERE id = $3',
          [NotificationStatus.SENT, result.messageId, queueItem.notification_id]
        );

        // Update queue status
        await databaseService.query(
          'UPDATE notification_queue SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['sent', queueItem.id]
        );

        // Create delivery record
        await this.createDeliveryRecord(queueItem, result);

        // Log event
        await this.logNotificationEvent(null, queueItem.notification_id, queueItem.store_id, 'sent', {
          provider: this.getProviderName(queueItem.type),
          messageId: result.messageId
        });

        logger.info('Notification sent successfully', {
          notificationId: queueItem.notification_id,
          type: queueItem.type,
          messageId: result.messageId
        });
      }
    } catch (error) {
      await this.handleQueueItemFailure(queueItem, error);
    }
  }

  private async sendEmail(queueItem: any): Promise<{ messageId: string; providerResponse: any }> {
    if (!this.emailProvider) {
      throw new Error('Email provider not configured');
    }

    const settings = await this.getNotificationSettings(queueItem.store_id);
    
    return await this.emailProvider.sendEmail({
      from: settings.emailFrom || 'noreply@cloudpos.com',
      to: queueItem.recipient_email,
      subject: queueItem.subject || 'Notification',
      text: queueItem.message,
      html: queueItem.html_content,
      replyTo: settings.emailReplyTo,
      trackingId: queueItem.tracking_id
    });
  }

  private async sendSms(queueItem: any): Promise<{ messageId: string; providerResponse: any }> {
    if (!this.smsProvider) {
      throw new Error('SMS provider not configured');
    }

    const settings = await this.getNotificationSettings(queueItem.store_id);
    
    return await this.smsProvider.sendSms({
      from: settings.smsFrom || '',
      to: queueItem.recipient_phone,
      message: queueItem.message,
      trackingId: queueItem.tracking_id
    });
  }

  private async sendPush(queueItem: any): Promise<{ messageId: string; providerResponse: any }> {
    if (!this.pushProvider) {
      throw new Error('Push provider not configured');
    }

    const data = queueItem.data ? JSON.parse(queueItem.data) : {};
    
    return await this.pushProvider.sendPush({
      to: queueItem.recipient_device_token,
      title: queueItem.subject,
      body: queueItem.message,
      data,
      trackingId: queueItem.tracking_id
    });
  }

  private async handleQueueItemFailure(queueItem: any, error: any): Promise<void> {
    const retryCount = queueItem.retry_count + 1;
    const maxRetries = queueItem.max_retries;

    if (retryCount <= maxRetries) {
      // Calculate next retry time with exponential backoff
      const backoffMinutes = Math.pow(2, retryCount - 1) * 5; // 5, 10, 20, 40 minutes
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await databaseService.query(`
        UPDATE notification_queue 
        SET status = 'queued', retry_count = $1, next_retry_at = $2, error_message = $3
        WHERE id = $4
      `, [retryCount, nextRetryAt, error.message, queueItem.id]);

      logger.warn('Notification queued for retry', {
        notificationId: queueItem.notification_id,
        retryCount,
        nextRetryAt,
        error: error.message
      });
    } else {
      // Mark as failed
      await databaseService.query(
        'UPDATE notification_queue SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, queueItem.id]
      );

      await databaseService.query(
        'UPDATE notifications SET status = $1, error_message = $2 WHERE id = $3',
        [NotificationStatus.FAILED, error.message, queueItem.notification_id]
      );

      // Log failure event
      await this.logNotificationEvent(null, queueItem.notification_id, queueItem.store_id, 'failed', {
        error: error.message,
        retryCount
      });

      logger.error('Notification failed permanently', {
        notificationId: queueItem.notification_id,
        retryCount,
        error: error.message
      });
    }
  }

  async getNotificationSettings(storeId: string): Promise<NotificationSettings> {
    const result = await databaseService.query(
      'SELECT * FROM notification_settings WHERE store_id = $1',
      [storeId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const defaultSettings = {
        id: uuidv4(),
        storeId,
        emailEnabled: true,
        emailFrom: 'noreply@cloudpos.com',
        emailReplyTo: undefined,
        smtpHost: undefined,
        smtpPort: undefined,
        smtpUser: undefined,
        smtpPassword: undefined,
        smtpSecure: true,
        smsEnabled: false,
        smsProvider: 'twilio',
        smsAccountSid: undefined,
        smsAuthToken: undefined,
        smsFrom: undefined,
        pushEnabled: false,
        pushProvider: 'fcm',
        fcmServerKey: undefined,
        apnsKey: undefined,
        apnsKeyId: undefined,
        apnsTeamId: undefined,
        webhookEnabled: false,
        webhookUrls: [],
        webhookSecret: undefined,
        emailRateLimit: 100,
        smsRateLimit: 50,
        pushRateLimit: 200,
        defaultMaxRetries: 3,
        retryBackoffMultiplier: 2.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await databaseService.query(`
        INSERT INTO notification_settings (
          id, store_id, email_enabled, email_from, sms_enabled, sms_provider,
          push_enabled, push_provider, webhook_enabled, email_rate_limit,
          sms_rate_limit, push_rate_limit, default_max_retries, retry_backoff_multiplier
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        defaultSettings.id,
        defaultSettings.storeId,
        defaultSettings.emailEnabled,
        defaultSettings.emailFrom,
        defaultSettings.smsEnabled,
        defaultSettings.smsProvider,
        defaultSettings.pushEnabled,
        defaultSettings.pushProvider,
        defaultSettings.webhookEnabled,
        defaultSettings.emailRateLimit,
        defaultSettings.smsRateLimit,
        defaultSettings.pushRateLimit,
        defaultSettings.defaultMaxRetries,
        defaultSettings.retryBackoffMultiplier
      ]);

      return defaultSettings;
    }

    return this.mapNotificationSettings(result.rows[0]);
  }

  private async queueNotification(
    client: PoolClient,
    notificationId: string,
    type: NotificationType,
    priority: NotificationPriority
  ): Promise<void> {
    const queueId = uuidv4();
    
    await client.query(`
      INSERT INTO notification_queue (
        id, notification_id, type, priority, status
      ) VALUES ($1, $2, $3, $4, $5)
    `, [queueId, notificationId, type, priority, 'queued']);
  }

  private async createDeliveryRecord(queueItem: any, result: { messageId: string; providerResponse: any }): Promise<void> {
    const deliveryId = uuidv4();
    
    await databaseService.query(`
      INSERT INTO notification_delivery (
        id, store_id, notification_id, queue_id, provider, provider_message_id,
        status, provider_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      deliveryId,
      queueItem.store_id,
      queueItem.notification_id,
      queueItem.id,
      this.getProviderName(queueItem.type),
      result.messageId,
      'sent',
      JSON.stringify(result.providerResponse)
    ]);
  }

  private async logNotificationEvent(
    client: PoolClient | null,
    notificationId: string,
    storeId: string,
    type: string,
    data: Record<string, any>,
    source: string = 'notification-service'
  ): Promise<void> {
    const query = `
      INSERT INTO notification_events (notification_id, store_id, type, event_data, source)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const params = [notificationId, storeId, type, JSON.stringify(data), source];

    if (client) {
      await client.query(query, params);
    } else {
      await databaseService.query(query, params);
    }
  }

  private getProviderName(type: NotificationType): string {
    switch (type) {
      case NotificationType.EMAIL:
        return this.emailProvider?.name || 'unknown';
      case NotificationType.SMS:
        return this.smsProvider?.name || 'unknown';
      case NotificationType.PUSH:
        return this.pushProvider?.name || 'unknown';
      default:
        return 'unknown';
    }
  }

  private mapNotification(row: any): Notification {
    return {
      id: row.id,
      storeId: row.store_id,
      type: row.type,
      status: row.status,
      priority: row.priority,
      templateId: row.template_id,
      recipientId: row.recipient_id,
      recipientType: row.recipient_type,
      recipientEmail: row.recipient_email,
      recipientPhone: row.recipient_phone,
      recipientDeviceToken: row.recipient_device_token,
      subject: row.subject,
      message: row.message,
      htmlContent: row.html_content,
      data: row.data || {},
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      trackingId: row.tracking_id,
      externalId: row.external_id,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      metadata: row.metadata || {},
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapNotificationSettings(row: any): NotificationSettings {
    return {
      id: row.id,
      storeId: row.store_id,
      emailEnabled: row.email_enabled,
      emailFrom: row.email_from,
      emailReplyTo: row.email_reply_to,
      smtpHost: row.smtp_host,
      smtpPort: row.smtp_port,
      smtpUser: row.smtp_user,
      smtpPassword: row.smtp_password,
      smtpSecure: row.smtp_secure,
      smsEnabled: row.sms_enabled,
      smsProvider: row.sms_provider,
      smsAccountSid: row.sms_account_sid,
      smsAuthToken: row.sms_auth_token,
      smsFrom: row.sms_from,
      pushEnabled: row.push_enabled,
      pushProvider: row.push_provider,
      fcmServerKey: row.fcm_server_key,
      apnsKey: row.apns_key,
      apnsKeyId: row.apns_key_id,
      apnsTeamId: row.apns_team_id,
      webhookEnabled: row.webhook_enabled,
      webhookUrls: row.webhook_urls || [],
      webhookSecret: row.webhook_secret,
      emailRateLimit: row.email_rate_limit,
      smsRateLimit: row.sms_rate_limit,
      pushRateLimit: row.push_rate_limit,
      defaultMaxRetries: row.default_max_retries,
      retryBackoffMultiplier: parseFloat(row.retry_backoff_multiplier),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const notificationService = new NotificationService();