import City from '../models/City.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

// @desc    Get all cities
// @route   GET /api/cities
// @access  Public
export const getAllCities = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, withAdmins = false } = req.query;
  
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  let cities;
  
  if (withAdmins === 'true') {
    // Get cities with admin information (for admin users)
    cities = await City.find()
      .populate({
        path: 'admins',
        select: 'fullName email phone status',
        match: { status: 'active' }
      })
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
  } else {
    // Get basic city information
    cities = await City.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
  }
  
  // Get total count for pagination
  const totalCities = await City.countDocuments();
  const totalPages = Math.ceil(totalCities / limit);
  
  sendResponse(res, 200, 'success', 'Cities retrieved successfully', {
    cities,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCities,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get city by ID
// @route   GET /api/cities/:id
// @access  Public
export const getCityById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { withAdmins = false } = req.query;
  
  let city;
  
  if (withAdmins === 'true' && req.user) {
    // Include admin information if requested and user is authenticated
    city = await City.findById(id).populate({
      path: 'admins',
      select: 'fullName email phone status',
      match: { status: 'active' }
    });
  } else {
    city = await City.findById(id);
  }
  
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  sendResponse(res, 200, 'success', 'City retrieved successfully', { city });
});

// @desc    Create new city
// @route   POST /api/cities
// @access  Private (super_admin only)
export const createCity = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  
  if (!name) {
    return next(new AppError('City name is required', 400));
  }
  
  // Check if city with this name already exists
  const existingCity = await City.findOne({ name });
  if (existingCity) {
    return next(new AppError('City with this name already exists', 400));
  }
  
  const city = await City.create({ name });
  
  sendResponse(res, 201, 'success', 'City created successfully', { city });
});

// @desc    Update city
// @route   PATCH /api/cities/:id
// @access  Private (super_admin only)
export const updateCity = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return next(new AppError('City name is required', 400));
  }
  
  // Check if another city with this name exists
  const existingCity = await City.findOne({ 
    name, 
    _id: { $ne: id } 
  });
  
  if (existingCity) {
    return next(new AppError('Another city with this name already exists', 400));
  }
  
  const city = await City.findByIdAndUpdate(
    id,
    { name },
    { 
      new: true, 
      runValidators: true 
    }
  );
  
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  sendResponse(res, 200, 'success', 'City updated successfully', { city });
});

// @desc    Delete city
// @route   DELETE /api/cities/:id
// @access  Private (super_admin only)
export const deleteCity = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const city = await City.findById(id);
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  // Check if city has any admins
  const admins = await User.find({ 
    cityId: id, 
    role: 'city_admin' 
  });
  
  if (admins.length > 0) {
    return next(new AppError('Cannot delete city that has assigned admins. Please reassign or remove admins first.', 400));
  }
  
  // In the future, also check for properties
  // const properties = await Property.find({ cityId: id });
  // if (properties.length > 0) {
  //   return next(new AppError('Cannot delete city that has properties', 400));
  // }
  
  await City.findByIdAndDelete(id);
  
  sendResponse(res, 200, 'success', 'City deleted successfully');
});

// @desc    Get city statistics
// @route   GET /api/cities/:id/stats
// @access  Private (super_admin or city_admin for their city)
export const getCityStats = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;
  
  // City admins can only see stats for their assigned city
  if (currentUser.role === 'city_admin') {
    if (!currentUser.cityId || currentUser.cityId.toString() !== id) {
      return next(new AppError('You can only view statistics for your assigned city', 403));
    }
  }
  
  const city = await City.findById(id);
  if (!city) {
    return next(new AppError('City not found', 404));
  }
  
  // Get statistics
  const stats = await Promise.all([
    // Count users by role in this city
    User.countDocuments({ cityId: id, role: 'city_admin' }),
    User.countDocuments({ cityId: id, role: 'owner' }),
    User.countDocuments({ cityId: id, role: 'customer' }),
    
    // Count users by status in this city
    User.countDocuments({ cityId: id, status: 'active' }),
    User.countDocuments({ cityId: id, status: 'inactive' }),
    User.countDocuments({ cityId: id, status: 'pending_approval' }),
    
    // Total users in city
    User.countDocuments({ cityId: id })
  ]);
  
  const [
    adminCount,
    ownerCount, 
    customerCount,
    activeCount,
    inactiveCount,
    pendingCount,
    totalUsers
  ] = stats;
  
  const cityStats = {
    city: {
      id: city._id,
      name: city.name
    },
    users: {
      total: totalUsers,
      byRole: {
        admin: adminCount,
        owner: ownerCount,
        customer: customerCount
      },
      byStatus: {
        active: activeCount,
        inactive: inactiveCount,
        pending: pendingCount
      }
    },
    // Future: properties, bookings, etc.
    properties: {
      total: 0, // Placeholder for future implementation
      byType: {
        hotel: 0,
        apartment: 0,
        chalet: 0,
        hall: 0
      }
    }
  };
  
  sendResponse(res, 200, 'success', 'City statistics retrieved successfully', { stats: cityStats });
});

// @desc    Search cities by name
// @route   GET /api/cities/search
// @access  Public
export const searchCities = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;
  
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }
  
  // Search cities by name (case-insensitive, partial match)
  const cities = await City.find({
    name: { $regex: q, $options: 'i' }
  })
  .sort({ name: 1 })
  .limit(parseInt(limit));
  
  sendResponse(res, 200, 'success', 'Cities search completed', { 
    cities,
    query: q,
    count: cities.length
  });
});
