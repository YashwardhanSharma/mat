const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
// const authMiddleware = require('../middleware/auth.middleware');

// Protect all cart routes with authentication
// router.use(authMiddleware.verifyToken);

// Add item to cart
router.post('/add', cartController.addToCart);

// Get all cart items for a user
router.get('/:userId', cartController.getCartItems);

// Update quantity of a cart item
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove', cartController.removeCartItem);

// Clear cart for a user
router.delete('/clear/:userId', cartController.clearCart);

// Checkout
router.post('/checkout', cartController.checkout);

module.exports = router;
