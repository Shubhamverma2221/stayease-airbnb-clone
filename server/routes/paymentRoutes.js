const express = require('express');
const router = express.Router();
const { checkoutBooking, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/checkout', protect, checkoutBooking);
router.post('/verify', protect, verifyPayment);

module.exports = router;
