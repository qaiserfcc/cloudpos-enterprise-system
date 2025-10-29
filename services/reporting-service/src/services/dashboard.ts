import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import { analyticsService } from './analytics';
import {
  Dashboard,
  DashboardType,
  Widget,
  WidgetType,
  DashboardConfig,
  WidgetData,
  TimeGranularity,
  AnalyticsQuery
} from '../models/types';

export class DashboardService {
  constructor() {
    logger.info('Dashboard service initialized');
  }

  async createDashboard(
    storeId: string,
    userId: string,
    type: DashboardType,
    config: DashboardConfig
  ): Promise<Dashboard> {
    try {
      const dashboardId = uuidv4();

      const dashboard: Dashboard = {
        id: dashboardId,
        storeId,
        name: config.name,
        description: config.description,
        type,
        layout: {
          columns: 12,
          rows: 8,
          gridSize: { width: 100, height: 100 },
          responsive: true
        },
        widgets: [],
        config,
        isPublic: config.isPublic || false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create default widgets based on dashboard type
      dashboard.widgets = await this.createDefaultWidgets(dashboardId, type);

      // Save dashboard to database
      await this.saveDashboard(dashboard);

      logger.info('Dashboard created successfully', {
        dashboardId,
        storeId,
        type,
        widgetCount: dashboard.widgets.length
      });

      return dashboard;
    } catch (error) {
      logger.error('Error creating dashboard:', error);
      throw error;
    }
  }

  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM dashboards WHERE id = $1',
        [dashboardId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const dashboard = this.deserializeDashboard(result.rows[0]);

      // Load widgets
      const widgetsResult = await databaseService.query(
        'SELECT * FROM dashboard_widgets WHERE dashboard_id = $1 ORDER BY position_x, position_y',
        [dashboardId]
      );

      dashboard.widgets = widgetsResult.rows.map((row: any) => this.deserializeWidget(row));

      return dashboard;
    } catch (error) {
      logger.error('Error retrieving dashboard:', error);
      throw error;
    }
  }

  async updateDashboard(
    dashboardId: string,
    updates: Partial<Dashboard>
  ): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Update dashboard fields
      const updatedDashboard = {
        ...dashboard,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveDashboard(updatedDashboard);

      logger.info('Dashboard updated successfully', {
        dashboardId,
        updates: Object.keys(updates)
      });

      return updatedDashboard;
    } catch (error) {
      logger.error('Error updating dashboard:', error);
      throw error;
    }
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      // Delete widgets first
      await databaseService.query(
        'DELETE FROM dashboard_widgets WHERE dashboard_id = $1',
        [dashboardId]
      );

      // Delete dashboard
      await databaseService.query(
        'DELETE FROM dashboards WHERE id = $1',
        [dashboardId]
      );

