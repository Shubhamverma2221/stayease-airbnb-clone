const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const uploadImage = require('../utils/uploadImage');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

const isTwilioConfigured = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  
  return (
    sid && !sid.includes('your_') && !sid.includes('placeholder') &&
    token && !token.includes('your_') && !token.includes('placeholder') &&
    serviceSid && !serviceSid.includes('your_') && !serviceSid.includes('placeholder')
  );
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_jwt_secret_123_abc', {
    expiresIn: '30d',
  });
};

const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return 'Unknown Device';
  const ua = userAgentString.toLowerCase();
  
  let browser = 'Browser';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  let os = 'OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  
  return `${browser} (${os})`;
};

const sendTokenResponse = async (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Parse User Agent details and IP address
  const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
  const device = parseUserAgent(userAgent);
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    await Session.create({
      user: user._id,
      token,
      device,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to create session record:', err.message);
  }

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      bio: user.bio,
      isVerified: user.isVerified,
      superhost: user.superhost,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    },
  });
};

// Light TOTP verification helper
function verifyTOTP(token, secret) {
  if (!secret) return false;
  
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < secret.length; i++) {
    const val = base32chars.indexOf(secret.charAt(i).toUpperCase());
    if (val >= 0) bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  const key = Buffer.from(bytes);

  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  
  for (let delta = -1; delta <= 1; delta++) {
    const currentCounter = counter + delta;
    const buffer = Buffer.alloc(8);
    let tmp = currentCounter;
    for (let i = 7; i >= 0; i--) {
      buffer[i] = tmp & 0xff;
      tmp = tmp >> 8;
    }
    
    const hmac = require('crypto').createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    
    const otpVal = (code % 1e6).toString().padStart(6, '0');
    if (otpVal === token) {
      return true;
    }
  }
  return false;
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide either email or phone number' });
    }

    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      }
    }

    // OTP for verification
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      password,
      role: role || 'guest',
      verificationOTP,
      verificationOTPExpires,
    });

    // Send Welcoming Registration Email + Verification Code
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to StayEase - Account Verification',
          message: `Hello ${user.name},\n\nWelcome to StayEase! Thank you for registering on our platform.\n\nYour account verification code is: ${verificationOTP}.\n\nSafe travels!\nStayEase Team`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #FF385C;">Welcome to StayEase!</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Thank you for creating an account on our platform. We are thrilled to help you explore and book vacation rentals, cabins, beach houses and more worldwide.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; color: #333; margin: 20px 0;">
              Verification Code: ${verificationOTP}
            </div>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
          </div>`
        });
      } catch (err) {
        console.error('Email send failure during registration:', err);
      }
    }
    
    if (user.phoneNumber) {
      if (isTwilioConfigured()) {
        try {
          let formattedNumber = user.phoneNumber.trim();
          if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
            formattedNumber = `+91${formattedNumber}`;
          } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
            formattedNumber = `+${formattedNumber}`;
          }
          console.log(`Sending Twilio Verify Registration OTP to ${formattedNumber}...`);
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: formattedNumber, channel: 'sms' });
        } catch (err) {
          console.error('Twilio Verify Registration OTP failed:', err.message);
        }
      } else {
        console.log(`[MOCK PHONE OTP] Registration OTP for ${user.phoneNumber} is: ${verificationOTP}`);
        try {
          await sendSMS(
            user.phoneNumber,
            `Hello ${user.name}, Welcome to StayEase! Your verification code is: ${verificationOTP}.`
          );
        } catch (err) {
          console.error('SMS send failure during registration:', err);
        }
      }
    }

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: user.email,
      phoneNumber: user.phoneNumber,
      message: 'Account created successfully! A verification code has been sent to complete your registration.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or phone and password' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked' });
    }

    // Determine channel to send verification code
    const hasEmail = !!user.email;
    const hasPhone = !!user.phoneNumber;
    const { channel } = req.body; // 'email' or 'sms'

    if (hasEmail && hasPhone && !channel) {
      return res.status(200).json({
        success: true,
        selectChannel: true,
        email: user.email,
        phoneNumber: user.phoneNumber,
        message: 'Please select a verification channel to continue.',
      });
    }

    const targetChannel = channel || (hasPhone ? 'sms' : 'email');

    // Always require OTP verification for all logins
    const twoFactorOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOTP = twoFactorOTP;
    user.twoFactorOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (targetChannel === 'email' && hasEmail) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'StayEase Login Verification - OTP Code',
          message: `Hello ${user.name},\n\nYour login verification code is: ${twoFactorOTP}.\n\nStayEase Team`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #FF385C;">StayEase Login Verification</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Please enter the following 6-digit verification code to complete your login.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; color: #333; margin: 20px 0;">
              Verification Code: ${twoFactorOTP}
            </div>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
          </div>`
        });
      } catch (err) {
        console.error('2FA Email send failure:', err);
      }
    } else if (targetChannel === 'sms' && hasPhone) {
      if (isTwilioConfigured()) {
        try {
          let formattedNumber = user.phoneNumber.trim();
          if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
            formattedNumber = `+91${formattedNumber}`;
          } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
            formattedNumber = `+${formattedNumber}`;
          }
          console.log(`Sending Twilio Verify Login OTP to ${formattedNumber}...`);
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: formattedNumber, channel: 'sms' });
        } catch (err) {
          console.error('Twilio Verify Login OTP failed:', err.message);
        }
      } else {
        console.log(`[MOCK PHONE OTP] Login OTP for ${user.phoneNumber} is: ${twoFactorOTP}`);
        try {
          await sendSMS(
            user.phoneNumber,
            `StayEase Login Verification: Your verification code is: ${twoFactorOTP}.`
          );
        } catch (err) {
          console.error('2FA SMS send failure:', err);
        }
      }
    }

    return res.status(200).json({
      success: true,
      require2FA: true,
      channel: targetChannel,
      email: user.email,
      phoneNumber: user.phoneNumber,
      message: `A verification code has been sent to your ${targetChannel === 'sms' ? 'phone number' : 'email'} to complete login.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA Code (Google Authenticator)
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res, next) => {
  try {
    const { email, phoneNumber, otp } = req.body;

    const query = {};
    if (email) query.email = email;
    else if (phoneNumber) query.phoneNumber = phoneNumber;
    else return res.status(400).json({ success: false, message: 'User credentials are required' });

    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const verifiedTOTP = verifyTOTP(otp, user.twoFactorSecret);
    const verifiedEmailOTP = user.twoFactorOTP === otp && user.twoFactorOTPExpires > Date.now();
    let verifiedSMSOTP = false;

    if (user.phoneNumber && isTwilioConfigured()) {
      try {
        let formattedNumber = user.phoneNumber.trim();
        if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
          formattedNumber = `+91${formattedNumber}`;
        } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
          formattedNumber = `+${formattedNumber}`;
        }
        
        console.log(`Checking Twilio Verify login OTP for ${formattedNumber}...`);
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks
          .create({ to: formattedNumber, code: otp });
          
        if (verification.status === 'approved') {
          verifiedSMSOTP = true;
        }
      } catch (err) {
        console.error('Twilio login verification check failed:', err.message);
      }
    } else if (user.phoneNumber) {
      // Fallback for mock SMS OTP check
      verifiedSMSOTP = user.twoFactorOTP === otp && user.twoFactorOTPExpires > Date.now();
    }

    if (!verifiedTOTP && !verifiedEmailOTP && !verifiedSMSOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired 2-Factor verification code' });
    }

    // Clear temporary email OTP details
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpires = undefined;
    await user.save();

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Setup 2FA (Generate Secret Key)
// @route   POST /api/auth/setup-2fa
// @access  Private
exports.setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += base32chars[Math.floor(Math.random() * 32)];
    }

    const label = encodeURIComponent(user.email || user.phoneNumber || 'User');
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/StayEase:${label}?secret=${secret}%26issuer=StayEase`;

    res.status(200).json({
      success: true,
      secret,
      qrCodeUrl,
      message: 'TOTP secret generated. Verify code to activate.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm and Enable 2FA
// @route   POST /api/auth/confirm-2fa
// @access  Private
exports.confirm2FA = async (req, res, next) => {
  try {
    const { secret, token } = req.body;
    const user = await User.findById(req.user.id);

    const verified = verifyTOTP(token, secret);
    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.twoFactorSecret = secret;
    user.isTwoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google Authenticator 2-Factor setup successful and enabled.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email (OTP)
// @route   POST /api/auth/verify-email
// @access  Private
exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.verificationOTP || user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification OTP' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = verificationOTP;
    user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Email Verification OTP',
      message: `Your email verification code is: ${verificationOTP}. It expires in 10 minutes.`,
    });

    res.status(200).json({ success: true, message: 'Verification OTP sent to email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;
    let query = {};

    if (email) {
      query = { email: email.toLowerCase() };
    } else if (phoneNumber) {
      query = { phoneNumber };
    } else {
      return res.status(400).json({ success: false, message: 'Please provide either email or phone number' });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: email ? 'No user registered with this email' : 'No user registered with this phone number',
      });
    }

    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = resetOTP;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (email && user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Reset Password OTP',
          message: `Your password reset code is: ${resetOTP}. It expires in 10 minutes.`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #FF385C;">StayEase Password Recovery</h2>
            <p>You requested a password reset. Use the code below to complete verification:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; color: #333; margin: 20px 0;">
              Reset OTP Code: ${resetOTP}
            </div>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
          </div>`,
        });
      } catch (err) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();
        return res.status(500).json({ success: false, message: 'Email could not be sent' });
      }
    } else if (phoneNumber && user.phoneNumber) {
      if (isTwilioConfigured()) {
        try {
          let formattedNumber = phoneNumber.trim();
          if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
            formattedNumber = `+91${formattedNumber}`;
          } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
            formattedNumber = `+${formattedNumber}`;
          }
          console.log(`Sending Twilio Verify OTP to ${formattedNumber}...`);
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: formattedNumber, channel: 'sms' });
        } catch (err) {
          user.resetPasswordOTP = undefined;
          user.resetPasswordOTPExpires = undefined;
          await user.save();
          console.error('Twilio Verify Dispatch Failed:', err.message);
          return res.status(500).json({ success: false, message: 'Twilio Verify OTP could not be sent' });
        }
      } else {
        console.log(`[MOCK PHONE OTP] Forgot Password OTP for ${user.phoneNumber} is: ${resetOTP}`);
        try {
          await sendSMS(
            user.phoneNumber,
            `Your StayEase password reset OTP is: ${resetOTP}. It expires in 10 minutes.`
          );
        } catch (err) {
          user.resetPasswordOTP = undefined;
          user.resetPasswordOTPExpires = undefined;
          await user.save();
          return res.status(500).json({ success: false, message: 'SMS could not be sent' });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: email
        ? 'Password reset OTP sent to email'
        : 'Password reset OTP sent to mobile phone via Twilio Verify',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, phoneNumber, otp, newPassword } = req.body;
    let user;

    if (email) {
      user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: Date.now() },
      });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No user registered with this phone number' });
      }

      if (isTwilioConfigured()) {
        try {
          let formattedNumber = phoneNumber.trim();
          if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
            formattedNumber = `+91${formattedNumber}`;
          } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
            formattedNumber = `+${formattedNumber}`;
          }
          
          console.log(`Checking Twilio Verify OTP for ${formattedNumber}...`);
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: formattedNumber, code: otp });

          if (verification.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
          }
        } catch (err) {
          console.error('Twilio Verify Check failed:', err.message);
          return res.status(400).json({ success: false, message: 'OTP verification failed' });
        }
      } else {
        // Fallback for mock SMS OTP check
        const isMatch = user.resetPasswordOTP === otp && user.resetPasswordOTPExpires > Date.now();
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Please provide email or phone number' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      await Session.deleteOne({ token, user: req.user.id });
    }

    res.status(200).cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    }).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile (Bio, Name, Picture)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, isTwoFactorEnabled } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (isTwoFactorEnabled !== undefined) user.isTwoFactorEnabled = isTwoFactorEnabled;

    if (req.file) {
      const pictureUrl = await uploadImage(req.file);
      user.profilePicture = pictureUrl;
    }

    await user.save();
    res.status(200).json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Become a Host
// @route   POST /api/auth/become-host
// @access  Private
exports.becomeHost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role === 'host' || user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'You are already a Host or Admin' });
    }

    user.role = 'host';
    user.isHostApproved = true; // Auto approve for simplicity
    await user.save();

    res.status(200).json({ success: true, user, message: 'Congratulations! You are now a Host.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Google Sign In / Sign Up
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { email, name, profilePicture } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Register new user directly via Google
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-10), // Random password
        profilePicture: profilePicture || '',
        isVerified: true, // Google emails are pre-verified
      });
    }

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Signup (OTP)
// @route   POST /api/auth/verify-signup
// @access  Public
exports.verifySignup = async (req, res, next) => {
  try {
    const { email, phoneNumber, otp } = req.body;

    const query = {};
    if (email) query.email = email.toLowerCase();
    else if (phoneNumber) query.phoneNumber = phoneNumber;
    else return res.status(400).json({ success: false, message: 'User credentials are required' });

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (phoneNumber && isTwilioConfigured()) {
      try {
        let formattedNumber = phoneNumber.trim();
        if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
          formattedNumber = `+91${formattedNumber}`;
        } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
          formattedNumber = `+${formattedNumber}`;
        }
        
        console.log(`Checking Twilio Verify Registration OTP for ${formattedNumber}...`);
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks
          .create({ to: formattedNumber, code: otp });

        if (verification.status !== 'approved') {
          return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }
      } catch (err) {
        console.error('Twilio Verify Registration Check failed:', err.message);
        return res.status(400).json({ success: false, message: 'OTP verification failed' });
      }
    } else {
      if (!user.verificationOTP || user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    // Send Onboarding/Welcome Email with detailed guides
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to StayEase - Your Premium Travel Journey Begins!',
          message: `Hello ${user.name},\n\nYour account has been verified successfully!\n\nWelcome to StayEase. Here are your account details and platform guides:\n- Support Email: shubhamshivi2004@gmail.com\n- Support Hotline: 9793768977\n\nSafe travels!\nStayEase Team`,
          html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; border-bottom: 2px solid #FF385C; padding-bottom: 20px; margin-bottom: 25px;">
              <h1 style="color: #FF385C; margin: 0; font-size: 28px;">StayEase</h1>
              <p style="color: #777; margin: 5px 0 0 0; font-size: 14px;">Your Premium Travel Ecosystem</p>
            </div>
            
            <h2 style="color: #333; margin-top: 0;">Account Verified Successfully! 🎉</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>We are excited to let you know that your email has been verified. Your StayEase account is now fully active, and you are ready to begin your premium travel journey.</p>
            
            <div style="background-color: #f7f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #FF385C;">
              <h3 style="margin-top: 0; color: #333; font-size: 16px;">🚀 Quick Start Guide</h3>
              <ul style="padding-left: 20px; margin-bottom: 0; color: #555;">
                <li style="margin-bottom: 8px;"><strong>AI Travel Concierge:</strong> Chat with our AI travel chatbot on the homepage to find properties, recommend attractions, or map out custom 3-day trip itineraries.</li>
                <li style="margin-bottom: 8px;"><strong>360° VR Tours:</strong> Inspect any room virtual layout directly on property detail cards at 120 FPS before booking.</li>
                <li style="margin-bottom: 8px;"><strong>Active Security Hub:</strong> Track, audit, or remotely revoke other active login sessions directly from your Profile settings card.</li>
                <li style="margin-bottom: 0;"><strong>Become a Host:</strong> List your own properties, configure availability, and manage dynamic calendar pricing.</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
              <h3 style="margin-top: 0; color: #333; font-size: 16px;">📞 StayEase Support Details</h3>
              <p style="margin: 5px 0; color: #555;">Need help? Our 24/7 client care team is always here for you:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #333; width: 120px;">Email Support:</td>
                  <td style="padding: 5px 0; color: #FF385C;"><a href="mailto:shubhamshivi2004@gmail.com" style="color: #FF385C; text-decoration: none;">shubhamshivi2004@gmail.com</a></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #333;">Hotline Support:</td>
                  <td style="padding: 5px 0; color: #555;"><a href="tel:+919793768977" style="color: #333; text-decoration: none;">+91 9793768977</a></td>
                </tr>
              </table>
            </div>
            
            <p style="margin-top: 30px; margin-bottom: 0; font-size: 14px; color: #888; text-align: center;">
              Thank you for choosing StayEase. We wish you wonderful travels ahead!<br/>
              <strong>StayEase Inc.</strong>
            </p>
          </div>`
        });
      } catch (err) {
        console.error('Welcome onboarding email sending failed:', err.message);
      }
    }

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Signup OTP Code
// @route   POST /api/auth/resend-signup-otp
// @access  Public
exports.resendSignupOTP = async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;
    const query = {};
    if (email) query.email = email.toLowerCase();
    else if (phoneNumber) query.phoneNumber = phoneNumber;
    else return res.status(400).json({ success: false, message: 'User credentials are required' });

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please log in.' });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = verificationOTP;
    user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (user.email && email) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to StayEase - Account Verification',
          message: `Hello ${user.name},\n\nYour account verification code is: ${verificationOTP}.\n\nSafe travels!\nStayEase Team`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #FF385C;">Verify Your Account</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Here is your new account verification code:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center; color: #333; margin: 20px 0;">
              Verification Code: ${verificationOTP}
            </div>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes.</p>
          </div>`
        });
      } catch (err) {
        console.error('Email resend failure during registration:', err);
      }
    }

    if (user.phoneNumber && phoneNumber) {
      if (isTwilioConfigured()) {
        try {
          let formattedNumber = user.phoneNumber.trim();
          if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
            formattedNumber = `+91${formattedNumber}`;
          } else if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('0')) {
            formattedNumber = `+${formattedNumber}`;
          }
          console.log(`Resending Twilio Verify Registration OTP to ${formattedNumber}...`);
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: formattedNumber, channel: 'sms' });
        } catch (err) {
          console.error('Twilio Verify Registration OTP resend failed:', err.message);
        }
      } else {
        console.log(`[MOCK PHONE OTP] Resent Registration OTP for ${user.phoneNumber} is: ${verificationOTP}`);
        try {
          await sendSMS(
            user.phoneNumber,
            `Hello ${user.name}, Your new verification code is: ${verificationOTP}.`
          );
        } catch (err) {
          console.error('SMS resend failure during registration:', err);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Verification OTP code resent successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile details
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      user,
      message: 'Profile details updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    const sessions = await Session.find({ user: req.user.id }).sort({ lastActive: -1 });
    
    // Map sessions and identify the current one
    const mappedSessions = sessions.map(sess => ({
      _id: sess._id,
      device: sess.device,
      ipAddress: sess.ipAddress,
      lastActive: sess.lastActive,
      isCurrent: sess.token === token,
    }));

    res.status(200).json({ success: true, sessions: mappedSessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke/delete an active session (Log out device)
// @route   DELETE /api/auth/sessions/:id
// @access  Private
exports.revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not owned by you' });
    }

    await session.deleteOne();
    res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
};
