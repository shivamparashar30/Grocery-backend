const express = require('express');
const {
  getDeliveries,
  getDelivery,
  getDeliveryByOrder,
  trackDelivery,
  createDelivery,
  updateDeliveryStatus,
  updateLocation,
  assignDeliveryBoy,
  updateProofOfDelivery,
  rateDelivery,
  getDeliveryStats,
} = require('../controllers/deliveryController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/track/:trackingNumber', trackDelivery);

// Private routes
router.get('/:id', protect, getDelivery);
router.get('/order/:orderId', protect, getDeliveryByOrder);
router.put('/:id/rate', protect, rateDelivery);

// Admin routes
router.get('/', protect, authorize('admin'), getDeliveries);
router.post('/', protect, authorize('admin'), createDelivery);
router.put('/:id/status', protect, authorize('admin'), updateDeliveryStatus);
router.put('/:id/location', protect, authorize('admin'), updateLocation);
router.put('/:id/assign', protect, authorize('admin'), assignDeliveryBoy);
router.put('/:id/proof', protect, authorize('admin'), updateProofOfDelivery);
router.get('/stats', protect, authorize('admin'), getDeliveryStats);

module.exports = router;