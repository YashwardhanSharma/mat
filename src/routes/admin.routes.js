const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { uploadProductImages: upload, uploadExcel } = require('../config/multerConfig');
const categoriesController = require('../controllers/category.controller');
const subcategoryController = require('../controllers/subcategory.controller');
const supportController = require('../controllers/support.controller');


// Public routes
router.get('/products/', adminController.getAllProducts);
router.get('/products/:id', adminController.getProductById);
// // Add product
router.post('/products/add', adminController.addProduct);

router.post('/products/add/bulke', uploadExcel, adminController.addBulkeProduct);

// Upload product images with form data
router.post('/products/images', upload, adminController.uploadProductImages);
router.post('/products/images/add', upload, adminController.uploadProductImagesAdd);
router.post('/products/images/list', adminController.uploadProductImagesList);

router.get('/users/list', adminController.getUsersByType);
// Update product
router.put('/products/update', adminController.updateProduct);
// Delete product
router.delete('/products/delete-all', adminController.deleteAllProducts);
router.delete('/products/delete/:id', adminController.deleteProductById);

router.get('/orders', adminController.getAllOrders);

router.put('/orders/update/:orderId', adminController.updateOrderStatus);
router.put('/dashbard', adminController.updateOrderStatus);

// Mount category routes
// CRUD
router.post('/category', categoriesController.createCategory);
router.get('/category', categoriesController.listCategories);
router.get('/category/:id', categoriesController.getCategory);
router.put('/category/:id', categoriesController.updateCategory);

// Soft delete (recommended)
router.patch('/category/:id/deactivate', categoriesController.deactivateCategory);

// Hard delete
router.delete('/category/:id', categoriesController.deleteCategory);



router.post('/subcategory', subcategoryController.createSubcategory);
router.get('/subcategory', subcategoryController.listSubcategories);
router.get('/subcategory/:id', subcategoryController.getSubcategory);
router.put('/subcategory/:id', subcategoryController.updateSubcategory);
router.patch('/subcategory/:id/deactivate', subcategoryController.deactivateSubcategory);
router.delete('/subcategory/:id', subcategoryController.deleteSubcategory);
router.get('/subcategory/:category_name', subcategoryController.getSubcategoriesByCategoryName);

// Support APIs (Admin)
router.post('/support', supportController.createSupport);
router.get('/support_list', supportController.getSupport);
router.put('/support/:id', supportController.updateSupport);
router.delete('/support/:id', supportController.deleteSupport);

module.exports = router;
