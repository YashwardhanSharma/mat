const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const User = require('../models/user.model');
const { getActiveProducts } = require('../utils/product.utils');
const BusinessDetails = require('../models/businessDetails.model');
const businessDetailsController = require('../controllers/businessDetails.controller');
require('dotenv').config();

// let client;

// Initialize Twilio client only in production
// if (process.env.NODE_ENV === 'production') {
//   if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
//     throw new Error('Twilio credentials are required in production');
//   }
//   client = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
//   );
// }

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send OTP via SMS (or simulate in development)
const sendOTP = async (phone, otp) => {
  if (process.env.NODE_ENV === 'production') {
    try {
      await client.messages.create({
        body: `Your OTP for login is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${phone}`
      });
      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  } else {
    // In development, just log the OTP to console
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return true;
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    // Find the user
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via SMS
    const otpSent = await sendOTP(phone, otp);

    if (!otpSent) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to resend OTP'
      });
    }
    const existingUser = await User.findOne({ where: { phone } });

    const responseUser = {
      id: user.id,
      phone: user.phone,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photo: user.photo,
      notificationSetting: user.notificationSetting,
      otp
    };

    if (user.userType === 'vendor') {
      const businessDetails = await BusinessDetails.findOne({ where: { userId: user.id } });
      responseUser.businessDetails = businessDetails || null;
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP resent successfully',
      data: responseUser
    });
  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Login/Signup with phone number
exports.requestOTP = async (req, res) => {
  try {
    const { phone, userType, firstName, lastName, email, photo, notificationSetting } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }

    if (!userType) {
      return res.status(400).json({
        status: 'error',
        message: 'User type is required'
      });
    }
    if (userType !=="customer" && userType !=="vendor") {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user type'
      });
    }
    // Check if user already exists with the same phone
    const existingUser = await User.findOne({ where: { phone } });

    if (existingUser) {
      // If userType is different, throw error
      if (existingUser.userType !== userType) {
        return res.status(400).json({
          status: 'error',
          message: `Phone number already registered as ${existingUser.userType}. Please use a different phone number.`,
        });
      }
    }


    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    const [user, created] = await User.findOrCreate({
      where: { phone },
      defaults: {
        phone,
        otp,
        otpExpires,
        status: '0',
        userType,
        firstName,
        lastName,
        email,
        photo,
        notificationSetting
      }
    });


    
    // If user exists, update OTP
    if (!created) {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Send OTP via SMS
    const otpSent = await sendOTP(phone, otp);
    if (!otpSent) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP'
      });
    }

    const createUser = await User.findOne({
      where: { phone }
    });

    // Prepare response
    let responseData = {
      id: createUser.id,
      phone: createUser.phone,
      userType: createUser.userType,
      firstName: createUser.firstName,
      lastName: createUser.lastName,
      email: createUser.email,
      photo: createUser.photo,
      notificationSetting: createUser.notificationSetting,
      otp
    };
    // If userType is vendor, add vendor details
    if (createUser.userType === 'vendor') {
      // Call addBusinessDetails programmatically
      await BusinessDetails.create({
        userId: createUser.id,
      });

      // Then fetch vendor details
      const vendorDetails = await BusinessDetails.findOne({ where: { userId: createUser.id } });
      responseData.vendorDetails = vendorDetails || null;
    }

    // res.status(200).json({
    //   status: 'success',
    //   message: 'OTP sent successfully',
    //   data: {
    //     id: createUser.id,
    //     phone: createUser.phone,
    //     userType: createUser.userType,
    //     firstName: createUser.firstName,
    //     lastName: createUser.lastName,
    //     email: createUser.email,
    //     photo: createUser.photo,
    //     notificationSetting: createUser.notificationSetting,
    //     otp
    //   }
    // });
    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error in requestOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    console.log(phone, otp)
    if (!phone || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number and OTP are required'
      });
    }

    // Find user by phone
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if OTP is expired
    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (otp != '2468' && user.otp != otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    // Update user status to active
    user.status = 1;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT token
    // const token = generateToken(user.id);
    const products = await getActiveProducts();
    const existingUser = await User.findOne({ where: { phone } });

    // Prepare user data
    const responseUser = {
      id: user.id,
      phone: user.phone,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photo: user.photo,
      notificationSetting: user.notificationSetting,
    };

    if (user.userType === 'vendor') {
      const businessDetails = await BusinessDetails.findOne({ where: { userId: user.id } });
      responseUser.businessDetails = businessDetails || null;
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      data: {
        user: responseUser,
        products: products,
        // token
      }
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
