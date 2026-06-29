const Razorpay = require('razorpay');
const stripe = require('stripe');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Initialize gateways dynamically
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

let stripeInstance = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
}

// @desc    Initiate payment order (Razorpay or Stripe or Mock)
// @route   POST /api/payments/checkout
// @access  Private
exports.checkoutBooking = async (req, res, next) => {
  try {
    const { bookingId, gateway = 'Razorpay' } = req.body;

    const booking = await Booking.findById(bookingId).populate('property');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Booking has already been paid' });
    }

    // --- GATEWAY: STRIPE ---
    if (gateway === 'Stripe' && stripeInstance) {
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: booking.property.title,
                description: `Stay from ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}`,
              },
              unit_amount: booking.totalPrice * 100, // Stripe expects paise / cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking._id}`,
        cancel_url: `${req.headers.origin}/checkout?bookingId=${booking._id}`,
      });

      booking.paymentGateway = 'Stripe';
      booking.orderId = session.id;
      await booking.save();

      return res.status(200).json({
        success: true,
        gateway: 'Stripe',
        sessionId: session.id,
        sessionUrl: session.url,
      });
    }

    // --- GATEWAY: RAZORPAY ---
    if (gateway === 'Razorpay' && razorpayInstance) {
      const options = {
        amount: booking.totalPrice * 100, // Razorpay expects paise
        currency: 'INR',
        receipt: `receipt_${booking._id}`,
      };

      const order = await razorpayInstance.orders.create(options);

      booking.paymentGateway = 'Razorpay';
      booking.orderId = order.id;
      await booking.save();

      return res.status(200).json({
        success: true,
        gateway: 'Razorpay',
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
      });
    }

    // --- FALLBACK MOCK PAYMENT ---
    // If credentials aren't provided, we trigger a mock order flow
    const mockOrderId = `order_mock_${Date.now()}`;
    booking.paymentGateway = gateway;
    booking.orderId = mockOrderId;
    await booking.save();

    res.status(200).json({
      success: true,
      gateway: `${gateway} (Mock Demo Mode)`,
      orderId: mockOrderId,
      amount: booking.totalPrice * 100,
      isMock: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature / confirm booking
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature, isMock, stripeSessionId } = req.body;

    const booking = await Booking.findById(bookingId).populate('property').populate('guest');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let isSuccess = false;
    let transactionId = '';

    if (isMock) {
      isSuccess = true;
      transactionId = `tx_mock_${Date.now()}`;
    } else if (stripeSessionId && stripeInstance) {
      const session = await stripeInstance.checkout.sessions.retrieve(stripeSessionId);
      if (session.payment_status === 'paid') {
        isSuccess = true;
        transactionId = session.payment_intent;
      }
    } else if (razorpayPaymentId && razorpaySignature && razorpayInstance) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpaySignature) {
        isSuccess = true;
        transactionId = razorpayPaymentId;
      }
    }

    if (!isSuccess) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // 1. Update Booking statuses
    booking.paymentStatus = 'Paid';
    booking.status = 'Confirmed';
    booking.paymentId = transactionId;
    await booking.save();

    // 2. Create Payment Record
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user.id,
      amount: booking.totalPrice,
      currency: 'INR',
      status: 'Completed',
      gateway: booking.paymentGateway,
      transactionId: transactionId,
      orderId: booking.orderId,
    });

    // 3. Add unavailable check dates to property calendar
    const property = await Property.findById(booking.property._id);
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const dateArray = [];
    let current = new Date(start);

    while (current < end) {
      dateArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    property.unavailableDates = [...property.unavailableDates, ...dateArray];
    await property.save();

    // 4. Send Notifications
    // Notification for Guest
    await Notification.create({
      user: booking.guest?._id || booking.guest,
      title: 'Booking Confirmed!',
      message: `Your booking for ${booking.property.title} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()} is confirmed!`,
      type: 'Booking',
    });

    // Notification for Host
    await Notification.create({
      user: property.host,
      title: 'New Booking Reservation',
      message: `You received a booking request from guest for ${booking.property.title}. Payment completed.`,
      type: 'Booking',
    });

    // 5. Send Real Email and SMS confirmation alerts
    if (booking.guest) {
      const guestEmail = booking.guest.email;
      const guestPhone = booking.guest.phoneNumber;
      const guestName = booking.guest.name || 'Guest';

      if (guestEmail) {
        const sendEmail = require('../utils/sendEmail');
        try {
          await sendEmail({
            email: guestEmail,
            subject: `StayEase Booking Confirmed: ${booking.property.title}`,
            message: `Hello ${guestName},\n\nThank you for booking with StayEase!\n\nYour reservation details:\nProperty: ${booking.property.title}\nCheck-in: ${start.toLocaleDateString()}\nCheck-out: ${end.toLocaleDateString()}\nTotal Amount: INR ${booking.totalPrice}\n\nSafe travels!\nStayEase Team`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 15px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px;">
                <h2 style="color: #FF385C; margin: 0; font-size: 24px;">Booking Confirmed! 🎉</h2>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Thank you for booking with StayEase</p>
              </div>
              <div style="padding: 20px 0;">
                <p>Hello <strong>${guestName}</strong>,</p>
                <p>Your reservation payment has been processed successfully. We are excited to host you!</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #eee;">
                  <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">Reservation Summary</h4>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #555;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Property:</td>
                      <td style="padding: 6px 0; text-align: right;">${booking.property.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Check-In Date:</td>
                      <td style="padding: 6px 0; text-align: right; color: #FF385C; font-weight: bold;">${start.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Check-Out Date:</td>
                      <td style="padding: 6px 0; text-align: right; color: #FF385C; font-weight: bold;">${end.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px;">Total Payout:</td>
                      <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #333; font-size: 15px; border-top: 1px solid #ddd; padding-top: 8px;">INR ${booking.totalPrice.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>
                <p style="color: #666; font-size: 12px; line-height: 1.5;">Need to make adjustments? Reach out to support at <strong>shubhamshivi2004@gmail.com</strong> or call us at <strong>9793768977</strong>.</p>
              </div>
              <div style="text-align: center; border-top: 1px solid #e5e5e5; padding-top: 15px; font-size: 11px; color: #999;">
                &copy; 2026 StayEase Inc. · Safe Travels
              </div>
            </div>`
          });
          console.log(`Confirmation email sent successfully to guest ${guestEmail}`);
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr.message);
        }
      }

      if (guestPhone) {
        const sendSMS = require('../utils/sendSMS');
        try {
          await sendSMS(
            guestPhone,
            `Thank you for booking with StayEase! Reservation confirmed for ${booking.property.title}. Check-in: ${start.toLocaleDateString()} to Check-out: ${end.toLocaleDateString()}. Total: INR ${booking.totalPrice.toLocaleString()}. Safe travels!`
          );
          console.log(`Confirmation SMS sent successfully to guest ${guestPhone}`);
        } catch (smsErr) {
          console.error('Failed to send confirmation SMS:', smsErr.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully. Booking confirmed.',
      booking,
      payment,
    });
  } catch (error) {
    next(error);
  }
};
