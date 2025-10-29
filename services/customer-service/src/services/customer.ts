import { Decimal } from 'decimal.js';
import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import {
  Customer,
  CustomerAddress,
  CustomerPreferences,
  CustomerLoyalty,
  CustomerAnalytics,
  CustomerStatus,
  CustomerType,
  CustomerSegment,
  LoyaltyTier,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchQuery,
  CustomerStatsResponse,
  CustomerEvent,
  LoyaltyPointsDto,
  LoyaltyTransaction,
  PurchaseHistorySummary
} from '../models/types';

export class CustomerService {
  constructor() {
    logger.info('Customer service initialized');
  }

  async createCustomer(storeId: string, dto: CreateCustomerDto): Promise<Customer> {
    return await databaseService.transaction(async (client) => {
      try {
        // Create customer record
        const customerId = uuidv4();
        
        const customerResult = await client.query(`
          INSERT INTO customers (
            id, store_id, type, first_name, last_name, email, phone,
            date_of_birth, gender, company_name, tax_id, tags, notes, custom_fields
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          customerId,
          storeId,
          dto.type || CustomerType.INDIVIDUAL,
          dto.firstName,
          dto.lastName,
          dto.email || null,
          dto.phone || null,
          dto.dateOfBirth || null,
          dto.gender || null,
          dto.companyName || null,
          dto.taxId || null,
          dto.tags || [],
          dto.notes || '',
          JSON.stringify(dto.customFields || {})
        ]);

        // Create address if provided
        if (dto.address) {
          await client.query(`
            INSERT INTO customer_addresses (
              customer_id, type, is_default, street1, street2, city, 
              state, postal_code, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            customerId,
            dto.address.type || 'home',
            true, // First address is default
            dto.address.street1,
            dto.address.street2 || null,
            dto.address.city,
            dto.address.state,
            dto.address.postalCode,
            dto.address.country || 'US'
          ]);
        }

        // Create preferences
        await client.query(`
          INSERT INTO customer_preferences (
            customer_id, contact_method, marketing_opt_in, sms_opt_in,
            email_opt_in, push_notifications_opt_in, language, currency, timezone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          customerId,
          dto.preferences?.contactMethod || 'email',
          dto.preferences?.marketingOptIn || false,
          dto.preferences?.smsOptIn || false,
          dto.preferences?.emailOptIn || false,
          dto.preferences?.pushNotificationsOptIn || false,
          dto.preferences?.language || 'en',
          dto.preferences?.currency || 'USD',
          dto.preferences?.timezone || 'UTC'
        ]);

        // Create initial analytics record
        await client.query(`
          INSERT INTO customer_analytics (customer_id, segment)
          VALUES ($1, $2)
        `, [customerId, CustomerSegment.NEW]);

        // Log customer creation event
        await this.logCustomerEvent(client, customerId, storeId, 'created', {
          customerData: dto
        });

        // Get the complete customer record
        const customer = await this.getCustomer(storeId, customerId);
        if (!customer) {
          throw new Error('Failed to retrieve created customer');
        }

        logger.info('Customer created successfully', { 
          customerId, 
          storeId, 
          email: dto.email 
        });

        return customer;
      } catch (error) {
        logger.error('Error creating customer:', error);
        throw error;
      }
    });
  }

  async updateCustomer(
    storeId: string, 
    customerId: string, 
    dto: UpdateCustomerDto
  ): Promise<Customer> {
    return await databaseService.transaction(async (client) => {
      try {
        // Check if customer exists
        const existingResult = await client.query(
          'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
          [customerId, storeId]
        );

        if (existingResult.rows.length === 0) {
          throw new Error('Customer not found');
        }

        // Build update query dynamically
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramCount = 0;

        if (dto.firstName !== undefined) {
          updateFields.push(`first_name = $${++paramCount}`);
          updateValues.push(dto.firstName);
        }
        if (dto.lastName !== undefined) {
          updateFields.push(`last_name = $${++paramCount}`);
          updateValues.push(dto.lastName);
        }
        if (dto.email !== undefined) {
          updateFields.push(`email = $${++paramCount}`);
          updateValues.push(dto.email);
        }
        if (dto.phone !== undefined) {
          updateFields.push(`phone = $${++paramCount}`);
          updateValues.push(dto.phone);
        }
        if (dto.dateOfBirth !== undefined) {
          updateFields.push(`date_of_birth = $${++paramCount}`);
          updateValues.push(dto.dateOfBirth);
        }
        if (dto.gender !== undefined) {
          updateFields.push(`gender = $${++paramCount}`);
          updateValues.push(dto.gender);
        }
        if (dto.companyName !== undefined) {
          updateFields.push(`company_name = $${++paramCount}`);
          updateValues.push(dto.companyName);
        }
        if (dto.taxId !== undefined) {
          updateFields.push(`tax_id = $${++paramCount}`);
          updateValues.push(dto.taxId);
        }
        if (dto.status !== undefined) {
          updateFields.push(`status = $${++paramCount}`);
          updateValues.push(dto.status);
        }
        if (dto.tags !== undefined) {
          updateFields.push(`tags = $${++paramCount}`);
          updateValues.push(dto.tags);
        }
        if (dto.notes !== undefined) {
          updateFields.push(`notes = $${++paramCount}`);
          updateValues.push(dto.notes);
        }
        if (dto.customFields !== undefined) {
          updateFields.push(`custom_fields = $${++paramCount}`);
          updateValues.push(JSON.stringify(dto.customFields));
        }

        if (updateFields.length > 0) {
          await client.query(`
            UPDATE customers 
            SET ${updateFields.join(', ')}
            WHERE id = $${++paramCount} AND store_id = $${++paramCount}
          `, [...updateValues, customerId, storeId]);
        }

        // Log customer update event
        await this.logCustomerEvent(client, customerId, storeId, 'updated', {
          updateData: dto
        });

        // Get updated customer
        const customer = await this.getCustomer(storeId, customerId);
        if (!customer) {
          throw new Error('Failed to retrieve updated customer');
        }

        logger.info('Customer updated successfully', { customerId, storeId });

        return customer;
      } catch (error) {
        logger.error('Error updating customer:', error);
        throw error;
      }
    });
  }

  async getCustomer(storeId: string, customerId: string): Promise<Customer | null> {
    try {
      const result = await databaseService.query(`
        SELECT c.*, 
               cp.contact_method, cp.marketing_opt_in, cp.sms_opt_in, 
               cp.email_opt_in, cp.push_notifications_opt_in, cp.language, 
               cp.currency, cp.timezone, cp.communication_frequency,
               ca.segment, ca.total_transactions, ca.total_spent, 
               ca.average_order_value, ca.lifetime_value, ca.churn_risk
        FROM customers c
        LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
        LEFT JOIN customer_analytics ca ON c.id = ca.customer_id
        WHERE c.id = $1 AND c.store_id = $2
      `, [customerId, storeId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // Get addresses
      const addressesResult = await databaseService.query(
        'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC',
        [customerId]
      );

      // Get loyalty information
      const loyaltyResult = await databaseService.query(`
        SELECT cl.*, lp.name as program_name 
        FROM customer_loyalty cl
        JOIN loyalty_programs lp ON cl.program_id = lp.id
        WHERE cl.customer_id = $1
      `, [customerId]);

      return this.mapCustomer(row, addressesResult.rows, loyaltyResult.rows[0]);
    } catch (error) {
      logger.error('Error getting customer:', error);
      throw error;
    }
  }

  async searchCustomers(
    storeId: string, 
    query: CustomerSearchQuery
  ): Promise<{ customers: Customer[]; total: number }> {
    try {
      let whereClause = 'WHERE c.store_id = $1';
      const params: any[] = [storeId];
      let paramCount = 1;

      if (query.query) {
        whereClause += ` AND (
          c.first_name ILIKE $${++paramCount} OR 
          c.last_name ILIKE $${++paramCount} OR 
          c.email ILIKE $${++paramCount} OR 
          c.phone ILIKE $${++paramCount} OR
          c.customer_number ILIKE $${++paramCount}
        )`;
        const searchTerm = `%${query.query}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (query.status) {
        whereClause += ` AND c.status = $${++paramCount}`;
        params.push(query.status);
      }

      if (query.type) {
        whereClause += ` AND c.type = $${++paramCount}`;
        params.push(query.type);
      }

      if (query.segment) {
        whereClause += ` AND ca.segment = $${++paramCount}`;
        params.push(query.segment);
      }

      if (query.tier) {
        whereClause += ` AND cl.tier = $${++paramCount}`;
        params.push(query.tier);
      }

      if (query.tags && query.tags.length > 0) {
        whereClause += ` AND c.tags && $${++paramCount}`;
        params.push(query.tags);
      }

      if (query.createdFrom) {
        whereClause += ` AND c.created_at >= $${++paramCount}`;
        params.push(query.createdFrom);
      }

      if (query.createdTo) {
        whereClause += ` AND c.created_at <= $${++paramCount}`;
        params.push(query.createdTo);
      }

      if (query.lastVisitFrom) {
        whereClause += ` AND c.last_visit_at >= $${++paramCount}`;
        params.push(query.lastVisitFrom);
      }

      if (query.lastVisitTo) {
        whereClause += ` AND c.last_visit_at <= $${++paramCount}`;
        params.push(query.lastVisitTo);
      }

      if (query.totalSpentMin !== undefined) {
        whereClause += ` AND ca.total_spent >= $${++paramCount}`;
        params.push(query.totalSpentMin);
      }

      if (query.totalSpentMax !== undefined) {
        whereClause += ` AND ca.total_spent <= $${++paramCount}`;
        params.push(query.totalSpentMax);
      }

      // Get total count
      const countResult = await databaseService.query(`
        SELECT COUNT(DISTINCT c.id) 
        FROM customers c
        LEFT JOIN customer_analytics ca ON c.id = ca.customer_id
        LEFT JOIN customer_loyalty cl ON c.id = cl.customer_id
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const offset = (page - 1) * limit;

      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      
      let orderClause = '';
      switch (sortBy) {
        case 'name':
          orderClause = `ORDER BY c.first_name ${sortOrder}, c.last_name ${sortOrder}`;
          break;
        case 'email':
          orderClause = `ORDER BY c.email ${sortOrder}`;
          break;
        case 'lastVisitAt':
          orderClause = `ORDER BY c.last_visit_at ${sortOrder} NULLS LAST`;
          break;
        case 'totalSpent':
          orderClause = `ORDER BY ca.total_spent ${sortOrder}`;
          break;
        default:
          orderClause = `ORDER BY c.created_at ${sortOrder}`;
      }

      const result = await databaseService.query(`
        SELECT c.*, 
               cp.contact_method, cp.marketing_opt_in, cp.language, cp.currency,
               ca.segment, ca.total_transactions, ca.total_spent, 
               ca.average_order_value, ca.lifetime_value, ca.churn_risk,
               cl.tier, cl.points
        FROM customers c
        LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
        LEFT JOIN customer_analytics ca ON c.id = ca.customer_id
        LEFT JOIN customer_loyalty cl ON c.id = cl.customer_id
        ${whereClause}
        ${orderClause}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `, [...params, limit, offset]);

      const customers = await Promise.all(
        result.rows.map(async (row: any) => {
          // Get addresses for each customer
          const addressesResult = await databaseService.query(
            'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC',
            [row.id]
          );

          return this.mapCustomer(row, addressesResult.rows, row);
        })
      );

      return { customers, total };
    } catch (error) {
      logger.error('Error searching customers:', error);
      throw error;
    }
  }

  async deleteCustomer(storeId: string, customerId: string): Promise<void> {
    return await databaseService.transaction(async (client) => {
      try {
        // Check if customer exists
        const existingResult = await client.query(
          'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
          [customerId, storeId]
        );

        if (existingResult.rows.length === 0) {
          throw new Error('Customer not found');
        }

        // Log customer deletion event
        await this.logCustomerEvent(client, customerId, storeId, 'deleted', {});

        // Delete customer (cascades to related tables)
        await client.query(
          'DELETE FROM customers WHERE id = $1 AND store_id = $2',
          [customerId, storeId]
        );

        logger.info('Customer deleted successfully', { customerId, storeId });
      } catch (error) {
        logger.error('Error deleting customer:', error);
        throw error;
      }
    });
  }

  async addLoyaltyPoints(
    storeId: string, 
    dto: LoyaltyPointsDto
  ): Promise<LoyaltyTransaction> {
    return await databaseService.transaction(async (client) => {
      try {
        // Get customer loyalty info
        const loyaltyResult = await client.query(`
          SELECT cl.*, lp.points_per_dollar, lp.point_value
          FROM customer_loyalty cl
          JOIN loyalty_programs lp ON cl.program_id = lp.id
          WHERE cl.customer_id = $1
        `, [dto.customerId]);

        if (loyaltyResult.rows.length === 0) {
          throw new Error('Customer not enrolled in loyalty program');
        }

        const loyalty = loyaltyResult.rows[0];
        const pointsDecimal = new Decimal(dto.points);

        // Create loyalty transaction
        const transactionId = uuidv4();
        await client.query(`
          INSERT INTO loyalty_transactions (
            id, customer_id, program_id, transaction_id, type, points, 
            description, reference, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          transactionId,
          dto.customerId,
          loyalty.program_id,
          dto.transactionId || null,
          dto.type,
          pointsDecimal,
          dto.description,
          dto.reference || null,
          dto.type === 'earned' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
        ]);

        // Update customer loyalty points
        if (dto.type === 'earned') {
          await client.query(`
            UPDATE customer_loyalty 
            SET points = points + $1, 
                total_points_earned = total_points_earned + $1,
                last_activity_at = CURRENT_TIMESTAMP
            WHERE customer_id = $2
          `, [pointsDecimal, dto.customerId]);
        } else if (dto.type === 'redeemed') {
          await client.query(`
            UPDATE customer_loyalty 
            SET points = points - $1, 
                total_points_redeemed = total_points_redeemed + $1,
                last_activity_at = CURRENT_TIMESTAMP
            WHERE customer_id = $2
          `, [pointsDecimal, dto.customerId]);
        }

        // Get the created transaction
        const transactionResult = await client.query(
          'SELECT * FROM loyalty_transactions WHERE id = $1',
          [transactionId]
        );

        const transaction = this.mapLoyaltyTransaction(transactionResult.rows[0]);

        logger.info('Loyalty points transaction created', {
          customerId: dto.customerId,
          type: dto.type,
          points: dto.points
        });

        return transaction;
      } catch (error) {
        logger.error('Error adding loyalty points:', error);
        throw error;
      }
    });
  }

