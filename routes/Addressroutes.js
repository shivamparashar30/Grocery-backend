const express = require('express');
const {
  getAddresses,
  getAddress,
  getDefaultAddress,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getAddressesByPincode,
} = require('../controllers/addressController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Private routes
router.get('/', protect, getAddresses);
router.get('/default', protect, getDefaultAddress);
router.post('/', protect, createAddress);
router.get('/:id', protect, getAddress);
router.put('/:id', protect, updateAddress);
router.put('/:id/default', protect, setDefaultAddress);
router.delete('/:id', protect, deleteAddress);

// Admin routes
router.get('/pincode/:pincode', protect, authorize('admin'), getAddressesByPincode);

module.exports = router;