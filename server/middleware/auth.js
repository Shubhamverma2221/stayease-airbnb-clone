const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const protect = async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header or HTTP-only cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_123_abc');
    
    // Check if active session exists in DB
    let activeSession = await Session.findOne({ token, user: decoded.id });
    if (!activeSession) {
      try {
        const userAgent = req.headers['user-agent'] || 'Legacy Device';
        let browser = 'Browser';
        const ua = userAgent.toLowerCase();
        if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('edge')) browser = 'Edge';
        
        let os = 'OS';
        if (ua.includes('windows')) os = 'Windows';
        else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
        else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
        else if (ua.includes('android')) os = 'Android';
        
        const device = `${browser} (${os})`;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        activeSession = await Session.create({
          user: decoded.id,
          token,
          device,
          ipAddress
        });
      } catch (err) {
        console.error('Failed to auto-create session:', err.message);
        return res.status(401).json({ success: false, message: 'Session has been revoked or logged out' });
      }
    }

    // Non-blocking update of lastActive timestamp
    activeSession.lastActive = new Date();
    activeSession.save().catch(err => console.error('Session update error:', err));

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
