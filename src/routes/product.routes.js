const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { uploadProductImages: upload } = require('../config/multerConfig');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
// Add product
router.post('/add', productController.addProduct);

// Upload product images with form data
router.post('/images', upload, productController.uploadProductImages);
// Update product
// router.put('/update/:id', productController.updateProductById);
// Delete product
router.delete('/delete/:id', productController.deleteProductById);

module.exports = router;