const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlist,
  moveToCart,
  getWishlistStats,
} = require('../controllers/wishlistController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Private routes
router.get('/', protect, getWishlist);
router.post('/:productId', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);
router.delete('/', protect, clearWishlist);
router.get('/check/:productId', protect, checkWishlist);
router.post('/move-to-cart', protect, moveToCart);

// Admin routes
router.get('/stats', protect, authorize('admin'), getWishlistStats);

module.exports = router;