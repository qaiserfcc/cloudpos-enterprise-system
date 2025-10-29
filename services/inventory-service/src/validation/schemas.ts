import Joi from 'joi';

// Product validation schemas
export const createProductSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().optional().max(1000),
  sku: Joi.string().required().max(255),
  barcode: Joi.string().optional().max(255),
  categoryId: Joi.string().uuid().required(),
  brand: Joi.string().optional().max(255),
  unitPrice: Joi.number().positive().required(),
  costPrice: Joi.number().positive().required(),
  taxable: Joi.boolean().default(true),
  taxRate: Joi.number().min(0).max(100).optional(),
  trackStock: Joi.boolean().default(true),
  minStockLevel: Joi.number().integer().min(0).default(0),
  maxStockLevel: Joi.number().integer().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).default(0),
  unit: Joi.string().required().max(50),
  imageUrl: Joi.string().uri().optional(),
  weight: Joi.number().positive().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive().required(),
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required()
  }).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().max(1000).optional(),
  barcode: Joi.string().max(255).optional(),
  categoryId: Joi.string().uuid().optional(),
  brand: Joi.string().max(255).optional(),
  unitPrice: Joi.number().positive().optional(),
  costPrice: Joi.number().positive().optional(),
  taxable: Joi.boolean().optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  trackStock: Joi.boolean().optional(),
  minStockLevel: Joi.number().integer().min(0).optional(),
  maxStockLevel: Joi.number().integer().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).optional(),
  unit: Joi.string().max(50).optional(),
  status: Joi.string().valid('active', 'inactive', 'discontinued').optional(),
  imageUrl: Joi.string().uri().optional(),
  weight: Joi.number().positive().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive().required(),
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required()
  }).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

export const productSearchSchema = Joi.object({
  q: Joi.string().max(255).optional(),
  categoryId: Joi.string().uuid().optional(),
  brand: Joi.string().max(255).optional(),
  status: Joi.string().valid('active', 'inactive', 'discontinued').optional(),
  trackStock: Joi.boolean().optional(),
  lowStock: Joi.boolean().optional(),
  priceMin: Joi.number().min(0).optional(),
  priceMax: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'sku', 'unitPrice', 'createdAt', 'updatedAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

// Category validation schemas
export const createCategorySchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().optional().max(1000),
  parentId: Joi.string().uuid().optional()
});

// Stock validation schemas
export const stockAdjustmentSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().required(),
  type: Joi.string().valid('in', 'out', 'adjustment').required(),
  reason: Joi.string().required().max(255),
  unitCost: Joi.number().positive().optional(),
  notes: Joi.string().max(1000).optional()
});

export const stockReservationSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().positive().required()
});

// Supplier validation schemas
export const createSupplierSchema = Joi.object({
  name: Joi.string().required().max(255),
  contactPerson: Joi.string().optional().max(255),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().max(50),
  address: Joi.object({
    street: Joi.string().required().max(255),
    city: Joi.string().required().max(100),
    state: Joi.string().required().max(100),
    zipCode: Joi.string().required().max(20),
    country: Joi.string().required().max(100)
  }).optional(),
  taxId: Joi.string().optional().max(100),
  paymentTerms: Joi.string().optional().max(255),
  creditLimit: Joi.number().min(0).optional(),
  notes: Joi.string().optional().max(1000)
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  contactPerson: Joi.string().max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(50).optional(),
  address: Joi.object({
    street: Joi.string().required().max(255),
    city: Joi.string().required().max(100),
    state: Joi.string().required().max(100),
    zipCode: Joi.string().required().max(20),
    country: Joi.string().required().max(100)
  }).optional(),
  taxId: Joi.string().max(100).optional(),
  paymentTerms: Joi.string().max(255).optional(),
  creditLimit: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'blocked').optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  notes: Joi.string().max(1000).optional()
});

// Purchase Order validation schemas
export const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().uuid().required(),
  orderNumber: Joi.string().max(100).optional(),
  expectedDeliveryDate: Joi.date().optional(),
  shippingCost: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().positive().required(),
      unitCost: Joi.number().positive().required()
    })
  ).min(1).required()
});

export const updatePurchaseOrderStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'confirmed', 'received', 'cancelled').required()
});

// Query parameter schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const supplierQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('active', 'inactive', 'blocked').optional()
});

export const purchaseOrderQuerySchema = paginationSchema.keys({
  supplierId: Joi.string().uuid().optional(),
  status: Joi.string().valid('draft', 'sent', 'confirmed', 'received', 'cancelled').optional()
});

export const stockMovementQuerySchema = paginationSchema.keys({
  productId: Joi.string().uuid().optional(),
  type: Joi.string().valid('in', 'out', 'adjustment', 'transfer', 'return', 'damaged', 'expired').optional()
});

export const alertQuerySchema = Joi.object({
  status: Joi.string().valid('active', 'acknowledged', 'resolved').optional()
});

// Middleware function to validate request body
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.body = value;
    next();
  };
};

// Middleware function to validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.query = value;
    next();
  };
};

// Middleware function to validate URL parameters
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.params = value;
    next();
  };
};

// Common parameter schemas
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const productParamSchema = Joi.object({
  productId: Joi.string().uuid().required()
});

export const supplierParamSchema = Joi.object({
  supplierId: Joi.string().uuid().required()
});

export const orderParamSchema = Joi.object({
  orderId: Joi.string().uuid().required()
});

export const alertParamSchema = Joi.object({
  alertId: Joi.string().uuid().required()
});