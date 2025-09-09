import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import Amenity from '../models/Amenity.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import { deleteRoomImages } from '../middleware/upload.js';

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (owner, super_admin)
export const createRoom = asyncHandler(async (req, res, next) => {
  const {
    hotelId,
    name,
    description,
    numberOfBeds,
    numberOfBathrooms,
    roomSize,
    moreInfo,
    basePrice,
    currency,
    capacity,
    images,
    unavailableDates,
    amenityIds
  } = req.body;

  // Check if user can create room for this hotel
  let canCreate = false;
  
  if (req.user.role === 'super_admin') {
    canCreate = true;
  } else if (req.user.role === 'owner') {
    // Check if user owns the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }
    if (hotel.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only create rooms for hotels you own', 403));
    }
    canCreate = true;
  }

  if (!canCreate) {
    return next(new AppError('You do not have permission to create rooms', 403));
  }

  // Check for duplicate room name within the same hotel
  const existingRoom = await Room.findOne({
    hotelId,
    name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive
  });

  if (existingRoom) {
    return next(new AppError('A room with this name already exists in this hotel', 400));
  }

  // Validate hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Validate amenities exist if provided
  if (amenityIds && amenityIds.length > 0) {
    const amenities = await Amenity.find({ _id: { $in: amenityIds } });
    if (amenities.length !== amenityIds.length) {
      return next(new AppError('One or more amenities not found', 400));
    }
  }

  // Normalize unavailableDates to day-start UTC
  let normalizedDates = [];
  if (unavailableDates && unavailableDates.length > 0) {
    normalizedDates = [...new Set(
      unavailableDates.map(date => {
        const utcDate = new Date(date);
        utcDate.setUTCHours(0, 0, 0, 0);
        return utcDate;
      })
    )].sort();
  }

  // Create room
  const room = await Room.create({
    hotelId,
    name,
    description,
    numberOfBeds,
    numberOfBathrooms,
    roomSize,
    moreInfo: moreInfo || [],
    basePrice,
    currency,
    capacity,
    images: images || [],
    unavailableDates: normalizedDates,
    amenityIds: amenityIds || []
  });

  // Populate references for response
  await room.populate([
    { path: 'hotel', select: 'name status isVisible' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 201, 'success', 'Room created successfully', { room });
});

// @desc    Update room
// @route   PATCH /api/rooms/:roomId
// @access  Private (owner, super_admin)
export const updateRoom = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const updateData = req.body;

  // Find room and check permissions
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  // Check if user can update this room
  let canUpdate = false;
  
  if (req.user.role === 'super_admin') {
    canUpdate = true;
  } else if (req.user.role === 'owner') {
    // Check if user owns the hotel
    const hotel = await Hotel.findById(room.hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }
    if (hotel.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only update rooms in hotels you own', 403));
    }
    canUpdate = true;
  }

  if (!canUpdate) {
    return next(new AppError('You do not have permission to update this room', 403));
  }

  // Check for duplicate room name if name is being updated
  if (updateData.name && updateData.name !== room.name) {
    const existingRoom = await Room.findOne({
      hotelId: room.hotelId,
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
      _id: { $ne: roomId }
    });

    if (existingRoom) {
      return next(new AppError('A room with this name already exists in this hotel', 400));
    }
  }

  // Validate amenities exist if provided
  if (updateData.amenityIds && updateData.amenityIds.length > 0) {
    const amenities = await Amenity.find({ _id: { $in: updateData.amenityIds } });
    if (amenities.length !== updateData.amenityIds.length) {
      return next(new AppError('One or more amenities not found', 400));
    }
  }

  // Update room
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'hotel', select: 'name status isVisible' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 200, 'success', 'Room updated successfully', { room: updatedRoom });
});

