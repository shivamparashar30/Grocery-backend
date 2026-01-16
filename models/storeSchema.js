const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Please provide store name'],
    },
    storeCode: {
      type: String,
      required: [true, 'Please provide store code'],
      unique: true,
      uppercase: true,
    },
    storeType: {
      type: String,
      enum: ['warehouse', 'retail', 'distribution-center', 'dark-store'],
      default: 'retail',
    },
    address: {
      addressLine1: {
        type: String,
        required: [true, 'Please provide address'],
      },
      addressLine2: String,
      landmark: String,
      city: {
        type: String,
        required: [true, 'Please provide city'],
      },
      state: {
        type: String,
        required: [true, 'Please provide state'],
      },
      pincode: {
        type: String,
        required: [true, 'Please provide pincode'],
      },
      country: {
        type: String,
        default: 'India',
      },
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Please provide latitude'],
      },
      longitude: {
        type: Number,
        required: [true, 'Please provide longitude'],
      },
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Please provide contact number'],
      },
      email: String,
      alternatePhone: String,
    },
    manager: {
      name: String,
      phone: String,
      email: String,
    },
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    },
    serviceableAreas: [
      {
        pincode: String,
        area: String,
        deliveryCharge: Number,
        minOrderAmount: Number,
      },
    ],
    features: {
      hasParking: { type: Boolean, default: false },
      hasHomeDelivery: { type: Boolean, default: true },
      hasPickup: { type: Boolean, default: false },
      acceptsCash: { type: Boolean, default: true },
      acceptsCard: { type: Boolean, default: true },
      acceptsUPI: { type: Boolean, default: true },
    },
    capacity: {
      storageArea: Number, // in sq ft
      maxOrders: Number, // per day
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    temporarilyClosed: {
      type: Boolean,
      default: false,
    },
    closureReason: String,
    images: [String],
  },
  {
    timestamps: true,
  }
);

// Check if store is currently open
storeSchema.methods.isOpenNow = function () {
  if (!this.isActive || this.temporarilyClosed) return false;
  
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const daySchedule = this.operatingHours[day];
  if (!daySchedule || !daySchedule.isOpen) return false;
  
  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
};

// Check if pincode is serviceable
storeSchema.methods.isServiceable = function (pincode) {
  return this.serviceableAreas.some(area => area.pincode === pincode);
};

// Calculate delivery charge for a pincode
storeSchema.methods.getDeliveryCharge = function (pincode) {
  const area = this.serviceableAreas.find(area => area.pincode === pincode);
  return area ? area.deliveryCharge : null;
};

module.exports = mongoose.model('Store', storeSchema);