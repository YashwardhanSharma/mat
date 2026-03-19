const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { Op } = require('sequelize');
require('dotenv').config();

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send OTP via SMS (or simulate in development)
const sendOTP = async (phone, otp) => {
  // In development, just log the OTP to console
  console.log(`[ADMIN AUTH] OTP for ${phone}: ${otp}`);
  return true;
};

// Request OTP for admin login
exports.requestAdminOTP = async (req, res) => {
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
    if (userType !=="admin" && userType !=="subAdmin") {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user type'
        });
      }

    const existingUser = await User.findOne({ where: { phone } });

    if (existingUser) {
        // If userType is different, throw error
        if (existingUser.userType != userType) {
        return res.status(400).json({
            status: 'error',
            message: `Phone number already registered as ${existingUser.userType}. Please use a different phone number.`,
        });
        }
    }

    // Generate OTP and set expiration (5 minutes for admin)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Update admin with new OTP
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
    // Send OTP
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
    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error in requestAdminOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Verify Admin OTP
exports.verifyAdminOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number and OTP are required'
      });
    }

    // Find admin user
    const admin = await User.findOne({ 
      where: { 
        phone,
        userType: { [Op.in]: ['admin', 'subAdmin'] }
      } 
    });

    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin account not found'
      });
    }

    // Check OTP expiration (5 minutes)
    if (admin.otpExpires < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired'
      });
    }

    // Verify OTP (2468 is a test OTP for development)
    if (otp != '2468' && admin.otp != otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    // Update admin status and clear OTP
    admin.status = 1;
    admin.otp = null;
    admin.otpExpires = null;
    await admin.save();

    res.status(200).json({
      status: 'success',
      message: 'login successful',
      data: {
        user: {
          id: admin.id,
          phone: admin.phone,
          userType: admin.userType,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          photo: admin.photo,
          status: admin.status,
          notificationSetting: admin.notificationSetting || {}
        }
      }
    });
  } catch (error) {
    console.error('Error in verifyAdminOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findByPk(req.user.id, {
      attributes: { exclude: ['otp', 'otpExpires'] }
    });

    if (!admin || !['admin', 'subAdmin'].includes(admin.userType)) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin account not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: admin
      }
    });
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};