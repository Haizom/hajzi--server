import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

// Helper function to create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Helper function to create and send token response
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);
  
  // Remove password from output
  user.passwordHash = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user
    }
  });
};

// @desc    Register a new user (customer or owner only)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, whatsappNumber, password, role } = req.body;
  
  // Only allow customer and owner registration through public endpoint
  if (role && !['customer', 'owner'].includes(role)) {
    return next(new AppError('Only customers and owners can register through this endpoint', 400));
  }
  
  // Default to customer if no role specified
  const userRole = role || 'customer';
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone';
    return next(new AppError(`User with this ${field} already exists`, 400));
  }
  
  // Create new user
  const newUser = await User.create({
    fullName,
    email,
    phone,
    whatsappNumber,
    passwordHash: password,
    role: userRole
  });
  
  createSendToken(newUser, 201, res, 'Registration successful');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  
  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+passwordHash').populate('city', 'name');
  
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // 3) Check if user account is active
  if (user.status !== 'active') {
    let message = 'Your account is not active.';
    if (user.status === 'pending_approval') {
      message = 'Your account is pending approval. Please wait for admin approval.';
    } else if (user.status === 'inactive') {
      message = 'Your account has been deactivated. Please contact support.';
    }
    return next(new AppError(message, 401));
  }
  
  // 4) If everything is ok, send token to client
  createSendToken(user, 200, res, 'Login successful');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  // User is already available from requireAuth middleware
  const user = await User.findById(req.user.id).populate('city', 'name');
  
  sendResponse(res, 200, 'success', 'User data retrieved successfully', { user });
});

// @desc    Update current user password
// @route   PATCH /api/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+passwordHash');
  
  // 2) Check if current password is correct
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }
  
  // 3) Check if new passwords match
  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirmation do not match.', 400));
  }
  
  // 4) Update password
  user.passwordHash = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  
  // 5) Log user in, send JWT
  createSendToken(user, 200, res, 'Password updated successfully');
});

// @desc    Update current user profile
// @route   PATCH /api/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordHash) {
    return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
  }
  
  // 2) Filter out fields that are not allowed to be updated
  const allowedFields = ['fullName', 'phone', 'whatsappNumber'];
  const filteredBody = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });
  
  // 3) Check if phone number is being changed and if it's unique
  if (filteredBody.phone && filteredBody.phone !== req.user.phone) {
    const existingUser = await User.findOne({ phone: filteredBody.phone });
    if (existingUser) {
      return next(new AppError('Phone number is already in use by another user', 400));
    }
  }
  
  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).populate('city', 'name');
  
  sendResponse(res, 200, 'success', 'Profile updated successfully', { user: updatedUser });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  // In a JWT setup, logout is typically handled client-side by removing the token
  // Here we just send a success response
  sendResponse(res, 200, 'success', 'Logged out successfully');
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
export const refreshToken = asyncHandler(async (req, res, next) => {
  // Generate new token with current user data
  createSendToken(req.user, 200, res, 'Token refreshed successfully');
});
