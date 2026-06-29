const express = require('express');
const router = express.Router();
const { chatWithAI, generateItinerary, summarizeReviews } = require('../controllers/aiController');

router.post('/chat', chatWithAI);
router.post('/itinerary', generateItinerary);
router.post('/reviews-summary', summarizeReviews);

module.exports = router;
