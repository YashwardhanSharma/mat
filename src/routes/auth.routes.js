const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Request OTP for login/signup
router.post('/request-otp', authController.requestOTP);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

// Verify OTP
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;
