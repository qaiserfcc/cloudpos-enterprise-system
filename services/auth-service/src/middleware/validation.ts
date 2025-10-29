import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
    role: Joi.string().valid('super_admin', 'store_admin', 'cashier', 'inventory_manager').default('cashier'),
    storeId: Joi.string().uuid().optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional().allow('')
  }),

  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
    role: Joi.string().valid('super_admin', 'store_admin', 'cashier', 'inventory_manager').required(),
    storeId: Joi.string().uuid().optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional().allow(''),
    role: Joi.string().valid('super_admin', 'store_admin', 'cashier', 'inventory_manager').optional(),
    storeId: Joi.string().uuid().optional().allow(null),
    isActive: Joi.boolean().optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  })
};

export function validateRequest(schemaName: keyof typeof schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error('Validation schema not found', { schemaName });
      res.status(500).json({
        error: 'Internal server error',
        code: 'SCHEMA_NOT_FOUND'
      });
      return;
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        schemaName,
        errors: validationErrors,
        ip: req.ip
      });

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

export function validateQueryParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation failed', {
        errors: validationErrors,
        ip: req.ip
      });

      res.status(400).json({
        error: 'Query validation failed',
        code: 'QUERY_VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    // Replace query with validated data
    req.query = value as any;
    next();
  };
}

export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Params validation failed', {
        errors: validationErrors,
        ip: req.ip
      });

      res.status(400).json({
        error: 'Parameter validation failed',
        code: 'PARAMS_VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    // Replace params with validated data
    req.params = value;
    next();
  };
}

// Common validation schemas for reuse
export const commonSchemas = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};