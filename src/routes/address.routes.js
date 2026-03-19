const express = require('express');
const router = express.Router();
const { addAddress, getUserAddresses, getAddressById, deleteAddress } = require('../controllers/address.controller');

/**
 * @route   GET /api/addresses/:userId
 * @desc    Get all addresses for a specific user
 * @access  Private
 */
router.post('/add', addAddress);
router.get('/:userId', getUserAddresses);
router.get('/address/:addressId', getAddressById);
router.delete('/:addressId', deleteAddress);


module.exports = router;