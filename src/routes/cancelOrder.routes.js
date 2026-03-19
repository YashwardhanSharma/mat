const express = require('express');
const router = express.Router();
const cancelOrderController = require('../controllers/cancelOrder.controller');

router.get('/', cancelOrderController.getAllCancelOrders);      // Get all cancel orders
router.post('/', cancelOrderController.addCancelOrder);         // Add cancel order
router.put('/:id', cancelOrderController.updateCancelOrder);    // Update cancel order
router.delete('/:id', cancelOrderController.deleteCancelOrder); // Delete cancel order

module.exports = router;
