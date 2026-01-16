const Address = require('../models/Address');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all addresses for logged in user
// @route   GET /api/v1/addresses
// @access  Private
exports.getAddresses = asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user.id }).sort('-isDefault');

  res.status(200).json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});

// @desc    Get single address
// @route   GET /api/v1/addresses/:id
// @access  Private
exports.getAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findById(req.params.id);

  if (!address) {
    return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
  }

  // Make sure address belongs to user
  if (address.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this address', 401));
  }

  res.status(200).json({
    success: true,
    data: address,
  });
});

// @desc    Get default address
// @route   GET /api/v1/addresses/default
// @access  Private
exports.getDefaultAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findOne({
    user: req.user.id,
    isDefault: true,
  });

  if (!address) {
    return next(new ErrorResponse('No default address found', 404));
  }

  res.status(200).json({
    success: true,
    data: address,
  });
});

// @desc    Create new address
// @route   POST /api/v1/addresses
// @access  Private
exports.createAddress = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const address = await Address.create(req.body);

  res.status(201).json({
    success: true,
    data: address,
  });
});

// @desc    Update address
// @route   PUT /api/v1/addresses/:id
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  let address = await Address.findById(req.params.id);

  if (!address) {
    return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
  }

  // Make sure address belongs to user
  if (address.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this address', 401));
  }

  address = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: address,
  });
});

// @desc    Set default address
// @route   PUT /api/v1/addresses/:id/default
// @access  Private
exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findById(req.params.id);

  if (!address) {
    return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
  }

  // Make sure address belongs to user
  if (address.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this address', 401));
  }

  // Remove default from all other addresses
  await Address.updateMany(
    { user: req.user.id, _id: { $ne: req.params.id } },
    { isDefault: false }
  );

  // Set this address as default
  address.isDefault = true;
  await address.save();

  res.status(200).json({
    success: true,
    data: address,
  });
});

// @desc    Delete address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findById(req.params.id);

  if (!address) {
    return next(new ErrorResponse(`Address not found with id of ${req.params.id}`, 404));
  }

  // Make sure address belongs to user
  if (address.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this address', 401));
  }

  await address.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
  });
});

// @desc    Get addresses by pincode (Admin)
// @route   GET /api/v1/addresses/pincode/:pincode
// @access  Private/Admin
exports.getAddressesByPincode = asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ pincode: req.params.pincode }).populate(
    'user',
    'name email phone'
  );

  res.status(200).json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});