// src/modules/subscriptions/subscriptions.controller.js
const subscriptionService = require('./subscriptions.service');
const asyncWrapper = require('../../shared/utils/asyncWrapper');

const getMySubscription = asyncWrapper(async (req, res) => {
  const subscription = await subscriptionService.getMySubscription(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { subscription },
  });
});

const createOrder = asyncWrapper(async (req, res) => {
  const { planId } = req.body;
  const orderDetails = await subscriptionService.createOrder(req.user.id, planId);
  res.status(200).json({
    status: 'success',
    data: orderDetails,
  });
});

const verifyPayment = asyncWrapper(async (req, res) => {
  const subscription = await subscriptionService.verifyPayment(req.user.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { subscription },
  });
});

const cancelSubscription = asyncWrapper(async (req, res) => {
  const subscription = await subscriptionService.cancelSubscription(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { subscription },
  });
});

module.exports = {
  getMySubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
};
