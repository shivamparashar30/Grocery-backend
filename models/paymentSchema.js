const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'netbanking'],
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'phonepe', 'googlepay', 'cash'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    cardDetails: {
      last4Digits: String,
      cardType: String,
      cardNetwork: String,
    },
    upiDetails: {
      vpa: String,
      transactionRef: String,
    },
    refund: {
      status: {
        type: String,
        enum: ['none', 'requested', 'processing', 'completed', 'rejected'],
        default: 'none',
      },
      amount: Number,
      reason: String,
      refundId: String,
      refundDate: Date,
    },
    failureReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Mark payment as successful
paymentSchema.methods.markAsSuccess = function (gatewayResponse) {
  this.status = 'success';
  this.paymentDate = new Date();
  this.gatewayResponse = gatewayResponse;
  return this.save();
};

// Mark payment as failed
paymentSchema.methods.markAsFailed = function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

// Process refund
paymentSchema.methods.processRefund = function (amount, reason) {
  this.refund.status = 'requested';
  this.refund.amount = amount;
  this.refund.reason = reason;
  return this.save();
};

// Generate transaction ID
paymentSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);