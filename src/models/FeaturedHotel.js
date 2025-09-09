import mongoose from 'mongoose';

const featuredHotelSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required'],
    unique: true // Only one featured entry per hotel
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
featuredHotelSchema.index({ hotelId: 1 }, { unique: true });
featuredHotelSchema.index({ createdAt: -1 });

// Virtual for hotel details
featuredHotelSchema.virtual('hotel', {
  ref: 'Hotel',
  localField: 'hotelId',
  foreignField: '_id',
  justOne: true
});

// Transform output for JSON responses
featuredHotelSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Static method to get featured hotels
featuredHotelSchema.statics.getFeaturedHotels = function(limit = 6) {
  return this.find()
    .populate({
      path: 'hotelId',
      select: 'name mainImage description location stars confirmed cityId',
      populate: {
        path: 'cityId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to check if hotel is already featured
featuredHotelSchema.statics.isHotelFeatured = function(hotelId) {
  return this.findOne({ hotelId });
};

// Pre-save middleware to validate business rules
featuredHotelSchema.pre('save', async function(next) {
  // Validate hotel exists and is approved
  if (this.isNew || this.isModified('hotelId')) {
    const Hotel = mongoose.model('Hotel');
    const hotel = await Hotel.findById(this.hotelId);
    
    if (!hotel) {
      return next(new Error('Hotel not found'));
    }
    
    if (hotel.status !== 'approved' || !hotel.isVisible) {
      return next(new Error('Only approved and visible hotels can be featured'));
    }
  }
  
  next();
});

// Pre-remove middleware to handle featured hotel deletion
featuredHotelSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Future: Add any cleanup logic here
    next();
  } catch (error) {
    next(error);
  }
});

const FeaturedHotel = mongoose.model('FeaturedHotel', featuredHotelSchema);

export default FeaturedHotel;
