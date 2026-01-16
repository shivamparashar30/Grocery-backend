const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all deliveries (Admin)
// @route   GET /api/v1/deliveries
// @access  Private/Admin
exports.getDeliveries = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const deliveries = await Delivery.find(query)
    .populate('order', 'orderItems totalPrice user')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: deliveries.length,
    data: deliveries,
  });
});

// @desc    Get single delivery
// @route   GET /api/v1/deliveries/:id
// @access  Private
exports.getDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findById(req.params.id).populate({
    path: 'order',
    select: 'orderItems totalPrice shippingAddress user',
    populate: {
      path: 'user',
      select: 'name email phone',
    },
  });

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Get delivery by order ID
// @route   GET /api/v1/deliveries/order/:orderId
// @access  Private
exports.getDeliveryByOrder = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ order: req.params.orderId }).populate(
    'order',
    'orderItems totalPrice shippingAddress'
  );

  if (!delivery) {
    return next(
      new ErrorResponse(`Delivery not found for order ${req.params.orderId}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Track delivery by tracking number
// @route   GET /api/v1/deliveries/track/:trackingNumber
// @access  Public
exports.trackDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({
    trackingNumber: req.params.trackingNumber,
  }).populate('order', 'orderItems totalPrice shippingAddress');

  if (!delivery) {
    return next(
      new ErrorResponse(
        `Delivery not found with tracking number ${req.params.trackingNumber}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: {
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      currentLocation: delivery.currentLocation,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      actualDeliveryTime: delivery.actualDeliveryTime,
      deliveryBoy: delivery.deliveryBoy,
      statusHistory: delivery.statusHistory,
    },
  });
});

// @desc    Create delivery (Admin)
// @route   POST /api/v1/deliveries
// @access  Private/Admin
exports.createDelivery = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  // Check if order exists
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${orderId}`, 404));
  }

  // Check if delivery already exists for this order
  const existingDelivery = await Delivery.findOne({ order: orderId });
  if (existingDelivery) {
    return next(new ErrorResponse('Delivery already exists for this order', 400));
  }

  req.body.order = orderId;
  const delivery = await Delivery.create(req.body);

  res.status(201).json({
    success: true,
    data: delivery,
  });
});

// @desc    Update delivery status (Admin)
// @route   PUT /api/v1/deliveries/:id/status
// @access  Private/Admin
exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks, location } = req.body;

  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  await delivery.updateStatus(status, remarks, location);

  // Update order status based on delivery status
  const order = await Order.findById(delivery.order);
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = 'delivered';
  } else if (status === 'out-for-delivery') {
    order.status = 'shipped';
  }
  await order.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Update delivery location (Admin/Delivery Boy)
// @route   PUT /api/v1/deliveries/:id/location
// @access  Private/Admin
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, address } = req.body;

  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  await delivery.updateLocation(latitude, longitude, address);

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Assign delivery boy (Admin)
// @route   PUT /api/v1/deliveries/:id/assign
// @access  Private/Admin
exports.assignDeliveryBoy = asyncHandler(async (req, res, next) => {
  const { name, phone, vehicleNumber, photo } = req.body;

  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  delivery.deliveryBoy = {
    name,
    phone,
    vehicleNumber,
    photo,
  };

  delivery.status = 'assigned';
  delivery.statusHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    remarks: `Assigned to ${name}`,
  });

  await delivery.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Update proof of delivery (Admin)
// @route   PUT /api/v1/deliveries/:id/proof
// @access  Private/Admin
exports.updateProofOfDelivery = asyncHandler(async (req, res, next) => {
  const { signature, photo, receivedBy } = req.body;

  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  delivery.proofOfDelivery = {
    signature,
    photo,
    receivedBy,
  };

  await delivery.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Rate delivery (Customer)
// @route   PUT /api/v1/deliveries/:id/rate
// @access  Private
exports.rateDelivery = asyncHandler(async (req, res, next) => {
  const { rating, feedback } = req.body;

  const delivery = await Delivery.findById(req.params.id).populate('order');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns the order
  if (delivery.order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to rate this delivery', 401));
  }

  // Check if delivery is completed
  if (delivery.status !== 'delivered') {
    return next(new ErrorResponse('Can only rate completed deliveries', 400));
  }

  delivery.rating = rating;
  delivery.feedback = feedback;
  await delivery.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

// @desc    Get delivery statistics (Admin)
// @route   GET /api/v1/deliveries/stats
// @access  Private/Admin
exports.getDeliveryStats = asyncHandler(async (req, res, next) => {
  const stats = await Delivery.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const totalDeliveries = await Delivery.countDocuments();
  const avgDeliveryTime = await Delivery.aggregate([
    {
      $match: {
        actualDeliveryTime: { $exists: true },
        pickupTime: { $exists: true },
      },
    },
    {
      $project: {
        deliveryTime: {
          $divide: [
            { $subtract: ['$actualDeliveryTime', '$pickupTime'] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$deliveryTime' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      total: totalDeliveries,
      avgDeliveryTimeHours: avgDeliveryTime[0]?.avgTime || 0,
    },
  });
});