const express = require('express');
const router = express.Router();
const {
  addReview,
  getReviewsForProperty,
  likeReview,
  reportReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/multer');

router.post('/', protect, upload.single('image'), addReview);
router.get('/property/:propertyId', getReviewsForProperty);
router.post('/:id/like', protect, likeReview);
router.post('/:id/report', protect, reportReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
