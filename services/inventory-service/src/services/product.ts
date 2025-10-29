import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { getDatabaseService } from './database';
import { logger } from '../utils/logger';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductSearchQuery,
  ProductCategory
} from '../models/types';

export class ProductService {
  private db = getDatabaseService();

  async createProduct(storeId: string, productData: CreateProductDto, userId: string): Promise<Product> {
    try {
      const productId = uuidv4();
      const now = new Date();

      // Validate SKU uniqueness within store
      const existingProduct = await this.db.query(
        'SELECT id FROM products WHERE store_id = $1 AND sku = $2',
        [storeId, productData.sku]
      );

      if (existingProduct.rows.length > 0) {
        throw new Error(`Product with SKU '${productData.sku}' already exists`);
      }

      // Validate barcode uniqueness if provided
      if (productData.barcode) {
        const existingBarcode = await this.db.query(
          'SELECT id FROM products WHERE barcode = $1',
          [productData.barcode]
        );

        if (existingBarcode.rows.length > 0) {
          throw new Error(`Product with barcode '${productData.barcode}' already exists`);
        }
      }

      // Insert product
      const result = await this.db.query(`
        INSERT INTO products (
          id, store_id, name, description, sku, barcode, category_id, brand,
          unit_price, cost_price, taxable, tax_rate, track_stock, min_stock_level,
          max_stock_level, reorder_point, unit, image_url, weight, dimensions,
          tags, created_by, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25
        ) RETURNING *
      `, [
        productId, storeId, productData.name, productData.description, productData.sku,
        productData.barcode, productData.categoryId, productData.brand,
        productData.unitPrice, productData.costPrice, productData.taxable,
        productData.taxRate, productData.trackStock, productData.minStockLevel,
        productData.maxStockLevel, productData.reorderPoint, productData.unit,
        productData.imageUrl, productData.weight, JSON.stringify(productData.dimensions),
        productData.tags, userId, userId, now, now
      ]);

      // Initialize stock level if tracking stock
      if (productData.trackStock) {
        await this.db.query(`
          INSERT INTO stock_levels (product_id, store_id, quantity, unit_cost)
          VALUES ($1, $2, $3, $4)
        `, [productId, storeId, 0, productData.costPrice]);
      }

      logger.info('Product created successfully', { productId, storeId, sku: productData.sku });
      return this.mapRowToProduct(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to create product', { error: error.message, storeId, productData });
      throw error;
    }
  }

  async getProduct(productId: string, storeId: string): Promise<Product | null> {
    try {
      const result = await this.db.query(`
        SELECT p.*, sl.quantity as stock_quantity
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id AND p.store_id = sl.store_id
        WHERE p.id = $1 AND p.store_id = $2
      `, [productId, storeId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToProduct(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get product', { error: error.message, productId, storeId });
      throw error;
    }
  }

  async getProductBySku(sku: string, storeId: string): Promise<Product | null> {
    try {
      const result = await this.db.query(`
        SELECT p.*, sl.quantity as stock_quantity
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id AND p.store_id = sl.store_id
        WHERE p.sku = $1 AND p.store_id = $2
      `, [sku, storeId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToProduct(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get product by SKU', { error: error.message, sku, storeId });
      throw error;
    }
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const result = await this.db.query(`
        SELECT p.*, sl.quantity as stock_quantity
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id AND p.store_id = sl.store_id
        WHERE p.barcode = $1
      `, [barcode]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToProduct(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get product by barcode', { error: error.message, barcode });
      throw error;
    }
  }

  async updateProduct(productId: string, storeId: string, updateData: UpdateProductDto, userId: string): Promise<Product> {
    try {
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          const dbColumn = this.camelToSnake(key);
          if (key === 'dimensions') {
            updateFields.push(`${dbColumn} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${dbColumn} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_by and updated_at
      updateFields.push(`updated_by = $${paramCount++}`);
      values.push(userId);
      updateFields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      // Add WHERE conditions
      values.push(productId, storeId);

      const result = await this.db.query(`
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount - 1} AND store_id = $${paramCount}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      logger.info('Product updated successfully', { productId, storeId, updateData });
      return this.mapRowToProduct(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to update product', { error: error.message, productId, storeId, updateData });
      throw error;
    }
  }

  async searchProducts(storeId: string, query: ProductSearchQuery): Promise<{ products: Product[], total: number }> {
    try {
      const whereConditions: string[] = ['p.store_id = $1'];
      const values: any[] = [storeId];
      let paramCount = 2;

      // Build WHERE clause based on search parameters
      if (query.q) {
        whereConditions.push(`(
          p.name ILIKE $${paramCount} OR 
          p.description ILIKE $${paramCount} OR 
          p.sku ILIKE $${paramCount} OR 
          p.barcode ILIKE $${paramCount}
        )`);
        values.push(`%${query.q}%`);
        paramCount++;
      }

      if (query.categoryId) {
        whereConditions.push(`p.category_id = $${paramCount}`);
        values.push(query.categoryId);
        paramCount++;
      }

      if (query.brand) {
        whereConditions.push(`p.brand ILIKE $${paramCount}`);
        values.push(`%${query.brand}%`);
        paramCount++;
      }

      if (query.status) {
        whereConditions.push(`p.status = $${paramCount}`);
        values.push(query.status);
        paramCount++;
      }

      if (query.trackStock !== undefined) {
        whereConditions.push(`p.track_stock = $${paramCount}`);
        values.push(query.trackStock);
        paramCount++;
      }

      if (query.lowStock) {
        whereConditions.push(`(p.track_stock = true AND sl.quantity <= p.min_stock_level)`);
      }

      if (query.priceMin !== undefined) {
        whereConditions.push(`p.unit_price >= $${paramCount}`);
        values.push(query.priceMin);
        paramCount++;
      }

      if (query.priceMax !== undefined) {
        whereConditions.push(`p.unit_price <= $${paramCount}`);
        values.push(query.priceMax);
        paramCount++;
      }

      if (query.tags && query.tags.length > 0) {
        whereConditions.push(`p.tags && $${paramCount}`);
        values.push(query.tags);
        paramCount++;
      }

      // Build ORDER BY clause
      const sortBy = query.sortBy || 'name';
      const sortOrder = query.sortOrder || 'asc';
      const orderBy = `ORDER BY p.${this.camelToSnake(sortBy)} ${sortOrder.toUpperCase()}`;

      // Pagination
      const limit = Math.min(query.limit || 20, 100);
      const offset = ((query.page || 1) - 1) * limit;

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT p.id)
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id AND p.store_id = sl.store_id
        WHERE ${whereConditions.join(' AND ')}
      `;

      // Main query
      const mainQuery = `
        SELECT DISTINCT p.*, sl.quantity as stock_quantity
        FROM products p
        LEFT JOIN stock_levels sl ON p.id = sl.product_id AND p.store_id = sl.store_id
        WHERE ${whereConditions.join(' AND ')}
        ${orderBy}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      // Execute queries
      const [countResult, productsResult] = await Promise.all([
        this.db.query(countQuery, values),
        this.db.query(mainQuery, [...values, limit, offset])
      ]);

      const products = productsResult.rows.map((row: any) => this.mapRowToProduct(row));
      const total = parseInt(countResult.rows[0].count);

      logger.info('Products search completed', { storeId, query, total, returned: products.length });

      return { products, total };
    } catch (error: any) {
      logger.error('Failed to search products', { error: error.message, storeId, query });
      throw error;
    }
  }

  async deleteProduct(productId: string, storeId: string): Promise<boolean> {
    try {
      // Check if product has any stock movements or is referenced in orders
      const dependencyCheck = await this.db.query(`
        SELECT 
          (SELECT COUNT(*) FROM stock_movements WHERE product_id = $1) as stock_movements,
          (SELECT COUNT(*) FROM purchase_order_items WHERE product_id = $1) as po_items
      `, [productId]);

      const { stock_movements, po_items } = dependencyCheck.rows[0];

      if (stock_movements > 0 || po_items > 0) {
        // Instead of deleting, mark as discontinued
        await this.db.query(`
          UPDATE products 
          SET status = 'discontinued', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND store_id = $2
        `, [productId, storeId]);

        logger.info('Product marked as discontinued instead of deleted', { productId, storeId });
        return true;
      }

      // Safe to delete
      const result = await this.db.query(`
        DELETE FROM products 
        WHERE id = $1 AND store_id = $2
      `, [productId, storeId]);

      const deleted = result.rowCount > 0;
      logger.info('Product deleted', { productId, storeId, deleted });
      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete product', { error: error.message, productId, storeId });
      throw error;
    }
  }

  // Helper methods
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      categoryId: row.category_id,
      brand: row.brand,
      unitPrice: parseFloat(row.unit_price),
      costPrice: parseFloat(row.cost_price),
      taxable: row.taxable,
      taxRate: row.tax_rate ? parseFloat(row.tax_rate) : undefined,
      trackStock: row.track_stock,
      stockQuantity: row.stock_quantity || 0,
      minStockLevel: row.min_stock_level,
      maxStockLevel: row.max_stock_level,
      reorderPoint: row.reorder_point,
      unit: row.unit,
      status: row.status,
      imageUrl: row.image_url,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Category management methods
  async createCategory(storeId: string, name: string, description?: string, parentId?: string): Promise<ProductCategory> {
    try {
      const categoryId = uuidv4();
      let level = 0;
      let path = name;

      if (parentId) {
        const parent = await this.db.query(
          'SELECT level, path FROM product_categories WHERE id = $1 AND store_id = $2',
          [parentId, storeId]
        );

        if (parent.rows.length === 0) {
          throw new Error('Parent category not found');
        }

        level = parent.rows[0].level + 1;
        path = `${parent.rows[0].path}/${name}`;
      }

      const result = await this.db.query(`
        INSERT INTO product_categories (id, store_id, name, description, parent_id, level, path)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [categoryId, storeId, name, description, parentId, level, path]);

      logger.info('Product category created', { categoryId, storeId, name });
      return this.mapRowToCategory(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to create category', { error: error.message, storeId, name });
      throw error;
    }
  }

  async getCategories(storeId: string): Promise<ProductCategory[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM product_categories WHERE store_id = $1 ORDER BY path, sort_order',
        [storeId]
      );

      return result.rows.map((row: any) => this.mapRowToCategory(row));
    } catch (error: any) {
      logger.error('Failed to get categories', { error: error.message, storeId });
      throw error;
    }
  }

  private mapRowToCategory(row: any): ProductCategory {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      description: row.description,
      parentId: row.parent_id,
      level: row.level,
      path: row.path,
      status: row.status,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}