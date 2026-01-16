const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all inventory (Admin)
// @route   GET /api/v1/inventory
// @access  Private/Admin
exports.getAllInventory = asyncHandler(async (req, res, next) => {
  const { status, store } = req.query;

  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (store) {
    query.store = store;
  }

  const inventory = await Inventory.find(query)
    .populate('product', 'name price images category')
    .populate('store', 'storeName storeCode');

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});

// @desc    Get inventory for a store
// @route   GET /api/v1/inventory/store/:storeId
// @access  Private/Admin
exports.getStoreInventory = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.find({ store: req.params.storeId })
    .populate('product', 'name price images category')
    .sort('-currentStock');

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});

// @desc    Get inventory for a product across all stores
// @route   GET /api/v1/inventory/product/:productId
// @access  Private/Admin
exports.getProductInventory = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.find({ product: req.params.productId })
    .populate('store', 'storeName storeCode address')
    .sort('-currentStock');

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});

// @desc    Get single inventory item
// @route   GET /api/v1/inventory/:id
// @access  Private/Admin
exports.getInventoryItem = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id)
    .populate('product', 'name price images category')
    .populate('store', 'storeName storeCode')
    .populate('stockHistory.performedBy', 'name');

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: inventory,
  });
});

// @desc    Check stock availability
// @route   GET /api/v1/inventory/check-stock
// @access  Public
exports.checkStock = asyncHandler(async (req, res, next) => {
  const { productId, storeId, quantity } = req.query;

  if (!productId || !storeId) {
    return next(new ErrorResponse('Please provide productId and storeId', 400));
  }

  const inventory = await Inventory.findOne({
    product: productId,
    store: storeId,
  });

  if (!inventory) {
    return res.status(200).json({
      success: true,
      available: false,
      message: 'Product not available in this store',
    });
  }

  const requestedQty = parseInt(quantity) || 1;
  const isAvailable = inventory.availableStock >= requestedQty;

  res.status(200).json({
    success: true,
    available: isAvailable,
    availableStock: inventory.availableStock,
    status: inventory.status,
  });
});

// @desc    Create inventory item (Admin)
// @route   POST /api/v1/inventory
// @access  Private/Admin
exports.createInventory = asyncHandler(async (req, res, next) => {
  const { product, store } = req.body;

  // Check if product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Check if store exists
  const storeExists = await Store.findById(store);
  if (!storeExists) {
    return next(new ErrorResponse('Store not found', 404));
  }

  // Check if inventory already exists
  const existingInventory = await Inventory.findOne({ product, store });
  if (existingInventory) {
    return next(new ErrorResponse('Inventory already exists for this product in this store', 400));
  }

  const inventory = await Inventory.create(req.body);

  res.status(201).json({
    success: true,
    data: inventory,
  });
});

// @desc    Update inventory item (Admin)
// @route   PUT /api/v1/inventory/:id
// @access  Private/Admin
exports.updateInventory = asyncHandler(async (req, res, next) => {
  let inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: inventory,
  });
});

// @desc    Delete inventory item (Admin)
// @route   DELETE /api/v1/inventory/:id
// @access  Private/Admin
exports.deleteInventory = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  await inventory.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Inventory deleted successfully',
  });
});

// @desc    Add stock (Admin)
// @route   POST /api/v1/inventory/:id/add-stock
// @access  Private/Admin
exports.addStock = asyncHandler(async (req, res, next) => {
  const { quantity, reason } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  await inventory.addStock(quantity, reason, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Stock added successfully',
    data: inventory,
  });
});

// @desc    Remove stock (Admin)
// @route   POST /api/v1/inventory/:id/remove-stock
// @access  Private/Admin
exports.removeStock = asyncHandler(async (req, res, next) => {
  const { quantity, reason, reference } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  try {
    await inventory.removeStock(quantity, reason, reference, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Stock removed successfully',
      data: inventory,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Reserve stock for order (Admin)
// @route   POST /api/v1/inventory/:id/reserve
// @access  Private/Admin
exports.reserveStock = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  try {
    await inventory.reserveStock(quantity);

    res.status(200).json({
      success: true,
      message: 'Stock reserved successfully',
      data: inventory,
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Release reserved stock (Admin)
// @route   POST /api/v1/inventory/:id/release
// @access  Private/Admin
exports.releaseStock = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  await inventory.releaseStock(quantity);

  res.status(200).json({
    success: true,
    message: 'Reserved stock released',
    data: inventory,
  });
});

// @desc    Get low stock items (Admin)
// @route   GET /api/v1/inventory/low-stock
// @access  Private/Admin
exports.getLowStockItems = asyncHandler(async (req, res, next) => {
  const { storeId } = req.query;

  const query = { status: 'low-stock' };
  if (storeId) {
    query.store = storeId;
  }

  const inventory = await Inventory.find(query)
    .populate('product', 'name price category')
    .populate('store', 'storeName storeCode')
    .sort('currentStock');

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});

// @desc    Get out of stock items (Admin)
// @route   GET /api/v1/inventory/out-of-stock
// @access  Private/Admin
exports.getOutOfStockItems = asyncHandler(async (req, res, next) => {
  const { storeId } = req.query;

  const query = { status: 'out-of-stock' };
  if (storeId) {
    query.store = storeId;
  }

  const inventory = await Inventory.find(query)
    .populate('product', 'name price category')
    .populate('store', 'storeName storeCode');

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});

// @desc    Get items needing reorder (Admin)
// @route   GET /api/v1/inventory/reorder-alerts
// @access  Private/Admin
exports.getReorderAlerts = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.find()
    .populate('product', 'name price category')
    .populate('store', 'storeName storeCode');

  const reorderItems = inventory.filter((item) => item.needsReorder());

  res.status(200).json({
    success: true,
    count: reorderItems.length,
    data: reorderItems,
  });
});

// @desc    Get inventory statistics (Admin)
// @route   GET /api/v1/inventory/stats
// @access  Private/Admin
exports.getInventoryStats = asyncHandler(async (req, res, next) => {
  const { storeId } = req.query;

  const query = storeId ? { store: storeId } : {};

  const stats = await Inventory.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        totalValue: {
          $sum: { $multiply: ['$currentStock', '$costPrice'] },
        },
      },
    },
  ]);

  const totalItems = await Inventory.countDocuments(query);
  const totalStockValue = await Inventory.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      totalItems,
      totalStockValue: totalStockValue[0]?.total || 0,
    },
  });
});

// @desc    Get stock history (Admin)
// @route   GET /api/v1/inventory/:id/history
// @access  Private/Admin
exports.getStockHistory = asyncHandler(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id)
    .populate('stockHistory.performedBy', 'name email')
    .select('product store stockHistory');

  if (!inventory) {
    return next(new ErrorResponse(`Inventory not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    count: inventory.stockHistory.length,
    data: inventory.stockHistory,
  });
});