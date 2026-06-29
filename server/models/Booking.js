const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkIn: {
      type: Date,
      required: [true, 'Please specify check-in date'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Please specify check-out date'],
    },
    guestsCount: {
      type: Number,
      required: true,
      default: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    totalNights: {
      type: Number,
      required: true,
    },
    cleaningFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Refunded'],
      default: 'Unpaid',
    },
    paymentGateway: {
      type: String,
      enum: ['Razorpay', 'Stripe', 'None'],
      default: 'None',
    },
    paymentId: {
      type: String,
      default: '',
    },
    orderId: {
      type: String,
      default: '',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    invoiceNumber: String,
    addons: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
