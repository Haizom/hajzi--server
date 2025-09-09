import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import City from '../models/City.js';
import Amenity from '../models/Amenity.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import { deleteHotelImages } from '../middleware/upload.js';

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private (owner, super_admin)
export const createHotel = asyncHandler(async (req, res, next) => {
  const {
    name,
    cityId,
    description,
    location,
    stars,
    roomsNumber,
    fromCityCenter,
    fromAirport,
    checkIn,
    checkOut,
    cancellation,
    notAllowed,
    paymentMethods,
    paymentTerms,
    amenityIds,
    mainImage,
    secondaryImages
  } = req.body;

  // Set ownerId based on user role
  let ownerId;
  if (req.user.role === 'super_admin') {
    // Super admin can specify ownerId or use their own ID
    ownerId = req.body.ownerId || req.user._id;
    
    // Validate the specified owner exists and has owner role
    if (req.body.ownerId) {
      const owner = await User.findById(req.body.ownerId);
      if (!owner || owner.role !== 'owner') {
        return next(new AppError('Specified owner not found or invalid role', 400));
      }
    }
  } else {
    // Owner can only create hotels for themselves
    ownerId = req.user._id;
  }

  // Check for duplicate hotel (same owner, name, city)
  const existingHotel = await Hotel.findOne({
    ownerId,
    name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive
    cityId
  });

  if (existingHotel) {
    return next(new AppError('A hotel with this name already exists in this city for this owner', 400));
  }

  // Validate city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new AppError('City not found', 404));
  }

  // Validate amenities exist if provided
  if (amenityIds && amenityIds.length > 0) {
    const amenities = await Amenity.find({ _id: { $in: amenityIds } });
    if (amenities.length !== amenityIds.length) {
      return next(new AppError('One or more amenities not found', 400));
    }
  }

  // Create hotel
  const hotel = await Hotel.create({
    name,
    cityId,
    ownerId,
    description,
    location,
    stars,
    roomsNumber,
    fromCityCenter,
    fromAirport,
    checkIn,
    checkOut,
    cancellation,
    notAllowed: notAllowed || [],
    paymentMethods: paymentMethods || ['cash'],
    paymentTerms,
    amenityIds: amenityIds || [],
    mainImage,
    secondaryImages: secondaryImages || []
  });

  // Populate references for response
  await hotel.populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 201, 'success', 'Hotel created successfully', { hotel });
});

