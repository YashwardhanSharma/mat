const Favorite = require('../models/favorite.model');
const sequelize = require('../config/db');

// Add a product to favorites
exports.addFavorite = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>", req.body)
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ status: 'error', message: 'userId and productId are required' });
    }

    // Prevent duplicates
    const existing = await Favorite.findOne({ where: { userId, productId } });
    if (existing) {
      return res.status(200).json({ status: 'success', message: 'Product already in favorites', favorite: existing });
    }

    const favorite = await Favorite.create({ userId, productId });
    res.status(200).json({ status: 'success', message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add favorite', error: error.message });
  }
};

// Remove a product from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ status: 'error', message: 'userId and productId are required' });
    }

    const deleted = await Favorite.destroy({ where: { userId, productId } });
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Favorite not found' });
    }

    res.status(200).json({ status: 'success', message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to remove favorite', error: error.message });
  }
};

// Get all favorites for a user
exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'userId is required' });
    }

    // const favorites = await Favorite.findAll({ where: { userId } });
    const query = `SELECT 
        f.id,
        f.userId,
        f.productId,
        f.created_at,
        f.updated_at,
        p.id,
        p.userId,
        p.heading AS name,
        p.sub_heading,
        p.details AS description,
        p.price,
        p.mrp,
        p.product_type,
        p.productImageUrl,
        p.brand,
        p.item,
        p.status,
        p.specification,
        p.measure,
        p.selling_measure,
        p.measure_term,
        p.measure_value,
        p.selling_measure_rate,
        p.unit_mrp_incl_gst,
        p.discount_rule,
        p.discount_value,
        p.delivery_time,
        p.logistics_rule,
        p.gst,
        p.delivery_charges,
        p.coupon_code_apply,
        GROUP_CONCAT(pi.image_url ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.id ASC) AS images
      FROM favorites f
      INNER JOIN products p ON p.id = f.productId
      LEFT JOIN product_images pi 
            ON pi.productId = p.id 
            AND pi.status = 'active'
      WHERE f.userId = :userId
        AND p.status = 'active'
      GROUP BY f.id, p.id
    `;

    const favorites = await sequelize.query(query, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    
    res.status(200).json({ status: 'success', favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get favorites', error: error.message });
  }
};

// Check if a product is in user's favorites
exports.isFavorite = async (req, res) => {
  try {
    const { userId, productId } = req.query;
    if (!userId || !productId) {
      return res.status(400).json({ status: 'error', message: 'userId and productId are required' });
    }

    const favorite = await Favorite.findOne({ where: { userId, productId } });
    res.status(200).json({ status: 'success', isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to check favorite', error: error.message });
  }
};
