const Rating = require('../models/rating.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

// Get all ratings (optional: filter by productId or userId)
exports.getAllRatings = async (req, res) => {
  try {
    const { productId, userId } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;

    const ratings = await Rating.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Product, as: 'product', attributes: ['id', 'heading', 'price'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Ratings fetched successfully',
      data: ratings
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ratings',
      error: error.message
    });
  }
};

//Add a new rating
exports.addRating = async (req, res) => {
  try {
    const { userId, productId, rating, review } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ status: 'error', message: 'userId, productId, and rating are required' });
    }

    const newRating = await Rating.create({ userId, productId, rating, review });

    return res.status(201).json({
      status: 'success',
      message: 'Rating added successfully',
      data: newRating
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add rating',
      error: error.message
    });
  }
};

//Update rating by ID
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, status } = req.body;

    const ratingRecord = await Rating.findByPk(id);
    if (!ratingRecord) {
      return res.status(404).json({ status: 'error', message: 'Rating not found' });
    }

    await ratingRecord.update({ rating, review, status });

    return res.status(200).json({
      status: 'success',
      message: 'Rating updated successfully',
      data: ratingRecord
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update rating',
      error: error.message
    });
  }
};

//Delete rating by ID
exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    const ratingRecord = await Rating.findByPk(id);
    if (!ratingRecord) {
      return res.status(404).json({ status: 'error', message: 'Rating not found' });
    }

    await ratingRecord.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete rating',
      error: error.message
    });
  }
};
