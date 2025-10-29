import { Router, Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction';
import { logger } from '../utils/logger';

const router = Router();

// Create a new transaction
router.post('/transactions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      storeId, 
      cashierId, 
      customerId, 
      type, 
      cartId, 
      paymentMethod, 
      paymentReference, 
      notes, 
      metadata 
    } = req.body;

    if (!storeId || !cashierId || !type || !paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'Store ID, Cashier ID, type, and payment method are required'
      });
      return;
    }

    const transaction = await transactionService.createTransaction({
      storeId,
      cashierId,
      customerId,
      type,
      cartId,
      paymentMethod,
      paymentReference,
      notes,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Process payment for a transaction
router.post('/transactions/:transactionId/payment', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { paymentMethod, amount, paymentReference, metadata } = req.body;

    if (!paymentMethod || !amount) {
      res.status(400).json({
        success: false,
        message: 'Payment method and amount are required'
      });
      return;
    }

    const transaction = await transactionService.processPayment({
      transactionId,
      paymentMethod,
      amount,
      paymentReference,
      metadata
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction by ID
router.get('/transactions/:transactionId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const transaction = await transactionService.getTransaction(transactionId);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Void a transaction
router.post('/transactions/:transactionId/void', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'Void reason is required'
      });
      return;
    }

    const transaction = await transactionService.voidTransaction(transactionId, reason);

    res.json({
      success: true,
      message: 'Transaction voided successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/stores/:storeId/transactions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.params;
    const {
      startDate,
      endDate,
      cashierId,
      customerId,
      type,
      status,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (cashierId) {
      filters.cashierId = cashierId as string;
    }

    if (customerId) {
      filters.customerId = customerId as string;
    }

    if (type) {
      filters.type = type as string;
    }

    if (status) {
      filters.status = status as string;
    }

    const result = await transactionService.getTransactionHistory(storeId, filters);

    res.json({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          pages: Math.ceil(result.total / filters.limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get daily sales summary
router.get('/stores/:storeId/sales/summary', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.params;
    const { date } = req.query;

    const startDate = date ? new Date(date as string) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const result = await transactionService.getTransactionHistory(storeId, {
      startDate,
      endDate,
      status: 'completed',
      limit: 1000
    });

    // Calculate summary
    let totalSales = 0;
    let totalTransactions = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const salesByType: Record<string, number> = {};
    const salesByCashier: Record<string, number> = {};

    result.transactions.forEach(transaction => {
      if (transaction.type === 'sale') {
        totalSales += parseFloat(transaction.total);
        totalTax += parseFloat(transaction.totalTax);
        totalDiscount += parseFloat(transaction.totalDiscount);
        totalTransactions++;

        // Group by type
        salesByType[transaction.type] = (salesByType[transaction.type] || 0) + parseFloat(transaction.total);

        // Group by cashier
        salesByCashier[transaction.cashierId] = (salesByCashier[transaction.cashierId] || 0) + parseFloat(transaction.total);
      }
    });

    res.json({
      success: true,
      data: {
        date: startDate.toISOString().split('T')[0],
        summary: {
          totalSales: totalSales.toFixed(2),
          totalTransactions,
          totalTax: totalTax.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2),
          averageTransactionValue: totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'
        },
        salesByType,
        salesByCashier
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;