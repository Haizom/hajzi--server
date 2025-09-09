import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters'],
    validate: {
      validator: function(v) {
        // Check if the name contains Arabic characters (basic validation)
        return /[\u0600-\u06FF]/.test(v);
      },
      message: 'City name must be in Arabic'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance and uniqueness
citySchema.index({ name: 1 }, { unique: true });

// Virtual to get city admins
citySchema.virtual('admins', {
  ref: 'User',
  localField: '_id',
  foreignField: 'cityId',
  match: { role: 'city_admin' }
});

// Virtual to get properties count (for future use)
citySchema.virtual('propertiesCount', {
  ref: 'Property', // This will be created later
  localField: '_id',
  foreignField: 'cityId',
  count: true
});

// Static method to get cities with admin info
citySchema.statics.getCitiesWithAdmins = async function() {
  return await this.find()
    .populate('admins', 'fullName email phone status')
    .sort({ name: 1 });
};

// Instance method to check if city has active admin
citySchema.methods.hasActiveAdmin = async function() {
  const User = mongoose.model('User');
  const activeAdmin = await User.findOne({
    cityId: this._id,
    role: 'city_admin',
    status: 'active'
  });
  return !!activeAdmin;
};

// Pre-remove middleware to handle city deletion
citySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const User = mongoose.model('User');
    
    // Check if city has any admins
    const admins = await User.find({ cityId: this._id, role: 'city_admin' });
    if (admins.length > 0) {
      const error = new Error('Cannot delete city that has assigned admins');
      error.statusCode = 400;
      return next(error);
    }
    
    // In the future, we might want to check for properties too
    // const Property = mongoose.model('Property');
    // const properties = await Property.find({ cityId: this._id });
    // if (properties.length > 0) {
    //   const error = new Error('Cannot delete city that has properties');
    //   error.statusCode = 400;
    //   return next(error);
    // }
    
    next();
  } catch (error) {
    next(error);
  }
});

const City = mongoose.model('City', citySchema);

export default City;
