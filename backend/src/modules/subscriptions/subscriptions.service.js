// src/modules/subscriptions/subscriptions.service.js
const crypto = require('crypto');
const prisma = require('../../config/database');
const razorpay = require('../../config/razorpay');
const AppError = require('../../shared/errors/AppError');

const getMySubscription = async (userId) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!sub) {
    throw new AppError('Subscription not found', 404);
  }
  return sub;
};

const createOrder = async (userId, planId) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.name === 'free') {
    throw new AppError('Cannot purchase the free plan', 400);
  }

  // Create an order in Razorpay
  const options = {
    amount: Number(plan.price), // Amount in paise
    currency: 'INR',
    receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`,
    notes: {
      userId,
      planId,
    },
  };

  const order = await razorpay.orders.create(options);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

const verifyPayment = async (userId, paymentDetails) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = paymentDetails;

  // 1. Verify Payment Signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isVerified = expectedSignature === razorpay_signature;
  if (!isVerified) {
    throw new AppError('Payment signature verification failed', 400);
  }

  // 2. Fetch order details from Razorpay to confirm details
  const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  // 3. Update User's Subscription and Create Invoice in a Database Transaction
  return await prisma.$transaction(async (tx) => {
    // Check if user has an existing subscription
    const existingSub = await tx.subscription.findUnique({ where: { userId } });

    const periodEnd = plan.interval === 'MONTHLY' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    let updatedSubscription;

    if (existingSub) {
      updatedSubscription = await tx.subscription.update({
        where: { userId },
        data: {
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });
    } else {
      updatedSubscription = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Create Invoice record
    await tx.invoice.create({
      data: {
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: plan.price,
        status: 'PAID',
        description: `Subscribed to ${plan.displayName}`,
      },
    });

    return updatedSubscription;
  });
};

const cancelSubscription = async (userId) => {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status === 'FREE') {
    throw new AppError('No active paid subscription to cancel', 400);
  }

  return await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      status: 'CANCELED', // Instantly cancel for simplicity, or keep until end of period
    },
  });
};

module.exports = {
  getMySubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
};
