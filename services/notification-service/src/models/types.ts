import { Decimal } from 'decimal.js';

// Notification Types
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook'
}

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DeliveryStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  REJECTED = 'rejected'
}

// Core Interfaces
export interface Notification {
  id: string;
  storeId: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  templateId?: string;
  
  // Recipients
  recipientId?: string;
  recipientType: 'customer' | 'user' | 'store' | 'system';
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  
  // Content
  subject?: string;
  message: string;
  htmlContent?: string;
  data?: Record<string, any>;
  
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  
  // Tracking
  trackingId?: string;
  externalId?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  metadata?: Record<string, any>;
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  storeId: string | null;
  name: string;
  type: TemplateType;
  subject?: string;
  template: string;
  description?: string;
  variables: string[];
  defaultData: Record<string, any>;
  tags: string[];
  status: TemplateStatus;
  isSystem: boolean;
  category: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  storeId: string;
  notificationId: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: DeliveryStatus;
  
  // Queue Management
  queuedAt: Date;
  processingAt?: Date;
  processedAt?: Date;
  
  // Retry Logic
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  
  // Error Handling
  errorMessage?: string;
  errorCode?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDelivery {
  id: string;
  storeId: string;
  notificationId: string;
  queueId: string;
  
  // Delivery Details
  provider: string;
  providerMessageId?: string;
  status: DeliveryStatus;
  deliveredAt?: Date;
  
  // Tracking
  opens: number;
  clicks: number;
  bounces: number;
  
  // Provider Response
  providerResponse?: Record<string, any>;
  errorMessage?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  id: string;
  storeId: string;
  notificationId: string;
  type: string;
  
  // Event Data
  eventData: Record<string, any>;
  timestamp: Date;
  
  // Source
  source: string;
  sourceId?: string;
  
  createdAt: Date;
}

export interface NotificationSettings {
  id: string;
  storeId: string;
  
  // Email Settings
  emailEnabled: boolean;
  emailFrom: string;
  emailReplyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  
  // SMS Settings
  smsEnabled: boolean;
  smsProvider: string;
  smsAccountSid?: string;
  smsAuthToken?: string;
  smsFrom?: string;
  
  // Push Settings
  pushEnabled: boolean;
  pushProvider: string;
  fcmServerKey?: string;
  apnsKey?: string;
  apnsKeyId?: string;
  apnsTeamId?: string;
  
  // Webhook Settings
  webhookEnabled: boolean;
  webhookUrls: string[];
  webhookSecret?: string;
  
  // Rate Limiting
  emailRateLimit: number;
  smsRateLimit: number;
  pushRateLimit: number;
  
  // Retry Settings
  defaultMaxRetries: number;
  retryBackoffMultiplier: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  id: string;
  storeId: string;
  date: Date;
  
  // Volume Stats
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  
  // Type Breakdown
  emailSent: number;
  emailDelivered: number;
  emailOpened: number;
  emailClicked: number;
  emailBounced: number;
  
  smsSent: number;
  smsDelivered: number;
  smsFailed: number;
  
  pushSent: number;
  pushDelivered: number;
  pushOpened: number;
  pushClicked: number;
  
  // Performance Metrics
  averageDeliveryTime: number;
  deliveryRate: Decimal;
  openRate: Decimal;
  clickRate: Decimal;
  bounceRate: Decimal;
  
  createdAt: Date;
  updatedAt: Date;
}

// DTOs and Request/Response Types
export interface CreateNotificationDto {
  type: NotificationType;
  priority?: NotificationPriority;
  templateId?: string;
  
  recipientId?: string;
  recipientType: 'customer' | 'user' | 'store' | 'system';
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceToken?: string;
  
  subject?: string;
  message: string;
  htmlContent?: string;
  data?: Record<string, any>;
  
  scheduledAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  type: TemplateType;
  notificationType: NotificationType;
  
  subject?: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  variables: string[];
  
  isActive?: boolean;
  isDefault?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  subject?: string;
  bodyTemplate?: string;
  htmlTemplate?: string;
  variables?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SendBulkNotificationDto {
  type: NotificationType;
  priority?: NotificationPriority;
  templateId?: string;
  
  recipients: Array<{
    recipientId?: string;
    recipientType: 'customer' | 'user' | 'store' | 'system';
    recipientEmail?: string;
    recipientPhone?: string;
    recipientDeviceToken?: string;
    data?: Record<string, any>;
  }>;
  
  subject?: string;
  message?: string;
  htmlContent?: string;
  globalData?: Record<string, any>;
  
  scheduledAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface NotificationSearchQuery {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  recipientType?: string;
  recipientId?: string;
  templateId?: string;
  tags?: string[];
  
  createdFrom?: Date;
  createdTo?: Date;
  sentFrom?: Date;
  sentTo?: Date;
  
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateSearchQuery {
  page?: number;
  pageSize?: number;
  type?: TemplateType;
  status?: TemplateStatus;
  category?: string;
  tags?: string[];
  search?: string;
  includeSystem?: boolean;
}

export interface NotificationStatsQuery {
  startDate: Date;
  endDate: Date;
  type?: NotificationType;
  groupBy?: 'day' | 'week' | 'month';
}

export interface NotificationStatsResponse {
  period: {
    startDate: Date;
    endDate: Date;
  };
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: Decimal;
    openRate: Decimal;
    clickRate: Decimal;
    bounceRate: Decimal;
  };
  byType: Record<NotificationType, {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: Decimal;
  }>;
  timeline: Array<{
    date: Date;
    sent: number;
    delivered: number;
    failed: number;
  }>;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    deliveryRate: Decimal;
    openRate: Decimal;
  }>;
}

// Provider Interfaces
export interface EmailProvider {
  name: string;
  sendEmail(params: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }>;
}

export interface SmsProvider {
  name: string;
  sendSms(params: {
    from: string;
    to: string;
    message: string;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }>;
}

export interface PushProvider {
  name: string;
  sendPush(params: {
    to: string;
    title?: string;
    body: string;
    data?: Record<string, any>;
    trackingId?: string;
  }): Promise<{ messageId: string; providerResponse: any }>;
}

// Webhook Types
export interface WebhookPayload {
  event: string;
  notificationId: string;
  storeId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  storeId: string;
  url: string;
  payload: WebhookPayload;
  status: DeliveryStatus;
  responseCode?: number;
  responseBody?: string;
  retryCount: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

// Campaign Types
export interface NotificationCampaign {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  
  // Campaign Settings
  type: NotificationType;
  templateId: string;
  audienceSegments: string[];
  
  // Scheduling
  scheduledAt?: Date;
  startDate?: Date;
  endDate?: Date;
  timezone: string;
  
  // Status
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  
  // Tracking
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}