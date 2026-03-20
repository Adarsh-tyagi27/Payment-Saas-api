// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { status: 'fail', message },
    standardHeaders: true,
    legacyHeaders: false,
  });

const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many auth attempts. Please try again after 15 minutes.'
);

const apiLimiter = createLimiter(
  60 * 1000, // 1 minute
  60,
  'Too many requests. Please slow down.'
);

const adminLimiter = createLimiter(
  60 * 1000,
  100,
  'Too many admin requests.'
);

module.exports = { authLimiter, apiLimiter, adminLimiter };
