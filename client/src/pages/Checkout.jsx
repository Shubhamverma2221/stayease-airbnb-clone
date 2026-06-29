import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CreditCard, ShieldCheck, Download, CheckCircle2, X, Lock, Check } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState('Razorpay');

  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Simulated Razorpay Overlay States
  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [mockStep, setMockStep] = useState('card'); // 'card' | 'processing' | 'otp'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [mockError, setMockError] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/bookings/${bookingId}`);
        setBooking(res.data.booking);
      } catch (error) {
        console.error('Error fetching booking details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Load Razorpay Script dynamically for real key integration
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    setPaying(true);
    setMockError('');
    try {
      // 1. Create checkout order on server
      const checkoutRes = await axios.post('/api/payments/checkout', {
        bookingId: booking._id,
        gateway: paymentGateway,
      });

      const { orderId, amount, keyId, isMock, sessionUrl } = checkoutRes.data;

      // --- STRIPE REDIRECT ---
      if (paymentGateway === 'Stripe' && sessionUrl) {
        window.location.href = sessionUrl;
        return;
      }

      // --- RAZORPAY SELECT FLOW ---
      if (paymentGateway === 'Razorpay') {
        if (isMock) {
          // Open simulated Razorpay popup card
          setShowMockRazorpay(true);
          setMockStep('card');
        } else if (window.Razorpay) {
          // Open real Razorpay popup card
          const options = {
            key: keyId,
            amount: amount,
            currency: 'INR',
            name: 'StayEase Payments',
            description: `Booking for ${booking.property.title}`,
            order_id: orderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post('/api/payments/verify', {
                  bookingId: booking._id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });

                if (verifyRes.data.success) {
                  setSuccess(true);
                  setPaymentDetails(verifyRes.data.payment);
                }
              } catch (err) {
                alert('Razorpay Signature verification failed!');
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
            },
            theme: {
              color: '#FF385C',
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Fallback to simulated card if script failed to load
          setShowMockRazorpay(true);
          setMockStep('card');
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  const handleMockCardSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setMockError('Please enter a valid 16-digit card number');
      return;
    }
    setMockStep('processing');
    setTimeout(() => {
      setMockStep('otp');
    }, 1500);
  };

  const handleMockOtpSubmit = async (e) => {
    e.preventDefault();
    if (mockOtp.length !== 6) {
      setMockError('Please enter the 6-digit OTP code');
      return;
    }
    setMockStep('processing');
    try {
      const verifyRes = await axios.post('/api/payments/verify', {
        bookingId: booking._id,
        isMock: true,
      });

      if (verifyRes.data.success) {
        setShowMockRazorpay(false);
        setSuccess(true);
        setPaymentDetails(verifyRes.data.payment);
      }
    } catch (err) {
      setMockError('Verification failed. Please try again.');
      setMockStep('otp');
    }
  };

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-900 justify-between">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-neutral-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between page-fade-in">
      <Navbar />

      <main className="flex-grow px-6 py-10 md:px-12 bg-neutral-50/50 dark:bg-neutral-950/20">
        <div className="mx-auto max-w-4xl relative">
          
          {/* Simulated Razorpay Overlay Modal Card */}
          {showMockRazorpay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-3xl bg-[#0b1626] text-white p-6 shadow-2xl border border-neutral-800 space-y-4 animate-scale-in text-left">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xs text-white">R</span>
                    <div>
                      <h3 className="text-xs font-black tracking-wider uppercase text-neutral-450">Razorpay</h3>
                      <p className="text-[10px] text-neutral-400 font-semibold">Demo Gateway Mode</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMockRazorpay(false)}
                    className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {mockStep === 'card' && (
                  <form onSubmit={handleMockCardSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Payment Amount</p>
                      <p className="text-xl font-black text-white">INR {booking.totalPrice.toLocaleString()}</p>
                    </div>

                    {mockError && (
                      <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-[11px] font-semibold text-red-400 text-center">
                        {mockError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Card Number</label>
                        <input
                          type="text"
                          required
                          placeholder="4111 1111 1111 1111"
                          maxLength="19"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardNumber(val);
                          }}
                          className="w-full rounded-xl border border-neutral-800 bg-[#0e1c31] py-2.5 px-3 text-xs outline-none focus:border-blue-500 text-white placeholder-neutral-600 mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength="5"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 2) {
                                setCardExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
                              } else {
                                setCardExpiry(val);
                              }
                            }}
                            className="w-full rounded-xl border border-neutral-800 bg-[#0e1c31] py-2.5 px-3 text-xs outline-none focus:border-blue-500 text-white placeholder-neutral-600 mt-1 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">CVV Code</label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            maxLength="3"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-xl border border-neutral-800 bg-[#0e1c31] py-2.5 px-3 text-xs outline-none focus:border-blue-500 text-white placeholder-neutral-600 mt-1 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-500 active:scale-99 transition duration-150 mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Pay INR {booking.totalPrice.toLocaleString()}</span>
                    </button>
                  </form>
                )}

                {mockStep === 'processing' && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Contacting Your Bank...</h4>
                      <p className="text-[10px] text-neutral-450 mt-0.5">Please do not refresh or close this tab.</p>
                    </div>
                  </div>
                )}

                {mockStep === 'otp' && (
                  <form onSubmit={handleMockOtpSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Bank Authentication</p>
                      <p className="text-xs text-neutral-350">A 6-digit OTP code has been dispatched to your mobile endpoint ending in 8977.</p>
                    </div>

                    {mockError && (
                      <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-[11px] font-semibold text-red-400 text-center">
                        {mockError}
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block text-center mb-1">Enter 6-Digit OTP</label>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        placeholder="e.g. 123456"
                        value={mockOtp}
                        onChange={(e) => setMockOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border border-neutral-850 bg-[#0e1c31] py-3 text-center text-lg tracking-widest font-mono font-black outline-none focus:border-blue-500 text-white placeholder-neutral-700"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-500 active:scale-99 transition duration-150 flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Verify and Finalize</span>
                    </button>
                  </form>
                )}

              </div>
            </div>
          )}

          {success ? (
            /* Success state displaying downloadable invoice */
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-850 text-center max-w-xl mx-auto space-y-6 animate-scale-in">
              <div className="flex justify-center text-green-500">
                <CheckCircle2 className="h-16 w-16 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-neutral-950 dark:text-white">Stay Booked Successfully!</h2>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Congratulations, your trip is fully reserved. We have sent the confirmation invoice details to your email.
              </p>

              {/* Invoice breakdown block */}
              <div className="border border-dashed border-neutral-200 p-6 rounded-2xl text-left bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50 space-y-3">
                <h4 className="font-black border-b pb-2 text-[10px] uppercase text-neutral-400 tracking-wider">Tax Invoice Receipt</h4>
                <div className="flex justify-between text-xs dark:text-neutral-300">
                  <span>Guest Name:</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex justify-between text-xs dark:text-neutral-300">
                  <span>Listing Title:</span>
                  <span className="font-bold truncate max-w-[200px]">{booking.property?.title}</span>
                </div>
                <div className="flex justify-between text-xs dark:text-neutral-300">
                  <span>Total Amount Paid:</span>
                  <span className="font-black text-brand">INR {booking.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400 pt-2 border-t dark:border-neutral-750">
                  <span>Invoice Ref:</span>
                  <span className="font-mono">{booking.invoiceNumber || 'INV-001'}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex-grow rounded-xl bg-neutral-900 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-grow flex items-center justify-center gap-2 rounded-xl border border-neutral-250 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-white"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>

            </div>
          ) : (
            /* Checkout Billing page */
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              
              {/* Payment selector */}
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Confirm and Pay</h2>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    Select Gateway
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentGateway('Razorpay')}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-5 text-center transition ${
                        paymentGateway === 'Razorpay'
                          ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                          : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-white'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="text-xs font-black uppercase tracking-wider">Razorpay</span>
                    </button>

                    <button
                      onClick={() => setPaymentGateway('Stripe')}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-5 text-center transition ${
                        paymentGateway === 'Stripe'
                          ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                          : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-white'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="text-xs font-black uppercase tracking-wider">Stripe</span>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-6 dark:border-neutral-800 space-y-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">Payment protection guaranteed</h5>
                      <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal">
                        Your transaction details are shielded using top-tier encryption algorithms. Refund options are guaranteed.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full rounded-2xl bg-brand py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-brand-dark shadow-md active:scale-98"
                >
                  {paying ? 'Contacting Merchant Gateway...' : `Pay INR ${booking.totalPrice.toLocaleString()}`}
                </button>
              </div>

              {/* Booking preview summary */}
              <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-850 h-fit space-y-6">
                <div className="flex gap-4">
                  <img
                    src={
                      booking.property?.coverImage?.startsWith('http')
                        ? booking.property.coverImage
                        : `http://localhost:5000${booking.property?.coverImage}`
                    }
                    alt={booking.property?.title}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{booking.property?.category}</span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 mt-0.5">{booking.property?.title}</h3>
                    <p className="text-[10px] font-bold text-neutral-450 uppercase mt-0.5">{booking.property?.address?.city}, {booking.property?.address?.country}</p>
                  </div>
                </div>

                <div className="border-t pt-4 dark:border-neutral-750 space-y-3.5">
                  <h4 className="text-[10px] font-black text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">
                    Price Details
                  </h4>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <span>INR {booking.pricePerNight} x {booking.totalNights} nights</span>
                    <span className="font-bold text-neutral-900 dark:text-white">INR {(booking.pricePerNight * booking.totalNights).toLocaleString()}</span>
                  </div>
                  {booking.cleaningFee > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      <span>Cleaning Fee</span>
                      <span>INR {booking.cleaningFee}</span>
                    </div>
                  )}
                  {booking.serviceFee > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      <span>Service Fee</span>
                      <span>INR {booking.serviceFee}</span>
                    </div>
                  )}
                  {booking.securityDeposit > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      <span>Security Deposit (Refundable)</span>
                      <span>INR {booking.securityDeposit}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <span>Local Occupancy Taxes</span>
                    <span>INR {booking.tax}</span>
                  </div>

                  <div className="flex justify-between border-t pt-4 text-sm font-black text-neutral-900 dark:text-white dark:border-neutral-750">
                    <span>Total (INR)</span>
                    <span className="text-base text-brand">INR {booking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
