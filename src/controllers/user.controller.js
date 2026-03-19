const User = require('../models/user.model');
const Product = require('../models/product.model');
const ProductImage = require('../models/productImage.model');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const sequelize = require('../config/db');
const UserMedia =  require('../models/userMedia.model');


//  Get user details by userId
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'userType', 'firstName', 'lastName', 'email', 'notificationSetting', 'photo', 'status', 'phone']
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const profileInfo = {};
    if (user.userType === 'customer') {
      console.log("I am customer ")
      profileInfo.totalSaving =  await getTotalSavings(userId); // Assuming a method to get total savings
      profileInfo.totalOrders =  await getTotalOrders(userId); // Assuming a method to get total orders
      profileInfo.avgDevelaryTIme =  30; // Assuming a method to get total ratings
    } else if (user.userType === 'vendor') {
      profileInfo.totalOrders =  await user.getTotalOrders(userId); // Assuming a method to get total orders
    }

    return res.status(200).json({
      status: 'success',
      message: 'User details fetched successfully',
      data: { user, profile: profileInfo }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch user', error: error.message });
  }
};
const getTotalSavings = async (userId) => {
  try {
    const [results] = await sequelize.query(
      `
      SELECT 
        SUM((p.mrp - p.price) * oi.quantity) AS totalSavings
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.userId = :userId
      `,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    return results?.totalSavings || 0;
  } catch (error) {
    console.error('Error calculating total savings:', error);
    return 0;
  }
};

const getTotalOrders = async (userId) => {
  try {
    const [results] = await sequelize.query(
      `
      SELECT COUNT(*) AS totalOrders
      FROM orders
      WHERE userId = :userId
      `,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return results?.totalOrders || 0;
  } catch (error) {
    console.error('Error fetching total orders:', error);
    return 0;
  }
};


// Update user details by userId
exports.updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, notificationSetting, photo, status } = req.body;

    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'User ID is required' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Update only the provided fields
    await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      email: email ?? user.email,
      notificationSetting: notificationSetting ?? user.notificationSetting,
      photo: photo ?? user.photo,
      status: status ?? user.status,
    });

    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user', error: error.message });
  }
};

exports.createMedia = async (req, res) => {
  try {
    const {
      type,
      url,
      name,
      text,
      user_name,
      phone,
      userId
    } = req.body;

    if (!type || !url || !name || !user_name || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    await UserMedia.create({
      type,
      url,
      name,
      text,
      user_name,
      phone,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Media created successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getAllMedia = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        type,
        url,
        name,
        text,
        user_name,
        phone,
        userId,
        created_at
      FROM user_media
      ORDER BY created_at DESC
    `;

    let replacements = {};
    const rows = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    console.log(rows, "length");
    console.log(rows.length, "here length");
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
      
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getMediaByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const rows = await sequelize.query(
      `
      SELECT *
      FROM user_media
      WHERE userId = :userId
      `,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM user_media
      WHERE id = :id
    `;

    const result = await sequelize.query(sql, {
      replacements: { id },
      type: sequelize.QueryTypes.DELETE
    });

    /**
     * result format (for DELETE):
     * MySQL → affectedRows count
     */
    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        id,
        type,
        url,
        name,
        text,
        user_name,
        phone,
        userId,
        created_at
      FROM user_media
      WHERE id = :id
      LIMIT 1
    `;

    const rows = await sequelize.query(sql, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    // rows is always an array
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      type,
      url,
      name,
      text,
      user_name,
      phone
    } = req.body;

    // Build dynamic update fields
    const fields = [];
    const replacements = { id };

    if (type) {
      fields.push('type = :type');
      replacements.type = type;
    }
    if (url) {
      fields.push('url = :url');
      replacements.url = url;
    }
    if (name) {
      fields.push('name = :name');
      replacements.name = name;
    }
    if (text !== undefined) {
      fields.push('text = :text');
      replacements.text = text;
    }
    if (user_name) {
      fields.push('user_name = :user_name');
      replacements.user_name = user_name;
    }
    if (phone) {
      fields.push('phone = :phone');
      replacements.phone = phone;
    }

    // Nothing to update
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    const sql = `
      UPDATE user_media
      SET ${fields.join(', ')}
      WHERE id = :id
    `;

    const [result] = await sequelize.query(sql, {
      replacements
    });

    // MySQL affected rows check
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media not found or no changes made'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Media updated successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.uploadImage = async (req, res) => {
    try {
      // The files and form data are already processed by multer middleware
      const baseUrl = `${constant.HOST}`;
      const userId = req.body.userId || 'default';
      console.log(req.body)
      console.log(req.image)
      // Get the uploaded files
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }
  
    const imageUrl = `${baseUrl}/uploads/user/${req.file.filename}`;
  
      // Here you could save the image references to your database
      // Example: await ProductImage.bulkCreate(uploadedImages);
  
      res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  
    } catch (error) {
      console.error('Upload product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload product images',
        error: error.message
      });
    }
  };

  exports.uploadAudio = async (req, res) => {
  try {
    const baseUrl = `${constant.HOST}`;

    // multer single('audio') → req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    const audioUrl = `${baseUrl}/uploads/audio/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Audio uploaded successfully',
      data: {
        url: audioUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Upload audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload audio',
      error: error.message
    });
  }
};

exports.uploadVideo = async (req, res) => {
  try {
    const baseUrl = `${constant.HOST}`;

    // multer single('video') → req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const videoUrl = `${baseUrl}/uploads/video/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: videoUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
};


