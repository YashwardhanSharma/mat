const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { uploadSingle } = require('../config/multerConfig');


//Get user details by userId
router.get('/:userId', userController.getUserById);

//Update user details by userId
router.put('/:userId', userController.updateUserById);

// Upload user profile picture
router.post('/upload', (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        status: 'error', 
        message: err.message || 'Error uploading file' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No file uploaded or invalid file type' 
      });
    }

    const baseUrl = `${constant.HOST}`;
    const imageUrl = `/uploads/user/${req.file.filename}`;
    const fullImageUrl = `${baseUrl}${imageUrl}`;
    
    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully!',
      imageUrl: fullImageUrl
    });
  });
});
  


module.exports = router;
