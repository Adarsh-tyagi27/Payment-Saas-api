// src/modules/subscriptions/subscriptions.routes.js
const express = require('express');
const subscriptionsController = require('./subscriptions.controller');
const authenticate = require('../../middlewares/authenticate');
const validateRequest = require('../../middlewares/validateRequest');
const Joi = require('joi');

const router = express.Router();

const orderSchema = Joi.object({
  planId: Joi.string().required(),
});

const verifySchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  planId: Joi.string().required(),
});

router.use(authenticate); // Secure all endpoints in this router

router.get('/me', subscriptionsController.getMySubscription);
router.post('/create-order', validateRequest(orderSchema), subscriptionsController.createOrder);
router.post('/verify-payment', validateRequest(verifySchema), subscriptionsController.verifyPayment);
router.post('/cancel', subscriptionsController.cancelSubscription);

module.exports = router;
