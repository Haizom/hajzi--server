import FeaturedHotel from '../models/FeaturedHotel.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

// @desc    Create new featured hotel
// @route   POST /api/featured-hotels
// @access  Private (super_admin only)
export const createFeaturedHotel = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.body;

  // Check if hotel exists and is approved
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  if (hotel.status !== 'approved' || !hotel.isVisible) {
    return next(new AppError('Only approved and visible hotels can be featured', 400));
  }

  // Check if hotel is already featured
  const existingFeatured = await FeaturedHotel.isHotelFeatured(hotelId);
  if (existingFeatured) {
    return next(new AppError('This hotel is already featured', 400));
  }

  // Create featured hotel
  const featuredHotel = await FeaturedHotel.create({ hotelId });

  // Populate hotel details for response
  await featuredHotel.populate({
    path: 'hotelId',
    select: 'name mainImage description location stars confirmed cityId',
    populate: {
      path: 'cityId',
      select: 'name'
    }
  });

  sendResponse(res, 201, 'success', 'Hotel added to featured successfully', { featuredHotel });
});

// @desc    Get all featured hotels (public)
// @route   GET /api/featured-hotels
// @access  Public
export const getAllFeaturedHotels = asyncHandler(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const featuredHotels = await FeaturedHotel.getFeaturedHotels(parseInt(limit));

  sendResponse(res, 200, 'success', 'Featured hotels retrieved successfully', { featuredHotels });
});

// @desc    Get featured hotel by ID
// @route   GET /api/featured-hotels/:id
// @access  Public
export const getFeaturedHotelById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const featuredHotel = await FeaturedHotel.findById(id)
    .populate({
      path: 'hotelId',
      select: 'name mainImage description location stars confirmed cityId',
      populate: {
        path: 'cityId',
        select: 'name'
      }
    });

  if (!featuredHotel) {
    return next(new AppError('Featured hotel not found', 404));
  }

  sendResponse(res, 200, 'success', 'Featured hotel retrieved successfully', { featuredHotel });
});


// @desc    Delete featured hotel
// @route   DELETE /api/featured-hotels/:id
// @access  Private (super_admin only)
export const deleteFeaturedHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const featuredHotel = await FeaturedHotel.findById(id);
  if (!featuredHotel) {
    return next(new AppError('Featured hotel not found', 404));
  }

  await FeaturedHotel.findByIdAndDelete(id);

  sendResponse(res, 200, 'success', 'Featured hotel deleted successfully');
});


// @desc    Get available hotels for featuring
// @route   GET /api/featured-hotels/available-hotels
// @access  Private (super_admin only)
export const getAvailableHotels = asyncHandler(async (req, res, next) => {
  const { search, page = 1, pageSize = 20 } = req.query;

  // Build filter for approved and visible hotels
  const filter = {
    status: 'approved',
    isVisible: true
  };

  // Add search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  // Show all approved and visible hotels (including already featured ones)

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Execute query
  const [hotels, totalCount] = await Promise.all([
    Hotel.find(filter)
      .populate('cityId', 'name')
      .select('name mainImage description location stars confirmed cityId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Hotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'All hotels retrieved successfully', {
    hotels,
    pagination: {
      currentPage: parseInt(page),
      pageSize: limit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get featured hotels for admin management
// @route   GET /api/featured-hotels/admin/all
// @access  Private (super_admin only)
export const getAdminFeaturedHotels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // Build filter
  const filter = {};

  if (search) {
    // Search in hotel name through populated field
    filter['hotelId.name'] = { $regex: search, $options: 'i' };
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;

  // Execute query
  const [featuredHotels, totalCount] = await Promise.all([
    FeaturedHotel.find(filter)
      .populate({
        path: 'hotelId',
        select: 'name mainImage description location stars confirmed cityId',
        populate: {
          path: 'cityId',
          select: 'name'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    FeaturedHotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'Admin featured hotels retrieved successfully', {
    featuredHotels,
    pagination: {
      currentPage: parseInt(page),
      pageSize: limit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});
