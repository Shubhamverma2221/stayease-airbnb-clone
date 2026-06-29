import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearError } from '../redux/authSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, Mail, Lock, Phone, Eye, EyeOff, Globe } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Verification Channel Selection States
  const [selectChannel, setSelectChannel] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(''); // 'email' | 'sms'
  
  const [require2FA, setRequire2FA] = useState(false);
  const [otp, setOtp] = useState('');

  // Password Recovery States
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Visual Password Toggles & Google Sign In States
  const [showPassword, setShowPassword] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Resend Countdown Timers
  const [loginResendTimer, setLoginResendTimer] = useState(0);
  const [recoveryResendTimer, setRecoveryResendTimer] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, loading } = useSelector((state) => state.auth);

  // Login Verification Timer
  useEffect(() => {
    let interval;
    if (loginResendTimer > 0) {
      interval = setInterval(() => {
        setLoginResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginResendTimer]);

  // Recovery Verification Timer
  useEffect(() => {
    let interval;
    if (recoveryResendTimer > 0) {
      interval = setInterval(() => {
        setRecoveryResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recoveryResendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/login', { emailOrPhone, password });
      
      if (res.data.selectChannel) {
        setUserEmail(res.data.email || '');
        setUserPhone(res.data.phoneNumber || '');
        setSelectChannel(true);
        dispatch(clearError());
      } else if (res.data.require2FA) {
        setSelectedChannel(res.data.channel || (emailOrPhone.includes('@') ? 'email' : 'sms'));
        setRequire2FA(true);
        setLoginResendTimer(30); // Start countdown
        dispatch(clearError());
      } else {
        dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
        navigate('/');
      }
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Login failed'));
    }
  };

  const handleSendChannelOTP = async (channel) => {
    dispatch(authStart());
    try {
      await axios.post('/api/auth/login', { emailOrPhone, password, channel });
      setSelectedChannel(channel);
      setSelectChannel(false);
      setRequire2FA(true);
      setLoginResendTimer(30); // Start countdown
      dispatch(clearError());
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Failed to dispatch verification code'));
    }
  };

  const handleResendLoginOTP = async () => {
    if (loginResendTimer > 0) return;
    dispatch(authStart());
    try {
      await axios.post('/api/auth/login', { emailOrPhone, password, channel: selectedChannel });
      setLoginResendTimer(30); // Reset timer
      dispatch(clearError());
      alert(`A new verification code has been resent to your ${selectedChannel === 'sms' ? 'phone number' : 'email'}.`);
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Failed to resend verification code'));
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const payload = { otp };
      if (emailOrPhone.includes('@')) {
        payload.email = emailOrPhone;
      } else {
        payload.phoneNumber = emailOrPhone;
      }
      const res = await axios.post('/api/auth/verify-2fa', payload);
      dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
      navigate('/');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Invalid verification code'));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const payload = {};
      if (forgotIdentifier.includes('@')) {
        payload.email = forgotIdentifier;
      } else {
        payload.phoneNumber = forgotIdentifier;
      }
      await axios.post('/api/auth/forgot-password', payload);
      setViewMode('reset');
      setRecoveryResendTimer(30); // Start recovery timer
      dispatch(clearError());
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Password recovery request failed'));
    }
  };

  const handleResendRecoveryOTP = async () => {
    if (recoveryResendTimer > 0) return;
    dispatch(authStart());
    try {
      const payload = {};
      if (forgotIdentifier.includes('@')) {
        payload.email = forgotIdentifier;
      } else {
        payload.phoneNumber = forgotIdentifier;
      }
      await axios.post('/api/auth/forgot-password', payload);
      setRecoveryResendTimer(30); // Reset timer
      dispatch(clearError());
      alert('A new password reset code has been resent.');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Failed to resend code'));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const payload = { otp: resetOtp, newPassword };
      if (forgotIdentifier.includes('@')) {
        payload.email = forgotIdentifier;
      } else {
        payload.phoneNumber = forgotIdentifier;
      }
      await axios.post('/api/auth/reset-password', payload);
      setViewMode('login');
      setEmailOrPhone(forgotIdentifier);
      setForgotIdentifier('');
      setResetOtp('');
      setNewPassword('');
      dispatch(clearError());
      alert('Password reset successfully! Please sign in with your new password.');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Invalid or expired reset code'));
    }
  };

  const handleGoogleLogin = async (selectedEmail, displayName) => {
    dispatch(authStart());
    setShowGooglePicker(false);
    try {
      const res = await axios.post('/api/auth/google-login', {
        email: selectedEmail,
        name: displayName || selectedEmail.split('@')[0],
      });
      dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
      navigate('/');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Google authentication failed'));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-6 bg-gradient-to-tr from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 relative">
        
        {/* Google Account Picker Popup Overlay */}
        {showGooglePicker && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 text-center space-y-5 animate-scale-in">
              <div className="flex flex-col items-center space-y-2">
                <svg className="h-9 w-9" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.78 0 3.38.61 4.64 1.82l3.46-3.46C17.99 1.19 15.15 0 12 0 7.31 0 3.3 2.69 1.34 6.61l4.08 3.16C6.39 6.84 8.97 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.42 14.77c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.34 6.99C.49 8.7.01 10.6.01 12.6s.48 3.9 1.33 5.61l4.08-3.44z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.03 0-5.61-1.8-6.52-4.73L1.7 18.02C3.66 21.31 7.68 24 12 24z"
                  />
                </svg>
                <h3 className="text-base font-black text-neutral-900 dark:text-white">Sign in with Google</h3>
                <p className="text-[11px] text-neutral-500 font-semibold">Choose an account to continue to StayEase</p>
              </div>

              <div className="space-y-2 text-left">
                <button
                  onClick={() => handleGoogleLogin('shubhamshivi2004@gmail.com', 'Shubham')}
                  className="w-full flex items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 transition"
                >
                  <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand uppercase">
                    S
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Shubham</p>
                    <p className="text-[10px] text-neutral-500 font-medium">shubhamshivi2004@gmail.com</p>
                  </div>
                </button>

                {showCustomGoogleInput ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customGoogleEmail) handleGoogleLogin(customGoogleEmail);
                    }}
                    className="p-3 border border-dashed rounded-xl dark:border-neutral-800 space-y-2 animate-fade-in"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter Google Email Address"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 py-1.5 px-3 text-xs outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-brand py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                    >
                      Verify and Continue
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCustomGoogleInput(true)}
                    className="w-full flex items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 transition"
                  >
                    <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 dark:bg-neutral-800">
                      +
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Use another account</p>
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setShowGooglePicker(false);
                  setShowCustomGoogleInput(false);
                  setCustomGoogleEmail('');
                }}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl ios-glass animate-fade-in">
          
          <h2 className="text-2xl font-black text-neutral-950 dark:text-white text-center">
            {selectChannel
              ? 'Select Verification Target'
              : require2FA
              ? 'Verification Code Required'
              : viewMode === 'forgot'
              ? 'Password Recovery'
              : viewMode === 'reset'
              ? 'Set New Password'
              : 'Log in to StayEase'}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-semibold text-center">
            {selectChannel
              ? 'Choose where you want to receive your login verification code.'
              : require2FA
              ? 'Please enter the 6-digit login verification OTP sent to your registered target.'
              : viewMode === 'forgot'
              ? 'Enter your registered email or phone number to retrieve your password.'
              : viewMode === 'reset'
              ? 'Enter the 6-digit verification code sent to your registered target.'
              : 'Welcome back! Please sign in to continue.'}
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {selectChannel ? (
            /* Multi-Channel OTP Selector View */
            <div className="mt-6 space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSendChannelOTP('email')}
                className="w-full flex items-center justify-between rounded-2xl border border-neutral-200/80 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Verify via Email</h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">{userEmail}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-brand/5 border border-brand/15 text-brand font-black tracking-wider uppercase px-2 py-1 rounded-lg">Send</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSendChannelOTP('sms')}
                className="w-full flex items-center justify-between rounded-2xl border border-neutral-200/80 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Verify via Mobile SMS</h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">{userPhone}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-600/5 border border-blue-600/15 text-blue-600 font-black tracking-wider uppercase px-2 py-1 rounded-lg">Send</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectChannel(false);
                  dispatch(clearError());
                }}
                className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 transition py-1 mt-2"
              >
                Cancel
              </button>
            </div>
          ) : require2FA ? (
            /* 2FA Form */
            <form onSubmit={handleVerify2FA} className="mt-6 space-y-5">
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

              {/* Resend Login OTP Trigger */}
              <div className="text-center">
                {loginResendTimer > 0 ? (
                  <p className="text-[11px] text-neutral-450 font-bold">
                    Resend code in <span className="font-mono text-brand font-black">{loginResendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendLoginOTP}
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
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark hover:scale-101 active:scale-99 shadow-md duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify and Log In'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setRequire2FA(false);
                    setOtp('');
                    dispatch(clearError());
                  }}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 transition py-1"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : viewMode === 'forgot' ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="mt-6 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Email or Phone Number
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="name@example.com or +919999999999"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark shadow-md duration-200"
                >
                  {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setForgotIdentifier('');
                    dispatch(clearError());
                  }}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 transition py-1"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          ) : viewMode === 'reset' ? (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 123456"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 mt-1 py-3 text-center font-mono font-extrabold text-lg tracking-widest outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              {/* Resend Password Recovery OTP Code */}
              <div className="text-center">
                {recoveryResendTimer > 0 ? (
                  <p className="text-[11px] text-neutral-450 font-bold">
                    Resend code in <span className="font-mono text-brand font-black">{recoveryResendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendRecoveryOTP}
                    className="text-[11px] text-brand hover:underline font-bold transition"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark shadow-md duration-200"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setForgotIdentifier('');
                    setResetOtp('');
                    setNewPassword('');
                    dispatch(clearError());
                  }}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 transition py-1"
                >
                  Cancel and Log In
                </button>
              </div>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Email or Mobile Number
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="name@example.com or +919999999999"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
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
                    placeholder="••••••••"
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
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      dispatch(clearError());
                    }}
                    className="text-[11px] font-bold text-neutral-400 hover:text-brand hover:underline transition-colors dark:text-neutral-550 dark:hover:text-brand-light"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="absolute bg-white px-3 text-[10px] font-black uppercase text-neutral-450 dark:bg-neutral-900 tracking-widest">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGooglePicker(true)}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800 transition shadow-sm hover:shadow active:scale-99 duration-150"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.78 0 3.38.61 4.64 1.82l3.46-3.46C17.99 1.19 15.15 0 12 0 7.31 0 3.3 2.69 1.34 6.61l4.08 3.16C6.39 6.84 8.97 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.42 14.77c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.34 6.99C.49 8.7.01 10.6.01 12.6s.48 3.9 1.33 5.61l4.08-3.44z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.03 0-5.61-1.8-6.52-4.73L1.7 18.02C3.66 21.31 7.68 24 12 24z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

            </form>
          )}

          <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-bold text-neutral-900 dark:text-white hover:underline">
              Sign up
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
