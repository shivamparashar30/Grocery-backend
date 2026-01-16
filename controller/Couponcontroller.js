const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Public
exports.getCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await Coupon.find({ isActive: true })
    .populate('applicableCategories', 'name')
    .populate('applicableProducts', 'name price');

  res.status(200).json({
    success: true,
    count: coupons.length,
    data: coupons,
  });
});

// @desc    Get single coupon
// @route   GET /api/v1/coupons/:id
// @access  Public
exports.getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('applicableCategories', 'name')
    .populate('applicableProducts', 'name price');

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: coupon,
  });
});

// @desc    Validate coupon code
// @route   POST /api/v1/coupons/validate
// @access  Private
exports.validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, orderAmount, categoryId, productId } = req.body;

  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });

  if (!coupon) {
    return next(new ErrorResponse('Invalid coupon code', 400));
  }

  // Check if coupon is valid
  if (!coupon.isValid()) {
    return next(new ErrorResponse('Coupon has expired or is no longer valid', 400));
  }

  // Check minimum order amount
  if (orderAmount < coupon.minOrderAmount) {
    return next(
      new ErrorResponse(
        `Minimum order amount of ₹${coupon.minOrderAmount} required`,
        400
      )
    );
  }

  // Check applicable categories
  if (categoryId && coupon.applicableCategories.length > 0) {
    if (!coupon.applicableCategories.includes(categoryId)) {
      return next(new ErrorResponse('Coupon not applicable for this category', 400));
    }
  }

  // Check applicable products
  if (productId && coupon.applicableProducts.length > 0) {
    if (!coupon.applicableProducts.includes(productId)) {
      return next(new ErrorResponse('Coupon not applicable for this product', 400));
    }
  }

  // Calculate discount
  const discount = coupon.calculateDiscount(orderAmount);

  res.status(200).json({
    success: true,
    data: {
      couponId: coupon._id,
      code: coupon.code,
      discount,
      finalAmount: orderAmount - discount,
    },
  });
});

// @desc    Apply coupon to order
// @route   POST /api/v1/coupons/apply
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponId } = req.body;

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    return next(new ErrorResponse('Coupon not found', 404));
  }

  // Increment usage count
  coupon.usedCount += 1;
  await coupon.save();

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
  });
});

// @desc    Create coupon (Admin)
// @route   POST /api/v1/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const coupon = await Coupon.create(req.body);

  res.status(201).json({
    success: true,
    data: coupon,
  });
});

// @desc    Update coupon (Admin)
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: coupon,
  });
});

// @desc    Delete coupon (Admin)
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  await coupon.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

// @desc    Get coupon usage statistics (Admin)
// @route   GET /api/v1/coupons/:id/stats
// @access  Private/Admin
exports.getCouponStats = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse(`Coupon not found with id of ${req.params.id}`, 404));
  }

  const stats = {
    code: coupon.code,
    totalUsage: coupon.usedCount,
    remainingUsage: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : 'Unlimited',
    isActive: coupon.isActive,
    isValid: coupon.isValid(),
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});