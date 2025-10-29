import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import { analyticsService } from './analytics';
import {
  Report,
  ReportType,
  ReportFormat,
  ReportSchedule,
  ReportRequest,
  ReportData,
  TimeGranularity,
  AnalyticsQuery
} from '../models/types';

export class ReportService {
  constructor() {
    logger.info('Report service initialized');
  }

  async generateReport(request: ReportRequest): Promise<Report> {
    try {
      const reportId = uuidv4();
      const startTime = Date.now();

      logger.info('Starting report generation', {
        reportId,
        type: request.type,
        format: request.format,
        storeId: request.storeId
      });

      // Generate report data based on type
      let reportData: ReportData;
      const analyticsQuery: AnalyticsQuery = {
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        granularity: request.granularity || TimeGranularity.DAY
      };

      switch (request.type) {
        case ReportType.SALES:
          const salesAnalytics = await analyticsService.getSalesAnalytics(
            request.storeId,
            analyticsQuery
          );
          reportData = this.formatSalesData(salesAnalytics);
          break;

        case ReportType.CUSTOMER:
          const customerAnalytics = await analyticsService.getCustomerAnalytics(
            request.storeId,
            analyticsQuery
          );
          reportData = this.formatCustomerData(customerAnalytics);
          break;

        case ReportType.INVENTORY:
          const inventoryAnalytics = await analyticsService.getInventoryAnalytics(
            request.storeId
          );
          reportData = this.formatInventoryData(inventoryAnalytics);
          break;

        case ReportType.FINANCIAL:
          const financialAnalytics = await analyticsService.getFinancialAnalytics(
            request.storeId,
            analyticsQuery
          );
          reportData = this.formatFinancialData(financialAnalytics);
          break;

        case ReportType.PRODUCT_PERFORMANCE:
          reportData = await this.generateProductPerformanceData(
            request.storeId,
            analyticsQuery
          );
          break;

        case ReportType.TAX:
          reportData = await this.generateTaxData(
            request.storeId,
            analyticsQuery
          );
          break;

        default:
          throw new Error(`Unsupported report type: ${request.type}`);
      }

      const generationTime = Date.now() - startTime;

      // Create report object
      const report: Report = {
        id: reportId,
        storeId: request.storeId,
        type: request.type,
        format: request.format,
        title: this.generateReportTitle(request.type, request.dateFrom, request.dateTo),
        description: this.generateReportDescription(request.type),
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        generatedAt: new Date(),
        generatedBy: request.userId,
        data: reportData,
        metadata: {
          generationTimeMs: generationTime,
          totalRecords: this.countTotalRecords(reportData),
          dataPoints: this.countDataPoints(reportData),
          granularity: request.granularity || TimeGranularity.DAY,
          filters: request.filters || {}
        },
        schedule: request.schedule
      };

      // Save report to database
      await this.saveReport(report);

      // Cache report if configured
      if (request.cache !== false) {
        await this.cacheReport(report);
      }

      logger.info('Report generated successfully', {
        reportId,
        type: request.type,
        generationTime,
        totalRecords: report.metadata.totalRecords
      });

      return report;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  async getReport(reportId: string): Promise<Report | null> {
    try {
      // Try cache first
      const cachedReport = await this.getCachedReport(reportId);
      if (cachedReport) {
        return cachedReport;
      }

      // Fallback to database
      const result = await databaseService.query(
        'SELECT * FROM reports WHERE id = $1',
        [reportId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.deserializeReport(result.rows[0]);
    } catch (error) {
      logger.error('Error retrieving report:', error);
      throw error;
    }
  }

  async listReports(
    storeId: string,
    options: {
      type?: ReportType;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'generatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ reports: Report[]; total: number }> {
    try {
      const {
        type,
        limit = 20,
        offset = 0,
        sortBy = 'generatedAt',
        sortOrder = 'desc'
      } = options;

      let whereClause = 'WHERE store_id = $1';
      const params: any[] = [storeId];

      if (type) {
        whereClause += ' AND type = $2';
        params.push(type);
      }

      const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Get total count
      const countResult = await databaseService.query(
        `SELECT COUNT(*) as total FROM reports ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);

      // Get reports
      const result = await databaseService.query(
        `SELECT * FROM reports ${whereClause} ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const reports = result.rows.map((row: any) => this.deserializeReport(row));

      return { reports, total };
    } catch (error) {
      logger.error('Error listing reports:', error);
      throw error;
    }
  }

  async scheduleReport(schedule: ReportSchedule): Promise<string> {
    try {
      const scheduleId = uuidv4();

      await databaseService.query(`
        INSERT INTO scheduled_reports (
          id, store_id, report_type, report_format, 
          schedule_pattern, schedule_timezone, 
          date_from_offset, date_to_offset,
          recipients, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        scheduleId,
        schedule.storeId,
        schedule.reportType,
        schedule.reportFormat,
        schedule.schedulePattern,
        schedule.timezone,
        schedule.dateFromOffset,
        schedule.dateToOffset,
        JSON.stringify(schedule.recipients),
        true,
        new Date()
      ]);

      logger.info('Report scheduled successfully', {
        scheduleId,
        storeId: schedule.storeId,
        reportType: schedule.reportType,
        pattern: schedule.schedulePattern
      });

      return scheduleId;
    } catch (error) {
      logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  async exportReport(reportId: string, format: ReportFormat): Promise<Buffer> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      switch (format) {
        case ReportFormat.PDF:
          return this.exportToPDF(report);
        case ReportFormat.EXCEL:
          return this.exportToExcel(report);
        case ReportFormat.CSV:
          return this.exportToCSV(report);
        case ReportFormat.JSON:
          return Buffer.from(JSON.stringify(report, null, 2));
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw error;
    }
  }

  private formatSalesData(analytics: any): ReportData {
    return {
      summary: {
        totalRevenue: analytics.overview.totalRevenue,
        totalOrders: analytics.overview.totalOrders,
        averageOrderValue: analytics.overview.averageOrderValue,
        revenueGrowth: analytics.overview.revenueGrowth
      },
      trends: analytics.trends,
      products: analytics.topProducts.slice(0, 10),
      channels: analytics.salesChannels,
      timeDistribution: {
        hourly: analytics.hourlyDistribution,
        weekly: analytics.weeklyDistribution
      }
    };
  }

  private formatCustomerData(analytics: any): ReportData {
    return {
      summary: {
        totalCustomers: analytics.overview.totalCustomers,
        newCustomers: analytics.overview.newCustomers,
        returningCustomers: analytics.overview.returningCustomers,
        averageOrdersPerCustomer: analytics.overview.averageOrdersPerCustomer
      },
      segments: analytics.segments,
      geographic: analytics.geographic.slice(0, 20)
    };
  }

  private formatInventoryData(analytics: any): ReportData {
    return {
      summary: {
        totalProducts: analytics.overview.totalProducts,
        totalValue: analytics.overview.totalValue,
        lowStockItems: analytics.overview.lowStockItems,
        outOfStockItems: analytics.overview.outOfStockItems
      },
      lowStock: analytics.lowStockProducts,
      topSelling: analytics.topSellingProducts.slice(0, 10),
      slowMoving: analytics.slowMovingProducts.slice(0, 10),
      categories: analytics.categoryPerformance
    };
  }

  private formatFinancialData(analytics: any): ReportData {
    return {
      summary: {
        grossRevenue: analytics.revenue.gross,
        netRevenue: analytics.revenue.net,
        grossProfit: analytics.profitability.grossProfit,
        netProfit: analytics.profitability.netProfit,
        grossMargin: analytics.profitability.grossMargin,
        netMargin: analytics.profitability.netMargin
      },
      revenue: analytics.revenue,
      expenses: analytics.expenses,
      profitability: analytics.profitability,
      kpis: analytics.kpis
    };
  }

  private async generateProductPerformanceData(
    storeId: string,
    query: AnalyticsQuery
  ): Promise<ReportData> {
    const result = await databaseService.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        c.name as category,
        COALESCE(SUM(oi.quantity), 0) as quantity_sold,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        COALESCE(AVG(oi.price), 0) as average_price,
        p.cost_price,
        p.selling_price,
        (p.selling_price - p.cost_price) as profit_per_unit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.status = 'completed'
        AND o.created_at BETWEEN $2 AND $3
      WHERE p.store_id = $1
      GROUP BY p.id, p.name, p.sku, c.name, p.cost_price, p.selling_price
      ORDER BY revenue DESC
    `, [storeId, query.dateFrom, query.dateTo]);

    return {
      products: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category || 'Uncategorized',
        quantitySold: parseInt(row.quantity_sold),
        revenue: new Decimal(row.revenue),
        averagePrice: new Decimal(row.average_price),
        costPrice: new Decimal(row.cost_price || 0),
        sellingPrice: new Decimal(row.selling_price || 0),
        profitPerUnit: new Decimal(row.profit_per_unit || 0),
        totalProfit: new Decimal(row.profit_per_unit || 0).mul(row.quantity_sold)
      }))
    };
  }

  private async generateTaxData(
    storeId: string,
    query: AnalyticsQuery
  ): Promise<ReportData> {
    const result = await databaseService.query(`
      SELECT 
        tax_rate,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(total_amount - tax_amount), 0) as net_amount,
        COUNT(*) as transaction_count
      FROM orders 
      WHERE store_id = $1 
      AND status = 'completed'
      AND created_at BETWEEN $2 AND $3
      GROUP BY tax_rate
      ORDER BY total_tax DESC
    `, [storeId, query.dateFrom, query.dateTo]);

    return {
      taxSummary: result.rows.map((row: any) => ({
        taxRate: new Decimal(row.tax_rate || 0),
        totalTax: new Decimal(row.total_tax),
        netAmount: new Decimal(row.net_amount),
        transactionCount: parseInt(row.transaction_count)
      })),
      totalTaxCollected: result.rows.reduce((sum: Decimal, row: any) => 
        sum.plus(row.total_tax), new Decimal(0)),
      totalNetAmount: result.rows.reduce((sum: Decimal, row: any) => 
        sum.plus(row.net_amount), new Decimal(0))
    };
  }

  private generateReportTitle(
    type: ReportType,
    dateFrom: Date,
    dateTo: Date
  ): string {
    const formatDate = (date: Date) => date.toLocaleDateString();
    const period = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;

    switch (type) {
      case ReportType.SALES:
        return `Sales Report (${period})`;
      case ReportType.CUSTOMER:
        return `Customer Analytics Report (${period})`;
      case ReportType.INVENTORY:
        return `Inventory Report (${formatDate(dateTo)})`;
      case ReportType.FINANCIAL:
        return `Financial Report (${period})`;
      case ReportType.PRODUCT_PERFORMANCE:
        return `Product Performance Report (${period})`;
      case ReportType.TAX:
        return `Tax Report (${period})`;
      default:
        return `Report (${period})`;
    }
  }

  private generateReportDescription(type: ReportType): string {
    switch (type) {
      case ReportType.SALES:
        return 'Comprehensive analysis of sales performance, trends, and revenue metrics';
      case ReportType.CUSTOMER:
        return 'Customer behavior analysis, segmentation, and retention metrics';
      case ReportType.INVENTORY:
        return 'Inventory levels, stock alerts, and product performance analysis';
      case ReportType.FINANCIAL:
        return 'Financial performance analysis including revenue, expenses, and profitability';
      case ReportType.PRODUCT_PERFORMANCE:
        return 'Detailed product-level performance analysis and profitability metrics';
      case ReportType.TAX:
        return 'Tax collection summary and transaction analysis';
      default:
        return 'Business analytics report';
    }
  }

  private countTotalRecords(data: ReportData): number {
    let count = 0;
    if (data.trends) count += data.trends.length;
    if (data.products) count += data.products.length;
    if (data.segments) count += data.segments.length;
    return count;
  }

  private countDataPoints(data: ReportData): number {
    return Object.keys(data).length;
  }

  private async saveReport(report: Report): Promise<void> {
    await databaseService.query(`
      INSERT INTO reports (
        id, store_id, type, format, title, description,
        date_from, date_to, generated_at, generated_by,
        data, metadata, schedule_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      report.id,
      report.storeId,
      report.type,
      report.format,
      report.title,
      report.description,
      report.dateFrom,
      report.dateTo,
      report.generatedAt,
      report.generatedBy,
      JSON.stringify(report.data),
      JSON.stringify(report.metadata),
      report.schedule?.id || null
    ]);
  }

  private async cacheReport(report: Report): Promise<void> {
    const cacheKey = `report:${report.id}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await databaseService.query(`
      INSERT INTO report_cache (
        cache_key, report_id, data, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cache_key) DO UPDATE SET
        data = EXCLUDED.data,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at
    `, [cacheKey, report.id, JSON.stringify(report), new Date(), expiresAt]);
  }

  private async getCachedReport(reportId: string): Promise<Report | null> {
    const cacheKey = `report:${reportId}`;
    
    const result = await databaseService.query(`
      SELECT data FROM report_cache 
      WHERE cache_key = $1 AND expires_at > NOW()
    `, [cacheKey]);

    if (result.rows.length === 0) {
      return null;
    }

    return JSON.parse(result.rows[0].data);
  }

  private deserializeReport(row: any): Report {
    return {
      id: row.id,
      storeId: row.store_id,
      type: row.type,
      format: row.format,
      title: row.title,
      description: row.description,
      dateFrom: new Date(row.date_from),
      dateTo: new Date(row.date_to),
      generatedAt: new Date(row.generated_at),
      generatedBy: row.generated_by,
      data: JSON.parse(row.data),
      metadata: JSON.parse(row.metadata),
      schedule: row.schedule_id ? {
        id: row.schedule_id,
        storeId: '',
        reportType: ReportType.SALES,
        reportFormat: ReportFormat.PDF,
        schedulePattern: '',
        timezone: 'UTC',
        dateFromOffset: 0,
        dateToOffset: 0,
        recipients: [],
        isActive: true
      } : undefined
    };
  }

  private async exportToPDF(report: Report): Promise<Buffer> {
    // PDF generation implementation would go here
    // Using a library like puppeteer or pdf-lib
    throw new Error('PDF export not yet implemented');
  }

  private async exportToExcel(report: Report): Promise<Buffer> {
    // Excel generation implementation would go here
    // Using a library like exceljs
    throw new Error('Excel export not yet implemented');
  }

  private async exportToCSV(report: Report): Promise<Buffer> {
    // CSV generation implementation would go here
    const csv = this.convertToCSV(report.data);
    return Buffer.from(csv, 'utf-8');
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would need more sophisticated implementation
    const headers = Object.keys(data);
    const csvData = headers.join(',') + '\n';
    return csvData + JSON.stringify(data);
  }
}

export const reportService = new ReportService();