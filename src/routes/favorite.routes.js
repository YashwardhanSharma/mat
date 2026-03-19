const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');

// Add a product to favorites
router.post('/add', favoriteController.addFavorite);

// Remove a product from favorites
router.post('/remove', favoriteController.removeFavorite);

// Get all favorites for a user
router.get('/list', favoriteController.getFavorites);

// Check if a product is favorited by a user
router.get('/check', favoriteController.isFavorite);

module.exports = router;
