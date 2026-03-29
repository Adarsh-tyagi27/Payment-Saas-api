// src/modules/billing/billing.routes.js
const express = require('express');
const billingController = require('./billing.controller');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.get('/usage', billingController.getUsage);

module.exports = router;