// @desc    Get all hotels (public)
// @route   GET /api/hotels
// @access  Public
export const getAllHotels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    cityId,
    starsMin,
    starsMax,
    amenityIds,
    priceMin,
    priceMax,
    currency,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // Build filter for public hotels
  const filter = {
    status: 'approved',
    isVisible: true
  };

  // Add search filter
  if (search) {
    filter.$text = { $search: search };
  }

  // Add city filter
  if (cityId) {
    filter.cityId = cityId;
  }

  // Add star rating filter
  if (starsMin || starsMax) {
    filter.stars = {};
    if (starsMin) filter.stars.$gte = parseInt(starsMin);
    if (starsMax) filter.stars.$lte = parseInt(starsMax);
  }

  // Add amenity filter
  if (amenityIds) {
    const amenityArray = amenityIds.split(',');
    filter.amenityIds = { $in: amenityArray };
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort object
  const sort = {};
  if (search && filter.$text) {
    sort.score = { $meta: 'textScore' };
  }
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;

  // If price filtering is needed, use aggregation
  if (priceMin || priceMax || currency) {
    const Room = mongoose.model('Room');
    
    // Build room filter for price range
    const roomFilter = { status: 'visible' };
    if (currency) {
      roomFilter.currency = currency;
    }
    if (priceMin || priceMax) {
      roomFilter.basePrice = {};
      if (priceMin) roomFilter.basePrice.$gte = parseFloat(priceMin);
      if (priceMax) roomFilter.basePrice.$lte = parseFloat(priceMax);
    }

    // Get hotel IDs that have rooms matching the price criteria
    const roomsWithPriceFilter = await Room.find(roomFilter).distinct('hotelId');
    
    // Add hotel ID filter to main filter
    filter._id = { $in: roomsWithPriceFilter };
  }

  // Execute query
  const [hotels, totalCount] = await Promise.all([
    Hotel.find(filter)
      .populate('city', 'name')
      .populate({
        path: 'amenityIds',
        select: 'name',
        model: 'Amenity'
      })
      .select('name mainImage description location stars roomsNumber fromCityCenter fromAirport confirmed createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Hotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'Hotels retrieved successfully', {
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

// @desc    Get hotel by ID
// @route   GET /api/hotels/:id
// @access  Public (approved+visible), Private (owner+admin for any status)
export const getHotelById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  let hotel = await Hotel.findById(id)
    .populate('city', 'name')
    .populate('owner', 'fullName email phone')
    .populate({
      path: 'amenityIds',
      select: 'name',
      model: 'Amenity'
    });

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Check access permissions
  if (!currentUser) {
    // Public access - only approved and visible hotels
    if (!hotel.isPubliclyVisible()) {
      return next(new AppError('Hotel not found', 404));
    }
  } else {
    // Authenticated user access
    const canViewAnyStatus = currentUser.role === 'super_admin' || 
                            hotel.isOwnedBy(currentUser._id);
    
    if (!canViewAnyStatus && !hotel.isPubliclyVisible()) {
      return next(new AppError('Hotel not found', 404));
    }
  }

  sendResponse(res, 200, 'success', 'Hotel retrieved successfully', { hotel });
});

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private (owner of hotel)
export const updateHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Check ownership or super admin status
  if (!hotel.isOwnedBy(currentUser._id) && currentUser.role !== 'super_admin') {
    return next(new AppError('You can only update your own hotels', 403));
  }

  // Prevent updating status and confirmed fields for regular owners
  // Super admins can update status
  let updateData;
  let cityId;
  
  if (currentUser.role === 'super_admin') {
    const { confirmed, ownerId, cityId: cityIdFromBody, ...data } = req.body;
    updateData = data; // Allow status updates for super admin
    cityId = cityIdFromBody;
  } else {
    const { status, confirmed, ownerId, cityId: cityIdFromBody, ...data } = req.body;
    updateData = data; // Prevent status updates for regular owners
    cityId = cityIdFromBody;
  }

  // Validate city if provided (but prevent changing it for existing hotels)
  if (cityId && cityId !== hotel.cityId.toString()) {
    return next(new AppError('Cannot change hotel city after creation', 400));
  }

  // Validate amenities if provided
  if (updateData.amenityIds && updateData.amenityIds.length > 0) {
    const amenities = await Amenity.find({ _id: { $in: updateData.amenityIds } });
    if (amenities.length !== updateData.amenityIds.length) {
      return next(new AppError('One or more amenities not found', 400));
    }
  }

  // Check for name uniqueness if name is being updated
  if (updateData.name && updateData.name !== hotel.name) {
    const existingHotel = await Hotel.findOne({
      ownerId: hotel.ownerId,
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
      cityId: hotel.cityId,
      _id: { $ne: id }
    });

    if (existingHotel) {
      return next(new AppError('A hotel with this name already exists in this city', 400));
    }
  }

  // Update hotel
  const updatedHotel = await Hotel.findByIdAndUpdate(
    id,
    updateData,
    { 
      new: true, 
      runValidators: true 
    }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenityIds', select: 'name', model: 'Amenity' }
  ]);

  sendResponse(res, 200, 'success', 'Hotel updated successfully', { hotel: updatedHotel });
});

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private (super_admin only)
export const deleteHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Delete associated images
  const imagesToDelete = [hotel.mainImage, ...hotel.secondaryImages];
  deleteHotelImages(imagesToDelete);

  // Delete hotel
  await Hotel.findByIdAndDelete(id);

  sendResponse(res, 200, 'success', 'Hotel deleted successfully');
});

// @desc    Approve hotel
// @route   POST /api/hotels/:id/approve
// @access  Private (super_admin only)
export const approveHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { status: 'approved' },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenityIds', select: 'name', model: 'Amenity' }
  ]);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  sendResponse(res, 200, 'success', 'Hotel approved successfully', { hotel });
});

// @desc    Reject hotel
// @route   POST /api/hotels/:id/reject
// @access  Private (super_admin only)
export const rejectHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { status: 'rejected' },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenityIds', select: 'name', model: 'Amenity' }
  ]);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  sendResponse(res, 200, 'success', 'Hotel rejected successfully', { hotel });
});

