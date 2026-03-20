// src/modules/auth/auth.routes.js
const express = require('express');
const authController = require('./auth.controller');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const { authLimiter } = require('../../middlewares/rateLimiter');
const { registerSchema, loginSchema, refreshSchema } = require('./auth.validation');

const router = express.Router();

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', validateRequest(refreshSchema), authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
