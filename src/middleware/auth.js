import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Verify JWT token and attach user to request
export const requireAuth = asyncHandler(async (req, res, next) => {
  // 1) Get token from headers
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }
  
  // 2) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    return next(new AppError('Token verification failed.', 401));
  }
  
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+passwordHash');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }
  
  // 4) Check if user is active
  if (currentUser.status !== 'active') {
    return next(new AppError('Your account is not active. Please contact support.', 401));
  }
  
  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }
  
  // 6) Grant access to protected route
  req.user = currentUser;
  next();
});

// Restrict access to specific roles
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be authenticated to access this route.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    
    next();
  };
};

// Middleware to check if user can access specific city data
export const requireCityAccess = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const user = req.user;
  
  // Super admin can access all cities
  if (user.role === 'super_admin') {
    return next();
  }
  
  // City admin can only access their own city
  if (user.role === 'city_admin') {
    if (!user.cityId || user.cityId.toString() !== cityId) {
      return next(new AppError('You can only access data for your assigned city.', 403));
    }
    return next();
  }
  
  // Other roles have different access patterns (to be defined later)
  return next(new AppError('You do not have permission to access this city data.', 403));
});

// Middleware to ensure city_admin has valid cityId
export const validateCityAdmin = asyncHandler(async (req, res, next) => {
  if (req.body.role === 'city_admin' || req.user?.role === 'city_admin') {
    const cityId = req.body.cityId || req.user?.cityId;
    
    if (!cityId) {
      return next(new AppError('City ID is required for city admin users.', 400));
    }
    
    // Verify city exists
    const City = (await import('../models/City.js')).default;
    const city = await City.findById(cityId);
    if (!city) {
      return next(new AppError('Invalid city ID provided.', 400));
    }
  }
  
  next();
});

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && currentUser.status === 'active') {
        req.user = currentUser;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }
  
  next();
});