// @desc    Edit room availability
// @route   PATCH /api/rooms/:roomId/availability
// @access  Private (owner, super_admin)
export const editRoomAvailability = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const { unavailableDates } = req.body;

  if (!unavailableDates || !Array.isArray(unavailableDates)) {
    return next(new AppError('Unavailable dates array is required', 400));
  }

  // Find room and check permissions
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  // Check if user can update this room
  let canUpdate = false;
  
  if (req.user.role === 'super_admin') {
    canUpdate = true;
  } else if (req.user.role === 'owner') {
    // Check if user owns the hotel
    const hotel = await Hotel.findById(room.hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }
    if (hotel.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only update rooms in hotels you own', 403));
    }
    canUpdate = true;
  }

  if (!canUpdate) {
    return next(new AppError('You do not have permission to update this room', 403));
  }

  // Normalize and deduplicate unavailableDates
  const normalizedDates = [...new Set(
    unavailableDates.map(date => {
      const utcDate = new Date(date);
      utcDate.setUTCHours(0, 0, 0, 0);
      return utcDate;
    })
  )].sort();

  // Update room availability
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    { unavailableDates: normalizedDates },
    { new: true, runValidators: true }
  ).populate([
    { path: 'hotel', select: 'name status isVisible' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 200, 'success', 'Room availability updated successfully', { room: updatedRoom });
});

// @desc    Show/Hide room
// @route   PATCH /api/rooms/:roomId/visibility
// @access  Private (owner, super_admin)
export const toggleRoomVisibility = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const { status } = req.body;

  if (!status || !['visible', 'hidden'].includes(status)) {
    return next(new AppError('Status must be either "visible" or "hidden"', 400));
  }

  // Find room and check permissions
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  // Check if user can update this room
  let canUpdate = false;
  
  if (req.user.role === 'super_admin') {
    canUpdate = true;
  } else if (req.user.role === 'owner') {
    // Check if user owns the hotel
    const hotel = await Hotel.findById(room.hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404));
    }
    if (hotel.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only update rooms in hotels you own', 403));
    }
    canUpdate = true;
  }

  if (!canUpdate) {
    return next(new AppError('You do not have permission to update this room', 403));
  }

  // Update room status
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    { status },
    { new: true, runValidators: true }
  ).populate([
    { path: 'hotel', select: 'name status isVisible' },
    { path: 'amenities', select: 'name' }
  ]);

  sendResponse(res, 200, 'success', `Room ${status} successfully`, { room: updatedRoom });
});

