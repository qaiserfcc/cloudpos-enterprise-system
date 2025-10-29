import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import {
  SalesAnalytics,
  CustomerAnalytics,
  InventoryAnalytics,
  FinancialAnalytics,
  AnalyticsQuery,
  TimeGranularity
} from '../models/types';

export class AnalyticsService {
  constructor() {
    logger.info('Analytics service initialized');
  }

  async getSalesAnalytics(storeId: string, query: AnalyticsQuery): Promise<SalesAnalytics> {
    try {
      const { dateFrom, dateTo, granularity = TimeGranularity.DAY } = query;

      // Get sales overview
      const overviewResult = await databaseService.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(*) as total_orders,
          COALESCE(AVG(total_amount), 0) as average_order_value,
          COALESCE(SUM(total_amount - tax_amount), 0) as gross_revenue,
          COALESCE(SUM(profit_margin), 0) as gross_margin
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
      `, [storeId, dateFrom, dateTo]);

      const overview = overviewResult.rows[0];

      // Get previous period for growth calculation
      const periodDiff = dateTo.getTime() - dateFrom.getTime();
      const previousFrom = new Date(dateFrom.getTime() - periodDiff);
      const previousTo = new Date(dateTo.getTime() - periodDiff);

      const previousResult = await databaseService.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders,
          COUNT(DISTINCT customer_id) as customers
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
      `, [storeId, previousFrom, previousTo]);

      const previous = previousResult.rows[0];

      // Calculate growth metrics
      const revenueGrowth = previous.revenue > 0 
        ? new Decimal(overview.total_revenue).minus(previous.revenue).div(previous.revenue).mul(100)
        : new Decimal(0);

      const orderGrowth = previous.orders > 0 
        ? new Decimal(overview.total_orders).minus(previous.orders).div(previous.orders).mul(100)
        : new Decimal(0);

      // Get trends data
      const trendsResult = await databaseService.query(`
        SELECT 
          DATE_TRUNC($1, created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders,
          COUNT(DISTINCT customer_id) as customers,
          COALESCE(AVG(total_amount), 0) as average_order_value
        FROM orders 
        WHERE store_id = $2 
        AND status = 'completed'
        AND created_at BETWEEN $3 AND $4
        GROUP BY DATE_TRUNC($1, created_at)
        ORDER BY date
      `, [granularity, storeId, dateFrom, dateTo]);

      // Get top products
      const topProductsResult = await databaseService.query(`
        SELECT 
          oi.product_id,
          p.name as product_name,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
          SUM(oi.quantity) as quantity,
          COUNT(DISTINCT oi.order_id) as orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.store_id = $1 
        AND o.status = 'completed'
        AND o.created_at BETWEEN $2 AND $3
        GROUP BY oi.product_id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `, [storeId, dateFrom, dateTo]);

      // Get top categories
      const topCategoriesResult = await databaseService.query(`
        SELECT 
          p.category_id,
          c.name as category_name,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
          SUM(oi.quantity) as quantity,
          COUNT(DISTINCT oi.order_id) as orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.store_id = $1 
        AND o.status = 'completed'
        AND o.created_at BETWEEN $2 AND $3
        AND p.category_id IS NOT NULL
        GROUP BY p.category_id, c.name
        ORDER BY revenue DESC
        LIMIT 10
      `, [storeId, dateFrom, dateTo]);

      // Get sales channels
      const channelsResult = await databaseService.query(`
        SELECT 
          COALESCE(sales_channel, 'online') as channel,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
        GROUP BY sales_channel
        ORDER BY revenue DESC
      `, [storeId, dateFrom, dateTo]);

      // Calculate channel percentages
      const totalChannelRevenue = channelsResult.rows.reduce((sum: number, row: any) => 
        sum + parseFloat(row.revenue), 0);

      // Get payment methods
      const paymentMethodsResult = await databaseService.query(`
        SELECT 
          COALESCE(payment_method, 'unknown') as method,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
        GROUP BY payment_method
        ORDER BY revenue DESC
      `, [storeId, dateFrom, dateTo]);

      // Calculate payment method percentages
      const totalPaymentRevenue = paymentMethodsResult.rows.reduce((sum: number, row: any) => 
        sum + parseFloat(row.revenue), 0);

      // Get hourly distribution
      const hourlyResult = await databaseService.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `, [storeId, dateFrom, dateTo]);

      // Get weekly distribution
      const weeklyResult = await databaseService.query(`
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY day_of_week
      `, [storeId, dateFrom, dateTo]);

      const analytics: SalesAnalytics = {
        period: {
          from: dateFrom,
          to: dateTo,
          granularity
        },
        overview: {
          totalRevenue: new Decimal(overview.total_revenue),
          totalOrders: parseInt(overview.total_orders),
          averageOrderValue: new Decimal(overview.average_order_value),
          grossMargin: new Decimal(overview.gross_margin),
          netMargin: new Decimal(overview.gross_margin), // Simplified for demo
          revenueGrowth,
          orderGrowth,
          customerGrowth: new Decimal(0) // Would need customer data
        },
        trends: trendsResult.rows.map((row: any) => ({
          date: new Date(row.date),
          revenue: new Decimal(row.revenue),
          orders: parseInt(row.orders),
          customers: parseInt(row.customers),
          averageOrderValue: new Decimal(row.average_order_value)
        })),
        topProducts: topProductsResult.rows.map((row: any) => ({
          productId: row.product_id,
          productName: row.product_name || 'Unknown Product',
          revenue: new Decimal(row.revenue),
          quantity: parseInt(row.quantity),
          orders: parseInt(row.orders)
        })),
        topCategories: topCategoriesResult.rows.map((row: any) => ({
          categoryId: row.category_id,
          categoryName: row.category_name || 'Unknown Category',
          revenue: new Decimal(row.revenue),
          quantity: parseInt(row.quantity),
          orders: parseInt(row.orders)
        })),
        salesChannels: channelsResult.rows.map((row: any) => ({
          channel: row.channel,
          revenue: new Decimal(row.revenue),
          orders: parseInt(row.orders),
          percentage: totalChannelRevenue > 0 
            ? new Decimal(row.revenue).div(totalChannelRevenue).mul(100)
            : new Decimal(0)
        })),
        paymentMethods: paymentMethodsResult.rows.map((row: any) => ({
          method: row.method,
          revenue: new Decimal(row.revenue),
          orders: parseInt(row.orders),
          percentage: totalPaymentRevenue > 0 
            ? new Decimal(row.revenue).div(totalPaymentRevenue).mul(100)
            : new Decimal(0)
        })),
        hourlyDistribution: hourlyResult.rows.map((row: any) => ({
          hour: parseInt(row.hour),
          revenue: new Decimal(row.revenue),
          orders: parseInt(row.orders)
        })),
        weeklyDistribution: weeklyResult.rows.map((row: any) => ({
          dayOfWeek: parseInt(row.day_of_week),
          revenue: new Decimal(row.revenue),
          orders: parseInt(row.orders)
        }))
      };

      logger.info('Sales analytics generated successfully', {
        storeId,
        dateFrom,
        dateTo,
        totalRevenue: analytics.overview.totalRevenue.toString(),
        totalOrders: analytics.overview.totalOrders
      });

      return analytics;
    } catch (error) {
      logger.error('Error generating sales analytics:', error);
      throw error;
    }
  }

  async getCustomerAnalytics(storeId: string, query: AnalyticsQuery): Promise<CustomerAnalytics> {
    try {
      const { dateFrom, dateTo } = query;

      // Get customer overview
      const overviewResult = await databaseService.query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT CASE WHEN c.created_at BETWEEN $2 AND $3 THEN c.id END) as new_customers,
          COUNT(DISTINCT CASE WHEN o.customer_id IS NOT NULL THEN o.customer_id END) as active_customers,
          COALESCE(AVG(customer_orders.order_count), 0) as avg_orders_per_customer
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id 
          AND o.created_at BETWEEN $2 AND $3 
          AND o.status = 'completed'
        LEFT JOIN (
          SELECT customer_id, COUNT(*) as order_count
          FROM orders 
          WHERE store_id = $1 AND status = 'completed'
          GROUP BY customer_id
        ) customer_orders ON c.id = customer_orders.customer_id
        WHERE c.store_id = $1
      `, [storeId, dateFrom, dateTo]);

