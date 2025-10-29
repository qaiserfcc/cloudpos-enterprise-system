import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { dbService } from './database';
import { redisService } from './redis';
import { logger } from '../utils/logger';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: string; // Decimal as string
  discount: string;  // Decimal as string
  taxRate: string;   // Decimal as string
  subtotal: string;  // Calculated
  tax: string;       // Calculated
  total: string;     // Calculated
  metadata?: Record<string, any>;
}

export interface Cart {
  id: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  items: CartItem[];
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  total: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AddItemToCartData {
  productId: string;
  quantity: number;
  unitPrice?: string;
  discount?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCartItemData {
  quantity?: number;
  discount?: string;
  metadata?: Record<string, any>;
}

export class CartService {
  
  async createCart(storeId: string, cashierId: string, customerId?: string): Promise<Cart> {
    try {
      const cartId = uuidv4();
      const now = new Date();

      const cart: Cart = {
        id: cartId,
        storeId,
        cashierId,
        customerId: customerId || undefined,
        items: [],
        subtotal: '0.00',
        totalDiscount: '0.00',
        totalTax: '0.00',
        total: '0.00',
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      // Store cart in Redis for fast access
      await redisService.setCartSession(cartId, cart, 3600); // 1 hour TTL

      // Also store in database for persistence
      await dbService.query(`
        INSERT INTO carts (id, store_id, cashier_id, customer_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [cartId, storeId, cashierId, customerId, 'active', now, now]);

      logger.info('Cart created', { cartId, storeId, cashierId });
      return cart;
    } catch (error) {
      logger.error('Failed to create cart', { error, storeId, cashierId });
      throw error;
    }
  }

  async getCart(cartId: string): Promise<Cart | null> {
    try {
      // Try Redis first
      let cart = await redisService.getCartSession(cartId);
      
      if (!cart) {
        // Fallback to database
        const result = await dbService.query(`
          SELECT c.*, 
                 COALESCE(json_agg(
                   json_build_object(
                     'id', ci.id,
                     'productId', ci.product_id,
                     'productName', p.name,
                     'productSku', p.sku,
                     'quantity', ci.quantity,
                     'unitPrice', ci.unit_price::text,
                     'discount', ci.discount::text,
                     'taxRate', ci.tax_rate::text,
                     'subtotal', ci.subtotal::text,
                     'tax', ci.tax::text,
                     'total', ci.total::text,
                     'metadata', ci.metadata
                   )
                 ) FILTER (WHERE ci.id IS NOT NULL), '[]') as items
          FROM carts c
          LEFT JOIN cart_items ci ON c.id = ci.cart_id
          LEFT JOIN products p ON ci.product_id = p.id
          WHERE c.id = $1 AND c.status = 'active'
          GROUP BY c.id
        `, [cartId]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        cart = {
          id: row.id,
          storeId: row.store_id,
          cashierId: row.cashier_id,
          customerId: row.customer_id,
          items: row.items,
          subtotal: row.subtotal?.toString() || '0.00',
          totalDiscount: row.total_discount?.toString() || '0.00',
          totalTax: row.total_tax?.toString() || '0.00',
          total: row.total?.toString() || '0.00',
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          metadata: row.metadata
        };

        // Cache in Redis
        await redisService.setCartSession(cartId, cart, 3600);
      }

      return cart;
    } catch (error) {
      logger.error('Failed to get cart', { error, cartId });
      throw error;
    }
  }

  async addItemToCart(cartId: string, itemData: AddItemToCartData): Promise<Cart> {
    try {
      const cart = await this.getCart(cartId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Get product details
      const productResult = await dbService.query(`
        SELECT id, name, sku, price, tax_rate 
        FROM products 
        WHERE id = $1 AND is_active = true
      `, [itemData.productId]);

      if (productResult.rows.length === 0) {
        throw new Error('Product not found or inactive');
      }

      const product = productResult.rows[0];
      const unitPrice = new Decimal(itemData.unitPrice || product.price);
      const quantity = new Decimal(itemData.quantity);
      const discount = new Decimal(itemData.discount || '0');
      const taxRate = new Decimal(product.tax_rate || '0');

      // Calculate line totals
      const subtotal = unitPrice.mul(quantity);
      const discountAmount = subtotal.mul(discount);
      const taxableAmount = subtotal.minus(discountAmount);
      const tax = taxableAmount.mul(taxRate);
      const total = taxableAmount.plus(tax);

      const cartItem: CartItem = {
        id: uuidv4(),
        productId: itemData.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: itemData.quantity,
        unitPrice: unitPrice.toFixed(2),
        discount: discount.toFixed(2),
        taxRate: taxRate.toFixed(2),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        ...(itemData.metadata && { metadata: itemData.metadata })
      };

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => 
        item.productId === itemData.productId
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        const existingItem = cart.items[existingItemIndex];
        const newQuantity = new Decimal(existingItem.quantity).plus(quantity);
        const newSubtotal = unitPrice.mul(newQuantity);
        const newDiscountAmount = newSubtotal.mul(discount);
        const newTaxableAmount = newSubtotal.minus(newDiscountAmount);
        const newTax = newTaxableAmount.mul(taxRate);
        const newTotal = newTaxableAmount.plus(newTax);

        cart.items[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity.toNumber(),
          subtotal: newSubtotal.toFixed(2),
          tax: newTax.toFixed(2),
          total: newTotal.toFixed(2)
        };
      } else {
        // Add new item
        cart.items.push(cartItem);
      }

      // Recalculate cart totals
      await this.recalculateCartTotals(cart);

      // Update in database
      await this.saveCartToDatabase(cart);

      // Update Redis cache
      await redisService.setCartSession(cartId, cart, 3600);

      logger.info('Item added to cart', { cartId, productId: itemData.productId, quantity: itemData.quantity });
      return cart;
    } catch (error) {
      logger.error('Failed to add item to cart', { error, cartId, itemData });
      throw error;
    }
  }

  async updateCartItem(cartId: string, itemId: string, updateData: UpdateCartItemData): Promise<Cart> {
    try {
      const cart = await this.getCart(cartId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      const item = cart.items[itemIndex];
      
      if (updateData.quantity !== undefined) {
        if (updateData.quantity <= 0) {
          // Remove item if quantity is 0 or negative
          cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity and recalculate
          const unitPrice = new Decimal(item.unitPrice);
          const quantity = new Decimal(updateData.quantity);
          const discount = new Decimal(updateData.discount || item.discount);
          const taxRate = new Decimal(item.taxRate);

          const subtotal = unitPrice.mul(quantity);
          const discountAmount = subtotal.mul(discount);
          const taxableAmount = subtotal.minus(discountAmount);
          const tax = taxableAmount.mul(taxRate);
          const total = taxableAmount.plus(tax);

          cart.items[itemIndex] = {
            ...item,
            quantity: updateData.quantity,
            discount: discount.toFixed(2),
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            ...(updateData.metadata && { metadata: updateData.metadata })
          };
        }
      }

      // Recalculate cart totals
      await this.recalculateCartTotals(cart);

      // Update in database
      await this.saveCartToDatabase(cart);

      // Update Redis cache
      await redisService.setCartSession(cartId, cart, 3600);

      logger.info('Cart item updated', { cartId, itemId, updateData });
      return cart;
    } catch (error) {
      logger.error('Failed to update cart item', { error, cartId, itemId, updateData });
      throw error;
    }
  }

  async removeItemFromCart(cartId: string, itemId: string): Promise<Cart> {
    try {
      const cart = await this.getCart(cartId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const initialLength = cart.items.length;
      cart.items = cart.items.filter(item => item.id !== itemId);

      if (cart.items.length === initialLength) {
        throw new Error('Item not found in cart');
      }

      // Recalculate cart totals
      await this.recalculateCartTotals(cart);

      // Update in database
      await this.saveCartToDatabase(cart);

      // Update Redis cache
      await redisService.setCartSession(cartId, cart, 3600);

      logger.info('Item removed from cart', { cartId, itemId });
      return cart;
    } catch (error) {
      logger.error('Failed to remove item from cart', { error, cartId, itemId });
      throw error;
    }
  }

  async clearCart(cartId: string): Promise<Cart> {
    try {
      const cart = await this.getCart(cartId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      cart.items = [];
      cart.subtotal = '0.00';
      cart.totalDiscount = '0.00';
      cart.totalTax = '0.00';
      cart.total = '0.00';
      cart.updatedAt = new Date();

      // Update in database
      await this.saveCartToDatabase(cart);

      // Update Redis cache
      await redisService.setCartSession(cartId, cart, 3600);

      logger.info('Cart cleared', { cartId });
      return cart;
    } catch (error) {
      logger.error('Failed to clear cart', { error, cartId });
      throw error;
    }
  }

  async deleteCart(cartId: string): Promise<void> {
    try {
      // Remove from database
      await dbService.query(`
        UPDATE carts SET status = 'abandoned' WHERE id = $1
      `, [cartId]);

      // Remove from Redis
      await redisService.deleteCartSession(cartId);

      logger.info('Cart deleted', { cartId });
    } catch (error) {
      logger.error('Failed to delete cart', { error, cartId });
      throw error;
    }
  }

  private async recalculateCartTotals(cart: Cart): Promise<void> {
    let subtotal = new Decimal(0);
    let totalDiscount = new Decimal(0);
    let totalTax = new Decimal(0);

    for (const item of cart.items) {
      const itemSubtotal = new Decimal(item.subtotal);
      const itemDiscount = new Decimal(item.subtotal).mul(new Decimal(item.discount));
      const itemTax = new Decimal(item.tax);

      subtotal = subtotal.plus(itemSubtotal);
      totalDiscount = totalDiscount.plus(itemDiscount);
      totalTax = totalTax.plus(itemTax);
    }

    const total = subtotal.minus(totalDiscount).plus(totalTax);

    cart.subtotal = subtotal.toFixed(2);
    cart.totalDiscount = totalDiscount.toFixed(2);
    cart.totalTax = totalTax.toFixed(2);
    cart.total = total.toFixed(2);
    cart.updatedAt = new Date();
  }

  private async saveCartToDatabase(cart: Cart): Promise<void> {
    await dbService.transaction(async (client) => {
      // Update cart
      await client.query(`
        UPDATE carts 
        SET subtotal = $1, total_discount = $2, total_tax = $3, total = $4, updated_at = $5
        WHERE id = $6
      `, [cart.subtotal, cart.totalDiscount, cart.totalTax, cart.total, cart.updatedAt, cart.id]);

      // Delete existing cart items
      await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);

      // Insert current cart items
      for (const item of cart.items) {
        await client.query(`
          INSERT INTO cart_items (
            id, cart_id, product_id, quantity, unit_price, discount, tax_rate,
            subtotal, tax, total, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          item.id, cart.id, item.productId, item.quantity, item.unitPrice,
          item.discount, item.taxRate, item.subtotal, item.tax, item.total,
          item.metadata, new Date(), new Date()
        ]);
      }
    });
  }
}

export const cartService = new CartService();