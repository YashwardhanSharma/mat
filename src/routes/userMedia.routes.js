const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const { uploadSingle, uploadAudio, uploadVideo } = require('../config/multerConfig');

// Create media
router.post('/', controller.createMedia);

// Get all media
router.get('/', controller.getAllMedia);

// Get all media
router.get('/:id', controller.getMediaById);

// Get media by user id
router.get('/user/:userId', controller.getMediaByUser);

router.delete('/:id', controller.deleteMediaById);

//update
router.put('/:id', controller.updateMediaById);

router.post('/upload/image', uploadSingle, controller.uploadImage);
router.post('/upload/audio', uploadAudio, controller.uploadAudio);
router.post('/upload/video', uploadVideo, controller.uploadVideo);
module.exports = router;
