import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [2, 'Room name must be at least 2 characters long'],
    maxlength: [120, 'Room name cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  numberOfBeds: {
    type: Number,
    required: [true, 'Number of beds is required'],
    min: [1, 'Number of beds must be at least 1'],
    max: [20, 'Number of beds cannot exceed 20'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Number of beds must be a positive integer'
    }
  },
  numberOfBathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Number of bathrooms cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Number of bathrooms must be a non-negative number'
    }
  },
  roomSize: {
    type: Number,
    min: [0, 'Room size cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Room size must be a non-negative number'
    }
  },
  moreInfo: {
    type: [String],
    validate: {
      validator: function(v) {
        if (v.length > 20) return false;
        return v.every(item => item.trim().length <= 200);
      },
      message: 'Maximum 20 info items allowed, each must not exceed 200 characters'
    },
    default: []
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Base price must be a non-negative number'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: {
      values: ['YER', 'USD', 'SAR'],
      message: 'Currency must be one of: YER, USD, SAR'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Capacity must be a positive integer'
    }
  },
  images: {
    type: [String],
    validate: {
      validator: function(v) {
        if (v.length > 4) return false;
        // Validate each URL format
        return v.every(url => /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(url));
      },
      message: 'Maximum 4 images allowed, each must be a valid image URL'
    },
    default: []
  },
  unavailableDates: {
    type: [Date],
    validate: {
      validator: function(v) {
        // Ensure all dates are unique and normalized to day-start UTC
        const uniqueDates = new Set(v.map(date => date.toISOString().split('T')[0]));
        return uniqueDates.size === v.length;
      },
      message: 'Unavailable dates must be unique'
    },
    default: []
  },
  amenityIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Amenity',
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['visible', 'hidden'],
      message: 'Status must be one of: visible, hidden'
    },
    default: 'visible',
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and anti-duplicate rules
roomSchema.index({ hotelId: 1, name: 1 }, { unique: true }); // Anti-duplicate rule
roomSchema.index({ hotelId: 1, status: 1 }); // Fast listing by hotel
roomSchema.index({ status: 1 }); // Public filters
roomSchema.index({ basePrice: 1 }); // Price-based queries
roomSchema.index({ capacity: 1 }); // Capacity-based queries
roomSchema.index({ numberOfBeds: 1 }); // Bed-based queries

// Virtual for hotel details
roomSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

// Virtual for amenities details
roomSchema.virtual('amenities', {
  ref: 'Amenity',
  localField: 'amenityIds',
  foreignField: '_id'
});

// Virtual for hotel details (alias for consistency)
roomSchema.virtual('hotelDetails', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

// Transform output for JSON responses
roomSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static method to get public rooms (visible)
roomSchema.statics.getPublicRooms = function(filter = {}, options = {}) {
  const publicFilter = {
    status: 'visible',
    ...filter
  };
  
  return this.find(publicFilter, null, options)
    .populate('hotel', 'name status isVisible')
    .populate({
      path: 'amenityIds',
      select: 'name',
      model: 'Amenity'
    });
};

// Static method to get rooms by hotel
roomSchema.statics.getRoomsByHotel = function(hotelId, filter = {}, options = {}) {
  const hotelFilter = {
    hotelId,
    ...filter
  };
  
  return this.find(hotelFilter, null, options)
    .populate('hotel', 'name status isVisible')
    .populate({
      path: 'amenityIds',
      select: 'name',
      model: 'Amenity'
    });
};

// Instance method to check if room is publicly visible
roomSchema.methods.isPubliclyVisible = function() {
  return this.status === 'visible';
};

// Pre-save middleware to validate business rules
roomSchema.pre('save', async function(next) {
  // Validate hotel exists
  if (this.isModified('hotelId')) {
    const Hotel = mongoose.model('Hotel');
    const hotel = await Hotel.findById(this.hotelId);
    
    if (!hotel) {
      return next(new Error('Hotel not found'));
    }
  }
  
  // Validate amenities exist if provided
  if (this.isModified('amenityIds') && this.amenityIds.length > 0) {
    const Amenity = mongoose.model('Amenity');
    const amenities = await Amenity.find({ _id: { $in: this.amenityIds } });
    
    if (amenities.length !== this.amenityIds.length) {
      return next(new Error('One or more amenities not found'));
    }
  }
  
  // Normalize unavailableDates to day-start UTC and deduplicate
  if (this.isModified('unavailableDates')) {
    this.unavailableDates = [...new Set(
      this.unavailableDates.map(date => {
        const utcDate = new Date(date);
        utcDate.setUTCHours(0, 0, 0, 0);
        return utcDate;
      })
    )].sort();
  }
  
  next();
});

// Pre-remove middleware to handle room deletion
roomSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Future: Check for bookings and handle accordingly
    // const Booking = mongoose.model('Booking');
    // const bookings = await Booking.find({ roomId: this._id, status: 'confirmed' });
    // if (bookings.length > 0) {
    //   const error = new Error('Cannot delete room with confirmed bookings');
    //   error.statusCode = 400;
    //   return next(error);
    // }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
