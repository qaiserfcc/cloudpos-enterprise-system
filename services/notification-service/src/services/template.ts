import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import {
  NotificationTemplate,
  NotificationType,
  TemplateStatus,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateSearchQuery
} from '../models/types';

export class TemplateService {
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.registerHelpers();
    logger.info('Template service initialized');
  }

  private registerHelpers(): void {
    // Register Handlebars helpers for common operations
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    Handlebars.registerHelper('formatDate', (date: Date, format: string = 'short') => {
      const options: Intl.DateTimeFormatOptions = {};
      
      switch (format) {
        case 'short':
          options.year = 'numeric';
          options.month = 'short';
          options.day = 'numeric';
          break;
        case 'long':
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          options.weekday = 'long';
          break;
        case 'time':
          options.hour = '2-digit';
          options.minute = '2-digit';
          break;
        default:
          options.year = 'numeric';
          options.month = 'short';
          options.day = 'numeric';
      }
      
      return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    });

    Handlebars.registerHelper('formatPhone', (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
    });

    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase() || '');
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase() || '');
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase() || '';
    });

    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifNotEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('math', (left: number, operator: string, right: number) => {
      switch (operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 0;
        case '%': return left % right;
        default: return left;
      }
    });
  }

  async createTemplate(storeId: string, dto: CreateTemplateDto): Promise<NotificationTemplate> {
    try {
      const templateId = uuidv4();

      // Validate template syntax
      await this.validateTemplate(dto.bodyTemplate, dto.notificationType);

      const result = await databaseService.query(`
        INSERT INTO notification_templates (
          id, store_id, name, type, subject, template, description, variables,
          default_data, tags, status, is_system, category, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        templateId,
        storeId,
        dto.name,
        dto.notificationType,
        dto.subject || null,
        dto.bodyTemplate,
        dto.description || null,
        JSON.stringify(dto.variables || []),
        JSON.stringify({}),
        dto.tags || [],
        dto.isActive ? TemplateStatus.ACTIVE : TemplateStatus.INACTIVE,
        false,
        'general',
        1
      ]);

      // Clear compiled template cache for this template
      this.clearCompiledTemplate(templateId);

      const template = this.mapTemplate(result.rows[0]);

      logger.info('Template created successfully', {
        templateId,
        storeId,
        name: dto.name,
        type: dto.type
      });

      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, storeId: string, dto: UpdateTemplateDto): Promise<NotificationTemplate> {
    try {
      // Validate template syntax if template content is being updated
      if (dto.bodyTemplate) {
        const existingTemplate = await this.getTemplate(templateId, storeId);
        // Map TemplateType to NotificationType for validation
        const notificationType = existingTemplate.type as unknown as NotificationType;
        await this.validateTemplate(dto.bodyTemplate, notificationType);
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (dto.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(dto.name);
      }
      if (dto.subject !== undefined) {
        updateFields.push(`subject = $${paramCount++}`);
        updateValues.push(dto.subject);
      }
      if (dto.bodyTemplate !== undefined) {
        updateFields.push(`template = $${paramCount++}`);
        updateValues.push(dto.bodyTemplate);
      }
      if (dto.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(dto.description);
      }
      if (dto.variables !== undefined) {
        updateFields.push(`variables = $${paramCount++}`);
        updateValues.push(JSON.stringify(dto.variables));
      }
      if (dto.tags !== undefined) {
        updateFields.push(`tags = $${paramCount++}`);
        updateValues.push(dto.tags);
      }
      if (dto.isActive !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(dto.isActive ? TemplateStatus.ACTIVE : TemplateStatus.INACTIVE);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(templateId, storeId);

      const result = await databaseService.query(`
        UPDATE notification_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND store_id = $${paramCount++}
        RETURNING *
      `, updateValues);

      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      // Clear compiled template cache
      this.clearCompiledTemplate(templateId);

      const template = this.mapTemplate(result.rows[0]);

      logger.info('Template updated successfully', {
        templateId,
        storeId,
        updatedFields: Object.keys(dto)
      });

      return template;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  async getTemplate(templateId: string, storeId: string): Promise<NotificationTemplate> {
    const result = await databaseService.query(`
      SELECT * FROM notification_templates 
      WHERE id = $1 AND (store_id = $2 OR is_system = true)
    `, [templateId, storeId]);

    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    return this.mapTemplate(result.rows[0]);
  }

  async getTemplates(storeId: string, query: TemplateSearchQuery = {}): Promise<{
    templates: NotificationTemplate[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 20,
      type,
      status,
      category,
      tags,
      search,
      includeSystem = true
    } = query;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Base condition for store access
    if (includeSystem) {
      conditions.push(`(store_id = $${paramCount++} OR is_system = true)`);
    } else {
      conditions.push(`store_id = $${paramCount++}`);
    }
    values.push(storeId);

    if (type) {
      conditions.push(`type = $${paramCount++}`);
      values.push(type);
    }

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (tags && tags.length > 0) {
      conditions.push(`tags && $${paramCount++}`);
      values.push(tags);
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await databaseService.query(`
      SELECT COUNT(*) as total FROM notification_templates ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const templatesResult = await databaseService.query(`
      SELECT * FROM notification_templates 
      ${whereClause}
      ORDER BY is_system DESC, created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `, [...values, pageSize, offset]);

    const templates = templatesResult.rows.map((row: any) => this.mapTemplate(row));

    return {
      templates,
      total,
      page,
      pageSize
    };
  }

  async renderTemplate(
    templateId: string,
    storeId: string,
    data: Record<string, any>
  ): Promise<{ subject?: string; content: string }> {
    try {
      const template = await this.getTemplate(templateId, storeId);

      if (template.status !== TemplateStatus.ACTIVE) {
        throw new Error('Template is not active');
      }

      // Merge template default data with provided data
      const mergedData = { ...template.defaultData, ...data };

      // Compile and render subject if exists
      let renderedSubject: string | undefined;
      if (template.subject) {
        const subjectTemplate = this.getCompiledTemplate(`${templateId}_subject`, template.subject);
        renderedSubject = subjectTemplate(mergedData);
      }

      // Compile and render template content
      const contentTemplate = this.getCompiledTemplate(templateId, template.template);
      const renderedContent = contentTemplate(mergedData);

      return {
        subject: renderedSubject,
        content: renderedContent
      };
    } catch (error) {
      logger.error('Error rendering template:', error);
      throw error;
    }
  }

  async previewTemplate(
    template: string,
    subject: string | undefined,
    data: Record<string, any>,
    type: NotificationType
  ): Promise<{ subject?: string; content: string }> {
    try {
      // Validate template syntax
      await this.validateTemplate(template, type);

      // Render subject if provided
      let renderedSubject: string | undefined;
      if (subject) {
        const subjectTemplate = Handlebars.compile(subject);
        renderedSubject = subjectTemplate(data);
      }

      // Render template content
      const contentTemplate = Handlebars.compile(template);
      const renderedContent = contentTemplate(data);

      return {
        subject: renderedSubject,
        content: renderedContent
      };
    } catch (error) {
      logger.error('Error previewing template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string, storeId: string): Promise<void> {
    try {
      // Check if template is used in any notifications
      const usageResult = await databaseService.query(
        'SELECT COUNT(*) as count FROM notifications WHERE template_id = $1',
        [templateId]
      );

      if (parseInt(usageResult.rows[0].count) > 0) {
        // Soft delete by marking as inactive
        await databaseService.query(
          'UPDATE notification_templates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3',
          [TemplateStatus.INACTIVE, templateId, storeId]
        );
      } else {
        // Hard delete if not used
        const result = await databaseService.query(
          'DELETE FROM notification_templates WHERE id = $1 AND store_id = $2',
          [templateId, storeId]
        );

        if (result.rowCount === 0) {
          throw new Error('Template not found');
        }
      }

      // Clear compiled template cache
      this.clearCompiledTemplate(templateId);

      logger.info('Template deleted successfully', { templateId, storeId });
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  async createSystemTemplates(): Promise<void> {
    const systemTemplates = [
      {
        name: 'Order Confirmation',
        type: NotificationType.EMAIL,
        category: 'order',
        subject: 'Order Confirmation - #{{order.number}}',
        template: `
          <h2>Thank you for your order!</h2>
          <p>Hi {{customer.name}},</p>
          <p>We've received your order and it's being processed.</p>
          
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> {{order.number}}</p>
          <p><strong>Order Date:</strong> {{formatDate order.createdAt}}</p>
          <p><strong>Total:</strong> {{formatCurrency order.total order.currency}}</p>
          
          <h3>Items</h3>
          {{#each order.items}}
          <div style="margin-bottom: 10px;">
            <strong>{{name}}</strong> - Qty: {{quantity}} - {{formatCurrency price order.currency}}
          </div>
          {{/each}}
          
          <p>We'll send you another email when your order ships.</p>
        `,
        variables: ['customer.name', 'order.number', 'order.createdAt', 'order.total', 'order.currency', 'order.items'],
        description: 'Email sent to customers when they place an order'
      },
      {
        name: 'Payment Successful',
        type: NotificationType.SMS,
        category: 'payment',
        template: 'Payment of {{formatCurrency payment.amount payment.currency}} has been processed successfully for order #{{order.number}}. Thank you!',
        variables: ['payment.amount', 'payment.currency', 'order.number'],
        description: 'SMS sent when payment is successfully processed'
      },
      {
        name: 'Low Stock Alert',
        type: NotificationType.EMAIL,
        category: 'inventory',
        subject: 'Low Stock Alert - {{product.name}}',
        template: `
          <h2>Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          
          <p><strong>Product:</strong> {{product.name}}</p>
          <p><strong>SKU:</strong> {{product.sku}}</p>
          <p><strong>Current Stock:</strong> {{product.currentStock}}</p>
          <p><strong>Minimum Threshold:</strong> {{product.minThreshold}}</p>
          
          <p>Please restock this item to avoid stockouts.</p>
        `,
        variables: ['product.name', 'product.sku', 'product.currentStock', 'product.minThreshold'],
        description: 'Email sent to staff when product stock is low'
      },
      {
        name: 'Welcome New Customer',
        type: NotificationType.EMAIL,
        category: 'customer',
        subject: 'Welcome to {{store.name}}!',
        template: `
          <h2>Welcome to {{store.name}}!</h2>
          <p>Hi {{customer.name}},</p>
          <p>Thank you for joining us! We're excited to have you as a customer.</p>
          
          <p>Here's what you can expect:</p>
          <ul>
            <li>Exclusive offers and discounts</li>
            <li>Early access to new products</li>
            <li>Personalized recommendations</li>
          </ul>
          
          <p>Start shopping now and enjoy your experience with us!</p>
        `,
        variables: ['store.name', 'customer.name'],
        description: 'Welcome email for new customers'
      }
    ];

    for (const templateData of systemTemplates) {
      try {
        await databaseService.query(`
          INSERT INTO notification_templates (
            id, store_id, name, type, subject, template, description, variables,
            category, status, is_system, version
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (name, type, is_system) WHERE is_system = true DO NOTHING
        `, [
          uuidv4(),
          null, // System templates don't belong to a specific store
          templateData.name,
          templateData.type,
          templateData.subject || null,
          templateData.template,
          templateData.description,
          JSON.stringify(templateData.variables),
          templateData.category,
          TemplateStatus.ACTIVE,
          true,
          1
        ]);
      } catch (error) {
        logger.error(`Error creating system template ${templateData.name}:`, error);
      }
    }

    logger.info('System templates created successfully');
  }

  private async validateTemplate(template: string, type: NotificationType): Promise<void> {
    try {
      // Compile template to check for syntax errors
      Handlebars.compile(template);

      // Additional validation based on type
      if (type === NotificationType.SMS) {
        // SMS templates should be concise
        const rendered = Handlebars.compile(template)({});
        if (rendered.length > 160) {
          logger.warn('SMS template may exceed standard length limit', { length: rendered.length });
        }
      }
    } catch (error: any) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }

  private getCompiledTemplate(cacheKey: string, template: string): HandlebarsTemplateDelegate {
    if (!this.compiledTemplates.has(cacheKey)) {
      this.compiledTemplates.set(cacheKey, Handlebars.compile(template));
    }
    return this.compiledTemplates.get(cacheKey)!;
  }

  private clearCompiledTemplate(templateId: string): void {
    this.compiledTemplates.delete(templateId);
    this.compiledTemplates.delete(`${templateId}_subject`);
  }

  private mapTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      type: row.type,
      subject: row.subject,
      template: row.template,
      description: row.description,
      variables: row.variables || [],
      defaultData: row.default_data || {},
      tags: row.tags || [],
      status: row.status,
      isSystem: row.is_system,
      category: row.category,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const templateService = new TemplateService();