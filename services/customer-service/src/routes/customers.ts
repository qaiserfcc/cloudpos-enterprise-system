import express, { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer';
import { logger } from '../utils/logger';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  loyaltyPointsSchema,
  customerIdSchema,
  storeIdSchema,
  addAddressSchema,
  updateAddressSchema,
  updatePreferencesSchema,
  bulkOperationSchema,
  paginationSchema,
  dateRangeSchema
} from '../schemas/validation';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerSearchQuery,
  LoyaltyPointsDto
} from '../models/types';

const router = express.Router();

// Middleware for request validation
const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.body = value;
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

// Error handling middleware
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// GET /customers - Search and list customers
router.get(
  '/',
  validateQuery(customerSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const searchQuery = req.query as unknown as CustomerSearchQuery;
    const result = await customerService.searchCustomers(storeId, searchQuery);

    res.json({
      success: true,
      data: {
        customers: result.customers,
        total: result.total,
        page: searchQuery.page || 1,
        limit: searchQuery.limit || 20,
        totalPages: Math.ceil(result.total / (searchQuery.limit || 20))
      }
    });
  })
);

// POST /customers - Create new customer
router.post(
  '/',
  validate(createCustomerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const customerDto = req.body as CreateCustomerDto;
    const customer = await customerService.createCustomer(storeId, customerDto);

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  })
);

// GET /customers/stats - Get customer statistics
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const stats = await customerService.getCustomerStats(storeId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// GET /customers/:customerId - Get customer by ID
router.get(
  '/:customerId',
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

    const customer = await customerService.getCustomer(storeId, customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  })
);

// PUT /customers/:customerId - Update customer
router.put(
  '/:customerId',
  validateParams(customerIdSchema),
  validate(updateCustomerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const { customerId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const updateDto = req.body as UpdateCustomerDto;
    const customer = await customerService.updateCustomer(storeId, customerId, updateDto);

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  })
);

// DELETE /customers/:customerId - Delete customer
router.delete(
  '/:customerId',
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

    await customerService.deleteCustomer(storeId, customerId);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  })
);

// POST /customers/loyalty/points - Add/redeem loyalty points
router.post(
  '/loyalty/points',
  validate(loyaltyPointsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const loyaltyDto = req.body as LoyaltyPointsDto;
    const transaction = await customerService.addLoyaltyPoints(storeId, loyaltyDto);

    res.status(201).json({
      success: true,
      data: transaction,
      message: `Loyalty points ${loyaltyDto.type} successfully`
    });
  })
);

// POST /customers/bulk - Bulk operations on customers
router.post(
  '/bulk',
  validate(bulkOperationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    const { customerIds, operation, data } = req.body;

    // This would need to be implemented in the customer service
    // For now, return a placeholder response
    res.json({
      success: true,
      message: `Bulk ${operation} operation queued for ${customerIds.length} customers`,
      data: {
        affectedCustomers: customerIds.length,
        operation,
        status: 'queued'
      }
    });
  })
);

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Customer API error:', error);

  if (error.message === 'Customer not found') {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  if (error.message === 'Customer not enrolled in loyalty program') {
    return res.status(400).json({
      success: false,
      message: 'Customer is not enrolled in a loyalty program'
    });
  }

  if (error.message.includes('duplicate') || error.message.includes('unique')) {
    return res.status(409).json({
      success: false,
      message: 'A customer with this email or phone already exists'
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