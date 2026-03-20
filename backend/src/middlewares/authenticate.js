// src/middlewares/authenticate.js
const jwt = require('jsonwebtoken');
const AppError = require('../shared/errors/AppError');
const prisma = require('../config/database');
const asyncWrapper = require('../shared/utils/asyncWrapper');

const authenticate = asyncWrapper(async (req, res, next) => {
  // 1) Check token exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];

  // 2) Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return next(new AppError('User no longer exists.', 401));
  }

  // 4) Attach user to request
  req.user = user;
  next();
});

module.exports = authenticate;
