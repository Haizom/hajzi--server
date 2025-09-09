import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true,
    minlength: [2, 'Hotel name must be at least 2 characters long'],
    maxlength: [150, 'Hotel name cannot exceed 150 characters']
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'City ID is required']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be one of: pending, approved, rejected'
    },
    default: 'pending'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  mainImage: {
    type: String,
    required: [true, 'Main image is required'],
    validate: {
      validator: function(v) {
        // Basic URL validation
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Main image must be a valid image URL'
    }
  },
  secondaryImages: {
    type: [String],
    validate: {
      validator: function(v) {
        // Check max 4 images
        if (v.length > 4) return false;
        // Validate each URL
        return v.every(url => /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(url));
      },
      message: 'Maximum 4 secondary images allowed, each must be a valid image URL'
    },
    default: []
  },
  description: {
    type: String,
    required: [true, 'Hotel description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  stars: {
    type: Number,
    min: [1, 'Star rating must be at least 1'],
    max: [5, 'Star rating cannot exceed 5'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Star rating must be an integer between 1 and 5'
    }
  },
  roomsNumber: {
    type: Number,
    min: [1, 'Number of rooms must be at least 1'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Number of rooms must be a positive integer'
    }
  },
  fromCityCenter: {
    type: Number,
    min: [0, 'Distance from city center cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Distance from city center must be a non-negative number'
    }
  },
  fromAirport: {
    type: Number,
    min: [0, 'Distance from airport cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Distance from airport must be a non-negative number'
    }
  },
  checkIn: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // HH:mm 24h format validation
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Check-in time must be in HH:mm format (24-hour)'
    }
  },
  checkOut: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // HH:mm 24h format validation
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Check-out time must be in HH:mm format (24-hour)'
    }
  },
  cancellation: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation policy cannot exceed 500 characters']
  },
  notAllowed: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // Common restrictions
        const validRestrictions = [
          'Pets', 'Smoking', 'Parties', 'Events', 'Children', 
          'Loud Music', 'Unregistered Guests', 'Alcohol'
        ];
        return v.every(restriction => validRestrictions.includes(restriction));
      },
      message: 'Invalid restriction type'
    }
  },
  paymentMethods: {
    type: [String],
    enum: {
      values: ['cash', 'card_on_site', 'bank_transfer', 'mobile_wallet'],
      message: 'Invalid payment method'
    },
    default: ['cash']
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment terms cannot exceed 500 characters']
  },
  amenityIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Amenity',
    default: []
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and anti-duplicate rules
hotelSchema.index({ ownerId: 1, name: 1, cityId: 1 }, { unique: true }); // Anti-duplicate rule
hotelSchema.index({ status: 1, isVisible: 1, cityId: 1, stars: 1, createdAt: 1 }); // Search optimization
hotelSchema.index({ name: 'text', description: 'text', location: 'text' }); // Text search

// Additional indexes
hotelSchema.index({ cityId: 1 });
hotelSchema.index({ ownerId: 1 });
hotelSchema.index({ status: 1 });
hotelSchema.index({ confirmed: 1 });
hotelSchema.index({ stars: 1 });
hotelSchema.index({ fromCityCenter: 1 });
hotelSchema.index({ fromAirport: 1 });

// Virtual for city details
hotelSchema.virtual('city', {
  ref: 'City',
  localField: 'cityId',
  foreignField: '_id',
  justOne: true
});

// Virtual for owner details
hotelSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for amenities details
hotelSchema.virtual('amenities', {
  ref: 'Amenity',
  localField: 'amenityIds',
  foreignField: '_id'
});

// Transform output for JSON responses
hotelSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static method to get public hotels (approved and visible)
hotelSchema.statics.getPublicHotels = function(filter = {}, options = {}) {
  const publicFilter = {
    status: 'approved',
    isVisible: true,
    ...filter
  };
  
  return this.find(publicFilter, null, options)
    .populate('city', 'name')
    .populate({
      path: 'amenityIds',
      select: 'name',
      model: 'Amenity'
    });
};

// Static method to search hotels
hotelSchema.statics.searchHotels = function(query, filter = {}, options = {}) {
  const searchFilter = {
    status: 'approved',
    isVisible: true,
    $text: { $search: query },
    ...filter
  };
  
  return this.find(searchFilter, { score: { $meta: 'textScore' } }, options)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .populate('city', 'name')
    .populate({
      path: 'amenityIds',
      select: 'name',
      model: 'Amenity'
    });
};

// Instance method to check ownership
hotelSchema.methods.isOwnedBy = function(userId) {
  return this.ownerId.toString() === userId.toString();
};

// Instance method to check if hotel is publicly visible
hotelSchema.methods.isPubliclyVisible = function() {
  return this.status === 'approved' && this.isVisible;
};

// Pre-save middleware to validate business rules
hotelSchema.pre('save', async function(next) {
  // If this is a new hotel, ensure the owner exists and has the correct role
  if (this.isNew) {
    const User = mongoose.model('User');
    const owner = await User.findById(this.ownerId);
    
    if (!owner) {
      return next(new Error('Owner not found'));
    }
    
    if (owner.role !== 'owner') {
      return next(new Error('User must have owner role to create a hotel'));
    }
  }
  
  // Validate city exists
  if (this.isModified('cityId')) {
    const City = mongoose.model('City');
    const city = await City.findById(this.cityId);
    
    if (!city) {
      return next(new Error('City not found'));
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
  
  next();
});

// Pre-remove middleware to handle hotel deletion
hotelSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Future: Check for bookings and handle accordingly
    // const Booking = mongoose.model('Booking');
    // const bookings = await Booking.find({ hotelId: this._id, status: 'confirmed' });
    // if (bookings.length > 0) {
    //   const error = new Error('Cannot delete hotel with confirmed bookings');
    //   error.statusCode = 400;
    //   return next(error);
    // }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;
