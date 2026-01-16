const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Check stock
  if (product.stock < quantity) {
    return next(new ErrorResponse('Not enough stock', 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    cart.items.push({ product: productId, quantity, price });
  }

  await cart.save();

  cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Update cart item
// @route   PUT /api/v1/cart/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  item.quantity = quantity;
  await cart.save();

  const updatedCart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: updatedCart,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );

  await cart.save();

  const updatedCart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: updatedCart,
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    data: cart,
  });
});