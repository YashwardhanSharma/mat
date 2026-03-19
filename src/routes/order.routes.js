const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Public routes
router.get('/', orderController.getOrders);
router.get('/user/:userId', orderController.getOrdersByUser);
router.get('/:orderId', orderController.getOrderById);


module.exports = router;