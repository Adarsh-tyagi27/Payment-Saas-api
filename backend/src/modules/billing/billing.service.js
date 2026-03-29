// src/modules/billing/billing.service.js
const prisma = require('../../config/database');
const AppError = require('../../shared/errors/AppError');

const getInvoices = async (userId) => {
  return await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const getInvoiceById = async (userId, invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  if (invoice.userId !== userId) {
    throw new AppError('Unauthorized access to invoice', 403);
  }
  return invoice;
};

const getUsageStats = async (userId) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    throw new AppError('No subscription details found', 404);
  }

  // Simulating mock API call usage stats for multi-tenant SaaS features
  const limit = sub.plan.features?.api_calls || 100;
  const used = Math.floor(Math.random() * (limit * 0.9)); // Random usage simulation
  
  return {
    planName: sub.plan.displayName,
    limit,
    used,
    percentage: Math.round((used / limit) * 100),
  };
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getUsageStats,
};
