// 🛒 ADVANCED SHOPPING CART
// Carrito persistente, cupones, cálculos de envío

import express from 'express';
import { checkoutLimiter } from '../middleware/security.js';

const router = express.Router();

// In-memory cart storage (usar DB en producción)
const carts = new Map();

// Generate or get cart ID
function getOrCreateCart(req, res, next) {
  let cartId = req.headers['x-cart-id'];

  if (!cartId) {
    cartId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Cart-ID', cartId);
  }

  req.cartId = cartId;

  if (!carts.has(cartId)) {
    carts.set(cartId, {
      id: cartId,
      items: [],
      totals: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      },
      coupon: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  next();
}

router.use(getOrCreateCart);

// GET /api/cart - Get current cart
router.get('/', (req, res) => {
  const cart = carts.get(req.cartId);
  res.json(cart);
});

// POST /api/cart/add - Add item to cart
router.post('/add', checkoutLimiter, (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Invalid item data' });
    }

    const cart = carts.get(req.cartId);
    const existingItem = cart.items.find(
      (item) => item.productId === productId && item.variant === variant
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        variant,
        addedAt: new Date(),
      });
    }

    calculateCart(cart);
    res.json({
      success: true,
      cart,
      message: 'Item agregado al carrito',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// PUT /api/cart/update/:productId - Update item quantity
router.put('/update/:productId', (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = carts.get(req.cartId);

    const item = cart.items.find((i) => i.productId === req.params.productId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    calculateCart(cart);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/cart/remove/:productId - Remove item
router.delete('/remove/:productId', (req, res) => {
  try {
    const cart = carts.get(req.cartId);
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    calculateCart(cart);

    res.json({
      success: true,
      cart,
      message: 'Item removido del carrito',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// POST /api/cart/coupon - Apply coupon
router.post('/coupon', (req, res) => {
  try {
    const { code } = req.body;
    const cart = carts.get(req.cartId);

    // Mock coupon validation
    const coupons = {
      'WELCOME10': { discount: 0.1, type: 'percentage' },
      'SAVE5': { discount: 5, type: 'fixed' },
      'SHIPPING': { discount: 10, type: 'shipping' },
    };

    const coupon = coupons[code];
    if (!coupon) {
      return res.status(400).json({ error: 'Cupón inválido' });
    }

    cart.coupon = { code, ...coupon };
    calculateCart(cart);

    res.json({
      success: true,
      cart,
      message: `Cupón ${code} aplicado`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

// POST /api/cart/shipping - Calculate shipping
router.post('/shipping', (req, res) => {
  try {
    const { zipCode, country = 'AR' } = req.body;
    const cart = carts.get(req.cartId);

    // Mock shipping calculation
    let shippingCost = 10;
    if (country === 'PY') shippingCost = 15;
    if (country === 'UY') shippingCost = 20;

    // Free shipping over $100
    if (cart.totals.subtotal > 100) {
      shippingCost = 0;
    }

    cart.totals.shipping = shippingCost;
    calculateCart(cart);

    res.json({
      success: true,
      shipping: shippingCost,
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', (req, res) => {
  const cart = carts.get(req.cartId);
  cart.items = [];
  cart.coupon = null;
  calculateCart(cart);

  res.json({
    success: true,
    message: 'Carrito vaciado',
  });
});

// Helper: Calculate cart totals
function calculateCart(cart) {
  // Subtotal
  cart.totals.subtotal = cart.items.reduce((sum, item) => {
    // Mock price: $10 per item (replace with actual product lookup)
    return sum + 10 * item.quantity;
  }, 0);

  // Tax (10%)
  cart.totals.tax = Math.round(cart.totals.subtotal * 0.1 * 100) / 100;

  // Discount
  cart.totals.discount = 0;
  if (cart.coupon) {
    if (cart.coupon.type === 'percentage') {
      cart.totals.discount =
        Math.round(cart.totals.subtotal * cart.coupon.discount * 100) / 100;
    } else if (cart.coupon.type === 'fixed') {
      cart.totals.discount = cart.coupon.discount;
    } else if (cart.coupon.type === 'shipping') {
      // Handled in shipping
    }
  }

  // Total
  cart.totals.total =
    cart.totals.subtotal +
    cart.totals.tax +
    cart.totals.shipping -
    cart.totals.discount;
  cart.totals.total = Math.round(cart.totals.total * 100) / 100;
}

export default router;
