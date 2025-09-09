import mongoose from 'mongoose';

const roomBookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  guestName: {
    type: String,
    required: [true, 'Guest name is required'],
    trim: true,
    maxlength: [100, 'Guest name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        // Yemen phone number format (+967 or 967 followed by 9 digits)
        return /^(\+?967|967)?[0-9]{9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid Yemen phone number'
    }
  },
  discountCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Discount code cannot exceed 50 characters']
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required'],
    validate: {
      validator: function(v) {
        // Check-in date should be in the future
        return v > new Date();
      },
      message: 'Check-in date must be in the future'
    }
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required'],
    validate: {
      validator: function(v) {
        // Check-out date should be after check-in date
        return v > this.checkIn;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  adults: {
    type: Number,
    required: [true, 'Number of adults is required'],
    min: [1, 'Number of adults must be at least 1'],
    max: [20, 'Number of adults cannot exceed 20'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Number of adults must be a positive integer'
    }
  },
  children: {
    type: Number,
    required: [true, 'Number of children is required'],
    min: [0, 'Number of children cannot be negative'],
    max: [10, 'Number of children cannot exceed 10'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Number of children must be a non-negative integer'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'rejected'],
      message: 'Status must be one of: pending, confirmed, cancelled, rejected'
    },
    default: 'pending'
  },
  ownerWhatsappLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Basic WhatsApp link validation
        return /^https:\/\/wa\.me\/\d+(\?text=.*)?$/.test(v);
      },
      message: 'Please provide a valid WhatsApp link'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
roomBookingSchema.index({ userId: 1, createdAt: -1 }); // User's bookings
roomBookingSchema.index({ ownerId: 1, createdAt: -1 }); // Owner's bookings
roomBookingSchema.index({ hotelId: 1, status: 1 }); // Hotel bookings by status
roomBookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 }); // Room availability
roomBookingSchema.index({ status: 1, createdAt: -1 }); // Status-based queries
roomBookingSchema.index({ checkIn: 1, checkOut: 1 }); // Date range queries

// Virtual for user details
roomBookingSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for owner details
roomBookingSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for room details
roomBookingSchema.virtual('room', {
  ref: 'Room',
  localField: 'roomId',
  foreignField: '_id',
  justOne: true
});

// Virtual for hotel details
roomBookingSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

// Virtual for number of nights
roomBookingSchema.virtual('nights').get(function() {
  if (!this.checkIn || !this.checkOut) return 0;
  const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Transform output for JSON responses
roomBookingSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static method to get user's bookings
roomBookingSchema.statics.getUserBookings = function(userId, filter = {}, options = {}) {
  const userFilter = {
    userId,
    ...filter
  };
  
  return this.find(userFilter, null, options)
    .populate('roomId', 'name basePrice capacity numberOfBeds roomSize images currency')
    .populate('hotelId', 'name mainImage location stars description')
    .populate('ownerId', 'fullName phone whatsappNumber')
    .sort({ createdAt: -1 });
};

// Static method to get owner's bookings
roomBookingSchema.statics.getOwnerBookings = function(ownerId, filter = {}, options = {}) {
  const ownerFilter = ownerId ? {
    ownerId,
    ...filter
  } : filter; // For SuperAdmin, don't filter by ownerId
  
  return this.find(ownerFilter, null, options)
    .populate('userId', 'fullName email phone')
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
    .sort({ createdAt: -1 });
};

// Static method to check room availability
roomBookingSchema.statics.checkRoomAvailability = function(roomId, checkIn, checkOut, excludeBookingId = null) {
  const filter = {
    roomId,
    status: { $in: ['pending', 'confirmed'] }, // Only active bookings
    $or: [
      {
        // Check-in date overlaps with existing booking
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
      }
    ]
  };
  
  // Exclude current booking if updating
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }
  
  return this.find(filter);
};

// Instance method to check if booking is owned by user
roomBookingSchema.methods.isOwnedByUser = function(userId) {
  return this.userId.toString() === userId.toString();
};

// Instance method to check if booking is owned by hotel owner
roomBookingSchema.methods.isOwnedByHotelOwner = function(ownerId) {
  return this.ownerId.toString() === ownerId.toString();
};

// Instance method to check if booking can be cancelled
roomBookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const checkInDate = new Date(this.checkIn);
  const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
  
  // Can cancel if status is pending or confirmed, and check-in is more than 24 hours away
  return ['pending', 'confirmed'].includes(this.status) && hoursUntilCheckIn > 24;
};

// Instance method to check if booking can be modified
roomBookingSchema.methods.canBeModified = function() {
  const now = new Date();
  const checkInDate = new Date(this.checkIn);
  const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
  
  // Can modify if status is pending, and check-in is more than 48 hours away
  return this.status === 'pending' && hoursUntilCheckIn > 48;
};

// Pre-save middleware to validate business rules
roomBookingSchema.pre('save', async function(next) {
  // Calculate price based on room price and number of nights
  if (this.isModified('checkIn') || this.isModified('checkOut') || this.isModified('roomId')) {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.roomId);
    
    if (!room) {
      return next(new Error('Room not found'));
    }
    
    // Calculate number of nights
    const nights = Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
    this.price = room.basePrice * nights;
  }
  
  // Validate that the room belongs to the hotel
  if (this.isModified('roomId') || this.isModified('hotelId')) {
    const Room = mongoose.model('Room');
    const room = await Room.findById(this.roomId);
    
    if (!room || room.hotelId.toString() !== this.hotelId.toString()) {
      return next(new Error('Room does not belong to the specified hotel'));
    }
  }
  
  // Validate that the hotel belongs to the owner
  if (this.isModified('hotelId') || this.isModified('ownerId')) {
    const Hotel = mongoose.model('Hotel');
    const hotel = await Hotel.findById(this.hotelId);
    
    if (!hotel || hotel.ownerId.toString() !== this.ownerId.toString()) {
      return next(new Error('Hotel does not belong to the specified owner'));
    }
  }
  
  // Validate user exists and has customer role
  if (this.isModified('userId')) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    if (user.role !== 'customer') {
      return next(new Error('Only customers can make bookings'));
    }
  }
  
  // Validate owner exists and has owner role
  if (this.isModified('ownerId')) {
    const User = mongoose.model('User');
    const owner = await User.findById(this.ownerId);
    
    if (!owner) {
      return next(new Error('Owner not found'));
    }
    
    if (owner.role !== 'owner') {
      return next(new Error('User must have owner role to receive bookings'));
    }
  }
  
  // Check room availability if this is a new booking or dates are being modified
  if (this.isNew || this.isModified('checkIn') || this.isModified('checkOut') || this.isModified('roomId')) {
    const conflictingBookings = await this.constructor.checkRoomAvailability(
      this.roomId,
      this.checkIn,
      this.checkOut,
      this.isNew ? null : this._id
    );
    
    if (conflictingBookings.length > 0) {
      return next(new Error('Room is not available for the selected dates'));
    }
  }
  
  next();
});

// Pre-remove middleware to handle booking deletion
roomBookingSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Check if booking can be deleted based on status and timing
    if (!this.canBeCancelled()) {
      const error = new Error('Cannot delete booking that cannot be cancelled');
      error.statusCode = 400;
      return next(error);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const RoomBooking = mongoose.model('RoomBooking', roomBookingSchema);

export default RoomBooking;
