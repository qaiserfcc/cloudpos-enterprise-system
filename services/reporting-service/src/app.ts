import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { logger } from './utils/logger';
import { reportService } from './services/report';
import { analyticsService } from './services/analytics';
import { dashboardService } from './services/dashboard';
import { alertService } from './services/alert';
import { databaseService } from './services/database';
import {
  ReportType,
  ReportFormat,
  DashboardType,
  AlertType,
  TimeGranularity,
  WidgetType
} from './models/types';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await databaseService.query('SELECT 1');
    
    return res.status(200).json({
      status: 'healthy',
      service: 'reporting-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      service: 'reporting-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Report Routes
app.post('/api/reports/generate', async (req, res) => {
  try {
    const {
      storeId,
      userId,
      type,
      format,
      dateFrom,
      dateTo,
      granularity,
      filters,
      schedule,
      cache
    } = req.body;

    // Validation
    if (!storeId || !userId || !type || !format || !dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required fields: storeId, userId, type, format, dateFrom, dateTo'
      });
    }

    // Validate enum values
    if (!Object.values(ReportType).includes(type)) {
      return res.status(400).json({
        error: `Invalid report type. Must be one of: ${Object.values(ReportType).join(', ')}`
      });
    }

    if (!Object.values(ReportFormat).includes(format)) {
      return res.status(400).json({
        error: `Invalid report format. Must be one of: ${Object.values(ReportFormat).join(', ')}`
      });
    }

    const report = await reportService.generateReport({
      storeId,
      userId,
      type,
      format,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      granularity: granularity || TimeGranularity.DAY,
      filters,
      schedule,
      cache
    });

    return res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await reportService.getReport(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error retrieving report:', error);
    return res.status(500).json({
      error: 'Failed to retrieve report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const { storeId, type, limit = 20, offset = 0, sortBy = 'generatedAt', sortOrder = 'desc' } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Missing required parameter: storeId'
      });
    }

    const result = await reportService.listReports(storeId as string, {
      type: type as ReportType,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'createdAt' | 'generatedAt' | 'title',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    return res.json({
      success: true,
      data: result.reports,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    logger.error('Error listing reports:', error);
    return res.status(500).json({
      error: 'Failed to list reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/reports/schedule', async (req, res) => {
  try {
    const schedule = req.body;

    // Basic validation
    if (!schedule.storeId || !schedule.reportType || !schedule.schedulePattern) {
      return res.status(400).json({
        error: 'Missing required fields: storeId, reportType, schedulePattern'
      });
    }

    const scheduleId = await reportService.scheduleReport(schedule);

    return res.status(201).json({
      success: true,
      data: { scheduleId }
    });
  } catch (error) {
    logger.error('Error scheduling report:', error);
    return res.status(500).json({
      error: 'Failed to schedule report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/reports/:reportId/export/:format', async (req, res) => {
  try {
    const { reportId, format } = req.params;

    if (!Object.values(ReportFormat).includes(format as ReportFormat)) {
      return res.status(400).json({
        error: `Invalid format. Must be one of: ${Object.values(ReportFormat).join(', ')}`
      });
    }

    const exportData = await reportService.exportReport(reportId, format as ReportFormat);

    // Set appropriate headers based on format
    let contentType = 'application/octet-stream';
    let filename = `report-${reportId}`;

    switch (format) {
      case ReportFormat.PDF:
        contentType = 'application/pdf';
        filename += '.pdf';
        break;
      case ReportFormat.EXCEL:
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;
      case ReportFormat.CSV:
        contentType = 'text/csv';
        filename += '.csv';
        break;
      case ReportFormat.JSON:
        contentType = 'application/json';
        filename += '.json';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(exportData);
  } catch (error) {
    logger.error('Error exporting report:', error);
    return res.status(500).json({
      error: 'Failed to export report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analytics Routes
app.get('/api/analytics/sales', async (req, res) => {
  try {
    const { storeId, dateFrom, dateTo, granularity = TimeGranularity.DAY } = req.query;

    if (!storeId || !dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required parameters: storeId, dateFrom, dateTo'
      });
    }

    const analytics = await analyticsService.getSalesAnalytics(storeId as string, {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string),
      granularity: granularity as TimeGranularity
    });

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting sales analytics:', error);
    return res.status(500).json({
      error: 'Failed to get sales analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/analytics/customers', async (req, res) => {
  try {
    const { storeId, dateFrom, dateTo } = req.query;

    if (!storeId || !dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required parameters: storeId, dateFrom, dateTo'
      });
    }

    const analytics = await analyticsService.getCustomerAnalytics(storeId as string, {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    });

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting customer analytics:', error);
    return res.status(500).json({
      error: 'Failed to get customer analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/analytics/inventory', async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Missing required parameter: storeId'
      });
    }

    const analytics = await analyticsService.getInventoryAnalytics(storeId as string);

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting inventory analytics:', error);
    return res.status(500).json({
      error: 'Failed to get inventory analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/analytics/financial', async (req, res) => {
  try {
    const { storeId, dateFrom, dateTo } = req.query;

    if (!storeId || !dateFrom || !dateTo) {
      return res.status(400).json({
        error: 'Missing required parameters: storeId, dateFrom, dateTo'
      });
    }

    const analytics = await analyticsService.getFinancialAnalytics(storeId as string, {
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string)
    });

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting financial analytics:', error);
    return res.status(500).json({
      error: 'Failed to get financial analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard Routes
app.post('/api/dashboards', async (req, res) => {
  try {
    const { storeId, userId, type, config } = req.body;

    if (!storeId || !userId || !type || !config) {
      return res.status(400).json({
        error: 'Missing required fields: storeId, userId, type, config'
      });
    }

    if (!Object.values(DashboardType).includes(type)) {
      return res.status(400).json({
        error: `Invalid dashboard type. Must be one of: ${Object.values(DashboardType).join(', ')}`
      });
    }

    const dashboard = await dashboardService.createDashboard(storeId, userId, type, config);

    return res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    return res.status(500).json({
      error: 'Failed to create dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await dashboardService.getDashboard(dashboardId);

    if (!dashboard) {
      return res.status(404).json({
        error: 'Dashboard not found'
      });
    }

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error retrieving dashboard:', error);
    return res.status(500).json({
      error: 'Failed to retrieve dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/dashboards', async (req, res) => {
  try {
    const { storeId, type, userId, includePublic } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Missing required parameter: storeId'
      });
    }

    const dashboards = await dashboardService.listDashboards(storeId as string, {
      type: type as DashboardType,
      userId: userId as string,
      includePublic: includePublic === 'true'
    });

    return res.json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    logger.error('Error listing dashboards:', error);
    return res.status(500).json({
      error: 'Failed to list dashboards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const updates = req.body;

    const dashboard = await dashboardService.updateDashboard(dashboardId, updates);

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    return res.status(500).json({
      error: 'Failed to update dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/dashboards/:dashboardId', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    await dashboardService.deleteDashboard(dashboardId);

    return res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting dashboard:', error);
    return res.status(500).json({
      error: 'Failed to delete dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/dashboards/:dashboardId/refresh', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await dashboardService.refreshDashboard(dashboardId);

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error refreshing dashboard:', error);
    return res.status(500).json({
      error: 'Failed to refresh dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Widget Routes
app.post('/api/dashboards/:dashboardId/widgets', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const widgetConfig = req.body;

    if (!widgetConfig.title || !widgetConfig.type || !widgetConfig.position || !widgetConfig.size) {
      return res.status(400).json({
        error: 'Missing required widget fields: title, type, position, size'
      });
    }

    if (!Object.values(WidgetType).includes(widgetConfig.type)) {
      return res.status(400).json({
        error: `Invalid widget type. Must be one of: ${Object.values(WidgetType).join(', ')}`
      });
    }

    const widget = await dashboardService.addWidget(dashboardId, widgetConfig);

    return res.status(201).json({
      success: true,
      data: widget
    });
  } catch (error) {
    logger.error('Error adding widget:', error);
    return res.status(500).json({
      error: 'Failed to add widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const updates = req.body;

    const widget = await dashboardService.updateWidget(widgetId, updates);

    return res.json({
      success: true,
      data: widget
    });
  } catch (error) {
    logger.error('Error updating widget:', error);
    return res.status(500).json({
      error: 'Failed to update widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    await dashboardService.deleteWidget(widgetId);

    return res.json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting widget:', error);
    return res.status(500).json({
      error: 'Failed to delete widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/widgets/:widgetId/data', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { from, to } = req.query;

    let timeRange;
    if (from && to) {
      timeRange = {
        from: new Date(from as string),
        to: new Date(to as string)
      };
    }

    const data = await dashboardService.getWidgetData(widgetId, timeRange);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting widget data:', error);
    return res.status(500).json({
      error: 'Failed to get widget data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Alert Routes
app.post('/api/alerts', async (req, res) => {
  try {
    const { storeId, userId, config } = req.body;

    if (!storeId || !userId || !config) {
      return res.status(400).json({
        error: 'Missing required fields: storeId, userId, config'
      });
    }

    if (!Object.values(AlertType).includes(config.type)) {
      return res.status(400).json({
        error: `Invalid alert type. Must be one of: ${Object.values(AlertType).join(', ')}`
      });
    }

    const alert = await alertService.createAlert(storeId, userId, config);

    return res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    return res.status(500).json({
      error: 'Failed to create alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await alertService.getAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found'
      });
    }

    return res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error retrieving alert:', error);
    return res.status(500).json({
      error: 'Failed to retrieve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const { storeId, type, status, isEnabled } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Missing required parameter: storeId'
      });
    }

    const alerts = await alertService.listAlerts(storeId as string, {
      type: type as AlertType,
      status: status as any,
      isEnabled: isEnabled === 'true'
    });

    return res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Error listing alerts:', error);
    return res.status(500).json({
      error: 'Failed to list alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const updates = req.body;

    const alert = await alertService.updateAlert(alertId, updates);

    return res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error updating alert:', error);
    return res.status(500).json({
      error: 'Failed to update alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    await alertService.deleteAlert(alertId);

    return res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    return res.status(500).json({
      error: 'Failed to delete alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/alerts/:alertId/instances', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;

    const result = await alertService.getAlertInstances(alertId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      status: status as 'triggered' | 'resolved'
    });

    return res.json({
      success: true,
      data: result.instances,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    logger.error('Error getting alert instances:', error);
    return res.status(500).json({
      error: 'Failed to get alert instances',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/alerts/instances/:instanceId/resolve', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { resolvedBy } = req.body;

    if (!resolvedBy) {
      return res.status(400).json({
        error: 'Missing required field: resolvedBy'
      });
    }

    await alertService.resolveAlert(instanceId, resolvedBy);

    return res.json({
      success: true,
      message: 'Alert instance resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    return res.status(500).json({
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/alerts/check', async (req, res) => {
  try {
    const { storeId } = req.body;
    await alertService.checkAlerts(storeId);

    return res.json({
      success: true,
      message: 'Alert check completed'
    });
  } catch (error) {
    logger.error('Error checking alerts:', error);
    return res.status(500).json({
      error: 'Failed to check alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await databaseService.initialize();
    
    app.listen(PORT, () => {
      logger.info(`Reporting service started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        service: 'reporting-service'
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  alertService.stopAlertChecking();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  alertService.stopAlertChecking();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export default app;