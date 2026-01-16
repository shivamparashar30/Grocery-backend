const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    deliveryBoy: {
      name: {
        type: String,
        required: [true, 'Please provide delivery boy name'],
      },
      phone: {
        type: String,
        required: [true, 'Please provide delivery boy phone'],
      },
      vehicleNumber: {
        type: String,
      },
      photo: {
        type: String,
      },
    },
    trackingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'picked-up',
        'in-transit',
        'out-for-delivery',
        'delivered',
        'failed',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },
    pickupTime: {
      type: Date,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      updatedAt: Date,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'pending',
            'assigned',
            'picked-up',
            'in-transit',
            'out-for-delivery',
            'delivered',
            'failed',
            'cancelled',
            'returned',
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        remarks: String,
        location: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
    deliveryNotes: {
      type: String,
    },
    proofOfDelivery: {
      signature: String,
      photo: String,
      receivedBy: String,
    },
    failureReason: {
      type: String,
    },
    returnReason: {
      type: String,
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Update status and add to history
deliverySchema.methods.updateStatus = function (newStatus, remarks, location) {
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    remarks,
    location,
  });
  
  // Update timestamps based on status
  if (newStatus === 'picked-up') {
    this.pickupTime = new Date();
  } else if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Update current location
deliverySchema.methods.updateLocation = function (latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    updatedAt: new Date(),
  };
  return this.save();
};

// Generate tracking number
deliverySchema.pre('save', function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);