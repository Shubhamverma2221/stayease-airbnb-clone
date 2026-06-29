const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Beachfront', 'Cabins', 'Trending', 'Modern', 'Countryside', 'Pools', 'Castles', 'Islands', 'Lakefront', 'Design'],
    },
    coverImage: {
      type: String,
      required: [true, 'Please provide a cover image'],
    },
    images: [
      {
        type: String,
      },
    ],
    bedrooms: {
      type: Number,
      required: [true, 'Please specify bedrooms count'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Please specify bathrooms count'],
    },
    guestsCapacity: {
      type: Number,
      required: [true, 'Please specify guest capacity'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please specify price per night'],
    },
    cleaningFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      zipCode: String,
      formattedAddress: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    streetViewUrl: {
      type: String,
      default: '',
    },
    virtualTourUrl: {
      type: String,
      default: '',
    },
    wifiSpeed: {
      type: Number, // Mbps
      default: 0,
    },
    parkingAvailable: {
      type: Boolean,
      default: false,
    },
    evCharging: {
      type: Boolean,
      default: false,
    },
    accessibilityFeatures: [String],
    amenities: [
      {
        type: String, // e.g. Wi-Fi, Kitchen, Pool, Air Conditioning
      },
    ],
    rules: [String],
    houseManual: {
      type: String,
      default: '',
    },
    safetyInformation: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    checkInInstructions: {
      type: String,
      default: '',
    },
    cancellationPolicy: {
      type: String,
      enum: ['Flexible', 'Moderate', 'Strict'],
      default: 'Flexible',
    },
    unavailableDates: [
      {
        type: Date,
      },
    ],
    dynamicPricing: {
      weekendPrice: Number,
      seasonalPricing: [
        {
          startDate: Date,
          endDate: Date,
          price: Number,
        },
      ],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for demo simplicity unless admin changes it
    },
  },
  { timestamps: true }
);

// GeoJSON 2dsphere index for location search
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);
