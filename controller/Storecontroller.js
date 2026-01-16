const Store = require('../models/Store');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all stores
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = asyncHandler(async (req, res, next) => {
  const { isActive, storeType, city } = req.query;

  const query = {};
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (storeType) {
    query.storeType = storeType;
  }
  
  if (city) {
    query['address.city'] = city;
  }

  const stores = await Store.find(query).sort('storeName');

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

// @desc    Get single store
// @route   GET /api/v1/stores/:id
// @access  Public
exports.getStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Get store by code
// @route   GET /api/v1/stores/code/:storeCode
// @access  Public
exports.getStoreByCode = asyncHandler(async (req, res, next) => {
  const store = await Store.findOne({ storeCode: req.params.storeCode.toUpperCase() });

  if (!store) {
    return next(
      new ErrorResponse(`Store not found with code ${req.params.storeCode}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Check if pincode is serviceable
// @route   GET /api/v1/stores/check-pincode/:pincode
// @access  Public
exports.checkPincode = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({
    isActive: true,
    'serviceableAreas.pincode': req.params.pincode,
  });

  if (stores.length === 0) {
    return res.status(200).json({
      success: true,
      serviceable: false,
      message: 'Sorry, we do not deliver to this pincode yet',
    });
  }

  // Get delivery charges for this pincode
  const deliveryInfo = stores.map((store) => {
    const area = store.serviceableAreas.find(
      (area) => area.pincode === req.params.pincode
    );
    return {
      storeId: store._id,
      storeName: store.storeName,
      deliveryCharge: area.deliveryCharge,
      minOrderAmount: area.minOrderAmount,
    };
  });

  res.status(200).json({
    success: true,
    serviceable: true,
    count: stores.length,
    data: deliveryInfo,
  });
});

// @desc    Get stores by location (nearest)
// @route   GET /api/v1/stores/nearby
// @access  Public
exports.getNearbyStores = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, maxDistance = 10 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }

  const stores = await Store.find({
    isActive: true,
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: maxDistance * 1000, // Convert km to meters
      },
    },
  });

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

// @desc    Create store (Admin)
// @route   POST /api/v1/stores
// @access  Private/Admin
exports.createStore = asyncHandler(async (req, res, next) => {
  const store = await Store.create(req.body);

  res.status(201).json({
    success: true,
    data: store,
  });
});

// @desc    Update store (Admin)
// @route   PUT /api/v1/stores/:id
// @access  Private/Admin
exports.updateStore = asyncHandler(async (req, res, next) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Delete store (Admin)
// @route   DELETE /api/v1/stores/:id
// @access  Private/Admin
exports.deleteStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  await store.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Store deleted successfully',
  });
});

// @desc    Toggle store active status (Admin)
// @route   PUT /api/v1/stores/:id/toggle
// @access  Private/Admin
exports.toggleStoreStatus = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  store.isActive = !store.isActive;
  await store.save();

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Temporarily close store (Admin)
// @route   PUT /api/v1/stores/:id/close
// @access  Private/Admin
exports.closeStore = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  store.temporarilyClosed = true;
  store.closureReason = reason;
  await store.save();

  res.status(200).json({
    success: true,
    message: 'Store temporarily closed',
    data: store,
  });
});

// @desc    Reopen store (Admin)
// @route   PUT /api/v1/stores/:id/reopen
// @access  Private/Admin
exports.reopenStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  store.temporarilyClosed = false;
  store.closureReason = undefined;
  await store.save();

  res.status(200).json({
    success: true,
    message: 'Store reopened',
    data: store,
  });
});

// @desc    Add serviceable area (Admin)
// @route   POST /api/v1/stores/:id/serviceable-areas
// @access  Private/Admin
exports.addServiceableArea = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  // Check if pincode already exists
  const exists = store.serviceableAreas.find(
    (area) => area.pincode === req.body.pincode
  );

  if (exists) {
    return next(new ErrorResponse('Pincode already in serviceable areas', 400));
  }

  store.serviceableAreas.push(req.body);
  await store.save();

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Remove serviceable area (Admin)
// @route   DELETE /api/v1/stores/:id/serviceable-areas/:pincode
// @access  Private/Admin
exports.removeServiceableArea = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  store.serviceableAreas = store.serviceableAreas.filter(
    (area) => area.pincode !== req.params.pincode
  );

  await store.save();

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Check if store is open now
// @route   GET /api/v1/stores/:id/is-open
// @access  Public
exports.checkIfOpen = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  const isOpen = store.isOpenNow();

  res.status(200).json({
    success: true,
    isOpen,
    storeName: store.storeName,
  });
});

// @desc    Get store statistics (Admin)
// @route   GET /api/v1/stores/:id/stats
// @access  Private/Admin
exports.getStoreStats = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }

  const stats = {
    storeName: store.storeName,
    totalOrders: store.totalOrders,
    rating: store.rating,
    serviceableAreas: store.serviceableAreas.length,
    isActive: store.isActive,
    temporarilyClosed: store.temporarilyClosed,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});