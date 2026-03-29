// src/modules/billing/billing.controller.js
const billingService = require('./billing.service');
const asyncWrapper = require('../../shared/utils/asyncWrapper');

const getInvoices = asyncWrapper(async (req, res) => {
  const invoices = await billingService.getInvoices(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { invoices },
  });
});

const getInvoiceById = asyncWrapper(async (req, res) => {
  const invoice = await billingService.getInvoiceById(req.user.id, req.params.id);
  res.status(200).json({
    status: 'success',
    data: { invoice },
  });
});

const getUsage = asyncWrapper(async (req, res) => {
  const usage = await billingService.getUsageStats(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { usage },
  });
});

module.exports = {
  getInvoices,
  getInvoiceById,
  getUsage,
};
