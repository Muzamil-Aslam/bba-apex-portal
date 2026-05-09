const express = require('express');
const router = express.Router();
const { getGallery, uploadMedia, deleteMedia, toggleFeatured } = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getGallery);
router.post('/upload', protect, authorize('admin', 'faculty'), uploadMedia);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteMedia);
router.patch('/:id/featured', protect, authorize('admin', 'faculty'), toggleFeatured);

module.exports = router;
