// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./shared/errors/AppError');
const authRoutes = require('./modules/auth/authRoutes'); // Fix module export path if needed, we used auth.routes.js. Let's check imports
const plansRoutes = require('./modules/plans/plans.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');

const app = express();

// 1. Webhook Raw Body Middleware (MUST be registered before general JSON parsing)
app.use('/api/v1/webhooks', webhooksRoutes);

// 2. Global Security and Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
  credentials: true,
}));
app.use(morgan('dev'));

// 3. Regular JSON & URL-encoded request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. API Routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);
app.use('/api/v1/billing', billingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Fallback for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
