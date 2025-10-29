import { Router } from 'express';
import { ProductService } from '../services/product';
import { logger } from '../utils/logger';
import {
  validateBody,
  validateQuery,
  validateParams,
  createProductSchema,
  updateProductSchema,
  productSearchSchema,
  createCategorySchema,
  uuidParamSchema,
  productParamSchema
} from '../validation/schemas';

const router = Router();
const productService = new ProductService();

// Create a new product
router.post('/',
  validateBody(createProductSchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];
      const userId = req.user?.userId || req.headers['x-user-id'];

      if (!storeId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID and User ID are required'
        });
      }

      const product = await productService.createProduct(storeId, req.body, userId);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to create product', { error: error.message });
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create product'
      });
    }
  }
);

// Search products
router.get('/',
  validateQuery(productSearchSchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const { products, total } = await productService.searchProducts(storeId, req.query);
      
      res.json({
        success: true,
        data: {
          products,
          pagination: {
            total,
            page: req.query.page,
            limit: req.query.limit,
            pages: Math.ceil(total / req.query.limit)
          }
        }
      });
    } catch (error: any) {
      logger.error('Failed to search products', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to search products'
      });
    }
  }
);

// Get product by ID
router.get('/:productId',
  validateParams(productParamSchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const product = await productService.getProduct(req.params.productId, storeId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to get product', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get product'
      });
    }
  }
);

// Get product by SKU
router.get('/sku/:sku',
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];
      const { sku } = req.params;

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      if (!sku) {
        return res.status(400).json({
          success: false,
          message: 'SKU is required'
        });
      }

      const product = await productService.getProductBySku(sku, storeId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to get product by SKU', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get product'
      });
    }
  }
);

// Get product by barcode
router.get('/barcode/:barcode',
  async (req: any, res: any) => {
    try {
      const { barcode } = req.params;

      if (!barcode) {
        return res.status(400).json({
          success: false,
          message: 'Barcode is required'
        });
      }

      const product = await productService.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to get product by barcode', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get product'
      });
    }
  }
);

// Update product
router.put('/:productId',
  validateParams(productParamSchema),
  validateBody(updateProductSchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];
      const userId = req.user?.userId || req.headers['x-user-id'];

      if (!storeId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID and User ID are required'
        });
      }

      const product = await productService.updateProduct(
        req.params.productId,
        storeId,
        req.body,
        userId
      );
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to update product', { error: error.message });
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update product'
      });
    }
  }
);

// Delete product
router.delete('/:productId',
  validateParams(productParamSchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const deleted = await productService.deleteProduct(req.params.productId, storeId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete product', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to delete product'
      });
    }
  }
);

// Category management routes

// Create category
router.post('/categories',
  validateBody(createCategorySchema),
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const category = await productService.createCategory(
        storeId,
        req.body.name,
        req.body.description,
        req.body.parentId
      );
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error: any) {
      logger.error('Failed to create category', { error: error.message });
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create category'
      });
    }
  }
);

// Get categories
router.get('/categories',
  async (req: any, res: any) => {
    try {
      const storeId = req.user?.storeId || req.headers['x-store-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      const categories = await productService.getCategories(storeId);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      logger.error('Failed to get categories', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get categories'
      });
    }
  }
);

export default router;