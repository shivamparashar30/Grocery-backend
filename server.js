const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');


// Load env vars
dotenv.config();



// Connect to database
connectDB();

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);



// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Grocery Store API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      coupons: '/api/v1/coupons',
      addresses: '/api/v1/addresses',
      wishlist: '/api/v1/wishlist',
      notifications: '/api/v1/notifications',
      banners: '/api/v1/banners',
      deliveries: '/api/v1/deliveries',
      payments: '/api/v1/payments',
      stores: '/api/v1/stores',
      inventory: '/api/v1/inventory',
      reviews: '/api/v1/reviews',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});