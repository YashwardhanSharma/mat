const express = require('express');
const router = express.Router();
const businessDetailsController = require('../controllers/businessDetails.controller');

// Add business details
router.post('/', businessDetailsController.addBusinessDetails);

// Update business details
router.put('/', businessDetailsController.updateBusinessDetails);

// Get business details by userId
router.get('/:userId', businessDetailsController.getBusinessDetailsByUserId);

module.exports = router;
