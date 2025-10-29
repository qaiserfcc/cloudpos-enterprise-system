import { Router, Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart';
import { logger } from '../utils/logger';

const router = Router();

// Create a new cart
router.post('/carts', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId, cashierId, customerId } = req.body;

    if (!storeId || !cashierId) {
      res.status(400).json({
        success: false,
        message: 'Store ID and Cashier ID are required'
      });
      return;
    }

    const cart = await cartService.createCart(storeId, cashierId, customerId);

    res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Get cart by ID
router.get('/carts/:cartId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;
    const cart = await cartService.getCart(cartId);

    if (!cart) {
      res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
      return;
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Add item to cart
router.post('/carts/:cartId/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;
    const { productId, quantity, unitPrice, discount, metadata } = req.body;

    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
      return;
    }

    if (quantity <= 0) {
      res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
      return;
    }

    const cart = await cartService.addItemToCart(cartId, {
      productId,
      quantity,
      unitPrice,
      discount,
      metadata
    });

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Update cart item
router.put('/carts/:cartId/items/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId, itemId } = req.params;
    const { quantity, discount, metadata } = req.body;

    const cart = await cartService.updateCartItem(cartId, itemId, {
      quantity,
      discount,
      metadata
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Remove item from cart
router.delete('/carts/:cartId/items/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId, itemId } = req.params;
    const cart = await cartService.removeItemFromCart(cartId, itemId);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Clear cart
router.delete('/carts/:cartId/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;
    const cart = await cartService.clearCart(cartId);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

// Delete cart
router.delete('/carts/:cartId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;
    await cartService.deleteCart(cartId);

    res.json({
      success: true,
      message: 'Cart deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;