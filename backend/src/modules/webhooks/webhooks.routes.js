// src/modules/webhooks/webhooks.routes.js
const express = require('express');
const webhooksController = require('./webhooks.controller');

const router = express.Router();

// NOTE: We need the raw body of the webhook payload to verify the signature from Razorpay.
// We configure raw body parsing middleware on this route.
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  webhooksController.handleRazorpayWebhook
);

module.exports = router;
