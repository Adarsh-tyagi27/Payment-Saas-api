// src/middlewares/authorize.js
const AppError = require('../shared/errors/AppError');

/**
 * Role-based access control middleware
 * Usage: authorize('ADMIN') or authorize('USER', 'ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = authorize;
