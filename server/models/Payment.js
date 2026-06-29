const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    gateway: {
      type: String,
      enum: ['Razorpay', 'Stripe'],
      required: true,
    },
    transactionId: String,
    orderId: String,
    signature: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