  async getCustomerStats(storeId: string): Promise<CustomerStatsResponse> {
    try {
      // Total customers
      const totalResult = await databaseService.query(
        'SELECT COUNT(*) FROM customers WHERE store_id = $1',
        [storeId]
      );

      // New customers this month
      const newThisMonthResult = await databaseService.query(`
        SELECT COUNT(*) FROM customers 
        WHERE store_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)
      `, [storeId]);

      // Active customers (visited in last 30 days)
      const activeResult = await databaseService.query(`
        SELECT COUNT(*) FROM customers 
        WHERE store_id = $1 AND last_visit_at >= CURRENT_DATE - INTERVAL '30 days'
      `, [storeId]);

      // Customer growth rate (month over month)
      const lastMonthResult = await databaseService.query(`
        SELECT COUNT(*) FROM customers 
        WHERE store_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < date_trunc('month', CURRENT_DATE)
      `, [storeId]);

      const currentMonth = parseInt(newThisMonthResult.rows[0].count);
      const lastMonth = parseInt(lastMonthResult.rows[0].count);
      const growthRate = lastMonth > 0 ? new Decimal(currentMonth - lastMonth).div(lastMonth).mul(100) : new Decimal(0);

      // Average lifetime value
      const avgLifetimeResult = await databaseService.query(`
        SELECT AVG(lifetime_value) as avg_ltv FROM customer_analytics ca
        JOIN customers c ON ca.customer_id = c.id
        WHERE c.store_id = $1
      `, [storeId]);

      // Top spenders
      const topSpendersResult = await databaseService.query(`
        SELECT c.id, c.first_name, c.last_name, ca.total_spent
        FROM customers c
        JOIN customer_analytics ca ON c.id = ca.customer_id
        WHERE c.store_id = $1 AND ca.total_spent > 0
        ORDER BY ca.total_spent DESC
        LIMIT 10
      `, [storeId]);

      // Segment distribution
      const segmentResult = await databaseService.query(`
        SELECT ca.segment, COUNT(*) as count
        FROM customer_analytics ca
        JOIN customers c ON ca.customer_id = c.id
        WHERE c.store_id = $1
        GROUP BY ca.segment
      `, [storeId]);

      // Tier distribution
      const tierResult = await databaseService.query(`
        SELECT cl.tier, COUNT(*) as count
        FROM customer_loyalty cl
        JOIN customers c ON cl.customer_id = c.id
        WHERE c.store_id = $1
        GROUP BY cl.tier
      `, [storeId]);

      const stats: CustomerStatsResponse = {
        totalCustomers: parseInt(totalResult.rows[0].count),
        newCustomersThisMonth: currentMonth,
        activeCustomers: parseInt(activeResult.rows[0].count),
        customerGrowthRate: growthRate,
        averageLifetimeValue: new Decimal(avgLifetimeResult.rows[0].avg_ltv || 0),
        topSpenders: topSpendersResult.rows.map((row: any) => ({
          customerId: row.id,
          name: `${row.first_name} ${row.last_name}`,
          totalSpent: new Decimal(row.total_spent)
        })),
        segmentDistribution: segmentResult.rows.reduce((acc: any, row: any) => {
          acc[row.segment] = parseInt(row.count);
          return acc;
        }, {}),
        tierDistribution: tierResult.rows.reduce((acc: any, row: any) => {
          acc[row.tier] = parseInt(row.count);
          return acc;
        }, {})
      };

      return stats;
    } catch (error) {
      logger.error('Error getting customer stats:', error);
      throw error;
    }
  }

