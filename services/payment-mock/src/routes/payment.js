const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { validateRequest } = require('../middleware/validation');
const { Transaction } = require('../models/Transaction');
const { generateMockResponse } = require('../utils/mockPayment');

const router = express.Router();

// Validation schemas
const processPaymentSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'bank_transfer').required(),
  cardNumber: Joi.string().optional(),
  expiryDate: Joi.string().optional(),
  cvv: Joi.string().optional(),
  cardholderName: Joi.string().optional()
});

const refundPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().optional(),
  reason: Joi.string().optional()
});

// Process payment
router.post('/process', validateRequest(processPaymentSchema), async (req, res, next) => {
  try {
    const { orderId, amount, paymentMethod, cardNumber, expiryDate, cvv, cardholderName } = req.body;

    // Generate mock payment response
    const mockResponse = generateMockResponse({
      orderId,
      amount,
      paymentMethod,
      cardNumber,
      expiryDate,
      cvv,
      cardholderName
    });

    // Create transaction record
    const transaction = await Transaction.create({
      id: uuidv4(),
      orderId,
      amount,
      status: mockResponse.status,
      paymentMethod,
      paymentReference: mockResponse.paymentId,
      failureReason: mockResponse.failureReason,
      processedAt: mockResponse.status === 'success' ? new Date() : null
    });

    res.status(200).json({
      message: 'Payment processed',
      paymentId: transaction.id,
      orderId: transaction.orderId,
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.paymentReference,
      processedAt: transaction.processedAt,
      failureReason: transaction.failureReason
    });
  } catch (error) {
    next(error);
  }
});

// Get payment status
router.get('/status/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const transaction = await Transaction.findById(paymentId);
    if (!transaction) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment with the given ID does not exist'
      });
    }

    res.json({
      paymentId: transaction.id,
      orderId: transaction.orderId,
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.paymentReference,
      processedAt: transaction.processedAt,
      failureReason: transaction.failureReason,
      createdAt: transaction.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Get payments by order
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const transactions = await Transaction.findByOrderId(orderId);

    res.json({
      orderId,
      payments: transactions.map(t => ({
        paymentId: t.id,
        amount: t.amount,
        status: t.status,
        paymentMethod: t.paymentMethod,
        paymentReference: t.paymentReference,
        processedAt: t.processedAt,
        failureReason: t.failureReason,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Refund payment
router.post('/refund', validateRequest(refundPaymentSchema), async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    // Get original transaction
    const originalTransaction = await Transaction.findById(paymentId);
    if (!originalTransaction) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment with the given ID does not exist'
      });
    }

    if (originalTransaction.status !== 'success') {
      return res.status(400).json({
        error: 'Invalid payment status',
        message: 'Only successful payments can be refunded'
      });
    }

    // Generate mock refund response
    const refundAmount = amount || originalTransaction.amount;
    const refundResponse = generateMockResponse({
      orderId: originalTransaction.orderId,
      amount: refundAmount,
      paymentMethod: originalTransaction.paymentMethod,
      isRefund: true
    });

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      id: uuidv4(),
      orderId: originalTransaction.orderId,
      amount: -refundAmount, // Negative amount for refund
      status: refundResponse.status,
      paymentMethod: originalTransaction.paymentMethod,
      paymentReference: refundResponse.paymentId,
      failureReason: refundResponse.failureReason,
      processedAt: refundResponse.status === 'success' ? new Date() : null
    });

    res.status(200).json({
      message: 'Refund processed',
      refundId: refundTransaction.id,
      originalPaymentId: paymentId,
      amount: refundAmount,
      status: refundTransaction.status,
      processedAt: refundTransaction.processedAt,
      failureReason: refundTransaction.failureReason
    });
  } catch (error) {
    next(error);
  }
});

// Get payment statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const stats = await Transaction.getStatistics();

    res.json({
      totalTransactions: stats.totalTransactions,
      successfulTransactions: stats.successfulTransactions,
      failedTransactions: stats.failedTransactions,
      totalAmount: stats.totalAmount,
      averageAmount: stats.averageAmount,
      successRate: stats.successRate
    });
  } catch (error) {
    next(error);
  }
});

// Simulate payment failure (for testing)
router.post('/simulate-failure', (req, res) => {
  const { failureRate = 0.1 } = req.body;
  
  // Update global failure rate for testing
  process.env.MOCK_FAILURE_RATE = failureRate.toString();
  
  res.json({
    message: 'Failure rate updated',
    failureRate: parseFloat(failureRate)
  });
});

module.exports = router;
