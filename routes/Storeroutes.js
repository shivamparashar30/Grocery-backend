const express = require('express');
const {
  getStores,
  getStore,
  getStoreByCode,
  checkPincode,
  getNearbyStores,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus,
  closeStore,
  reopenStore,
  addServiceableArea,
  removeServiceableArea,
  checkIfOpen,
  getStoreStats,
} = require('../controllers/storeController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getStores);
router.get('/nearby', getNearbyStores);
router.get('/check-pincode/:pincode', checkPincode);
router.get('/code/:storeCode', getStoreByCode);
router.get('/:id', getStore);
router.get('/:id/is-open', checkIfOpen);

// Admin routes
router.post('/', protect, authorize('admin'), createStore);
router.put('/:id', protect, authorize('admin'), updateStore);
router.delete('/:id', protect, authorize('admin'), deleteStore);
router.put('/:id/toggle', protect, authorize('admin'), toggleStoreStatus);
router.put('/:id/close', protect, authorize('admin'), closeStore);
router.put('/:id/reopen', protect, authorize('admin'), reopenStore);
router.post('/:id/serviceable-areas', protect, authorize('admin'), addServiceableArea);
router.delete('/:id/serviceable-areas/:pincode', protect, authorize('admin'), removeServiceableArea);
router.get('/:id/stats', protect, authorize('admin'), getStoreStats);

module.exports = router;