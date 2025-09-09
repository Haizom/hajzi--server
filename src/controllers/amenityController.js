import Amenity from '../models/Amenity.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

// @desc    Get all amenities
// @route   GET /api/v1/amenities
// @access  Public
export const getAllAmenities = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    search,
    sort = 'name'
  } = req.query;

  // Build query
  const query = {};
  
  // Search functionality
  if (search) {
    query.name = {
      $regex: search,
      $options: 'i'
    };
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const amenities = await Amenity.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Amenity.countDocuments(query);

  sendResponse(res, 200, 'success', 'Amenities retrieved successfully', {
    amenities,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalAmenities: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get single amenity
// @route   GET /api/v1/amenities/:id
// @access  Public
export const getAmenityById = asyncHandler(async (req, res, next) => {
  const amenity = await Amenity.findById(req.params.id);

  if (!amenity) {
    return next(new AppError('Amenity not found', 404));
  }

  sendResponse(res, 200, 'success', 'Amenity retrieved successfully', {
    amenity
  });
});

// @desc    Search amenities by name
// @route   GET /api/v1/amenities/search
// @access  Public
export const searchAmenities = asyncHandler(async (req, res, next) => {
  const { q: query, limit = 10 } = req.query;

  if (!query) {
    return next(new AppError('Search query is required', 400));
  }

  const amenities = await Amenity.find({
    name: {
      $regex: query,
      $options: 'i'
    }
  })
    .limit(parseInt(limit))
    .sort('name');

  const count = amenities.length;

  sendResponse(res, 200, 'success', 'Amenities found successfully', {
    amenities,
    query,
    count
  });
});

// @desc    Create new amenity
// @route   POST /api/v1/amenities
// @access  Private (Super Admin only)
export const createAmenity = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  // Check if amenity already exists (case-insensitive)
  const existingAmenity = await Amenity.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  });

  if (existingAmenity) {
    return next(new AppError('Amenity with this name already exists', 400));
  }

  const amenity = await Amenity.create({
    name: name.trim()
  });

  sendResponse(res, 201, 'success', 'Amenity created successfully', {
    amenity
  });
});

// @desc    Update amenity
// @route   PATCH /api/v1/amenities/:id
// @access  Private (Super Admin only)
export const updateAmenity = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  // Check if amenity exists
  const amenity = await Amenity.findById(req.params.id);
  if (!amenity) {
    return next(new AppError('Amenity not found', 404));
  }

  // Check if another amenity with the same name exists (case-insensitive)
  if (name && name !== amenity.name) {
    const existingAmenity = await Amenity.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingAmenity) {
      return next(new AppError('Amenity with this name already exists', 400));
    }
  }

  // Update amenity
  const updatedAmenity = await Amenity.findByIdAndUpdate(
    req.params.id,
    { name: name?.trim() },
    {
      new: true,
      runValidators: true
    }
  );

  sendResponse(res, 200, 'success', 'Amenity updated successfully', {
    amenity: updatedAmenity
  });
});

// @desc    Delete amenity
// @route   DELETE /api/v1/amenities/:id
// @access  Private (Super Admin only)
export const deleteAmenity = asyncHandler(async (req, res, next) => {
  const amenity = await Amenity.findById(req.params.id);

  if (!amenity) {
    return next(new AppError('Amenity not found', 404));
  }

  await Amenity.findByIdAndDelete(req.params.id);

  sendResponse(res, 200, 'success', 'Amenity deleted successfully', {});
});

// @desc    Get amenities statistics
// @route   GET /api/v1/amenities/stats
// @access  Private (Super Admin only)
export const getAmenitiesStats = asyncHandler(async (req, res, next) => {
  const stats = await Amenity.aggregate([
    {
      $group: {
        _id: null,
        totalAmenities: { $sum: 1 },
        averageNameLength: { $avg: { $strLenCP: '$name' } }
      }
    },
    {
      $project: {
        _id: 0,
        totalAmenities: 1,
        averageNameLength: { $round: ['$averageNameLength', 2] }
      }
    }
  ]);

  const recentAmenities = await Amenity.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name createdAt');

  sendResponse(res, 200, 'success', 'Amenities statistics retrieved successfully', {
    stats: stats[0] || { totalAmenities: 0, averageNameLength: 0 },
    recentAmenities
  });
});
