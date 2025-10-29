import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from './errorHandler';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    throw new ValidationError('Validation failed', {
      errors: errorMessages,
      count: errorMessages.length
    });
  }

  next();
};

// Common validation rules
export const commonValidations = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sort')
      .optional()
      .isString()
      .withMessage('Sort must be a string'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either asc or desc')
  ],

  // Transaction validations
  transactionAmount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number with at least 0.01'),
    
  transactionItems: body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
    
  // Product validations
  productName: body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1 and 255 characters'),
    
  productPrice: body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
    
  productSku: body('sku')
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1 and 100 characters'),

  // Customer validations
  customerName: body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Customer name must be between 1 and 255 characters'),
    
  customerPhone: body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),

  // Store validations
  storeName: body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Store name must be between 1 and 255 characters'),
    
  storeAddress: body('address')
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters'),

  // Inventory validations
  inventoryQuantity: body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
    
  inventoryMinStock: body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),

  // Payment validations
  paymentMethod: body('paymentMethod')
    .isIn(['cash', 'card', 'digital_wallet', 'bank_transfer', 'check'])
    .withMessage('Invalid payment method'),
    
  paymentAmount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be a positive number'),

  // Date range validations
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ]
};

// Validation rule sets for specific endpoints
export const validationRules = {
  // Auth validations
  register: [
    commonValidations.email,
    commonValidations.password,
    body('firstName').isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
    body('lastName').isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
    body('role').optional().isIn(['admin', 'manager', 'cashier']).withMessage('Invalid role')
  ],

  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Transaction validations
  createTransaction: [
    commonValidations.transactionAmount,
    commonValidations.transactionItems,
    body('customerId').optional().isUUID().withMessage('Invalid customer ID'),
    body('paymentMethod').isIn(['cash', 'card', 'digital_wallet']).withMessage('Invalid payment method')
  ],

  // Product validations
  createProduct: [
    commonValidations.productName,
    commonValidations.productPrice,
    commonValidations.productSku,
    body('categoryId').isUUID().withMessage('Invalid category ID'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
  ],

  updateProduct: [
    commonValidations.id,
    body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Product name must be between 1 and 255 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
  ],

  // Customer validations
  createCustomer: [
    commonValidations.customerName,
    commonValidations.email,
    commonValidations.customerPhone,
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth')
  ],

  // Inventory validations
  updateInventory: [
    commonValidations.id,
    commonValidations.inventoryQuantity,
    body('reason').optional().isLength({ min: 1, max: 255 }).withMessage('Reason must be between 1 and 255 characters')
  ],

  // General validations
  getById: [commonValidations.id],
  
  getList: [
    ...commonValidations.pagination,
    query('search').optional().isLength({ min: 1, max: 255 }).withMessage('Search term must be between 1 and 255 characters')
  ],

  dateRangeQuery: [
    ...commonValidations.dateRange,
    ...commonValidations.pagination
  ]
};

export default validateRequest;