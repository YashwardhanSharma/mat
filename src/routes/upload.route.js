const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No image uploaded!' });
  }

  const imageUrl = `/uploads/user/${req.file.filename}`;
  res.status(200).json({
    status: 'success',
    message: 'Image uploaded successfully!',
    imageUrl
  });
});

module.exports = router;
