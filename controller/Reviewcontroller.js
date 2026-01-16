const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res, next) => {
  const { reviewType, status } = req.query;

  const query = {};
  
  if (reviewType) {
    query.reviewType = reviewType;
  }
  
  if (status) {
    query.status = status;
  }

  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name price images')
    .populate('order', 'totalPrice status')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({
    product: req.params.productId,
    reviewType: 'product',
    status: 'approved',
  })
    .populate('user', 'name')
    .sort('-createdAt');

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  res.status(200).json({
    success: true,
    count: reviews.length,
    avgRating: avgRating.toFixed(1),
    data: reviews,
  });
});

// @desc    Get reviews for a delivery
// @route   GET /api/v1/reviews/delivery/:deliveryId
// @access  Private/Admin
exports.getDeliveryReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({
    delivery: req.params.deliveryId,
    reviewType: 'delivery',
  })
    .populate('user', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// @desc    Get reviews for a store
// @route   GET /api/v1/reviews/store/:storeId
// @access  Public
exports.getStoreReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({
    store: req.params.storeId,
    reviewType: 'store',
    status: 'approved',
  })
    .populate('user', 'name')
    .sort('-createdAt');

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  res.status(200).json({
    success: true,
    count: reviews.length,
    avgRating: avgRating.toFixed(1),
    data: reviews,
  });
});

// @desc    Get user's reviews
// @route   GET /api/v1/reviews/my-reviews
// @access  Private
exports.getMyReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id })
    .populate('product', 'name price images')
    .populate('order', 'totalPrice')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name')
    .populate('product', 'name price images')
    .populate('adminResponse.respondedBy', 'name');

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Create product review
// @route   POST /api/v1/reviews/product/:productId
// @access  Private
exports.createProductReview = asyncHandler(async (req, res, next) => {
  const { rating, title, comment, images, pros, cons, orderId } = req.body;

  // Check if product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Check if user has purchased this product
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      'orderItems.product': req.params.productId,
    });
    isVerifiedPurchase = !!order;
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user.id,
    product: req.params.productId,
    reviewType: 'product',
  });

  if (existingReview) {
    return next(new ErrorResponse('You have already reviewed this product', 400));
  }

  const review = await Review.create({
    reviewType: 'product',
    user: req.user.id,
    product: req.params.productId,
    order: orderId,
    rating,
    title,
    comment,
    images,
    pros,
    cons,
    isVerifiedPurchase,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc    Create delivery review
// @route   POST /api/v1/reviews/delivery/:deliveryId
// @access  Private
exports.createDeliveryReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, orderId } = req.body;

  const review = await Review.create({
    reviewType: 'delivery',
    user: req.user.id,
    delivery: req.params.deliveryId,
    order: orderId,
    rating,
    comment,
    isVerifiedPurchase: true,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  // Make sure review belongs to user
  if (review.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this review', 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this review', 401));
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

// @desc    Mark review as helpful
// @route   PUT /api/v1/reviews/:id/helpful
// @access  Private
exports.markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  await review.markHelpful(req.user.id);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Mark review as not helpful
// @route   PUT /api/v1/reviews/:id/not-helpful
// @access  Private
exports.markNotHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  await review.markNotHelpful(req.user.id);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Add admin response to review (Admin)
// @route   POST /api/v1/reviews/:id/response
// @access  Private/Admin
exports.addAdminResponse = asyncHandler(async (req, res, next) => {
  const { message } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  await review.addAdminResponse(message, req.user.id);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Approve review (Admin)
// @route   PUT /api/v1/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  review.isApproved = true;
  review.status = 'approved';
  await review.save();

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Reject review (Admin)
// @route   PUT /api/v1/reviews/:id/reject
// @access  Private/Admin
exports.rejectReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  review.status = 'rejected';
  await review.save();

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Feature review (Admin)
// @route   PUT /api/v1/reviews/:id/feature
// @access  Private/Admin
exports.featureReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  review.isFeatured = !review.isFeatured;
  await review.save();

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Report review
// @route   PUT /api/v1/reviews/:id/report
// @access  Private
exports.reportReview = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
  }

  review.isReported = true;
  review.reportReason = reason;
  review.status = 'flagged';
  await review.save();

  res.status(200).json({
    success: true,
    message: 'Review reported successfully',
  });
});

// @desc    Get review statistics (Admin)
// @route   GET /api/v1/reviews/stats
// @access  Private/Admin
exports.getReviewStats = asyncHandler(async (req, res, next) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: '$reviewType',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
      },
    },
  ]);

  const totalReviews = await Review.countDocuments();
  const verifiedReviews = await Review.countDocuments({ isVerifiedPurchase: true });

  res.status(200).json({
    success: true,
    data: {
      byType: stats,
      total: totalReviews,
      verified: verifiedReviews,
    },
  });
});