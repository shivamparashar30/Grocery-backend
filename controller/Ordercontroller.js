const Order = require('../models/Order');
const Cart = require('../models/Cart');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorResponse('No order items', 400));
  }

  const order = await Order.create({
    orderItems,
    user: req.user.id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // Clear user's cart after order
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], totalPrice: 0 }
  );

  res.status(201).json({
    success: true,
    data: order,
  });
});

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price images');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Make sure order belongs to user or user is admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this order', 401));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = req.body;

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    data: updatedOrder,
  });
});

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  order.status = req.body.status;

  if (req.body.status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    data: updatedOrder,
  });
});

// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Make sure order belongs to user
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 401));
  }

  // Can only cancel if not delivered
  if (order.isDelivered) {
    return next(new ErrorResponse('Cannot cancel delivered order', 400));
  }

  order.status = 'cancelled';
  await order.save();

  res.status(200).json({
    success: true,
    data: order,
  });
});