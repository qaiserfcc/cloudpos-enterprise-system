import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

export class MongoManager {
  private static client: MongoClient;
  private static db: Db;

  static async connect(uri: string = process.env.MONGODB_URL || 'mongodb://localhost:27017'): Promise<void> {
    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
        retryReads: true,
      });

      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB || 'cloudpos_analytics');
      
      console.log('Connected to MongoDB for analytics');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }

  static getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  static getCollection(name: string): Collection {
    return this.getDatabase().collection(name);
  }

  /**
   * Analytics Collections
   */

  // Transaction Analytics
  static async logTransaction(transactionData: {
    transactionId: string;
    storeId: string;
    terminalId: string;
    userId: string;
    customerId?: string;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    timestamp: Date;
    duration: number; // transaction duration in seconds
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('transaction_analytics');
    await collection.insertOne({
      ...transactionData,
      _id: new ObjectId(),
      transactionId: transactionData.transactionId,
      createdAt: new Date(),
    });
  }

  // User Activity Analytics
  static async logUserActivity(activityData: {
    userId: string;
    storeId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const collection = this.getCollection('user_activity');
    await collection.insertOne({
      ...activityData,
      createdAt: new Date(),
    });
  }

  // Product Performance Analytics
  static async logProductPerformance(performanceData: {
    productId: string;
    storeId: string;
    date: Date;
    quantitySold: number;
    revenue: number;
    averageTransactionValue: number;
    uniqueCustomers: number;
    timeOfDayDistribution: Record<string, number>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('product_performance');
    
    // Use upsert to update daily totals
    await collection.updateOne(
      {
        productId: performanceData.productId,
        storeId: performanceData.storeId,
        date: {
          $gte: new Date(performanceData.date.getFullYear(), performanceData.date.getMonth(), performanceData.date.getDate()),
          $lt: new Date(performanceData.date.getFullYear(), performanceData.date.getMonth(), performanceData.date.getDate() + 1),
        },
      },
      {
        $inc: {
          quantitySold: performanceData.quantitySold,
          revenue: performanceData.revenue,
          uniqueCustomers: performanceData.uniqueCustomers,
        },
        $set: {
          averageTransactionValue: performanceData.averageTransactionValue,
          timeOfDayDistribution: performanceData.timeOfDayDistribution,
          metadata: performanceData.metadata,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // Store Performance Analytics
  static async logStorePerformance(performanceData: {
    storeId: string;
    date: Date;
    totalTransactions: number;
    totalRevenue: number;
    averageTransactionValue: number;
    uniqueCustomers: number;
    peakHours: Array<{ hour: number; transactions: number }>;
    topProducts: Array<{ productId: string; quantity: number; revenue: number }>;
    paymentMethodDistribution: Record<string, number>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('store_performance');
    
    await collection.updateOne(
      {
        storeId: performanceData.storeId,
        date: {
          $gte: new Date(performanceData.date.getFullYear(), performanceData.date.getMonth(), performanceData.date.getDate()),
          $lt: new Date(performanceData.date.getFullYear(), performanceData.date.getMonth(), performanceData.date.getDate() + 1),
        },
      },
      {
        $set: {
          ...performanceData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // Customer Analytics
  static async logCustomerAnalytics(customerData: {
    customerId: string;
    storeId: string;
    visitDate: Date;
    transactionCount: number;
    totalSpent: number;
    averageTransactionValue: number;
    categoriesPurchased: string[];
    loyaltyPointsEarned: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('customer_analytics');
    
    await collection.updateOne(
      {
        customerId: customerData.customerId,
        storeId: customerData.storeId,
        visitDate: {
          $gte: new Date(customerData.visitDate.getFullYear(), customerData.visitDate.getMonth(), customerData.visitDate.getDate()),
          $lt: new Date(customerData.visitDate.getFullYear(), customerData.visitDate.getMonth(), customerData.visitDate.getDate() + 1),
        },
      },
      {
        $inc: {
          transactionCount: customerData.transactionCount,
          totalSpent: customerData.totalSpent,
          loyaltyPointsEarned: customerData.loyaltyPointsEarned,
        },
        $set: {
          averageTransactionValue: customerData.averageTransactionValue,
          metadata: customerData.metadata,
          updatedAt: new Date(),
        },
        $addToSet: {
          categoriesPurchased: { $each: customerData.categoriesPurchased },
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // Inventory Analytics
  static async logInventoryMovement(movementData: {
    productId: string;
    storeId: string;
    movementType: 'sale' | 'restock' | 'adjustment' | 'transfer';
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost?: number;
    reason?: string;
    timestamp: Date;
    userId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('inventory_movements');
    await collection.insertOne({
      ...movementData,
      createdAt: new Date(),
    });
  }

  // System Performance Logs
  static async logSystemPerformance(performanceData: {
    service: string;
    endpoint?: string;
    responseTime: number;
    statusCode: number;
    errorMessage?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('system_performance');
    await collection.insertOne({
      ...performanceData,
      createdAt: new Date(),
    });
  }

  // Error Logs
  static async logError(errorData: {
    service: string;
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    userId?: string;
    storeId?: string;
    request?: Record<string, any>;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): Promise<void> {
    const collection = this.getCollection('error_logs');
    await collection.insertOne({
      ...errorData,
      createdAt: new Date(),
    });
  }

  /**
   * Analytics Queries
   */

  // Get sales analytics for a date range
  static async getSalesAnalytics(storeId: string, startDate: Date, endDate: Date): Promise<any> {
    const collection = this.getCollection('transaction_analytics');
    
    const pipeline = [
      {
        $match: {
          storeId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageTransactionValue: { $avg: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  // Get top performing products
  static async getTopProducts(storeId: string, startDate: Date, endDate: Date, limit: number = 10): Promise<any> {
    const collection = this.getCollection('transaction_analytics');
    
    const pipeline = [
      {
        $match: {
          storeId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          category: { $first: '$items.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          averagePrice: { $avg: '$items.unitPrice' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: limit,
      },
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  // Get customer analytics
  static async getCustomerInsights(storeId: string, startDate: Date, endDate: Date): Promise<any> {
    const collection = this.getCollection('customer_analytics');
    
    const pipeline = [
      {
        $match: {
          storeId,
          visitDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $addToSet: '$customerId' },
          totalTransactions: { $sum: '$transactionCount' },
          totalRevenue: { $sum: '$totalSpent' },
          averageTransactionValue: { $avg: '$averageTransactionValue' },
          totalLoyaltyPoints: { $sum: '$loyaltyPointsEarned' },
        },
      },
      {
        $project: {
          _id: 0,
          totalCustomers: { $size: '$totalCustomers' },
          totalTransactions: 1,
          totalRevenue: 1,
          averageTransactionValue: 1,
          totalLoyaltyPoints: 1,
          averageRevenuePerCustomer: { $divide: ['$totalRevenue', { $size: '$totalCustomers' }] },
        },
      },
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  /**
   * Data Cleanup and Maintenance
   */

  // Clean old analytics data (older than specified days)
  static async cleanOldData(collectionName: string, daysToKeep: number = 365): Promise<void> {
    const collection = this.getCollection(collectionName);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await collection.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`Cleaned ${result.deletedCount} old records from ${collectionName}`);
  }

  /**
   * Health Check
   */
  static async healthCheck(): Promise<{ connected: boolean; collections?: string[] }> {
    try {
      await this.client.db('admin').command({ ping: 1 });
      const collections = await this.db.listCollections().toArray();
      
      return {
        connected: true,
        collections: collections.map(c => c.name),
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }

  /**
   * Create Indexes for Performance
   */
  static async createIndexes(): Promise<void> {
    // Transaction analytics indexes
    const transactionCollection = this.getCollection('transaction_analytics');
    await transactionCollection.createIndex({ storeId: 1, timestamp: -1 });
    await transactionCollection.createIndex({ customerId: 1, timestamp: -1 });
    await transactionCollection.createIndex({ 'items.productId': 1 });

    // User activity indexes
    const userActivityCollection = this.getCollection('user_activity');
    await userActivityCollection.createIndex({ userId: 1, timestamp: -1 });
    await userActivityCollection.createIndex({ storeId: 1, timestamp: -1 });

    // Product performance indexes
    const productPerformanceCollection = this.getCollection('product_performance');
    await productPerformanceCollection.createIndex({ productId: 1, storeId: 1, date: -1 });

    // Store performance indexes
    const storePerformanceCollection = this.getCollection('store_performance');
    await storePerformanceCollection.createIndex({ storeId: 1, date: -1 });

    // Customer analytics indexes
    const customerAnalyticsCollection = this.getCollection('customer_analytics');
    await customerAnalyticsCollection.createIndex({ customerId: 1, storeId: 1, visitDate: -1 });

    // Inventory movements indexes
    const inventoryMovementsCollection = this.getCollection('inventory_movements');
    await inventoryMovementsCollection.createIndex({ productId: 1, storeId: 1, timestamp: -1 });

    // System performance indexes
    const systemPerformanceCollection = this.getCollection('system_performance');
    await systemPerformanceCollection.createIndex({ service: 1, timestamp: -1 });

    // Error logs indexes
    const errorLogsCollection = this.getCollection('error_logs');
    await errorLogsCollection.createIndex({ service: 1, timestamp: -1 });
    await errorLogsCollection.createIndex({ severity: 1, timestamp: -1 });

    console.log('MongoDB indexes created successfully');
  }
}

export default MongoManager;