      const overview = overviewResult.rows[0];

      // Calculate returning customers
      const returningCustomers = parseInt(overview.active_customers) - parseInt(overview.new_customers);

      // Get customer segments
      const segmentsResult = await databaseService.query(`
        SELECT 
          CASE 
            WHEN total_spent >= 1000 THEN 'VIP'
            WHEN total_spent >= 500 THEN 'Premium'
            WHEN total_spent >= 100 THEN 'Regular'
            ELSE 'New'
          END as segment,
          COUNT(*) as customers,
          COALESCE(SUM(total_spent), 0) as revenue,
          COALESCE(AVG(total_spent), 0) as average_order_value
        FROM (
          SELECT 
            c.id,
            COALESCE(SUM(o.total_amount), 0) as total_spent
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id 
            AND o.status = 'completed'
            AND o.created_at BETWEEN $2 AND $3
          WHERE c.store_id = $1
          GROUP BY c.id
        ) customer_spending
        GROUP BY segment
        ORDER BY revenue DESC
      `, [storeId, dateFrom, dateTo]);

      // Calculate segment percentages
      const totalSegmentCustomers = segmentsResult.rows.reduce((sum: number, row: any) => 
        sum + parseInt(row.customers), 0);

      // Get geographic distribution
      const geographicResult = await databaseService.query(`
        SELECT 
          COALESCE(country, 'Unknown') as country,
          COALESCE(state, '') as state,
          COALESCE(city, '') as city,
          COUNT(DISTINCT c.id) as customers,
          COALESCE(SUM(o.total_amount), 0) as revenue
        FROM customers c
        LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = true
        LEFT JOIN orders o ON c.id = o.customer_id 
          AND o.created_at BETWEEN $2 AND $3 
          AND o.status = 'completed'
        WHERE c.store_id = $1
        GROUP BY country, state, city
        ORDER BY customers DESC
        LIMIT 20
      `, [storeId, dateFrom, dateTo]);

