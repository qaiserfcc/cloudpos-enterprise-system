import express, { Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database';
import { logger } from '../utils/logger';
import {
  addAddressSchema,
  updateAddressSchema,
  customerIdSchema
} from '../schemas/validation';
import { CustomerAddress } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

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

// GET /customers/:customerId/addresses - Get customer addresses
router.get(
  '/:customerId/addresses',
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
      'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC',
      [customerId]
    );

    const addresses: CustomerAddress[] = result.rows.map((row: any) => ({
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
    }));

    res.json({
      success: true,
      data: addresses
    });
  })
);

// POST /customers/:customerId/addresses - Add new address
router.post(
  '/:customerId/addresses',
  validateParams(customerIdSchema),
  validate(addAddressSchema),
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

    await databaseService.transaction(async (client) => {
      // If this is set as default, unset all other defaults
      if (req.body.isDefault) {
        await client.query(
          'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1',
          [customerId]
        );
      }

      const addressId = uuidv4();
      await client.query(`
        INSERT INTO customer_addresses (
          id, customer_id, type, is_default, street1, street2, 
          city, state, postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        addressId,
        customerId,
        req.body.type,
        req.body.isDefault,
        req.body.street1,
        req.body.street2 || null,
        req.body.city,
        req.body.state,
        req.body.postalCode,
        req.body.country
      ]);

      const result = await client.query(
        'SELECT * FROM customer_addresses WHERE id = $1',
        [addressId]
      );

      const address = result.rows[0];
      const mappedAddress: CustomerAddress = {
        id: address.id,
        customerId: address.customer_id,
        type: address.type,
        isDefault: address.is_default,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        createdAt: new Date(address.created_at),
        updatedAt: new Date(address.updated_at)
      };

      res.status(201).json({
        success: true,
        data: mappedAddress,
        message: 'Address added successfully'
      });
    });
  })
);

// PUT /customers/:customerId/addresses/:addressId - Update address
router.put(
  '/:customerId/addresses/:addressId',
  validateParams(customerIdSchema),
  validate(updateAddressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const { customerId, addressId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    // Verify customer exists in store and address belongs to customer
    const addressCheck = await databaseService.query(`
      SELECT ca.id FROM customer_addresses ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.id = $1 AND ca.customer_id = $2 AND c.store_id = $3
    `, [addressId, customerId, storeId]);

    if (addressCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await databaseService.transaction(async (client) => {
      // If this is set as default, unset all other defaults
      if (req.body.isDefault) {
        await client.query(
          'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1',
          [customerId]
        );
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 0;

      if (req.body.type !== undefined) {
        updateFields.push(`type = $${++paramCount}`);
        updateValues.push(req.body.type);
      }
      if (req.body.street1 !== undefined) {
        updateFields.push(`street1 = $${++paramCount}`);
        updateValues.push(req.body.street1);
      }
      if (req.body.street2 !== undefined) {
        updateFields.push(`street2 = $${++paramCount}`);
        updateValues.push(req.body.street2);
      }
      if (req.body.city !== undefined) {
        updateFields.push(`city = $${++paramCount}`);
        updateValues.push(req.body.city);
      }
      if (req.body.state !== undefined) {
        updateFields.push(`state = $${++paramCount}`);
        updateValues.push(req.body.state);
      }
      if (req.body.postalCode !== undefined) {
        updateFields.push(`postal_code = $${++paramCount}`);
        updateValues.push(req.body.postalCode);
      }
      if (req.body.country !== undefined) {
        updateFields.push(`country = $${++paramCount}`);
        updateValues.push(req.body.country);
      }
      if (req.body.isDefault !== undefined) {
        updateFields.push(`is_default = $${++paramCount}`);
        updateValues.push(req.body.isDefault);
      }

      if (updateFields.length > 0) {
        await client.query(`
          UPDATE customer_addresses 
          SET ${updateFields.join(', ')}
          WHERE id = $${++paramCount}
        `, [...updateValues, addressId]);
      }

      const result = await client.query(
        'SELECT * FROM customer_addresses WHERE id = $1',
        [addressId]
      );

      const address = result.rows[0];
      const mappedAddress: CustomerAddress = {
        id: address.id,
        customerId: address.customer_id,
        type: address.type,
        isDefault: address.is_default,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        createdAt: new Date(address.created_at),
        updatedAt: new Date(address.updated_at)
      };

      res.json({
        success: true,
        data: mappedAddress,
        message: 'Address updated successfully'
      });
    });
  })
);

// DELETE /customers/:customerId/addresses/:addressId - Delete address
router.delete(
  '/:customerId/addresses/:addressId',
  validateParams(customerIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.headers['x-store-id'] as string;
    const { customerId, addressId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required in headers'
      });
    }

    // Verify customer exists in store and address belongs to customer
    const addressCheck = await databaseService.query(`
      SELECT ca.id, ca.is_default FROM customer_addresses ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.id = $1 AND ca.customer_id = $2 AND c.store_id = $3
    `, [addressId, customerId, storeId]);

    if (addressCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await databaseService.transaction(async (client) => {
      const isDefault = addressCheck.rows[0].is_default;

      // Delete the address
      await client.query(
        'DELETE FROM customer_addresses WHERE id = $1',
        [addressId]
      );

      // If this was the default address, set another address as default
      if (isDefault) {
        await client.query(`
          UPDATE customer_addresses 
          SET is_default = true 
          WHERE customer_id = $1 
          AND id = (
            SELECT id FROM customer_addresses 
            WHERE customer_id = $1 
            ORDER BY created_at ASC 
            LIMIT 1
          )
        `, [customerId]);
      }

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    });
  })
);

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Address API error:', error);

  if (error.message === 'Customer not found' || error.message === 'Address not found') {
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