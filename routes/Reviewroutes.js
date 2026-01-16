const express = require('express');
const {
  getAllReviews,
  getProductReviews,
  getDeliveryReviews,
  getStoreReviews,
  getMyReviews,
  getReview,
  createProductReview,
  createDeliveryReview,
  updateReview,
  deleteReview,
  markHelpful,
  markNotHelpful,
  addAdminResponse,
  approveReview,
  rejectReview,
  featureReview,
  reportReview,
  getReviewStats,
} = require('../controllers/reviewController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/store/:storeId', getStoreReviews);
router.get('/:id', getReview);

// Private routes
router.get('/my-reviews', protect, getMyReviews);
router.post('/product/:productId', protect, createProductReview);
router.post('/delivery/:deliveryId', protect, createDeliveryReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markHelpful);
router.put('/:id/not-helpful', protect, markNotHelpful);
router.put('/:id/report', protect, reportReview);

// Admin routes
router.get('/', protect, authorize('admin'), getAllReviews);
router.get('/delivery/:deliveryId', protect, authorize('admin'), getDeliveryReviews);
router.post('/:id/response', protect, authorize('admin'), addAdminResponse);
router.put('/:id/approve', protect, authorize('admin'), approveReview);
router.put('/:id/reject', protect, authorize('admin'), rejectReview);
router.put('/:id/feature', protect, authorize('admin'), featureReview);
router.get('/stats', protect, authorize('admin'), getReviewStats);

module.exports = router;