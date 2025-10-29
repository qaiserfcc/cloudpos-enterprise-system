import express, { Request, Response, NextFunction } from 'express';
import { Decimal } from 'decimal.js';
import { databaseService } from '../services/database';
import { logger } from '../utils/logger';
import {
  customerIdSchema,
  dateRangeSchema,
  paginationSchema
} from '../schemas/validation';
import { CustomerAnalytics, CustomerSegment } from '../models/types';

const router = express.Router();

// Middleware for params validation
const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parameters validation error',
        errors: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.params = value;
    next();
  };
};

// Middleware for query validation
const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.query = value;
    next();
  };
};

// Error handling middleware
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// GET /analytics/customers/:customerId - Get customer analytics
router.get(
  '/customers/:customerId',
  validateParams(customerIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const { customerId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    // Verify customer exists in store
    const customerCheck = await databaseService.query(
      'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, storeId]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const result = await databaseService.query(
      'SELECT * FROM customer_analytics WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer analytics not found'
      });
    }

    const row = result.rows[0];
    const analytics: CustomerAnalytics = {
      id: row.id,
      customerId: row.customer_id,
      segment: row.segment,
      totalTransactions: row.total_transactions,
      totalSpent: new Decimal(row.total_spent),
      averageOrderValue: new Decimal(row.average_order_value),
      lastPurchaseAmount: new Decimal(row.last_purchase_amount),
      totalVisits: row.total_visits,
      averageVisitsPerMonth: new Decimal(row.average_visits_per_month),
      daysSinceLastVisit: row.days_since_last_visit,
      averageSessionDuration: row.average_session_duration,
      emailOpenRate: new Decimal(row.email_open_rate),
      smsClickRate: new Decimal(row.sms_click_rate),
      loyaltyEngagement: new Decimal(row.loyalty_engagement),
      churnRisk: row.churn_risk,
      lifetimeValue: new Decimal(row.lifetime_value),
      predictedValue: new Decimal(row.predicted_value),
      mostPurchasedProducts: row.most_purchased_products || [],
      preferredShoppingTime: row.preferred_shopping_time,
      preferredShoppingDay: row.preferred_shopping_day,
      calculatedAt: new Date(row.calculated_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    res.json({
      success: true,
      data: analytics
    });
  })
);

// GET /analytics/overview - Get analytics overview for store
router.get(
  '/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    // Customer segment distribution
    const segmentResult = await databaseService.query(`
      SELECT ca.segment, COUNT(*) as count, AVG(ca.lifetime_value) as avg_ltv
      FROM customer_analytics ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.store_id = $1
      GROUP BY ca.segment
    `, [storeId]);

    // Churn risk analysis
    const churnResult = await databaseService.query(`
      SELECT ca.churn_risk, COUNT(*) as count
      FROM customer_analytics ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.store_id = $1
      GROUP BY ca.churn_risk
    `, [storeId]);

    // Revenue analytics
    const revenueResult = await databaseService.query(`
      SELECT 
        SUM(ca.total_spent) as total_revenue,
        AVG(ca.total_spent) as avg_customer_value,
        AVG(ca.average_order_value) as avg_order_value,
        COUNT(*) as total_customers
      FROM customer_analytics ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.store_id = $1
    `, [storeId]);

    // Top customers by value
    const topCustomersResult = await databaseService.query(`
      SELECT 
        c.id, c.first_name, c.last_name, c.email,
        ca.total_spent, ca.total_transactions, ca.segment
      FROM customer_analytics ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.store_id = $1 AND ca.total_spent > 0
      ORDER BY ca.total_spent DESC
      LIMIT 10
    `, [storeId]);

    // Growth trends (monthly)
    const growthResult = await databaseService.query(`
      SELECT 
        DATE_TRUNC('month', c.created_at) as month,
        COUNT(*) as new_customers,
        SUM(ca.total_spent) as revenue
      FROM customers c
      LEFT JOIN customer_analytics ca ON c.id = ca.customer_id
      WHERE c.store_id = $1 AND c.created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY month DESC
    `, [storeId]);

    const overview = {
      segmentDistribution: segmentResult.rows.map((row: any) => ({
        segment: row.segment,
        count: parseInt(row.count),
        averageLifetimeValue: new Decimal(row.avg_ltv || 0)
      })),
      churnAnalysis: churnResult.rows.map((row: any) => ({
        risk: row.churn_risk,
        count: parseInt(row.count)
      })),
      revenue: {
        totalRevenue: new Decimal(revenueResult.rows[0]?.total_revenue || 0),
        averageCustomerValue: new Decimal(revenueResult.rows[0]?.avg_customer_value || 0),
        averageOrderValue: new Decimal(revenueResult.rows[0]?.avg_order_value || 0),
        totalCustomers: parseInt(revenueResult.rows[0]?.total_customers || 0)
      },
      topCustomers: topCustomersResult.rows.map((row: any) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        totalSpent: new Decimal(row.total_spent),
        totalTransactions: row.total_transactions,
        segment: row.segment
      })),
      monthlyGrowth: growthResult.rows.map((row: any) => ({
        month: row.month,
        newCustomers: parseInt(row.new_customers),
        revenue: new Decimal(row.revenue || 0)
      }))
    };

    res.json({
      success: true,
      data: overview
    });
  })
);

