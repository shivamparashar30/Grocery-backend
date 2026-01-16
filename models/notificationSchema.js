const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order',
        'delivery',
        'payment',
        'offer',
        'product',
        'system',
        'general',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: [true, 'Please provide notification title'],
    },
    message: {
      type: String,
      required: [true, 'Please provide notification message'],
    },
    image: {
      type: String,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    actionUrl: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Index for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);