const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');

router.get('/', ratingController.getAllRatings);      // Get all ratings (filter by productId/userId optional)
router.post('/', ratingController.addRating);        // Add new rating
router.put('/:id', ratingController.updateRating);   // Update rating
router.delete('/:id', ratingController.deleteRating);// Delete rating

module.exports = router;
