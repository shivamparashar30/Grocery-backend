const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ['product', 'delivery', 'store'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    images: [
      {
        type: String,
      },
    ],
    pros: [String],
    cons: [String],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notHelpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    adminResponse: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true, sparse: true });

// Mark as helpful
reviewSchema.methods.markHelpful = function (userId) {
  // Remove from not helpful if exists
  this.notHelpfulBy = this.notHelpfulBy.filter(
    (id) => id.toString() !== userId.toString()
  );
  
  // Add to helpful if not already there
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
  }
  
  this.helpfulCount = this.helpfulBy.length;
  this.notHelpfulCount = this.notHelpfulBy.length;
  
  return this.save();
};

// Mark as not helpful
reviewSchema.methods.markNotHelpful = function (userId) {
  // Remove from helpful if exists
  this.helpfulBy = this.helpfulBy.filter(
    (id) => id.toString() !== userId.toString()
  );
  
  // Add to not helpful if not already there
  if (!this.notHelpfulBy.includes(userId)) {
    this.notHelpfulBy.push(userId);
  }
  
  this.helpfulCount = this.helpfulBy.length;
  this.notHelpfulCount = this.notHelpfulBy.length;
  
  return this.save();
};

// Add admin response
reviewSchema.methods.addAdminResponse = function (message, adminId) {
  this.adminResponse = {
    message,
    respondedBy: adminId,
    respondedAt: new Date(),
  };
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);