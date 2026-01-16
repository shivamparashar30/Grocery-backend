const Banner = require('../models/Banner');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all active banners
// @route   GET /api/v1/banners
// @access  Public
exports.getBanners = asyncHandler(async (req, res, next) => {
  const { position, bannerType } = req.query;

  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (position) {
    query.position = position;
  }

  if (bannerType) {
    query.bannerType = bannerType;
  }

  const banners = await Banner.find(query)
    .populate('targetProduct', 'name price images')
    .populate('targetCategory', 'name')
    .sort('displayOrder');

  res.status(200).json({
    success: true,
    count: banners.length,
    data: banners,
  });
});

// @desc    Get all banners (Admin)
// @route   GET /api/v1/banners/all
// @access  Private/Admin
exports.getAllBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find()
    .populate('targetProduct', 'name price')
    .populate('targetCategory', 'name')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: banners.length,
    data: banners,
  });
});

// @desc    Get single banner
// @route   GET /api/v1/banners/:id
// @access  Public
exports.getBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id)
    .populate('targetProduct', 'name price images')
    .populate('targetCategory', 'name');

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: banner,
  });
});

// @desc    Create banner (Admin)
// @route   POST /api/v1/banners
// @access  Private/Admin
exports.createBanner = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const banner = await Banner.create(req.body);

  res.status(201).json({
    success: true,
    data: banner,
  });
});

// @desc    Update banner (Admin)
// @route   PUT /api/v1/banners/:id
// @access  Private/Admin
exports.updateBanner = asyncHandler(async (req, res, next) => {
  let banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: banner,
  });
});

// @desc    Delete banner (Admin)
// @route   DELETE /api/v1/banners/:id
// @access  Private/Admin
exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  await banner.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Banner deleted successfully',
  });
});

// @desc    Track banner click
// @route   POST /api/v1/banners/:id/click
// @access  Public
exports.trackClick = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  await banner.incrementClick();

  res.status(200).json({
    success: true,
    message: 'Click tracked',
  });
});

// @desc    Track banner impression
// @route   POST /api/v1/banners/:id/impression
// @access  Public
exports.trackImpression = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  await banner.incrementImpression();

  res.status(200).json({
    success: true,
    message: 'Impression tracked',
  });
});

// @desc    Toggle banner active status (Admin)
// @route   PUT /api/v1/banners/:id/toggle
// @access  Private/Admin
exports.toggleActive = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  res.status(200).json({
    success: true,
    data: banner,
  });
});

// @desc    Get banner analytics (Admin)
// @route   GET /api/v1/banners/:id/analytics
// @access  Private/Admin
exports.getBannerAnalytics = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse(`Banner not found with id of ${req.params.id}`, 404));
  }

  const analytics = {
    title: banner.title,
    impressions: banner.impressionCount,
    clicks: banner.clickCount,
    ctr: banner.impressionCount > 0 
      ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(2) 
      : 0,
    isActive: banner.isActive,
    isCurrentlyActive: banner.isCurrentlyActive(),
    startDate: banner.startDate,
    endDate: banner.endDate,
  };

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

// @desc    Get top performing banners (Admin)
// @route   GET /api/v1/banners/analytics/top
// @access  Private/Admin
exports.getTopBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find()
    .select('title clickCount impressionCount')
    .sort('-clickCount')
    .limit(10);

  const analyticsData = banners.map((banner) => ({
    id: banner._id,
    title: banner.title,
    clicks: banner.clickCount,
    impressions: banner.impressionCount,
    ctr: banner.impressionCount > 0 
      ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(2) 
      : 0,
  }));

  res.status(200).json({
    success: true,
    count: analyticsData.length,
    data: analyticsData,
  });
});