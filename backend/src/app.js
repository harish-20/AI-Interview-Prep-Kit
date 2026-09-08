const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const kitRoutes = require('./routes/kit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection middleware for production / serverless requests
app.use(async (req, res, next) => {
  // Skip DB connection check for health check route
  if (req.path === '/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);

// Catch-all 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
