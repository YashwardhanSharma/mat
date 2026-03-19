const express = require('express');
const router = express.Router();
const authAdminController = require('../controllers/authAdmin.controller');

// Request OTP for admin login
router.post('/request-otp', authAdminController.requestAdminOTP);

// Verify OTP for admin login
router.post('/verify-otp', authAdminController.verifyAdminOTP);

// Get admin profile (protected route)
router.get('/profile', authAdminController.getAdminProfile);

module.exports = router;
