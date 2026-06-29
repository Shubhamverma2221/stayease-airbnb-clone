import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearError } from '../redux/authSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Mail, Lock, ShieldAlert, Phone, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guest');
  const [showPassword, setShowPassword] = useState(false);

  // Registration verification states
  const [requireVerification, setRequireVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, loading } = useSelector((state) => state.auth);

  // Resend Countdown Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email && !phoneNumber) {
      dispatch(authFailure('Please provide either an email or mobile number to sign up'));
      return;
    }
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/register', { name, email, phoneNumber, password, role });
      if (res.data.requireVerification) {
        setRequireVerification(true);
        setResendTimer(30); // Start 30s countdown
        dispatch(clearError());
      } else {
        dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
        navigate('/');
      }
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Registration failed'));
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    dispatch(authStart());
    try {
      const payload = {};
      if (email) {
        payload.email = email;
      } else if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }
      await axios.post('/api/auth/resend-signup-otp', payload);
      setResendTimer(30); // Reset timer
      dispatch(clearError());
      alert('A new verification code has been sent.');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Failed to resend code'));
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const payload = { otp };
      if (email) {
        payload.email = email;
      } else if (phoneNumber) {
        payload.phoneNumber = phoneNumber;
      }
      const res = await axios.post('/api/auth/verify-signup', payload);
      dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
      navigate('/');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Invalid verification code'));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-6 bg-gradient-to-tr from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl ios-glass animate-fade-in">
          
          <h2 className="text-2xl font-black text-neutral-950 dark:text-white text-center">
            {requireVerification ? 'Verify Your Account' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-semibold text-center">
            {requireVerification 
              ? 'Please enter the 6-digit verification code sent to your email or phone.' 
              : 'Join the StayEase community to book and host listings.'}
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {requireVerification ? (
            /* OTP Verification Form */
            <form onSubmit={handleVerifySignup} className="mt-6 space-y-5">
              <div className="text-center">
                <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 py-3.5 text-center font-mono font-extrabold text-xl tracking-widest outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              {/* Resend Countdown Link */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-[11px] text-neutral-450 font-bold">
                    Resend code in <span className="font-mono text-brand font-black">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-[11px] text-brand hover:underline font-bold transition"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  {loading ? 'Verifying...' : 'Verify and Log In'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setRequireVerification(false);
                    setOtp('');
                    dispatch(clearError());
                  }}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 transition py-1"
                >
                  Back to Registration
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Email address (Optional if Mobile provided)
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Mobile Number (Optional if Email provided)
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 9793768977"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-10 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  I want to join as a
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm cursor-pointer"
                >
                  <option value="guest">Guest (Book properties)</option>
                  <option value="host">Host (Rent out properties)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-neutral-900 dark:text-white hover:underline">
              Log in
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