// @desc    Confirm hotel (verified badge)
// @route   POST /api/hotels/:id/confirm
// @access  Private (super_admin only)
export const confirmHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { confirmed: true },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenityIds', select: 'name', model: 'Amenity' }
  ]);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  sendResponse(res, 200, 'success', 'Hotel confirmed successfully', { hotel });
});

// @desc    Unconfirm hotel (remove verified badge)
// @route   POST /api/hotels/:id/unconfirm
// @access  Private (super_admin only)
export const unconfirmHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { confirmed: false },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenities', select: 'name' }
  ]);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  sendResponse(res, 200, 'success', 'Hotel unconfirmed successfully', { hotel });
});

// @desc    Show hotel (make visible)
// @route   POST /api/hotels/:id/show
// @access  Private (owner of hotel)
export const showHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Check ownership
  if (!hotel.isOwnedBy(currentUser._id)) {
    return next(new AppError('You can only show/hide your own hotels', 403));
  }

  // Can only show approved hotels
  if (hotel.status !== 'approved') {
    return next(new AppError('Only approved hotels can be made visible', 400));
  }

  const updatedHotel = await Hotel.findByIdAndUpdate(
    id,
    { isVisible: true },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 200, 'success', 'Hotel is now visible', { hotel: updatedHotel });
});

// @desc    Hide hotel (make invisible)
// @route   POST /api/hotels/:id/hide
// @access  Private (owner of hotel)
export const hideHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Check ownership
  if (!hotel.isOwnedBy(currentUser._id)) {
    return next(new AppError('You can only show/hide your own hotels', 403));
  }

  const updatedHotel = await Hotel.findByIdAndUpdate(
    id,
    { isVisible: false },
    { new: true, runValidators: true }
  ).populate([
    { path: 'city', select: 'name' },
    { path: 'owner', select: 'fullName email' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 200, 'success', 'Hotel is now hidden', { hotel: updatedHotel });
});

// @desc    Get owner's hotels
// @route   GET /api/owner/hotels
// @access  Private (owner)
export const getOwnerHotels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    visibility
  } = req.query;

  const ownerId = req.user._id;

  // Build filter
  const filter = { ownerId };

  if (status) {
    filter.status = status;
  }

  if (visibility !== undefined) {
    filter.isVisible = visibility === 'true';
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Execute query
  const [hotels, totalCount] = await Promise.all([
    Hotel.find(filter)
      .populate('city', 'name')
      .populate({
        path: 'amenityIds',
        select: 'name',
        model: 'Amenity'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Hotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'Owner hotels retrieved successfully', {
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

// @desc    Get admin queue (pending hotels)
// @route   GET /api/admin/hotels
// @access  Private (super_admin)
export const getAdminHotels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    search,
    cityId
  } = req.query;

  // Build filter - only apply status filter if specified
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (cityId && cityId !== 'all') {
    filter.cityId = cityId;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort
  const sort = { createdAt: -1 };

  // Execute query
  const [hotels, totalCount] = await Promise.all([
    Hotel.find(filter)
      .populate('city', 'name')
      .populate('owner', 'fullName email phone')
      .populate({
        path: 'amenityIds',
        select: 'name',
        model: 'Amenity'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Hotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'Admin hotels retrieved successfully', {
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

// @desc    Get hotels for city admin dashboard (with city filtering)
// @route   GET /api/hotels/cityadmin/all
// @access  Private (city_admin for their city)
export const getCityAdminHotels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    status,
    ownerId,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // City admins can only see hotels in their assigned city
  if (req.user.role === 'city_admin') {
    if (!req.user.cityId) {
      return next(new AppError('City admin must have an assigned city', 403));
    }
  }

  // Build filter
  const filter = {};
  
  // Always filter by city for city admin
  if (req.user.role === 'city_admin') {
    filter.cityId = req.user.cityId;
  }

  // Add status filter if specified
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Add owner filter if specified
  if (ownerId && ownerId !== 'all') {
    filter.ownerId = ownerId;
  }

  // Add search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortDir === 'desc' ? -1 : 1;

  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Execute query with comprehensive population
  const [hotels, totalCount] = await Promise.all([
    Hotel.find(filter)
      .populate('ownerId', 'fullName email phone whatsappNumber')
      .populate('cityId', 'name')
      .populate('amenityIds', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Hotel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'City admin hotels retrieved successfully', {
    hotels,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      pageSize: parseInt(pageSize),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});