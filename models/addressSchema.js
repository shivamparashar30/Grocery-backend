const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      maxlength: [10, 'Phone number should be 10 digits'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Please provide address line 1'],
    },
    addressLine2: {
      type: String,
    },
    landmark: {
      type: String,
    },
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
      maxlength: [6, 'Pincode should be 6 digits'],
    },
    country: {
      type: String,
      default: 'India',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default address per user
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);