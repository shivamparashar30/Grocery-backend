const express = require('express');
const {
  getBanners,
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  trackClick,
  trackImpression,
  toggleActive,
  getBannerAnalytics,
  getTopBanners,
} = require('../controllers/bannerController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getBanners);
router.get('/:id', getBanner);
router.post('/:id/click', trackClick);
router.post('/:id/impression', trackImpression);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllBanners);
router.post('/', protect, authorize('admin'), createBanner);
router.put('/:id', protect, authorize('admin'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);
router.put('/:id/toggle', protect, authorize('admin'), toggleActive);
router.get('/:id/analytics', protect, authorize('admin'), getBannerAnalytics);
router.get('/analytics/top', protect, authorize('admin'), getTopBanners);

module.exports = router;