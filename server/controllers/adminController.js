const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ role: 'host' });
    const totalProperties = await Property.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Total revenue sum from payments
    const payments = await Payment.find({ status: 'Completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('property', 'title coverImage pricePerNight')
      .populate('guest', 'name email')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        totalProperties,
        totalBookings,
        totalRevenue,
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block status of a user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block administrative accounts' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Verify Host accounts
// @route   PUT /api/admin/users/:id/approve-host
// @access  Private (Admin)
exports.approveHost = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isHostApproved = true;
    user.role = 'host';
    await user.save();

    res.status(200).json({ success: true, user, message: 'Host approved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle property listing approval
// @route   PUT /api/admin/properties/:id/approve
// @access  Private (Admin)
exports.toggleApproveProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.isApproved = !property.isApproved;
    await property.save();

    res.status(200).json({
      success: true,
      property,
      message: `Listing ${property.isApproved ? 'approved' : 'suspended'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};
