import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import { analyticsService } from './analytics';
import {
  Alert,
  AlertType,
  AlertStatus,
  AlertConfig,
  AlertInstance,
  AlertRule,
  ThresholdConfig,
  TrendConfig,
  TimeGranularity,
  AnalyticsQuery
} from '../models/types';

// Extended types for alert service
interface AlertServiceAlert extends Alert {
  config: AlertConfig;
  rules: AlertRule[];
  notificationChannels: string[];
  isEnabled: boolean;
  lastTriggeredAt?: Date;
}

interface AlertServiceInstance extends AlertInstance {
  status: 'triggered' | 'resolved';
  data: Record<string, any>;
  metadata: Record<string, any>;
  resolvedBy?: string;
}

export class AlertService {
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    logger.info('Alert service initialized');
    this.startAlertChecking();
  }

  async createAlert(
    storeId: string,
    userId: string,
    config: AlertConfig
  ): Promise<AlertServiceAlert> {
    try {
      const alertId = uuidv4();

      const alert: AlertServiceAlert = {
        id: alertId,
        storeId,
        name: config.name,
        description: config.description,
        type: config.type,
        status: AlertStatus.ACTIVE,
        config,
        rules: config.rules || [],
        notificationChannels: config.notificationChannels || ['email'],
        isEnabled: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Base Alert interface fields
        condition: {
          operator: 'gt',
          value: config.threshold || new Decimal(0)
        },
        actions: [],
        checkInterval: 300,
        isActive: true,
        tags: [],
        metadata: {}
      };

      await this.saveAlert(alert);

      logger.info('Alert created successfully', {
        alertId,
        storeId,
        type: config.type,
        name: config.name
      });

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  async getAlert(alertId: string): Promise<AlertServiceAlert | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM alerts WHERE id = $1',
        [alertId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.deserializeAlert(result.rows[0]);
    } catch (error) {
      logger.error('Error retrieving alert:', error);
      throw error;
    }
  }

  async updateAlert(
    alertId: string,
    updates: Partial<AlertServiceAlert>
  ): Promise<AlertServiceAlert> {
    try {
      const alert = await this.getAlert(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      const updatedAlert = {
        ...alert,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveAlert(updatedAlert);

      logger.info('Alert updated successfully', {
        alertId,
        updates: Object.keys(updates)
      });

      return updatedAlert;
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw error;
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      // Delete alert instances first
      await databaseService.query(
        'DELETE FROM alert_instances WHERE alert_id = $1',
        [alertId]
      );

      // Delete alert
      await databaseService.query(
        'DELETE FROM alerts WHERE id = $1',
        [alertId]
      );

      logger.info('Alert deleted successfully', { alertId });
    } catch (error) {
      logger.error('Error deleting alert:', error);
      throw error;
    }
  }

  async listAlerts(
    storeId: string,
    options: {
      type?: AlertType;
      status?: AlertStatus;
      isEnabled?: boolean;
    } = {}
  ): Promise<AlertServiceAlert[]> {
    try {
      let whereClause = 'WHERE store_id = $1';
      const params: any[] = [storeId];

      if (options.type) {
        whereClause += ' AND type = $2';
        params.push(options.type);
      }

      if (options.status) {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(options.status);
      }

      if (options.isEnabled !== undefined) {
        whereClause += ` AND is_enabled = $${params.length + 1}`;
        params.push(options.isEnabled);
      }

      const result = await databaseService.query(
        `SELECT * FROM alerts ${whereClause} ORDER BY created_at DESC`,
        params
      );

      return result.rows.map((row: any) => this.deserializeAlert(row));
    } catch (error) {
      logger.error('Error listing alerts:', error);
      throw error;
    }
  }

  async getAlertInstances(
    alertId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'triggered' | 'resolved';
    } = {}
  ): Promise<{ instances: AlertServiceInstance[]; total: number }> {
    try {
      const { limit = 20, offset = 0, status } = options;

      let whereClause = 'WHERE alert_id = $1';
      const params: any[] = [alertId];

      if (status) {
        whereClause += ' AND status = $2';
        params.push(status);
      }

      // Get total count
      const countResult = await databaseService.query(
        `SELECT COUNT(*) as total FROM alert_instances ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);

      // Get instances
      const result = await databaseService.query(
        `SELECT * FROM alert_instances ${whereClause} ORDER BY triggered_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const instances = result.rows.map((row: any) => this.deserializeAlertInstance(row));

      return { instances, total };
    } catch (error) {
      logger.error('Error getting alert instances:', error);
      throw error;
    }
  }

  async checkAlerts(storeId?: string): Promise<void> {
    try {
      const whereClause = storeId ? 'WHERE store_id = $1 AND is_enabled = true' : 'WHERE is_enabled = true';
      const params = storeId ? [storeId] : [];

      const result = await databaseService.query(
        `SELECT * FROM alerts ${whereClause}`,
        params
      );

      const alerts = result.rows.map((row: any) => this.deserializeAlert(row));

      for (const alert of alerts) {
        await this.evaluateAlert(alert);
      }

      logger.debug('Alert check completed', {
        storeId,
        alertCount: alerts.length
      });
    } catch (error) {
      logger.error('Error during alert check:', error);
    }
  }

  async resolveAlert(instanceId: string, resolvedBy: string): Promise<void> {
    try {
      await databaseService.query(`
        UPDATE alert_instances 
        SET status = 'resolved', resolved_at = $1, resolved_by = $2
        WHERE id = $3
      `, [new Date(), resolvedBy, instanceId]);

      logger.info('Alert instance resolved', { instanceId, resolvedBy });
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  private async evaluateAlert(alert: AlertServiceAlert): Promise<void> {
    try {
      switch (alert.type) {
        case AlertType.THRESHOLD:
          await this.evaluateThresholdAlert(alert);
          break;
        case AlertType.TREND:
          await this.evaluateTrendAlert(alert);
          break;
        case AlertType.ANOMALY:
          await this.evaluateAnomalyAlert(alert);
          break;
        default:
          logger.warn('Unknown alert type', { alertId: alert.id, type: alert.type });
      }
    } catch (error) {
      logger.error('Error evaluating alert:', { alertId: alert.id, error });
    }
  }

  private async evaluateThresholdAlert(alert: AlertServiceAlert): Promise<void> {
    const config = alert.config as ThresholdConfig;
    
    // Get current metric value
    const currentValue = await this.getCurrentMetricValue(
      alert.storeId,
      config.metric,
      config.timeWindow || '1h'
    );

    let shouldTrigger = false;
    let message = '';

    switch (config.operator) {
      case 'greater_than':
        shouldTrigger = currentValue.gt(config.threshold);
        message = `${config.metric} (${currentValue}) is greater than threshold (${config.threshold})`;
        break;
      case 'less_than':
        shouldTrigger = currentValue.lt(config.threshold);
        message = `${config.metric} (${currentValue}) is less than threshold (${config.threshold})`;
        break;
      case 'equals':
        shouldTrigger = currentValue.eq(config.threshold);
        message = `${config.metric} (${currentValue}) equals threshold (${config.threshold})`;
        break;
    }

    if (shouldTrigger) {
      await this.triggerAlert(alert, {
        value: currentValue,
        threshold: config.threshold,
        message
      });
    }
  }

  private async evaluateTrendAlert(alert: AlertServiceAlert): Promise<void> {
    const config = alert.config as TrendConfig;
    
    // Get trend data for the specified period
    const trendData = await this.getTrendData(
      alert.storeId,
      config.metric,
      config.period,
      config.granularity
    );

    if (trendData.length < 2) {
      return; // Not enough data for trend analysis
    }

    // Calculate trend direction and magnitude
    const firstValue = trendData[0].value;
    const lastValue = trendData[trendData.length - 1].value;
    const change = lastValue.minus(firstValue);
    const changePercent = firstValue.gt(0) ? change.div(firstValue).mul(100) : new Decimal(0);

    let shouldTrigger = false;
    let message = '';

    switch (config.direction) {
      case 'increasing':
        shouldTrigger = changePercent.gte(config.threshold);
        message = `${config.metric} has increased by ${changePercent.toFixed(2)}% (threshold: ${config.threshold}%)`;
        break;
      case 'decreasing':
        shouldTrigger = changePercent.lte(config.threshold.neg());
        message = `${config.metric} has decreased by ${changePercent.abs().toFixed(2)}% (threshold: ${config.threshold}%)`;
        break;
    }

    if (shouldTrigger) {
      await this.triggerAlert(alert, {
        value: lastValue,
        change: changePercent,
        message
      });
    }
  }

  private async evaluateAnomalyAlert(alert: AlertServiceAlert): Promise<void> {
    // Simplified anomaly detection - in production, would use more sophisticated algorithms
    const config = alert.config;
    
    const historicalData = await this.getHistoricalData(
      alert.storeId,
      config.metric,
      30 // 30 days of historical data
    );

    if (historicalData.length < 7) {
      return; // Not enough historical data
    }

    const currentValue = await this.getCurrentMetricValue(
      alert.storeId,
      config.metric,
      '1h'
    );

    // Calculate mean and standard deviation
    const values = historicalData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum.plus(val), new Decimal(0)).div(values.length);
    const variance = values.reduce((sum, val) => sum.plus(val.minus(mean).pow(2)), new Decimal(0)).div(values.length);
    const stdDev = variance.sqrt();

    // Check if current value is an anomaly (more than 2 standard deviations from mean)
    const deviations = currentValue.minus(mean).abs().div(stdDev);
    
    if (deviations.gt(2)) {
      await this.triggerAlert(alert, {
        value: currentValue,
        mean,
        deviations,
        message: `${config.metric} (${currentValue}) is ${deviations.toFixed(2)} standard deviations from the mean (${mean})`
      });
    }
  }

  private async getCurrentMetricValue(
    storeId: string,
    metric: string,
    timeWindow: string
  ): Promise<Decimal> {
    const endTime = new Date();
    const startTime = this.parseTimeWindow(timeWindow, endTime);

    const analyticsQuery: AnalyticsQuery = {
      dateFrom: startTime,
      dateTo: endTime,
      granularity: TimeGranularity.HOUR
    };

    switch (metric) {
      case 'revenue':
        const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, analyticsQuery);
        return salesAnalytics.overview.totalRevenue;
      
      case 'orders':
        const orderAnalytics = await analyticsService.getSalesAnalytics(storeId, analyticsQuery);
        return new Decimal(orderAnalytics.overview.totalOrders);
      
      case 'customers':
        const customerAnalytics = await analyticsService.getCustomerAnalytics(storeId, analyticsQuery);
        return new Decimal(customerAnalytics.overview.newCustomers);
      
      case 'inventory_value':
        const inventoryAnalytics = await analyticsService.getInventoryAnalytics(storeId);
        return inventoryAnalytics.overview.totalValue;
      
      default:
        return new Decimal(0);
    }
  }

  private async getTrendData(
    storeId: string,
    metric: string,
    period: number,
    granularity: TimeGranularity
  ): Promise<Array<{ date: Date; value: Decimal }>> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - period * 24 * 60 * 60 * 1000);

    const analyticsQuery: AnalyticsQuery = {
      dateFrom: startTime,
      dateTo: endTime,
      granularity
    };

    const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, analyticsQuery);
    
    switch (metric) {
      case 'revenue':
        return salesAnalytics.trends.map(t => ({
          date: t.date,
          value: t.revenue
        }));
      case 'orders':
        return salesAnalytics.trends.map(t => ({
          date: t.date,
          value: new Decimal(t.orders)
        }));
      default:
        return [];
    }
  }

  private async getHistoricalData(
    storeId: string,
    metric: string,
    days: number
  ): Promise<Array<{ date: Date; value: Decimal }>> {
    return await this.getTrendData(storeId, metric, days, TimeGranularity.DAY);
  }

  private parseTimeWindow(timeWindow: string, fromDate: Date): Date {
    const match = timeWindow.match(/^(\d+)([hdwmy])$/);
    if (!match) {
      throw new Error(`Invalid time window format: ${timeWindow}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const date = new Date(fromDate);

    switch (unit) {
      case 'h':
        date.setHours(date.getHours() - value);
        break;
      case 'd':
        date.setDate(date.getDate() - value);
        break;
      case 'w':
        date.setDate(date.getDate() - value * 7);
        break;
      case 'm':
        date.setMonth(date.getMonth() - value);
        break;
      case 'y':
        date.setFullYear(date.getFullYear() - value);
        break;
    }

    return date;
  }

  private async triggerAlert(
    alert: AlertServiceAlert,
    context: {
      value: Decimal;
      threshold?: Decimal;
      change?: Decimal;
      mean?: Decimal;
      deviations?: Decimal;
      message: string;
    }
  ): Promise<void> {
    try {
      // Check if this alert was recently triggered to avoid spam
      const recentInstance = await databaseService.query(`
        SELECT id FROM alert_instances 
        WHERE alert_id = $1 AND status = 'triggered' 
        AND triggered_at > $2
        ORDER BY triggered_at DESC 
        LIMIT 1
      `, [alert.id, new Date(Date.now() - 30 * 60 * 1000)]); // 30 minutes

      if (recentInstance.rows.length > 0) {
        return; // Alert already triggered recently
      }

      // Create alert instance
      const instanceId = uuidv4();
      const instance: AlertServiceInstance = {
        id: instanceId,
        alertId: alert.id,
        storeId: alert.storeId,
        triggeredAt: new Date(),
        triggerValue: context.value,
        threshold: context.threshold || new Decimal(0),
        message: context.message,
        severity: 'medium',
        actionsExecuted: [],
        status: 'triggered',
        data: {
          value: context.value.toString(),
          threshold: context.threshold?.toString(),
          change: context.change?.toString(),
          message: context.message
        },
        metadata: {
          storeId: alert.storeId,
          alertName: alert.name,
          alertType: alert.type
        }
      };

      await this.saveAlertInstance(instance);

      // Update alert status
      await this.updateAlert(alert.id, { 
        status: AlertStatus.TRIGGERED,
        lastTriggered: new Date()
      });

      // Send notifications
      await this.sendNotifications(alert, instance);

      logger.info('Alert triggered', {
        alertId: alert.id,
        instanceId,
        message: context.message
      });
    } catch (error) {
      logger.error('Error triggering alert:', error);
    }
  }

  private async sendNotifications(alert: AlertServiceAlert, instance: AlertServiceInstance): Promise<void> {
    // Integration with notification service would go here
    // For now, just log the notification
    logger.info('Alert notification sent', {
      alertId: alert.id,
      instanceId: instance.id,
      channels: alert.notificationChannels,
      message: instance.data.message
    });
  }

  private async saveAlert(alert: AlertServiceAlert): Promise<void> {
    await databaseService.query(`
      INSERT INTO alerts (
        id, store_id, name, description, type, status, config,
        rules, notification_channels, is_enabled,
        created_by, created_at, updated_at, last_triggered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        config = EXCLUDED.config,
        rules = EXCLUDED.rules,
        notification_channels = EXCLUDED.notification_channels,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = EXCLUDED.updated_at,
        last_triggered_at = EXCLUDED.last_triggered_at
    `, [
      alert.id,
      alert.storeId,
      alert.name,
      alert.description,
      alert.type,
      alert.status,
      JSON.stringify(alert.config),
      JSON.stringify(alert.rules),
      JSON.stringify(alert.notificationChannels),
      alert.isEnabled,
      alert.createdBy,
      alert.createdAt,
      alert.updatedAt,
      alert.lastTriggeredAt || null
    ]);
  }

  private async saveAlertInstance(instance: AlertServiceInstance): Promise<void> {
    await databaseService.query(`
      INSERT INTO alert_instances (
        id, alert_id, status, triggered_at, resolved_at,
        resolved_by, data, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      instance.id,
      instance.alertId,
      instance.status,
      instance.triggeredAt,
      instance.resolvedAt || null,
      instance.resolvedBy || null,
      JSON.stringify(instance.data),
      JSON.stringify(instance.metadata)
    ]);
  }

  private deserializeAlert(row: any): AlertServiceAlert {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      config: JSON.parse(row.config),
      rules: JSON.parse(row.rules || '[]'),
      notificationChannels: JSON.parse(row.notification_channels || '["email"]'),
      isEnabled: row.is_enabled,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastTriggeredAt: row.last_triggered_at ? new Date(row.last_triggered_at) : undefined,
      // Base Alert interface fields
      condition: {
        operator: 'gt',
        value: new Decimal(0)
      },
      actions: [],
      checkInterval: 300,
      isActive: row.is_enabled,
      tags: [],
      metadata: {}
    };
  }

  private deserializeAlertInstance(row: any): AlertServiceInstance {
    return {
      id: row.id,
      alertId: row.alert_id,
      storeId: row.store_id || '',
      triggeredAt: new Date(row.triggered_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      triggerValue: new Decimal(0),
      threshold: new Decimal(0),
      message: row.message || '',
      severity: 'medium',
      actionsExecuted: [],
      status: row.status,
      data: JSON.parse(row.data || '{}'),
      metadata: JSON.parse(row.metadata || '{}'),
      resolvedBy: row.resolved_by
    };
  }

  private startAlertChecking(): void {
    // Check alerts every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkAlerts().catch(error => {
        logger.error('Alert checking failed:', error);
      });
    }, 5 * 60 * 1000);

    logger.info('Alert checking started (5 minute interval)');
  }

  public stopAlertChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Alert checking stopped');
    }
  }
}

export const alertService = new AlertService();