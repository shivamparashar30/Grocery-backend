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

// User Registration
router.post('/register', register);

// User Login
router.post('/login', login);

// Forgot Password - Send Reset Link
router.post('/forgot-password', forgotPassword);

// Reset Password - With Token
router.post('/reset-password/:token', resetPassword);

// Verify Email - Email Verification Link
router.get('/verify-email/:token', verifyEmail);

// Resend Verification Email
router.post('/resend-verification', resendVerificationEmail);

// Check if Email Exists
router.post('/check-email', checkEmailExists);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Get Current User Profile
router.get('/me', auth, getMe);

// Update User Profile
router.put('/update-profile', auth, updateProfile);

// Change Password (When Logged In)
router.put('/change-password', auth, changePassword);

// Logout (Optional - for token blacklisting)
router.post('/logout', auth, logout);

// Refresh Access Token
router.post('/refresh-token', auth, refreshToken);

// Delete Account
router.delete('/delete-account', auth, deleteAccount);

// Update Profile Picture
router.put('/update-avatar', auth, updateAvatar);

// Enable Two-Factor Authentication
router.post('/enable-2fa', auth, enable2FA);

// Verify Two-Factor Authentication
router.post('/verify-2fa', auth, verify2FA);

// Disable Two-Factor Authentication
router.post('/disable-2fa', auth, disable2FA);

// ============================================
// SOCIAL AUTH ROUTES (Optional)
// ============================================

// Google OAuth Login
router.post('/google', googleAuth);

// Facebook OAuth Login
router.post('/facebook', facebookAuth);

// Apple OAuth Login
router.post('/apple', appleAuth);

// ============================================
// ADMIN ROUTES (Optional - Admin Only)
// ============================================

// Get All Users (Admin)
router.get('/users', auth, isAdmin, getAllUsers);

// Get User By ID (Admin)
router.get('/users/:id', auth, isAdmin, getUserById);

// Update User Role (Admin)
router.put('/users/:id/role', auth, isAdmin, updateUserRole);

// Block/Unblock User (Admin)
router.put('/users/:id/toggle-status', auth, isAdmin, toggleUserStatus);

// Delete User (Admin)
router.delete('/users/:id', auth, isAdmin, deleteUser);

module.exports = router;