  private async logCustomerEvent(
    client: PoolClient,
    customerId: string,
    storeId: string,
    type: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await client.query(`
      INSERT INTO customer_events (customer_id, store_id, type, data, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [customerId, storeId, type, JSON.stringify(data), JSON.stringify(metadata || {})]);
  }

  private mapCustomer(
    row: any, 
    addresses: any[], 
    loyaltyRow?: any
  ): Customer {
    const customer: Customer = {
      id: row.id,
      storeId: row.store_id,
      customerNumber: row.customer_number,
      type: row.type,
      status: row.status,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
      gender: row.gender,
      companyName: row.company_name,
      taxId: row.tax_id,
      addresses: addresses.map(addr => this.mapAddress(addr)),
      preferences: {
        id: row.id,
        customerId: row.id,
        contactMethod: row.contact_method || 'email',
        marketingOptIn: row.marketing_opt_in || false,
        smsOptIn: row.sms_opt_in || false,
        emailOptIn: row.email_opt_in || false,
        pushNotificationsOptIn: row.push_notifications_opt_in || false,
        language: row.language || 'en',
        currency: row.currency || 'USD',
        timezone: row.timezone || 'UTC',
        communicationFrequency: row.communication_frequency || 'weekly',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      loyaltyProgram: loyaltyRow ? {
        id: loyaltyRow.id,
        customerId: row.id,
        programId: loyaltyRow.program_id,
        tier: loyaltyRow.tier || LoyaltyTier.BRONZE,
        points: new Decimal(loyaltyRow.points || 0),
        totalPointsEarned: new Decimal(loyaltyRow.total_points_earned || 0),
        totalPointsRedeemed: new Decimal(loyaltyRow.total_points_redeemed || 0),
        joinedAt: new Date(loyaltyRow.joined_at),
        expiresAt: loyaltyRow.expires_at ? new Date(loyaltyRow.expires_at) : undefined,
        lastActivityAt: new Date(loyaltyRow.last_activity_at),
        createdAt: new Date(loyaltyRow.created_at),
        updatedAt: new Date(loyaltyRow.updated_at)
      } : undefined,
      analytics: {
        id: row.id,
        customerId: row.id,
        segment: row.segment || CustomerSegment.NEW,
        totalTransactions: row.total_transactions || 0,
        totalSpent: new Decimal(row.total_spent || 0),
        averageOrderValue: new Decimal(row.average_order_value || 0),
        lastPurchaseAmount: new Decimal(0),
        totalVisits: 0,
        averageVisitsPerMonth: new Decimal(0),
        daysSinceLastVisit: 0,
        averageSessionDuration: 0,
        emailOpenRate: new Decimal(0),
        smsClickRate: new Decimal(0),
        loyaltyEngagement: new Decimal(0),
        churnRisk: row.churn_risk || 'low',
        lifetimeValue: new Decimal(row.lifetime_value || 0),
        predictedValue: new Decimal(0),
        mostPurchasedProducts: [],
        preferredShoppingTime: row.preferred_shopping_time || '12:00',
        preferredShoppingDay: row.preferred_shopping_day || 'monday',
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      tags: row.tags || [],
      notes: row.notes || '',
      customFields: row.custom_fields || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastVisitAt: row.last_visit_at ? new Date(row.last_visit_at) : undefined
    };

    return customer;
  }

  private mapAddress(row: any): CustomerAddress {
    return {
      id: row.id,
      customerId: row.customer_id,
      type: row.type,
      isDefault: row.is_default,
      street1: row.street1,
      street2: row.street2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapLoyaltyTransaction(row: any): LoyaltyTransaction {
    return {
      id: row.id,
      customerId: row.customer_id,
      programId: row.program_id,
      transactionId: row.transaction_id,
      type: row.type,
      points: new Decimal(row.points),
      description: row.description,
      reference: row.reference,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      createdAt: new Date(row.created_at)
    };
  }
}

export const customerService = new CustomerService();