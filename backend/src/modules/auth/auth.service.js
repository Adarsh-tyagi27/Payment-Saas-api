// src/modules/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const AppError = require('../../shared/errors/AppError');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const register = async (email, password) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // We automatically seed a Free Plan when registering the user
  const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      subscription: freePlan ? {
        create: {
          planId: freePlan.id,
          status: 'FREE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far in future for free plan
        }
      } : undefined
    },
    include: {
      subscription: true
    }
  });

  const tokens = generateTokens(user);
  
  // Store Refresh Token in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
    ...tokens,
  };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const tokens = generateTokens(user);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
    ...tokens,
  };
};

const refresh = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token is in database and not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { token } });
      }
      throw new AppError('Refresh token expired or invalid', 401);
    }

    const tokens = generateTokens(storedToken.user);

    // Rotate Refresh Token
    await prisma.refreshToken.delete({ where: { token } });
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    });

    return tokens;
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

const logout = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
