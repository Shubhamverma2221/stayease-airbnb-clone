const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const uploadImage = require('../utils/uploadImage');

// Simple AI Sentiment Analysis Heuristic
const analyzeSentiment = (text) => {
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'clean', 'perfect', 'beautiful', 'wonderful', 'friendly', 'cozy', 'comfortable', 'nice', 'awesome', 'best'];
  const negativeWords = ['bad', 'dirty', 'poor', 'hate', 'rude', 'noisy', 'expensive', 'terrible', 'worst', 'uncomfortable', 'broken', 'smelly', 'cold', 'loud'];

  const words = text.toLowerCase().split(/\W+/);
  let score = 0.5; // neutral base

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((w) => {
    if (positiveWords.includes(w)) positiveCount++;
    if (negativeWords.includes(w)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total > 0) {
    score = positiveCount / total; // between 0 and 1
  }

  let label = 'Neutral';
  if (score > 0.6) label = 'Positive';
  if (score < 0.4) label = 'Negative';

  return { score, label };
};

// @desc    Add review for a property (verified bookings only)
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { propertyId, bookingId, rating, comment } = req.body;

    // Check if the booking exists, belongs to user, and is confirmed/completed
    const booking = await Booking.findOne({
      _id: bookingId,
      guest: req.user.id,
      property: propertyId,
      status: { $in: ['Confirmed', 'Completed'] },
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Only guests with verified, confirmed bookings can review this property',
      });
    }

    // Check if review already exists for this booking
    const reviewExists = await Review.findOne({ booking: bookingId });
    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    }

    // Process optional review image
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    // Sentiment Analysis
    const sentiment = analyzeSentiment(comment);

    const review = await Review.create({
      property: propertyId,
      author: req.user.id,
      booking: bookingId,
      rating: Number(rating),
      comment,
      images: imageUrl ? [imageUrl] : [],
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
    });

    // Update Property average rating and review counts
    const property = await Property.findById(propertyId);
    const reviews = await Review.find({ property: propertyId });

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    property.reviewsCount = reviews.length;
    property.averageRating = parseFloat((totalRatings / reviews.length).toFixed(2));
    await property.save();

    res.status(201).json({
      success: true,
      review,
      message: 'Review posted successfully. Sentiment Analyzed: ' + sentiment.label,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a property
// @route   GET /api/reviews/property/:propertyId
// @access  Public
exports.getReviewsForProperty = async (req, res, next) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('author', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle review like (mark review as helpful)
// @route   POST /api/reviews/:id/like
// @access  Private
exports.likeReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const index = review.likes.indexOf(req.user.id);
    let liked = false;

    if (index === -1) {
      review.likes.push(req.user.id);
      liked = true;
    } else {
      review.likes.splice(index, 1);
    }

    await review.save();

    res.status(200).json({
      success: true,
      liked,
      message: liked ? 'Review marked helpful' : 'Review unliked',
      likesCount: review.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reports.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You already flagged this review' });
    }

    review.reports.push(req.user.id);
    await review.save();

    res.status(200).json({ success: true, message: 'Review reported to moderation team' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const propertyId = review.property;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate average ratings
    const property = await Property.findById(propertyId);
    const reviews = await Review.find({ property: propertyId });

    if (reviews.length > 0) {
      const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
      property.reviewsCount = reviews.length;
      property.averageRating = parseFloat((totalRatings / reviews.length).toFixed(2));
    } else {
      property.reviewsCount = 0;
      property.averageRating = 0;
    }
    await property.save();

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
