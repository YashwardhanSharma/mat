// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');

// CRUD
router.post('/', controller.createCategory);
router.get('/', controller.listCategories);
router.get('/:id', controller.getCategory);
router.put('/:id', controller.updateCategory);

// Soft delete (recommended)
router.patch('/:id/deactivate', controller.deactivateCategory);

// Hard delete
router.delete('/:id', controller.deleteCategory);

module.exports = router;
