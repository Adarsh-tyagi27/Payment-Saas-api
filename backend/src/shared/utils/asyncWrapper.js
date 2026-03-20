// src/shared/utils/asyncWrapper.js
/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to Express error handler — no try/catch needed
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