// @desc    List rooms of a hotel (public read)
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
export const getRoomsByHotel = asyncHandler(async (req, res, next) => {
  const { hotelId } = req.params;

  const {
    page = 1,
    limit = 20,
    status = 'visible'
  } = req.query;


  // Validate hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Build filter
  let filter = { hotelId };
  
  // Status filter - only show visible rooms for public users
  if (req.user) {
    // Authenticated users can see all rooms if they have permission
    if (req.user.role === 'super_admin' || 
        (req.user.role === 'owner' && hotel.ownerId.toString() === req.user._id.toString())) {
      if (status === 'all') {
        // Show all rooms
      } else if (status === 'hidden') {
        filter.status = 'hidden';
      } else {
        filter.status = 'visible';
      }
    } else {
      // Regular users only see visible rooms
      filter.status = 'visible';
    }
  } else {
    // Unauthenticated users only see visible rooms
    filter.status = 'visible';
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageLimit = parseInt(limit);

  // Execute query
  const [rooms, totalCount] = await Promise.all([
    Room.find(filter)
      .populate('hotel', 'name status isVisible')
      .populate({
        path: 'amenities',
        select: 'name',
        model: 'Amenity'
      })
      .select('name description numberOfBeds numberOfBathrooms roomSize basePrice currency capacity images status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Room.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageLimit);

  sendResponse(res, 200, 'success', 'Rooms retrieved successfully', {
    rooms,
    pagination: {
      currentPage: parseInt(page),
      pageSize: pageLimit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get room details (public read)
// @route   GET /api/rooms/:roomId
// @access  Public (visible rooms), Private (owner, super_admin for hidden rooms)
export const getRoomById = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  // Find room
  const room = await Room.findById(roomId).populate([
    { path: 'hotel', select: 'name status isVisible ownerId' },
    { path: 'amenities', select: 'name' }
  ]);

  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  // Check access permissions
  let canAccess = false;
  
  if (room.status === 'visible') {
    // Visible rooms are accessible to everyone
    canAccess = true;
  } else if (req.user) {
    // Hidden rooms - check if user has permission
    if (req.user.role === 'super_admin') {
      canAccess = true;
    } else if (req.user.role === 'owner') {
      // Check if user owns the hotel
      if (room.hotel && room.hotel.ownerId.toString() === req.user._id.toString()) {
        canAccess = true;
      }
    }
  }

  if (!canAccess) {
    return next(new AppError('You do not have permission to view this room', 403));
  }

  sendResponse(res, 200, 'success', 'Room retrieved successfully', { room });
});

// @desc    Get rooms by owner (owner dashboard)
// @route   GET /api/rooms/owner/my-rooms
// @access  Private (owner)
export const getOwnerRooms = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    hotelId,
    status
  } = req.query;

  // Build filter for owner's rooms
  const filter = {};
  
  if (hotelId) {
    // Check if user owns this hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || hotel.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Hotel not found or access denied', 404));
    }
    filter.hotelId = hotelId;
  } else {
    // Get all hotels owned by user
    const userHotels = await Hotel.find({ ownerId: req.user._id }).select('_id');
    const hotelIds = userHotels.map(hotel => hotel._id);
    filter.hotelId = { $in: hotelIds };
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageLimit = parseInt(limit);

  // Execute query
  const [rooms, totalCount] = await Promise.all([
    Room.find(filter)
      .populate('hotel', 'name status isVisible')
      .populate({
        path: 'amenities',
        select: 'name',
        model: 'Amenity'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Room.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageLimit);

  sendResponse(res, 200, 'success', 'Rooms retrieved successfully', {
    rooms,
    pagination: {
      currentPage: parseInt(page),
      pageSize: pageLimit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get all rooms (super_admin only)
// @route   GET /api/rooms/admin/all
// @access  Private (super_admin)
export const getAllRooms = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    hotelId,
    search
  } = req.query;

  // Build filter
  let filter = {};
  
  if (status && status !== 'all') {
    filter.status = status;
  }
  
  if (hotelId) {
    filter.hotelId = hotelId;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageLimit = parseInt(limit);

  // Execute query
  const [rooms, totalCount] = await Promise.all([
    Room.find(filter)
      .populate('hotel', 'name status isVisible')
      .populate({
        path: 'amenities',
        select: 'name',
        model: 'Amenity'
      })
      .select('name description numberOfBeds numberOfBathrooms roomSize basePrice currency capacity images status createdAt hotelId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Room.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageLimit);

  sendResponse(res, 200, 'success', 'Rooms retrieved successfully', {
    rooms,
    pagination: {
      currentPage: parseInt(page),
      pageSize: pageLimit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Get rooms for city admin dashboard (filtered by city)
// @route   GET /api/rooms/cityadmin/all
// @access  Private (city_admin for their city)
export const getCityAdminRooms = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // City admins can only see rooms in hotels in their assigned city
  if (req.user.role === 'city_admin') {
    if (!req.user.cityId) {
      return next(new AppError('City admin must have an assigned city', 403));
    }
  }

  // Get hotels in the city admin's city first
  const cityHotels = await Hotel.find({ cityId: req.user.cityId }).select('_id');
  const hotelIds = cityHotels.map(hotel => hotel._id);

  // Build filter for rooms
  let filter = {
    hotelId: { $in: hotelIds }
  };
  
  if (status && status !== 'all') {
    filter.status = status;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortDir === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageLimit = parseInt(limit);

  // Execute query
  const [rooms, totalCount] = await Promise.all([
    Room.find(filter)
      .populate({
        path: 'hotelId',
        select: 'name status isVisible cityId ownerId',
        populate: {
          path: 'ownerId',
          select: 'fullName email phone whatsappNumber'
        }
      })
      .populate({
        path: 'amenityIds',
        select: 'name',
        model: 'Amenity'
      })
      .select('name description numberOfBeds numberOfBathrooms roomSize basePrice currency capacity images status createdAt hotelId')
      .sort(sort)
      .skip(skip)
      .limit(pageLimit),
    Room.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageLimit);

  sendResponse(res, 200, 'success', 'City admin rooms retrieved successfully', {
    rooms,
    pagination: {
      currentPage: parseInt(page),
      pageSize: pageLimit,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

// @desc    Delete room (super_admin only)
// @route   DELETE /api/rooms/:roomId
// @access  Private (super_admin)
export const deleteRoom = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  // Find room
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  // Delete associated images
  if (room.images && room.images.length > 0) {
    deleteRoomImages(room.images);
  }

  // Delete room
  await Room.findByIdAndDelete(roomId);

  sendResponse(res, 200, 'success', 'Room deleted successfully');
});
