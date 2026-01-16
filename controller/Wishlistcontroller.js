const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock rating category',
    populate: {
      path: 'category',
      select: 'name',
    },
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    success: true,
    count: wishlist.items.length,
    data: wishlist,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/:productId
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.productId}`, 404));
  }

  let wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: [],
    });
  }

  // Check if product already in wishlist
  const itemExists = wishlist.items.find(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemExists) {
    return next(new ErrorResponse('Product already in wishlist', 400));
  }

  // Add product to wishlist
  wishlist.items.push({
    product: req.params.productId,
  });

  await wishlist.save();

  // Populate the wishlist before sending response
  wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock rating',
  });

  res.status(200).json({
    success: true,
    data: wishlist,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    return next(new ErrorResponse('Wishlist not found', 404));
  }

  // Remove product from wishlist
  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  await wishlist.save();

  // Populate the wishlist before sending response
  const updatedWishlist = await Wishlist.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock rating',
  });

  res.status(200).json({
    success: true,
    data: updatedWishlist,
  });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
exports.clearWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    return next(new ErrorResponse('Wishlist not found', 404));
  }

  wishlist.items = [];
  await wishlist.save();

  res.status(200).json({
    success: true,
    message: 'Wishlist cleared successfully',
    data: wishlist,
  });
});

// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
exports.checkWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    return res.status(200).json({
      success: true,
      inWishlist: false,
    });
  }

  const inWishlist = wishlist.items.some(
    (item) => item.product.toString() === req.params.productId
  );

  res.status(200).json({
    success: true,
    inWishlist,
  });
});

// @desc    Move wishlist items to cart
// @route   POST /api/v1/wishlist/move-to-cart
// @access  Private
exports.moveToCart = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
    'items.product'
  );

  if (!wishlist || wishlist.items.length === 0) {
    return next(new ErrorResponse('Wishlist is empty', 400));
  }

  // Get Cart model
  const Cart = require('../models/Cart');
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [],
    });
  }

  // Add wishlist items to cart
  for (const item of wishlist.items) {
    const product = item.product;
    
    // Check if product is available
    if (!product.isActive || product.stock === 0) {
      continue;
    }

    // Check if already in cart
    const existingItem = cart.items.find(
      (cartItem) => cartItem.product.toString() === product._id.toString()
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      cart.items.push({
        product: product._id,
        quantity: 1,
        price,
      });
    }
  }

  await cart.save();

  // Clear wishlist
  wishlist.items = [];
  await wishlist.save();

  res.status(200).json({
    success: true,
    message: 'Items moved to cart successfully',
  });
});

// @desc    Get wishlist statistics (Admin)
// @route   GET /api/v1/wishlist/stats
// @access  Private/Admin
exports.getWishlistStats = asyncHandler(async (req, res, next) => {
  const stats = await Wishlist.aggregate([
    {
      $unwind: '$items',
    },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $unwind: '$product',
    },
    {
      $project: {
        productName: '$product.name',
        productPrice: '$product.price',
        wishlistCount: '$count',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    count: stats.length,
    data: stats,
  });
});