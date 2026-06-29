const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  toggleWishlist,
  getWishlist,
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/multer');

// Public
router.get('/', getProperties);
router.get('/user/wishlist', protect, getWishlist);
router.get('/:id', getPropertyById);

// Private (Host & Admin)
router.post(
  '/',
  protect,
  authorize('host', 'admin'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  createProperty
);

router.put(
  '/:id',
  protect,
  authorize('host', 'admin'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  updateProperty
);

router.delete('/:id', protect, authorize('host', 'admin'), deleteProperty);

// Private (Wishlist toggle)
router.post('/:id/wishlist', protect, toggleWishlist);

module.exports = router;