      const analytics: CustomerAnalytics = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        overview: {
          totalCustomers: parseInt(overview.total_customers),
          newCustomers: parseInt(overview.new_customers),
          returningCustomers,
          customerRetentionRate: new Decimal(0), // Would need historical data for proper calculation
          customerLifetimeValue: new Decimal(0), // Would need historical data for proper calculation
          averageOrdersPerCustomer: new Decimal(overview.avg_orders_per_customer)
        },
        segments: segmentsResult.rows.map((row: any) => ({
          segment: row.segment,
          customers: parseInt(row.customers),
          revenue: new Decimal(row.revenue),
          averageOrderValue: new Decimal(row.average_order_value),
          percentage: totalSegmentCustomers > 0 
            ? new Decimal(row.customers).div(totalSegmentCustomers).mul(100)
            : new Decimal(0)
        })),
        cohortAnalysis: [], // Would need more complex implementation
        geographic: geographicResult.rows.map((row: any) => ({
          country: row.country,
          state: row.state || undefined,
          city: row.city || undefined,
          customers: parseInt(row.customers),
          revenue: new Decimal(row.revenue)
        })),
        acquisitionChannels: [] // Would need acquisition channel tracking
      };

      logger.info('Customer analytics generated successfully', {
        storeId,
        dateFrom,
        dateTo,
        totalCustomers: analytics.overview.totalCustomers,
        newCustomers: analytics.overview.newCustomers
      });

      return analytics;
    } catch (error) {
      logger.error('Error generating customer analytics:', error);
      throw error;
    }
  }

  async getInventoryAnalytics(storeId: string): Promise<InventoryAnalytics> {
    try {
      // Get inventory overview
      const overviewResult = await databaseService.query(`
        SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(current_stock * cost_price), 0) as total_value,
          COUNT(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items
        FROM products 
        WHERE store_id = $1 AND is_active = true
      `, [storeId]);

      const overview = overviewResult.rows[0];

      // Get low stock products
      const lowStockResult = await databaseService.query(`
        SELECT 
          id as product_id,
          name as product_name,
          current_stock,
          minimum_stock,
          GREATEST(minimum_stock * 2, minimum_stock + 10) as suggested_reorder
        FROM products 
        WHERE store_id = $1 
        AND is_active = true
        AND current_stock <= minimum_stock 
        AND current_stock > 0
        ORDER BY (current_stock::FLOAT / NULLIF(minimum_stock, 0)) ASC
        LIMIT 20
      `, [storeId]);

      // Get top selling products (last 30 days)
      const topSellingResult = await databaseService.query(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          COALESCE(SUM(oi.quantity), 0) as quantity_sold,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
          CASE 
            WHEN p.current_stock > 0 THEN COALESCE(SUM(oi.quantity), 0)::FLOAT / p.current_stock
            ELSE 0 
          END as inventory_turnover
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
          AND o.status = 'completed'
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        WHERE p.store_id = $1 AND p.is_active = true
        GROUP BY p.id, p.name, p.current_stock
        ORDER BY quantity_sold DESC
        LIMIT 20
      `, [storeId]);

      // Get slow moving products
      const slowMovingResult = await databaseService.query(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.current_stock,
          COALESCE(EXTRACT(DAYS FROM CURRENT_DATE - MAX(o.created_at)), 999) as days_since_last_sale,
          CASE 
            WHEN COALESCE(EXTRACT(DAYS FROM CURRENT_DATE - MAX(o.created_at)), 999) > 90 THEN 'Consider discount'
            WHEN COALESCE(EXTRACT(DAYS FROM CURRENT_DATE - MAX(o.created_at)), 999) > 60 THEN 'Monitor closely'
            ELSE 'Normal'
          END as suggested_action
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
        WHERE p.store_id = $1 
        AND p.is_active = true
        AND p.current_stock > 0
        GROUP BY p.id, p.name, p.current_stock
        HAVING COALESCE(EXTRACT(DAYS FROM CURRENT_DATE - MAX(o.created_at)), 999) > 30
        ORDER BY days_since_last_sale DESC
        LIMIT 20
      `, [storeId]);

      // Get category performance
      const categoryResult = await databaseService.query(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          COALESCE(SUM(p.current_stock * p.cost_price), 0) as total_value,
          COALESCE(AVG(sales_data.turnover), 0) as inventory_turnover,
          COALESCE(AVG(p.selling_price - p.cost_price), 0) as profit_margin
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.store_id = $1
        LEFT JOIN (
          SELECT 
            oi.product_id,
            COUNT(*) as turnover
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.store_id = $1 
          AND o.status = 'completed'
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY oi.product_id
        ) sales_data ON p.id = sales_data.product_id
        WHERE c.store_id = $1
        GROUP BY c.id, c.name
        ORDER BY total_value DESC
      `, [storeId]);

      const analytics: InventoryAnalytics = {
        overview: {
          totalProducts: parseInt(overview.total_products),
          totalValue: new Decimal(overview.total_value),
          lowStockItems: parseInt(overview.low_stock_items),
          outOfStockItems: parseInt(overview.out_of_stock_items),
          averageInventoryTurnover: new Decimal(0) // Would need more complex calculation
        },
        lowStockProducts: lowStockResult.rows.map((row: any) => ({
          productId: row.product_id,
          productName: row.product_name,
          currentStock: parseInt(row.current_stock),
          minimumStock: parseInt(row.minimum_stock),
          suggestedReorder: parseInt(row.suggested_reorder)
        })),
        topSellingProducts: topSellingResult.rows.map((row: any) => ({
          productId: row.product_id,
          productName: row.product_name,
          quantitySold: parseInt(row.quantity_sold),
          revenue: new Decimal(row.revenue),
          inventoryTurnover: new Decimal(row.inventory_turnover)
        })),
        slowMovingProducts: slowMovingResult.rows.map((row: any) => ({
          productId: row.product_id,
          productName: row.product_name,
          currentStock: parseInt(row.current_stock),
          daysSinceLastSale: parseInt(row.days_since_last_sale),
          suggestedAction: row.suggested_action
        })),
        categoryPerformance: categoryResult.rows.map((row: any) => ({
          categoryId: row.category_id,
          categoryName: row.category_name,
          totalValue: new Decimal(row.total_value),
          inventoryTurnover: new Decimal(row.inventory_turnover),
          profitMargin: new Decimal(row.profit_margin)
        }))
      };

      logger.info('Inventory analytics generated successfully', {
        storeId,
        totalProducts: analytics.overview.totalProducts,
        lowStockItems: analytics.overview.lowStockItems
      });

      return analytics;
    } catch (error) {
      logger.error('Error generating inventory analytics:', error);
      throw error;
    }
  }

  async getFinancialAnalytics(storeId: string, query: AnalyticsQuery): Promise<FinancialAnalytics> {
    try {
      const { dateFrom, dateTo } = query;

      // Get revenue data
      const revenueResult = await databaseService.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as gross_revenue,
          COALESCE(SUM(total_amount - tax_amount), 0) as net_revenue,
          COALESCE(SUM(CASE WHEN order_type = 'subscription' THEN total_amount ELSE 0 END), 0) as recurring_revenue,
          COALESCE(SUM(CASE WHEN order_type != 'subscription' THEN total_amount ELSE 0 END), 0) as one_time_revenue
        FROM orders 
        WHERE store_id = $1 
        AND status = 'completed'
        AND created_at BETWEEN $2 AND $3
      `, [storeId, dateFrom, dateTo]);

      const revenue = revenueResult.rows[0];

      // Get expense data (simplified - would integrate with expense tracking system)
      const expenseResult = await databaseService.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_expenses
        FROM expenses 
        WHERE store_id = $1 
        AND expense_date BETWEEN $2 AND $3
      `, [storeId, dateFrom, dateTo]);

      const expenses = expenseResult.rows[0] || { total_expenses: 0 };

      // Calculate profitability metrics
      const grossRevenue = new Decimal(revenue.gross_revenue);
      const netRevenue = new Decimal(revenue.net_revenue);
      const totalExpenses = new Decimal(expenses.total_expenses);
      
      const grossProfit = grossRevenue.minus(totalExpenses);
      const netProfit = netRevenue.minus(totalExpenses);
      const grossMargin = grossRevenue.gt(0) ? grossProfit.div(grossRevenue).mul(100) : new Decimal(0);
      const netMargin = netRevenue.gt(0) ? netProfit.div(netRevenue).mul(100) : new Decimal(0);

      const analytics: FinancialAnalytics = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        revenue: {
          gross: grossRevenue,
          net: netRevenue,
          recurring: new Decimal(revenue.recurring_revenue),
          oneTime: new Decimal(revenue.one_time_revenue)
        },
        expenses: {
          total: totalExpenses,
          categories: [] // Would need expense category breakdown
        },
        profitability: {
          grossProfit,
          grossMargin,
          netProfit,
          netMargin,
          ebitda: grossProfit // Simplified calculation
        },
        cashFlow: {
          operating: netProfit,
          investing: new Decimal(0),
          financing: new Decimal(0),
          net: netProfit
        },
        kpis: [
          {
            name: 'Revenue Growth',
            value: new Decimal(0), // Would need period comparison
            trend: 'stable'
          },
          {
            name: 'Gross Margin',
            value: grossMargin,
            target: new Decimal(30),
            trend: 'stable'
          },
          {
            name: 'Net Margin',
            value: netMargin,
            target: new Decimal(15),
            trend: 'stable'
          }
        ]
      };

      logger.info('Financial analytics generated successfully', {
        storeId,
        dateFrom,
        dateTo,
        grossRevenue: analytics.revenue.gross.toString(),
        netProfit: analytics.profitability.netProfit.toString()
      });

      return analytics;
    } catch (error) {
      logger.error('Error generating financial analytics:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();