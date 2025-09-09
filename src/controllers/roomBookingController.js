import RoomBooking from '../models/RoomBooking.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

// @desc    Create new room booking
// @route   POST /api/room-bookings
// @access  Private (customer)
export const createRoomBooking = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    guestName,
    phoneNumber,
    discountCode,
    checkIn,
    checkOut,
    adults,
    children,
    notes,
    roomId
  } = req.body;

  const userId = req.user._id;

  // First get the room to extract hotelId
  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  const hotelId = room.hotelId;

  // Now get hotel and owner details
  const hotel = await Hotel.findById(hotelId).populate({
    path: 'ownerId',
    select: 'fullName email phone whatsappNumber role'
  });

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  if (!hotel.isVisible || hotel.status !== 'approved') {
    return next(new AppError('Hotel is not available for booking', 400));
  }

  const owner = hotel.ownerId;

  // Validate owner exists and has owner role
  if (!owner) {
    return next(new AppError('Hotel owner not found', 400));
  }

  if (owner.role !== 'owner') {
    return next(new AppError('Hotel owner does not have owner role', 400));
  }

  // Generate WhatsApp link from owner's WhatsApp number
  let ownerWhatsappLink = null;
  if (owner.whatsappNumber) {
    // Format WhatsApp number for link
    let whatsappNumber = owner.whatsappNumber.replace(/\s/g, '').replace(/[^\d+]/g, '');
    
    // Ensure it starts with +967
    if (whatsappNumber.startsWith('+967')) {
      // Already formatted correctly
    } else if (whatsappNumber.startsWith('967')) {
      whatsappNumber = '+' + whatsappNumber;
    } else if (whatsappNumber.length === 9 && /^[0-9]{9}$/.test(whatsappNumber)) {
      whatsappNumber = '+967' + whatsappNumber;
    }
    
    // Create WhatsApp link
    ownerWhatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}`;
  }

  // Check room availability
  const conflictingBookings = await RoomBooking.checkRoomAvailability(
    roomId,
    new Date(checkIn),
    new Date(checkOut)
  );

  if (conflictingBookings.length > 0) {
    return next(new AppError('Room is not available for the selected dates', 400));
  }

  // Calculate price
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const price = room.basePrice * nights;

  // Create booking with auto-found hotelId and ownerId
  const booking = await RoomBooking.create({
    fullName,
    guestName,
    phoneNumber,
    discountCode,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    adults,
    children,
    notes,
    userId,
    ownerId: owner._id, // Auto-found from room -> hotel -> owner
    roomId,
    hotelId: hotelId, // Auto-found from room -> hotel
    price,
    ownerWhatsappLink // Auto-generated from owner's WhatsApp number
  });

  // Populate references for response with comprehensive data
  await booking.populate([
    { 
      path: 'userId', 
      select: 'fullName email phone' 
    },
    { 
      path: 'ownerId', 
      select: 'fullName email phone whatsappNumber' 
    },
    { 
      path: 'roomId', 
      select: 'name basePrice capacity numberOfBeds numberOfBathrooms roomSize images currency moreInfo amenityIds',
      populate: {
        path: 'amenityIds',
        select: 'name'
      }
    },
    { 
      path: 'hotelId', 
      select: 'name mainImage secondaryImages location stars description cityId',
      populate: {
        path: 'cityId',
        select: 'name'
      }
    }
  ]);

  sendResponse(res, 201, 'success', 'Room booking created successfully', { booking });
});

// @desc    Get user's own bookings
// @route   GET /api/room-bookings/my-bookings
// @access  Private (customer)
export const getMyBookings = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  const userId = req.user._id;

  // Build filter
  const filter = { userId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort
  const sort = {};
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;

  // Execute query with comprehensive population
  const [bookings, totalCount] = await Promise.all([
    RoomBooking.find(filter)
      .populate({
        path: 'roomId',
        select: 'name basePrice capacity numberOfBeds numberOfBathrooms roomSize images currency moreInfo amenityIds',
        populate: {
          path: 'amenityIds',
          select: 'name'
        }
      })
      .populate({
        path: 'hotelId',
        select: 'name mainImage secondaryImages location stars description cityId',
        populate: {
          path: 'cityId',
          select: 'name'
        }
      })
      .populate('ownerId', 'fullName email phone whatsappNumber')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    RoomBooking.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'User bookings retrieved successfully', {
    bookings,
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

// @desc    Get booking by ID
// @route   GET /api/room-bookings/:id
// @access  Private (customer for own bookings, owner/super_admin for hotel bookings)
export const getBookingById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const booking = await RoomBooking.findById(id)
    .populate('userId', 'fullName email phone')
    .populate('ownerId', 'fullName email phone whatsappNumber')
    .populate({
      path: 'roomId',
      select: 'name basePrice capacity numberOfBeds numberOfBathrooms roomSize images currency moreInfo amenityIds',
      populate: {
        path: 'amenityIds',
        select: 'name'
      }
    })
    .populate({
      path: 'hotelId',
      select: 'name mainImage secondaryImages location stars description cityId',
      populate: {
        path: 'cityId',
        select: 'name'
      }
    });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check access permissions
  const canView = booking.isOwnedByUser(currentUser._id) || 
                  booking.isOwnedByHotelOwner(currentUser._id) ||
                  currentUser.role === 'super_admin';

  if (!canView) {
    return next(new AppError('You do not have permission to view this booking', 403));
  }

  sendResponse(res, 200, 'success', 'Booking retrieved successfully', { booking });
});

// @desc    Update booking
// @route   PUT /api/room-bookings/:id
// @access  Private (customer for own bookings)
export const updateBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const booking = await RoomBooking.findById(id);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check ownership
  if (!booking.isOwnedByUser(currentUser._id)) {
    return next(new AppError('You can only update your own bookings', 403));
  }

  // Check if booking can be modified
  if (!booking.canBeModified()) {
    return next(new AppError('This booking cannot be modified. Check-in is too soon or booking is not in pending status', 400));
  }

  // Prevent updating certain fields
  const {
    status,
    price,
    userId,
    ownerId,
    ...updateData
  } = req.body;

  // Validate room availability if dates or room are being changed
  if (updateData.checkIn || updateData.checkOut || updateData.roomId) {
    const checkInDate = updateData.checkIn ? new Date(updateData.checkIn) : booking.checkIn;
    const checkOutDate = updateData.checkOut ? new Date(updateData.checkOut) : booking.checkOut;
    const roomId = updateData.roomId || booking.roomId;

    const conflictingBookings = await RoomBooking.checkRoomAvailability(
      roomId,
      checkInDate,
      checkOutDate,
      id
    );

    if (conflictingBookings.length > 0) {
      return next(new AppError('Room is not available for the selected dates', 400));
    }

    // Recalculate price if dates or room changed
    if (updateData.checkIn || updateData.checkOut || updateData.roomId) {
      const room = await Room.findById(roomId);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      updateData.price = room.basePrice * nights;
    }
  }

  // Update booking
  const updatedBooking = await RoomBooking.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'userId', select: 'fullName email' },
    { path: 'ownerId', select: 'fullName email phone whatsappNumber' },
    { path: 'roomId', select: 'name basePrice capacity' },
    { path: 'hotelId', select: 'name mainImage location' }
  ]);

  sendResponse(res, 200, 'success', 'Booking updated successfully', { booking: updatedBooking });
});

// @desc    Cancel booking
// @route   DELETE /api/room-bookings/:id
// @access  Private (customer for own bookings)
export const cancelBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  const booking = await RoomBooking.findById(id);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check ownership
  if (!booking.isOwnedByUser(currentUser._id)) {
    return next(new AppError('You can only cancel your own bookings', 403));
  }

  // Check if booking can be cancelled
  if (!booking.canBeCancelled()) {
    return next(new AppError('This booking cannot be cancelled. Check-in is too soon', 400));
  }

  // Update booking status
  const updatedBooking = await RoomBooking.findByIdAndUpdate(
    id,
    { status: 'cancelled' },
    { new: true, runValidators: true }
  ).populate([
    { path: 'userId', select: 'fullName email' },
    { path: 'ownerId', select: 'fullName email phone whatsappNumber' },
    { path: 'roomId', select: 'name basePrice capacity' },
    { path: 'hotelId', select: 'name mainImage location' }
  ]);

  sendResponse(res, 200, 'success', 'Booking cancelled successfully', { booking: updatedBooking });
});

// @desc    Get owner's bookings (for hotel owners)
// @route   GET /api/room-bookings/owner/my-bookings
// @access  Private (owner)
export const getOwnerBookings = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    hotelId,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  const ownerId = req.user._id;

  // Build filter
  const filter = { ownerId };
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (hotelId && hotelId !== 'all') {
    filter.hotelId = hotelId;
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort
  const sort = {};
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;

  // Execute query
  const [bookings, totalCount] = await Promise.all([
    RoomBooking.getOwnerBookings(ownerId, filter, { sort, skip, limit }),
    RoomBooking.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'Owner bookings retrieved successfully', {
    bookings,
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

// @desc    Update booking status (for owners and super admin)
// @route   PATCH /api/room-bookings/:id/status
// @access  Private (owner, super_admin)
export const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const currentUser = req.user;

  const booking = await RoomBooking.findById(id);
  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check permissions
  const canUpdateStatus = booking.isOwnedByHotelOwner(currentUser._id) || 
                         currentUser.role === 'super_admin';

  if (!canUpdateStatus) {
    return next(new AppError('You can only update bookings for your hotels', 403));
  }

  // Validate status
  if (!['pending', 'confirmed', 'cancelled', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status. Must be one of: pending, confirmed, cancelled, rejected', 400));
  }

  // Update booking status
  const updatedBooking = await RoomBooking.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate([
    { path: 'userId', select: 'fullName email phone' },
    { path: 'ownerId', select: 'fullName email phone whatsappNumber' },
    { path: 'roomId', select: 'name basePrice capacity' },
    { path: 'hotelId', select: 'name mainImage location' }
  ]);

  sendResponse(res, 200, 'success', 'Booking status updated successfully', { booking: updatedBooking });
});

// @desc    Get all bookings (for super admin)
// @route   GET /api/room-bookings/admin/all
// @access  Private (super_admin)
export const getAllBookings = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    hotelId,
    ownerId,
    search,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (hotelId && hotelId !== 'all') {
    filter.hotelId = hotelId;
  }
  if (ownerId && ownerId !== 'all') {
    filter.ownerId = ownerId;
  }

  // Add search filter
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { guestName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Build sort
  const sort = {};
  sort[sortBy] = sortDir === 'asc' ? 1 : -1;

  // Execute query using the same comprehensive method as owner bookings
  // Pass null as ownerId for SuperAdmin to get all bookings with same data structure
  const [bookings, totalCount] = await Promise.all([
    RoomBooking.getOwnerBookings(null, filter, { sort, skip, limit }),
    RoomBooking.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'All bookings retrieved successfully', {
    bookings,
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

// @desc    Get booking statistics
// @route   GET /api/room-bookings/admin/stats
// @access  Private (super_admin)
export const getBookingStats = asyncHandler(async (req, res, next) => {
  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    rejectedBookings,
    totalRevenue
  ] = await Promise.all([
    RoomBooking.countDocuments(),
    RoomBooking.countDocuments({ status: 'pending' }),
    RoomBooking.countDocuments({ status: 'confirmed' }),
    RoomBooking.countDocuments({ status: 'cancelled' }),
    RoomBooking.countDocuments({ status: 'rejected' }),
    RoomBooking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ])
  ]);

  const stats = {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    rejectedBookings,
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
  };

  sendResponse(res, 200, 'success', 'Booking statistics retrieved successfully', { stats });
});

// @desc    Get bookings for city admin dashboard (filtered by city)
// @route   GET /api/room-bookings/cityadmin/all
// @access  Private (city_admin for their city)
export const getCityAdminBookings = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    search,
    sortBy = 'createdAt',
    sortDir = 'desc'
  } = req.query;

  // City admins can only see bookings for hotels in their assigned city
  if (req.user.role === 'city_admin') {
    if (!req.user.cityId) {
      return next(new AppError('City admin must have an assigned city', 403));
    }
  }

  // Get hotels in the city admin's city first
  const cityHotels = await Hotel.find({ cityId: req.user.cityId }).select('_id');
  const hotelIds = cityHotels.map(hotel => hotel._id);

  // Build filter for bookings
  let filter = {
    hotelId: { $in: hotelIds }
  };

  // Add status filter if specified
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Add search filter
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { guestName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortDir === 'desc' ? -1 : 1;

  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  // Execute query with comprehensive population
  const [bookings, totalCount] = await Promise.all([
    RoomBooking.find(filter)
      .populate('userId', 'fullName email phone')
      .populate('ownerId', 'fullName email phone whatsappNumber')
      .populate({
        path: 'roomId',
        select: 'name basePrice capacity numberOfBeds numberOfBathrooms roomSize images currency moreInfo amenityIds',
        populate: {
          path: 'amenityIds',
          select: 'name'
        }
      })
      .populate({
        path: 'hotelId',
        select: 'name mainImage secondaryImages location stars description cityId',
        populate: {
          path: 'cityId',
          select: 'name'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    RoomBooking.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  sendResponse(res, 200, 'success', 'City admin bookings retrieved successfully', {
    bookings,
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
