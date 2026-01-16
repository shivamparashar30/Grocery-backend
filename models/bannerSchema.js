const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide banner title'],
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: [true, 'Please provide banner image'],
    },
    bannerType: {
      type: String,
      enum: ['hero', 'promotional', 'category', 'seasonal', 'flash-sale'],
      default: 'promotional',
    },
    position: {
      type: String,
      enum: ['top', 'middle', 'bottom', 'sidebar'],
      default: 'top',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    linkType: {
      type: String,
      enum: ['product', 'category', 'external', 'none'],
      default: 'none',
    },
    linkTo: {
      type: String,
    },
    targetProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    targetCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    impressionCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Increment click count
bannerSchema.methods.incrementClick = function () {
  this.clickCount += 1;
  return this.save();
};

// Increment impression count
bannerSchema.methods.incrementImpression = function () {
  this.impressionCount += 1;
  return this.save();
};

// Index for efficient querying
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
bannerSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);