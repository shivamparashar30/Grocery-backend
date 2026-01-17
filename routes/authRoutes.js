// ============================================
// authRoutes.js - Authentication Routes
// ============================================
const express = require('express');
const router = express.Router();

// Import all controller functions and middleware
const {
  // Middleware
  auth,
  isAdmin,
  
  // Public routes
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  checkEmailExists,
  
  // Protected routes
  getMe,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  deleteAccount,
  updateAvatar,
  enable2FA,
  verify2FA,
  disable2FA,
  
  // Social auth
  googleAuth,
  facebookAuth,
  appleAuth,
  
  // Admin routes
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require('../controller/auth');

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// User Registration - POST /api/v1/auth/register
router.post('/register', register);

// User Login - POST /api/v1/auth/login
router.post('/login', login);

// Forgot Password - Send Reset Link - POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// Reset Password - With Token (supports both routes for flexibility)
// POST /api/v1/auth/reset-password/:token (with token in URL)
router.post('/reset-password/:token', resetPassword);
// POST /api/v1/auth/reset-password (with token in body)
router.post('/reset-password', resetPassword);

// Verify Email - Email Verification Link - GET /api/v1/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// Resend Verification Email - POST /api/v1/auth/resend-verification
router.post('/resend-verification', resendVerificationEmail);

// Check if Email Exists - POST /api/v1/auth/check-email
router.post('/check-email', checkEmailExists);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Get Current User Profile - GET /api/v1/auth/me
router.get('/me', auth, getMe);

// Alternative route for getting current user
router.get('/current-user', auth, getCurrentUser);

// Update User Profile - PUT /api/v1/auth/update-profile
router.put('/update-profile', auth, updateProfile);

// Change Password (When Logged In) - PUT /api/v1/auth/change-password
router.put('/change-password', auth, changePassword);

// Logout (Optional - for token blacklisting) - POST /api/v1/auth/logout
router.post('/logout', auth, logout);

// Refresh Access Token - POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken);

// Delete Account - DELETE /api/v1/auth/delete-account
router.delete('/delete-account', auth, deleteAccount);

// Update Profile Picture - PUT /api/v1/auth/update-avatar
router.put('/update-avatar', auth, updateAvatar);

// Enable Two-Factor Authentication - POST /api/v1/auth/enable-2fa
router.post('/enable-2fa', auth, enable2FA);

// Verify Two-Factor Authentication - POST /api/v1/auth/verify-2fa
router.post('/verify-2fa', auth, verify2FA);

// Disable Two-Factor Authentication - POST /api/v1/auth/disable-2fa
router.post('/disable-2fa', auth, disable2FA);

// ============================================
// SOCIAL AUTH ROUTES (Optional)
// ============================================

// Google OAuth Login - POST /api/v1/auth/google
router.post('/google', googleAuth);

// Facebook OAuth Login - POST /api/v1/auth/facebook
router.post('/facebook', facebookAuth);

// Apple OAuth Login - POST /api/v1/auth/apple
router.post('/apple', appleAuth);

// ============================================
// ADMIN ROUTES (Admin Only)
// ============================================

// Get All Users (Admin) - GET /api/v1/auth/users
router.get('/users', auth, isAdmin, getAllUsers);

// Get User By ID (Admin) - GET /api/v1/auth/users/:id
router.get('/users/:id', auth, isAdmin, getUserById);

// Update User Role (Admin) - PUT /api/v1/auth/users/:id/role
router.put('/users/:id/role', auth, isAdmin, updateUserRole);

// Block/Unblock User (Admin) - PUT /api/v1/auth/users/:id/toggle-status
router.put('/users/:id/toggle-status', auth, isAdmin, toggleUserStatus);

// Delete User (Admin) - DELETE /api/v1/auth/users/:id
router.delete('/users/:id', auth, isAdmin, deleteUser);

module.exports = router;