const express = require('express');
const {
  getAllInventory,
  getStoreInventory,
  getProductInventory,
  getInventoryItem,
  checkStock,
  createInventory,
  updateInventory,
  deleteInventory,
  addStock,
  removeStock,
  reserveStock,
  releaseStock,
  getLowStockItems,
  getOutOfStockItems,
  getReorderAlerts,
  getInventoryStats,
  getStockHistory,
} = require('../controllers/inventoryController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/check-stock', checkStock);

// Admin routes
router.get('/', protect, authorize('admin'), getAllInventory);
router.get('/store/:storeId', protect, authorize('admin'), getStoreInventory);
router.get('/product/:productId', protect, authorize('admin'), getProductInventory);
router.get('/low-stock', protect, authorize('admin'), getLowStockItems);
router.get('/out-of-stock', protect, authorize('admin'), getOutOfStockItems);
router.get('/reorder-alerts', protect, authorize('admin'), getReorderAlerts);
router.get('/stats', protect, authorize('admin'), getInventoryStats);
router.get('/:id', protect, authorize('admin'), getInventoryItem);
router.get('/:id/history', protect, authorize('admin'), getStockHistory);
router.post('/', protect, authorize('admin'), createInventory);
router.put('/:id', protect, authorize('admin'), updateInventory);
router.delete('/:id', protect, authorize('admin'), deleteInventory);
router.post('/:id/add-stock', protect, authorize('admin'), addStock);
router.post('/:id/remove-stock', protect, authorize('admin'), removeStock);
router.post('/:id/reserve', protect, authorize('admin'), reserveStock);
router.post('/:id/release', protect, authorize('admin'), releaseStock);

module.exports = router;