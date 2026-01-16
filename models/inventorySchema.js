const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    currentStock: {
      type: Number,
      required: [true, 'Please provide current stock'],
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 1000,
    },
    reorderPoint: {
      type: Number,
      default: 20,
    },
    reorderQuantity: {
      type: Number,
      default: 100,
    },
    lastRestocked: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    batchNumber: {
      type: String,
    },
    supplier: {
      name: String,
      contact: String,
      email: String,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    stockHistory: [
      {
        type: {
          type: String,
          enum: ['in', 'out', 'adjustment', 'expired', 'damaged', 'return'],
        },
        quantity: Number,
        reason: String,
        reference: String, // Order ID or other reference
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock', 'discontinued'],
      default: 'in-stock',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate available stock
inventorySchema.pre('save', function (next) {
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  
  // Update status based on stock levels
  if (this.currentStock === 0) {
    this.status = 'out-of-stock';
  } else if (this.currentStock <= this.minStockLevel) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  next();
});

// Add stock
inventorySchema.methods.addStock = function (quantity, reason, performedBy) {
  this.currentStock += quantity;
  this.lastRestocked = new Date();
  
  this.stockHistory.push({
    type: 'in',
    quantity,
    reason,
    performedBy,
    date: new Date(),
  });
  
  return this.save();
};

// Remove stock
inventorySchema.methods.removeStock = function (quantity, reason, reference, performedBy) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.currentStock -= quantity;
  
  this.stockHistory.push({
    type: 'out',
    quantity,
    reason,
    reference,
    performedBy,
    date: new Date(),
  });
  
  return this.save();
};

// Reserve stock for order
inventorySchema.methods.reserveStock = function (quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.reservedStock += quantity;
  return this.save();
};

// Release reserved stock
inventorySchema.methods.releaseStock = function (quantity) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  return this.save();
};

// Check if reorder is needed
inventorySchema.methods.needsReorder = function () {
  return this.currentStock <= this.reorderPoint;
};

// Compound index for efficient queries
inventorySchema.index({ product: 1, store: 1 }, { unique: true });
inventorySchema.index({ status: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);