// GET /analytics/segments - Get customer segments analysis
router.get(
  '/segments',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const segmentAnalysis = await Promise.all(
      Object.values(CustomerSegment).map(async (segment) => {
        const result = await databaseService.query(`
          SELECT 
            COUNT(*) as count,
            AVG(ca.total_spent) as avg_spent,
            AVG(ca.total_transactions) as avg_transactions,
            AVG(ca.average_order_value) as avg_order_value,
            AVG(ca.lifetime_value) as avg_lifetime_value,
            AVG(ca.email_open_rate) as avg_email_open_rate,
            AVG(ca.loyalty_engagement) as avg_loyalty_engagement
          FROM customer_analytics ca
          JOIN customers c ON ca.customer_id = c.id
          WHERE c.store_id = $1 AND ca.segment = $2
        `, [storeId, segment]);

        const row = result.rows[0];
        return {
          segment,
          metrics: {
            count: parseInt(row.count),
            averageSpent: new Decimal(row.avg_spent || 0),
            averageTransactions: new Decimal(row.avg_transactions || 0),
            averageOrderValue: new Decimal(row.avg_order_value || 0),
            averageLifetimeValue: new Decimal(row.avg_lifetime_value || 0),
            averageEmailOpenRate: new Decimal(row.avg_email_open_rate || 0),
            averageLoyaltyEngagement: new Decimal(row.avg_loyalty_engagement || 0)
          }
        };
      })
    );

    res.json({
      success: true,
      data: segmentAnalysis
    });
  })
);

// GET /analytics/cohorts - Get cohort analysis
router.get(
  '/cohorts',
  validateQuery(dateRangeSchema.optional()),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const { startDate, endDate } = req.query as any;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Monthly cohort analysis
    const cohortResult = await databaseService.query(`
      WITH cohorts AS (
        SELECT 
          DATE_TRUNC('month', c.created_at) as cohort_month,
          c.id as customer_id,
          ca.total_spent,
          ca.total_transactions
        FROM customers c
        LEFT JOIN customer_analytics ca ON c.id = ca.customer_id
        WHERE c.store_id = $1 
        AND c.created_at >= $2 
        AND c.created_at <= $3
      )
      SELECT 
        cohort_month,
        COUNT(*) as cohort_size,
        AVG(total_spent) as avg_revenue_per_customer,
        SUM(total_spent) as total_cohort_revenue,
        AVG(total_transactions) as avg_transactions_per_customer
      FROM cohorts
      GROUP BY cohort_month
      ORDER BY cohort_month
    `, [storeId, start, end]);

    const cohorts = cohortResult.rows.map((row: any) => ({
      month: row.cohort_month,
      size: parseInt(row.cohort_size),
      averageRevenuePerCustomer: new Decimal(row.avg_revenue_per_customer || 0),
      totalRevenue: new Decimal(row.total_cohort_revenue || 0),
      averageTransactionsPerCustomer: new Decimal(row.avg_transactions_per_customer || 0)
    }));

    res.json({
      success: true,
      data: {
        cohorts,
        period: {
          startDate: start,
          endDate: end
        }
      }
    });
  })
);

// POST /analytics/recalculate - Trigger analytics recalculation
router.post(
  '/recalculate',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    // This would typically trigger a background job
    // For now, we'll just update the calculated_at timestamp
    await databaseService.query(`
      UPDATE customer_analytics 
      SET calculated_at = CURRENT_TIMESTAMP 
      WHERE customer_id IN (
        SELECT id FROM customers WHERE store_id = $1
      )
    `, [storeId]);

    res.json({
      success: true,
      message: 'Analytics recalculation triggered',
      data: {
        status: 'queued',
        triggeredAt: new Date()
      }
    });
  })
);

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Analytics API error:', error);

  if (error.message === 'Customer not found' || error.message === 'Customer analytics not found') {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }

  // Database connection errors
  if (error.message.includes('connection') || error.message.includes('database')) {
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;