const express = require('express');
const {
  getPayments,
  getPayment,
  getPaymentByOrder,
  getMyPayments,
  createPayment,
  updatePaymentSuccess,
  updatePaymentFailed,
  processRefund,
  updateRefundStatus,
  verifyPayment,
  getPaymentStats,
  getPaymentAnalytics,
} = require('../controllers/paymentController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/verify', verifyPayment);

// Private routes
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPayment);
router.get('/order/:orderId', protect, getPaymentByOrder);
router.post('/', protect, createPayment);
router.put('/:id/success', protect, updatePaymentSuccess);
router.put('/:id/failed', protect, updatePaymentFailed);

// Admin routes
router.get('/', protect, authorize('admin'), getPayments);
router.post('/:id/refund', protect, authorize('admin'), processRefund);
router.put('/:id/refund/status', protect, authorize('admin'), updateRefundStatus);
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/analytics', protect, authorize('admin'), getPaymentAnalytics);

module.exports = router;