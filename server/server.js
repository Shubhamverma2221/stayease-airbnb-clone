// Restart Trigger: Profile routes initialized
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = async () => {
  const db = require('./config/db');
  await db();
};

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Enable rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // necessary for displaying uploaded local images in development
}));

// Configure CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(limiter);

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Serve static client assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  // Basic health check in development
  app.get('/', (req, res) => {
    res.send('StayEase API running successfully...');
  });
}

// Centralized error handler
app.use(errorHandler);

// Setup Socket.io
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // User joins their specific booking chat room
  socket.on('join_booking_chat', ({ bookingId }) => {
    socket.join(bookingId);
    console.log(`Socket ${socket.id} joined room: ${bookingId}`);
  });

  // Handle message transfer
  socket.on('send_booking_message', ({ bookingId, sender, message }) => {
    const messagePayload = {
      sender,
      message,
      timestamp: new Date(),
    };
    // Broadcast to room members including sender (or everyone in the room)
    io.to(bookingId).emit('receive_booking_message', messagePayload);
    console.log(`Msg in room ${bookingId}: ${sender.name} - ${message}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Database connection & Server kickoff
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});

// Trigger Nodemon Reload

