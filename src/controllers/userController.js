import User from '../models/User.js';
import City from '../models/City.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('city', 'name');
  sendResponse(res, 200, 'success', 'User data retrieved successfully', { user });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (with restrictions)
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;
  
  // Users can only view their own profile unless they're admin
  if (id !== currentUser.id.toString() && 
      !['super_admin', 'city_admin'].includes(currentUser.role)) {
    return next(new AppError('You can only view your own profile', 403));
  }
  
  // City admins can only view users in their city
  if (currentUser.role === 'city_admin') {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if the target user belongs to the same city or is the city admin themselves
    if (targetUser.cityId && 
        targetUser.cityId.toString() !== currentUser.cityId.toString() &&
        id !== currentUser.id.toString()) {
      return next(new AppError('You can only view users in your assigned city', 403));
    }
  }
  
  const user = await User.findById(id).populate('city', 'name');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  sendResponse(res, 200, 'success', 'User retrieved successfully', { user });
});

// @desc    Get all users (super admin only)
// @route   GET /api/users
// @access  Private (super_admin only)
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, role, status, city } = req.query;
  
  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (city) filter.cityId = city;
  
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  // Get users with pagination
  const users = await User.find(filter)
    .populate('city', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count for pagination
  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / limit);
  
  sendResponse(res, 200, 'success', 'Users retrieved successfully', {
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalUsers,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Create city admin (super admin only)
// @route   POST /api/users/city-admin
// @access  Private (super_admin only)
export const createCityAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, whatsappNumber, password, cityId } = req.body;
  
  // Debug: Log the request body
  console.log('Creating city admin with data:', {
    fullName,
    email,
    phone,
    whatsappNumber,
    cityId,
    hasPassword: !!password
  });
  
  // Validate required fields
  if (!fullName || !email || !phone || !password || !cityId) {
    return next(new AppError('Please provide all required fields: fullName, email, phone, password, cityId', 400));
  }
  
  // Check if city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  // Check if city already has an active admin
  const existingAdmin = await User.findOne({
    cityId,
    role: 'city_admin',
    status: 'active'
  });
  
  if (existingAdmin) {
    return next(new AppError('This city already has an active admin', 400));
  }
  
  // Check if user with email or phone already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone';
    return next(new AppError(`User with this ${field} already exists`, 400));
  }
  
  // Create city admin
  const cityAdmin = await User.create({
    fullName,
    email,
    phone,
    whatsappNumber,
    passwordHash: password,
    role: 'city_admin',
    cityId,
    status: 'active' // City admins are activated immediately
  });
  
  // Populate city information
  await cityAdmin.populate('city', 'name');
  
  sendResponse(res, 201, 'success', 'City admin created successfully', { user: cityAdmin });
});

// @desc    Update user information (super admin only)
// @route   PATCH /api/users/:id
// @access  Private (super_admin only)
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { fullName, email, phone, whatsappNumber, password, cityId } = req.body;
  
  // Debug: Log the update request
  console.log('Updating user with data:', {
    id,
    fullName,
    email,
    phone,
    whatsappNumber,
    cityId,
    hasPassword: !!password
  });
  
  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Prepare update data
  const updateData = {};
  
  if (fullName !== undefined) updateData.fullName = fullName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
  if (cityId !== undefined) updateData.cityId = cityId;
  if (password !== undefined) updateData.passwordHash = password;
  
  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('city', 'name');
  
  sendResponse(res, 200, 'success', 'User updated successfully', { user: updatedUser });
});

// @desc    Update user status (super admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (super_admin only)
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['active', 'inactive', 'pending_approval'].includes(status)) {
    return next(new AppError('Please provide a valid status: active, inactive, or pending_approval', 400));
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate('city', 'name');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  sendResponse(res, 200, 'success', 'User status updated successfully', { user });
});

// @desc    Update user role (super admin only)
// @route   PATCH /api/users/:id/role
// @access  Private (super_admin only)
export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role, cityId } = req.body;
  
  if (!role || !['super_admin', 'city_admin', 'owner', 'customer'].includes(role)) {
    return next(new AppError('Please provide a valid role', 400));
  }
  
  // Prevent changing super admin role
  const targetUser = await User.findById(id);
  if (!targetUser) {
    return next(new AppError('User not found', 404));
  }
  
  if (targetUser.role === 'super_admin' && req.user.id.toString() !== id) {
    return next(new AppError('Cannot change super admin role', 403));
  }
  
  // Validate cityId for city_admin role
  if (role === 'city_admin') {
    if (!cityId) {
      return next(new AppError('City ID is required for city admin role', 400));
    }
    
    const city = await City.findById(cityId);
    if (!city) {
      return next(new AppError('City not found', 404));
    }
    
    // Check if city already has an active admin (unless it's the same user)
    const existingAdmin = await User.findOne({
      cityId,
      role: 'city_admin',
      status: 'active',
      _id: { $ne: id }
    });
    
    if (existingAdmin) {
      return next(new AppError('This city already has an active admin', 400));
    }
  }
  
  const updateData = { role };
  if (role === 'city_admin') {
    updateData.cityId = cityId;
  } else if (targetUser.role === 'city_admin' && role !== 'city_admin') {
    // Remove cityId if changing from city_admin to another role
    updateData.cityId = null;
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('city', 'name');
  
  sendResponse(res, 200, 'success', 'User role updated successfully', { user });
});

// @desc    Delete user (super admin only)
// @route   DELETE /api/users/:id
// @access  Private (super_admin only)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Prevent deleting super admin
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (user.role === 'super_admin') {
    return next(new AppError('Cannot delete super admin user', 403));
  }
  
  await User.findByIdAndDelete(id);
  
  sendResponse(res, 200, 'success', 'User deleted successfully');
});

// @desc    Get users by city (city admin can see their city users)
// @route   GET /api/users/city/:cityId
// @access  Private (super_admin or city_admin for their city)
export const getUsersByCity = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const currentUser = req.user;
  
  // City admins can only see users in their assigned city
  if (currentUser.role === 'city_admin') {
    if (!currentUser.cityId || currentUser.cityId.toString() !== cityId) {
      return next(new AppError('You can only view users in your assigned city', 403));
    }
  }
  
  // Verify city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  const users = await User.find({ cityId }).populate('city', 'name');
  
  sendResponse(res, 200, 'success', 'City users retrieved successfully', { 
    users, 
    city: { id: city._id, name: city.name }
  });
});
