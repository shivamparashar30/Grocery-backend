const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all payments (Admin)
// @route   GET /api/v1/payments
// @access  Private/Admin
exports.getPayments = asyncHandler(async (req, res, next) => {
  const { status, paymentMethod } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  const payments = await Payment.find(query)
    .populate('order', 'orderItems totalPrice')
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order', 'orderItems totalPrice')
    .populate('user', 'name email phone');

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  // Make sure payment belongs to user or user is admin
  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this payment', 401));
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Get payment by order ID
// @route   GET /api/v1/payments/order/:orderId
// @access  Private
exports.getPaymentByOrder = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findOne({ order: req.params.orderId }).populate(
    'order',
    'orderItems totalPrice'
  );

  if (!payment) {
    return next(
      new ErrorResponse(`Payment not found for order ${req.params.orderId}`, 404)
    );
  }

  // Make sure payment belongs to user or user is admin
  if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this payment', 401));
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Get user's payment history
// @route   GET /api/v1/payments/my-payments
// @access  Private
exports.getMyPayments = asyncHandler(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate('order', 'orderItems totalPrice status')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// @desc    Create payment
// @route   POST /api/v1/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { orderId, paymentMethod, paymentGateway, amount } = req.body;

  // Check if order exists
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${orderId}`, 404));
  }

  // Make sure order belongs to user
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to create payment for this order', 401));
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({ order: orderId });
  if (existingPayment) {
    return next(new ErrorResponse('Payment already exists for this order', 400));
  }

  const payment = await Payment.create({
    order: orderId,
    user: req.user.id,
    paymentMethod,
    paymentGateway,
    amount,
    status: paymentMethod === 'cash' ? 'pending' : 'processing',
  });

  res.status(201).json({
    success: true,
    data: payment,
  });
});

// @desc    Update payment to success (Webhook/Admin)
// @route   PUT /api/v1/payments/:id/success
// @access  Private
exports.updatePaymentSuccess = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  await payment.markAsSuccess(req.body.gatewayResponse);

  // Update order payment status
  const order = await Order.findById(payment.order);
  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = req.body.gatewayResponse;
  await order.save();

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Update payment to failed
// @route   PUT /api/v1/payments/:id/failed
// @access  Private
exports.updatePaymentFailed = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  await payment.markAsFailed(reason);

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Process refund
// @route   POST /api/v1/payments/:id/refund
// @access  Private/Admin
exports.processRefund = asyncHandler(async (req, res, next) => {
  const { amount, reason } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  // Check if payment is successful
  if (payment.status !== 'success') {
    return next(new ErrorResponse('Can only refund successful payments', 400));
  }

  // Check if already refunded
  if (payment.refund.status === 'completed') {
    return next(new ErrorResponse('Payment already refunded', 400));
  }

  // Validate refund amount
  if (amount > payment.amount) {
    return next(new ErrorResponse('Refund amount cannot exceed payment amount', 400));
  }

  await payment.processRefund(amount, reason);

  res.status(200).json({
    success: true,
    message: 'Refund request submitted',
    data: payment,
  });
});

// @desc    Update refund status (Admin)
// @route   PUT /api/v1/payments/:id/refund/status
// @access  Private/Admin
exports.updateRefundStatus = asyncHandler(async (req, res, next) => {
  const { status, refundId } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
  }

  payment.refund.status = status;
  if (refundId) {
    payment.refund.refundId = refundId;
  }
  if (status === 'completed') {
    payment.refund.refundDate = new Date();
    payment.status = 'refunded';
  }

  await payment.save();

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Verify payment (Gateway callback)
// @route   POST /api/v1/payments/verify
// @access  Public
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { transactionId, gatewayResponse } = req.body;

  const payment = await Payment.findOne({ transactionId });

  if (!payment) {
    return next(new ErrorResponse('Payment not found', 404));
  }

  // Here you would verify with the payment gateway
  // This is a simplified version
  const isValid = true; // Replace with actual gateway verification

  if (isValid) {
    await payment.markAsSuccess(gatewayResponse);

    // Update order
    const order = await Order.findById(payment.order);
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
    });
  } else {
    await payment.markAsFailed('Payment verification failed');
    res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
});

// @desc    Get payment statistics (Admin)
// @route   GET /api/v1/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const methodStats = await Payment.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const totalPayments = await Payment.countDocuments();
  const successfulPayments = await Payment.countDocuments({ status: 'success' });
  const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      byMethod: methodStats,
      total: totalPayments,
      successful: successfulPayments,
      successRate: successRate.toFixed(2),
    },
  });
});

// @desc    Get payment analytics for date range (Admin)
// @route   GET /api/v1/payments/analytics
// @access  Private/Admin
exports.getPaymentAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const query = {
    status: 'success',
  };

  if (startDate && endDate) {
    query.paymentDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const analytics = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
          day: { $dayOfMonth: '$paymentDate' },
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics,
  });
});