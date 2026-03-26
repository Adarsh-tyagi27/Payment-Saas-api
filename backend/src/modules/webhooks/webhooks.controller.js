// src/modules/webhooks/webhooks.controller.js
const crypto = require('crypto');
const prisma = require('../../config/database');
const AppError = require('../../shared/errors/AppError');
const { checkIdempotency, saveIdempotency } = require('../../shared/utils/idempotency');

const verifyWebhookSignature = (rawBody, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return next(new AppError('Missing signature header', 400));
    }

    const rawBody = req.body.toString('utf8');
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return next(new AppError('Invalid webhook signature', 400));
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.created_at + '_' + (payload.contains?.[0] || 'event');

    // Webhook Idempotency Check
    const cached = await checkIdempotency(eventId);
    if (cached) {
      return res.status(200).json({ received: true, duplicated: true });
    }

    // Process Razorpay events
    const event = payload.event;
    console.log(`🔌 Received Razorpay Webhook: ${event}`);

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payload.payment.entity);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.payload.subscription.entity);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    await saveIdempotency(eventId, { success: true }, 200);
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Handlers inside controller for ease of reference
const handlePaymentCaptured = async (payment) => {
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const amount = payment.amount;

  console.log(`✅ Webhook: Payment captured ${paymentId} for Order ${orderId}`);

  // Ensure Invoice table is synced
  const invoice = await prisma.invoice.findUnique({
    where: { razorpayPaymentId: paymentId }
  });

  if (!invoice) {
    // If client tab was closed before verify-payment route ran, Webhook handles it gracefully
    const userId = payment.notes?.userId;
    const planId = payment.notes?.planId;

    if (userId && planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      const periodEnd = plan.interval === 'MONTHLY' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { userId },
          update: {
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
          create: {
            userId,
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          }
        }),
        prisma.invoice.create({
          data: {
            userId,
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            amount: amount,
            status: 'PAID',
            description: `Subscribed to ${plan.displayName} (via Webhook fallback)`,
          }
        })
      ]);
    }
  }
};

const handlePaymentFailed = async (payment) => {
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const userId = payment.notes?.userId;

  console.log(`❌ Webhook: Payment failed ${paymentId} for Order ${orderId}`);

  if (userId) {
    await prisma.invoice.create({
      data: {
        userId,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId || 'N/A',
        amount: payment.amount,
        status: 'FAILED',
        description: `Payment failed for ${payment.description || 'subscription'}`,
      }
    });
  }
};

const handleSubscriptionCancelled = async (razorpaySub) => {
  console.log(`🔌 Webhook: Subscription cancelled on Razorpay: ${razorpaySub.id}`);
  await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: razorpaySub.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    }
  });
};

module.exports = {
  handleRazorpayWebhook,
};
