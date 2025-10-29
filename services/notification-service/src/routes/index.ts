import { Router } from 'express';
import { notificationService } from '../services/notification';
import { templateService } from '../services/template';
import { logger } from '../utils/logger';
import {
  NotificationType,
  NotificationPriority,
  TemplateType,
  TemplateStatus
} from '../models/types';

// Simple validation functions
const validateCreateNotification = (data: any) => {
  if (!data.type || !Object.values(NotificationType).includes(data.type)) {
    throw new Error('Valid notification type is required');
  }
  if (!data.message) {
    throw new Error('Message is required');
  }
  if (!data.recipientType) {
    throw new Error('Recipient type is required');
  }
  return data;
};

const validateCreateTemplate = (data: any) => {
  if (!data.name) {
    throw new Error('Template name is required');
  }
  if (!data.bodyTemplate) {
    throw new Error('Template body is required');
  }
  if (!data.notificationType || !Object.values(NotificationType).includes(data.notificationType)) {
    throw new Error('Valid notification type is required');
  }
  return data;
};

const validateBulkNotification = (data: any) => {
  if (!data.type || !Object.values(NotificationType).includes(data.type)) {
    throw new Error('Valid notification type is required');
  }
  if (!data.recipients || !Array.isArray(data.recipients) || data.recipients.length === 0) {
    throw new Error('Recipients array is required and must not be empty');
  }
  return data;
};

const router = Router();

// Middleware for extracting store ID (in real implementation, this would come from auth)
const extractStoreId = (req: any, res: any, next: any) => {
  const storeId = req.headers['x-store-id'] || req.query.storeId;
  if (!storeId) {
    return res.status(400).json({ error: 'Store ID is required' });
  }
  req.storeId = storeId;
  next();
};

// Apply store ID middleware to all routes
router.use(extractStoreId);

// Initialize providers for store
router.post('/initialize', async (req: any, res: any) => {
  try {
    await notificationService.initializeProviders(req.storeId);
    res.json({ message: 'Notification providers initialized successfully' });
  } catch (error: any) {
    logger.error('Error initializing providers:', error);
    res.status(500).json({ error: 'Failed to initialize providers' });
  }
});

// Notification Routes
router.post('/notifications', async (req: any, res: any) => {
  try {
    const validatedData = validateCreateNotification(req.body);
    
    // Convert datetime string to Date if provided
    const dto = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const notification = await notificationService.createNotification(req.storeId, dto);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    logger.error('Error creating notification:', error);
    res.status(400).json({ error: error.message || 'Failed to create notification' });
  }
});

router.post('/notifications/bulk', async (req: any, res: any) => {
  try {
    const validatedData = validateBulkNotification(req.body);
    
    // Convert datetime string to Date if provided
    const dto = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const result = await notificationService.sendBulkNotifications(req.storeId, dto);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error creating bulk notifications:', error);
    res.status(400).json({ error: error.message || 'Failed to create bulk notifications' });
  }
});

// Template Routes
router.post('/templates', async (req: any, res: any) => {
  try {
    const validatedData = validateCreateTemplate(req.body);
    const template = await templateService.createTemplate(req.storeId, validatedData);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error: any) {
    logger.error('Error creating template:', error);
    res.status(400).json({ error: error.message || 'Failed to create template' });
  }
});

router.get('/templates', async (req: any, res: any) => {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
      type: req.query.type,
      status: req.query.status,
      category: req.query.category,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      includeSystem: req.query.includeSystem !== 'false'
    };

    const result = await templateService.getTemplates(req.storeId, query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/templates/:templateId', async (req: any, res: any) => {
  try {
    const template = await templateService.getTemplate(req.params.templateId, req.storeId);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    logger.error('Error fetching template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.put('/templates/:templateId', async (req: any, res: any) => {
  try {
    // Simple validation for update - just check required fields if provided
    const template = await templateService.updateTemplate(
      req.params.templateId,
      req.storeId,
      req.body
    );
    
    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    logger.error('Error updating template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.status(400).json({ error: error.message || 'Failed to update template' });
  }
});

router.delete('/templates/:templateId', async (req: any, res: any) => {
  try {
    await templateService.deleteTemplate(req.params.templateId, req.storeId);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

router.post('/templates/:templateId/render', async (req: any, res: any) => {
  try {
    const data = req.body.data || {};
    const result = await templateService.renderTemplate(
      req.params.templateId,
      req.storeId,
      data
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error rendering template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.status(500).json({ error: 'Failed to render template' });
  }
});

router.post('/templates/preview', async (req: any, res: any) => {
  try {
    const { template, subject, data, type } = req.body;
    
    if (!template || !type) {
      return res.status(400).json({ error: 'Template and type are required' });
    }
    
    const result = await templateService.previewTemplate(
      template,
      subject,
      data || {},
      type
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Queue management routes
router.post('/queue/process', async (req: any, res: any) => {
  try {
    await notificationService.processNotificationQueue();
    res.json({ 
      success: true, 
      message: 'Queue processing initiated' 
    });
  } catch (error: any) {
    logger.error('Error processing queue:', error);
    res.status(500).json({ error: 'Failed to process queue' });
  }
});

// Settings routes
router.get('/settings', async (req: any, res: any) => {
  try {
    const settings = await notificationService.getNotificationSettings(req.storeId);
    
    // Remove sensitive information
    const sanitizedSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? '***' : undefined,
      smsAuthToken: settings.smsAuthToken ? '***' : undefined,
      fcmServerKey: settings.fcmServerKey ? '***' : undefined,
      apnsKey: settings.apnsKey ? '***' : undefined,
      webhookSecret: settings.webhookSecret ? '***' : undefined
    };
    
    res.json({
      success: true,
      data: sanitizedSettings
    });
  } catch (error: any) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// System routes
router.post('/system/create-templates', async (req: any, res: any) => {
  try {
    await templateService.createSystemTemplates();
    res.json({ 
      success: true, 
      message: 'System templates created successfully' 
    });
  } catch (error: any) {
    logger.error('Error creating system templates:', error);
    res.status(500).json({ error: 'Failed to create system templates' });
  }
});

// Health check
router.get('/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

export default router;