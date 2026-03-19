const express = require('express');
const router = express.Router();
const gstnController = require('../controllers/gstn.controller');

// Add GSTN
router.post('/add', gstnController.addGstn);

// Update GSTN by userId
router.put('/:userId', gstnController.updateGstn);

// Delete GSTN by userId
router.delete('/:userId', gstnController.removeGstn);

// Get GSTN by userId
router.get('/:userId', gstnController.getGstnByUserId);

module.exports = router;
