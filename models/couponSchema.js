const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Please specify discount type'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide discount value'],
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usagePerUser: {
      type: Number,
      default: 1,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
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

// Check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) return false;
  
  // Check date validity
  if (now < this.startDate || now > this.endDate) return false;
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  
  return true;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isValid()) return 0;
  
  if (orderAmount < this.minOrderAmount) return 0;
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    
    // Apply max discount cap if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = this.discountValue;
  }
  
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);