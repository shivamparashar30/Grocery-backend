const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Remove duplicate products
wishlistSchema.methods.removeDuplicates = function () {
  const uniqueProducts = new Set();
  this.items = this.items.filter((item) => {
    const productId = item.product.toString();
    if (uniqueProducts.has(productId)) {
      return false;
    }
    uniqueProducts.add(productId);
    return true;
  });
};

module.exports = mongoose.model('Wishlist', wishlistSchema);