      logger.info('Dashboard deleted successfully', { dashboardId });
    } catch (error) {
      logger.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  async listDashboards(
    storeId: string,
    options: {
      type?: DashboardType;
      userId?: string;
      includePublic?: boolean;
    } = {}
  ): Promise<Dashboard[]> {
    try {
      let whereClause = 'WHERE store_id = $1';
      const params: any[] = [storeId];

      if (options.type) {
        whereClause += ' AND type = $2';
        params.push(options.type);
      }

      if (options.userId && !options.includePublic) {
        whereClause += ` AND (created_by = $${params.length + 1} OR is_public = true)`;
        params.push(options.userId);
      } else if (options.userId) {
        whereClause += ` AND created_by = $${params.length + 1}`;
        params.push(options.userId);
      }

      const result = await databaseService.query(
        `SELECT * FROM dashboards ${whereClause} ORDER BY created_at DESC`,
        params
      );

      const dashboards = await Promise.all(
        result.rows.map(async (row: any) => {
          const dashboard = this.deserializeDashboard(row);
          
          // Load widget summaries (without data)
          const widgetsResult = await databaseService.query(
            'SELECT id, title, type, position_x, position_y, width, height FROM dashboard_widgets WHERE dashboard_id = $1',
            [dashboard.id]
          );

          dashboard.widgets = widgetsResult.rows.map((widgetRow: any) => ({
            id: widgetRow.id,
            title: widgetRow.title,
            type: widgetRow.type,
            position: {
              x: widgetRow.position_x,
              y: widgetRow.position_y
            },
            size: {
              width: widgetRow.width,
              height: widgetRow.height
            }
          })) as Widget[];

          return dashboard;
        })
      );

      return dashboards;
    } catch (error) {
      logger.error('Error listing dashboards:', error);
      throw error;
    }
  }

  async addWidget(
    dashboardId: string,
    widgetConfig: {
      title: string;
      type: WidgetType;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: Record<string, any>;
    }
  ): Promise<Widget> {
    try {
      const widgetId = uuidv4();

      const widget: Widget = {
        id: widgetId,
        dashboardId,
        title: widgetConfig.title,
        type: widgetConfig.type,
        position: widgetConfig.position,
        size: widgetConfig.size,
        config: widgetConfig.config,
        refreshInterval: 300, // 5 minutes default
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveWidget(widget);

      logger.info('Widget added to dashboard', {
        dashboardId,
        widgetId,
        type: widget.type
      });

      return widget;
    } catch (error) {
      logger.error('Error adding widget:', error);
      throw error;
    }
  }

  async updateWidget(
    widgetId: string,
    updates: Partial<Widget>
  ): Promise<Widget> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM dashboard_widgets WHERE id = $1',
        [widgetId]
      );

      if (result.rows.length === 0) {
        throw new Error('Widget not found');
      }

      const currentWidget = this.deserializeWidget(result.rows[0]);
      const updatedWidget = {
        ...currentWidget,
        ...updates,
        updatedAt: new Date()
      };

      await this.saveWidget(updatedWidget);

      logger.info('Widget updated successfully', {
        widgetId,
        updates: Object.keys(updates)
      });

      return updatedWidget;
    } catch (error) {
      logger.error('Error updating widget:', error);
      throw error;
    }
  }

  async deleteWidget(widgetId: string): Promise<void> {
    try {
      await databaseService.query(
        'DELETE FROM dashboard_widgets WHERE id = $1',
        [widgetId]
      );

      logger.info('Widget deleted successfully', { widgetId });
    } catch (error) {
      logger.error('Error deleting widget:', error);
      throw error;
    }
  }

  async getWidgetData(
    widgetId: string,
    timeRange?: { from: Date; to: Date }
  ): Promise<WidgetData> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM dashboard_widgets WHERE id = $1',
        [widgetId]
      );

      if (result.rows.length === 0) {
        throw new Error('Widget not found');
      }

      const widget = this.deserializeWidget(result.rows[0]);
      return await this.generateWidgetData(widget, timeRange);
    } catch (error) {
      logger.error('Error getting widget data:', error);
      throw error;
    }
  }

  async refreshDashboard(dashboardId: string): Promise<Dashboard> {
    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Refresh all widget data
      for (const widget of dashboard.widgets) {
        if (widget.id) {
          widget.data = await this.generateWidgetData(widget);
          widget.lastRefreshed = new Date();
        }
      }

      logger.info('Dashboard refreshed successfully', {
        dashboardId,
        widgetCount: dashboard.widgets.length
      });

      return dashboard;
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
      throw error;
    }
  }

  private async createDefaultWidgets(
    dashboardId: string,
    type: DashboardType
  ): Promise<Widget[]> {
    const widgets: Widget[] = [];

    switch (type) {
      case DashboardType.SALES:
        widgets.push(
          await this.createWidget(dashboardId, 'Total Revenue', WidgetType.METRIC, { x: 0, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Sales Trend', WidgetType.LINE_CHART, { x: 3, y: 0 }, { width: 9, height: 4 }),
          await this.createWidget(dashboardId, 'Top Products', WidgetType.TABLE, { x: 0, y: 2 }, { width: 6, height: 4 }),
          await this.createWidget(dashboardId, 'Sales by Channel', WidgetType.PIE_CHART, { x: 6, y: 2 }, { width: 6, height: 4 })
        );
        break;

      case DashboardType.FINANCIAL:
        widgets.push(
          await this.createWidget(dashboardId, 'Revenue', WidgetType.METRIC, { x: 0, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Profit Margin', WidgetType.METRIC, { x: 3, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Financial Trend', WidgetType.AREA_CHART, { x: 6, y: 0 }, { width: 6, height: 4 }),
          await this.createWidget(dashboardId, 'Expense Breakdown', WidgetType.PIE_CHART, { x: 0, y: 2 }, { width: 6, height: 4 })
        );
        break;

      case DashboardType.CUSTOMER:
        widgets.push(
          await this.createWidget(dashboardId, 'Total Customers', WidgetType.METRIC, { x: 0, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Customer Growth', WidgetType.LINE_CHART, { x: 3, y: 0 }, { width: 9, height: 4 }),
          await this.createWidget(dashboardId, 'Customer Segments', WidgetType.BAR_CHART, { x: 0, y: 2 }, { width: 6, height: 4 }),
          await this.createWidget(dashboardId, 'Geographic Distribution', WidgetType.MAP, { x: 6, y: 2 }, { width: 6, height: 4 })
        );
        break;

      case DashboardType.OPERATIONS:
        widgets.push(
          await this.createWidget(dashboardId, 'Orders Today', WidgetType.METRIC, { x: 0, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Inventory Alerts', WidgetType.LIST, { x: 3, y: 0 }, { width: 3, height: 4 }),
          await this.createWidget(dashboardId, 'Order Status', WidgetType.PIE_CHART, { x: 6, y: 0 }, { width: 6, height: 4 }),
          await this.createWidget(dashboardId, 'Low Stock Items', WidgetType.TABLE, { x: 0, y: 2 }, { width: 6, height: 4 })
        );
        break;

      default:
        // Executive dashboard
        widgets.push(
          await this.createWidget(dashboardId, 'Revenue', WidgetType.METRIC, { x: 0, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Orders', WidgetType.METRIC, { x: 3, y: 0 }, { width: 3, height: 2 }),
          await this.createWidget(dashboardId, 'Performance Overview', WidgetType.MULTI_METRIC, { x: 6, y: 0 }, { width: 6, height: 4 }),
          await this.createWidget(dashboardId, 'Key Trends', WidgetType.LINE_CHART, { x: 0, y: 2 }, { width: 12, height: 4 })
        );
        break;
    }

    return widgets;
  }

  private async createWidget(
    dashboardId: string,
    title: string,
    type: WidgetType,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): Promise<Widget> {
    const widget: Widget = {
      id: uuidv4(),
      dashboardId,
      title,
      type,
      position,
      size,
      config: this.getDefaultWidgetConfig(type),
      refreshInterval: 300,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveWidget(widget);
    return widget;
  }

  private getDefaultWidgetConfig(type: WidgetType): Record<string, any> {
    switch (type) {
      case WidgetType.METRIC:
        return {
          metric: 'revenue',
          format: 'currency',
          showTrend: true,
          timeRange: '24h'
        };
      case WidgetType.LINE_CHART:
        return {
          metrics: ['revenue'],
          timeRange: '30d',
          granularity: 'day'
        };
      case WidgetType.BAR_CHART:
        return {
          metric: 'orders',
          groupBy: 'category',
          limit: 10
        };
      case WidgetType.PIE_CHART:
        return {
          metric: 'revenue',
          groupBy: 'channel',
          limit: 5
        };
      case WidgetType.TABLE:
        return {
          columns: ['name', 'revenue', 'orders'],
          sortBy: 'revenue',
          limit: 10
        };
      default:
        return {};
    }
  }

  private async generateWidgetData(
    widget: Widget,
    timeRange?: { from: Date; to: Date }
  ): Promise<WidgetData> {
    try {
      const defaultTimeRange = {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      };

      const range = timeRange || defaultTimeRange;
      
      // Get dashboard to access store ID
      const dashboardResult = await databaseService.query(
        'SELECT store_id FROM dashboards WHERE id = $1',
        [widget.dashboardId]
      );

      if (dashboardResult.rows.length === 0) {
        throw new Error('Dashboard not found');
      }

      const storeId = dashboardResult.rows[0].store_id;

      const analyticsQuery: AnalyticsQuery = {
        dateFrom: range.from,
        dateTo: range.to,
        granularity: TimeGranularity.DAY
      };

      switch (widget.type) {
        case WidgetType.METRIC:
          return await this.generateMetricData(storeId, widget.config, analyticsQuery);
        
        case WidgetType.LINE_CHART:
        case WidgetType.AREA_CHART:
          return await this.generateTimeSeriesData(storeId, widget.config, analyticsQuery);
        
        case WidgetType.BAR_CHART:
        case WidgetType.PIE_CHART:
          return await this.generateCategoryData(storeId, widget.config, analyticsQuery);
        
        case WidgetType.TABLE:
          return await this.generateTableData(storeId, widget.config, analyticsQuery);
        
        default:
          return {
            value: new Decimal(0),
            trend: 'stable',
            lastUpdated: new Date()
          };
      }
    } catch (error) {
      logger.error('Error generating widget data:', error);
      return {
        value: new Decimal(0),
        trend: 'stable',
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateMetricData(
    storeId: string,
    config: Record<string, any>,
    query: AnalyticsQuery
  ): Promise<WidgetData> {
    const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, query);
    
    let value: Decimal;
    switch (config.metric) {
      case 'revenue':
        value = salesAnalytics.overview.totalRevenue;
        break;
      case 'orders':
        value = new Decimal(salesAnalytics.overview.totalOrders);
        break;
      case 'average_order_value':
        value = salesAnalytics.overview.averageOrderValue;
        break;
      default:
        value = new Decimal(0);
    }

    return {
      value,
      trend: salesAnalytics.overview.revenueGrowth.gt(0) ? 'up' : 
             salesAnalytics.overview.revenueGrowth.lt(0) ? 'down' : 'stable',
      change: salesAnalytics.overview.revenueGrowth,
      lastUpdated: new Date()
    };
  }

  private async generateTimeSeriesData(
    storeId: string,
    config: Record<string, any>,
    query: AnalyticsQuery
  ): Promise<WidgetData> {
    const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, query);
    
    return {
      series: salesAnalytics.trends.map(trend => ({
        date: trend.date,
        value: trend.revenue
      })),
      lastUpdated: new Date()
    };
  }

  private async generateCategoryData(
    storeId: string,
    config: Record<string, any>,
    query: AnalyticsQuery
  ): Promise<WidgetData> {
    const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, query);
    
    return {
      categories: salesAnalytics.topCategories.slice(0, config.limit || 10).map(category => ({
        name: category.categoryName,
        value: category.revenue,
        percentage: new Decimal(100).div(salesAnalytics.topCategories.length) // Simplified
      })),
      lastUpdated: new Date()
    };
  }

  private async generateTableData(
    storeId: string,
    config: Record<string, any>,
    query: AnalyticsQuery
  ): Promise<WidgetData> {
    const salesAnalytics = await analyticsService.getSalesAnalytics(storeId, query);
    
    return {
      rows: salesAnalytics.topProducts.slice(0, config.limit || 10).map(product => ({
        name: product.productName,
        revenue: product.revenue,
        orders: product.orders,
        quantity: product.quantity
      })),
      lastUpdated: new Date()
    };
  }

  private async saveDashboard(dashboard: Dashboard): Promise<void> {
    await databaseService.query(`
      INSERT INTO dashboards (
        id, store_id, name, description, type, layout, config,
        is_public, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        layout = EXCLUDED.layout,
        config = EXCLUDED.config,
        is_public = EXCLUDED.is_public,
        updated_at = EXCLUDED.updated_at
    `, [
      dashboard.id,
      dashboard.storeId,
      dashboard.name,
      dashboard.description,
      dashboard.type,
      JSON.stringify(dashboard.layout),
      JSON.stringify(dashboard.config),
      dashboard.isPublic,
      dashboard.createdBy,
      dashboard.createdAt,
      dashboard.updatedAt
    ]);
  }

  private async saveWidget(widget: Widget): Promise<void> {
    await databaseService.query(`
      INSERT INTO dashboard_widgets (
        id, dashboard_id, title, type, position_x, position_y,
        width, height, config, refresh_interval, is_visible,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        position_x = EXCLUDED.position_x,
        position_y = EXCLUDED.position_y,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        config = EXCLUDED.config,
        refresh_interval = EXCLUDED.refresh_interval,
        is_visible = EXCLUDED.is_visible,
        updated_at = EXCLUDED.updated_at
    `, [
      widget.id,
      widget.dashboardId,
      widget.title,
      widget.type,
      widget.position.x,
      widget.position.y,
      widget.size.width,
      widget.size.height,
      JSON.stringify(widget.config),
      widget.refreshInterval,
      widget.isVisible,
      widget.createdAt,
      widget.updatedAt
    ]);
  }

  private deserializeDashboard(row: any): Dashboard {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      description: row.description,
      type: row.type,
      layout: JSON.parse(row.layout || '[]'),
      widgets: [], // Will be loaded separately
      config: JSON.parse(row.config || '{}'),
      isPublic: row.is_public,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private deserializeWidget(row: any): Widget {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      title: row.title,
      type: row.type,
      position: {
        x: row.position_x,
        y: row.position_y
      },
      size: {
        width: row.width,
        height: row.height
      },
      config: JSON.parse(row.config || '{}'),
      refreshInterval: row.refresh_interval,
      isVisible: row.is_visible,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastRefreshed: row.last_refreshed ? new Date(row.last_refreshed) : undefined
    };
  }
}

export const dashboardService = new DashboardService();