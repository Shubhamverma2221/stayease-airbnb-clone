const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

// Helper: check if listing is available for date range
const checkAvailability = async (propertyId, checkIn, checkOut) => {
  const overlappingBookings = await Booking.find({
    property: propertyId,
    status: { $in: ['Confirmed', 'Pending'] },
    $or: [
      { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } },
    ],
  });
  return overlappingBookings.length === 0;
};

// @desc    Create a booking request (Pending payment)
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { propertyId, checkIn, checkOut, guestsCount } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.host.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot book your own property' });
    }

    if (guestsCount > property.guestsCapacity) {
      return res.status(400).json({
        success: false,
        message: `Property maximum guest capacity is ${property.guestsCapacity}`,
      });
    }

    // Availability verification
    const isAvailable = await checkAvailability(propertyId, checkIn, checkOut);
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: 'Property is not available for selected dates' });
    }

    // Calculate dates & Pricing
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const totalNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (totalNights <= 0) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }

    // Base pricing with dynamic checks
    let basePricePerNight = property.pricePerNight;
    let totalPrice = 0;

    // Iterate day-by-day to apply dynamic weekend prices or season prices
    for (let i = 0; i < totalNights; i++) {
      const currentDay = new Date(checkInDate);
      currentDay.setDate(checkInDate.getDate() + i);

      let dayPrice = basePricePerNight;

      // Weekend pricing check (Friday and Saturday nights)
      const dayOfWeek = currentDay.getDay();
      if ((dayOfWeek === 5 || dayOfWeek === 6) && property.dynamicPricing?.weekendPrice) {
        dayPrice = property.dynamicPricing.weekendPrice;
      }

      // Seasonal overrides check
      if (property.dynamicPricing?.seasonalPricing) {
        for (const season of property.dynamicPricing.seasonalPricing) {
          if (currentDay >= new Date(season.startDate) && currentDay <= new Date(season.endDate)) {
            dayPrice = season.price;
            break;
          }
        }
      }
      totalPrice += dayPrice;
    }

    const { addons = [] } = req.body;
    let addonsTotal = 0;
    
    if (addons.includes('Airport Pickup')) {
      addonsTotal += 1200;
    }
    if (addons.includes('Premium Car Rental')) {
      addonsTotal += 3500 * totalNights;
    }
    if (addons.includes('Local Tour Guide')) {
      addonsTotal += 1800 * totalNights;
    }

    const calculatedAvgPrice = totalPrice / totalNights;
    const cleaningFee = property.cleaningFee || 0;
    const serviceFee = property.serviceFee || 0;
    const securityDeposit = property.securityDeposit || 0;
    const tax = Math.round(totalPrice * 0.12); // 12% tax

    const finalTotalPrice = totalPrice + cleaningFee + serviceFee + tax + securityDeposit + addonsTotal;

    // Create the pending booking
    const booking = await Booking.create({
      property: propertyId,
      guest: req.user.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestsCount,
      pricePerNight: calculatedAvgPrice,
      totalNights,
      cleaningFee,
      serviceFee,
      tax,
      securityDeposit,
      totalPrice: finalTotalPrice,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      invoiceNumber: 'INV-' + Date.now().toString().slice(-8),
      addons,
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking request created. Proceed to payment.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookings (Guest context) OR host's reservations (Host context)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const { role } = req.query; // 'guest' or 'host'
    let bookings = [];

    if (role === 'host') {
      // Find properties owned by host
      const properties = await Property.find({ host: req.user.id });
      const propertyIds = properties.map((p) => p._id);

      bookings = await Booking.find({ property: { $in: propertyIds } })
        .populate('property', 'title coverImage address pricePerNight')
        .populate('guest', 'name email profilePicture')
        .sort('-createdAt');
    } else {
      // Default to guest bookings
      bookings = await Booking.find({ guest: req.user.id })
        .populate('property', 'title coverImage address pricePerNight location')
        .populate({
          path: 'property',
          populate: { path: 'host', select: 'name email profilePicture superhost' },
        })
        .sort('-createdAt');
    }

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by ID (for invoices or itinerary)
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title coverImage address location wifiSpeed rules host')
      .populate('guest', 'name email profilePicture');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify authorized user (either guest who booked, or host who owns property)
    const propertyHostId = booking.property.host.toString();
    if (booking.guest._id.toString() !== req.user.id && propertyHostId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking & handle refunds
// @route   POST /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization
    if (booking.guest.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    const timeDiff = checkInDate.getTime() - today.getTime();
    const daysUntilCheckIn = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let refundAmount = 0;

    // Refund policy calculations
    if (booking.paymentStatus === 'Paid') {
      const policy = booking.property.cancellationPolicy; // 'Flexible', 'Moderate', 'Strict'
      if (policy === 'Flexible' && daysUntilCheckIn >= 1) {
        refundAmount = booking.totalPrice - booking.serviceFee; // 100% refund minus service fee
      } else if (policy === 'Moderate' && daysUntilCheckIn >= 5) {
        refundAmount = booking.totalPrice - booking.serviceFee;
      } else if (policy === 'Moderate' && daysUntilCheckIn >= 1) {
        refundAmount = (booking.totalPrice - booking.serviceFee) * 0.5; // 50% refund
      } else if (policy === 'Strict' && daysUntilCheckIn >= 7) {
        refundAmount = (booking.totalPrice - booking.serviceFee) * 0.5;
      } else {
        refundAmount = 0; // No refund
      }
    }

    booking.status = 'Cancelled';
    booking.paymentStatus = refundAmount > 0 ? 'Refunded' : booking.paymentStatus;
    booking.refundAmount = refundAmount;
    await booking.save();

    // Trigger Notification for Host
    await Notification.create({
      user: booking.property.host,
      title: 'Booking Cancelled',
      message: `Booking for ${booking.property.title} was cancelled by the guest.`,
      type: 'Booking',
    });

    res.status(200).json({
      success: true,
      booking,
      message: `Booking cancelled successfully. Refund calculated: INR ${refundAmount}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Host Dashboard / Earnings details
// @route   GET /api/bookings/host/dashboard
// @access  Private (Host)
exports.getHostDashboard = async (req, res, next) => {
  try {
    const properties = await Property.find({ host: req.user.id });
    const propertyIds = properties.map((p) => p._id);

    const bookings = await Booking.find({
      property: { $in: propertyIds },
      status: 'Confirmed',
    });

    // Calculations
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalPrice - b.serviceFee - b.tax - b.securityDeposit), 0);
    const activeBookings = bookings.filter((b) => new Date(b.checkOut) >= new Date() && b.status === 'Confirmed').length;

    // Calculate Occupancy rate (percentage of days booked)
    // Simplified demo calculation: percentage of listings with active bookings
    const occupancyRate = properties.length > 0 ? Math.round((activeBookings / properties.length) * 100) : 0;

    // Monthly earnings distribution
    const monthlyEarnings = Array(12).fill(0);
    bookings.forEach((b) => {
      const month = new Date(b.checkIn).getMonth();
      monthlyEarnings[month] += (b.totalPrice - b.serviceFee - b.tax - b.securityDeposit);
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalListings: properties.length,
        totalEarnings,
        activeBookings,
        occupancyRate,
        monthlyEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};
