const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  becomeHost,
  verify2FA,
  setup2FA,
  confirm2FA,
  googleLogin,
  verifySignup,
  resendSignupOTP,
  getSessions,
  revokeSession,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/multer');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-signup', verifySignup);
router.post('/resend-signup-otp', resendSignupOTP);
router.post('/verify-2fa', verify2FA);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/become-host', protect, becomeHost);

router.post('/setup-2fa', protect, setup2FA);
router.post('/confirm-2fa', protect, confirm2FA);

router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);

// Support profile photo uploads
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);

module.exports = router;
