// src/modules/auth/auth.controller.js
const authService = require('./auth.service');
const asyncWrapper = require('../../shared/utils/asyncWrapper');

const register = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.register(email, password);
  
  res.status(201).json({
    status: 'success',
    data: result,
  });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const logout = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const getMe = asyncWrapper(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
