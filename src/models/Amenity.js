import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Amenity name is required'],
    trim: true,
    minlength: [2, 'Amenity name must be at least 2 characters long'],
    maxlength: [100, 'Amenity name cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
amenitySchema.index({ name: 1 });

// Ensure unique amenity names (case-insensitive)
amenitySchema.index({ name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

// Virtual for id
amenitySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Transform output
amenitySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Amenity = mongoose.model('Amenity', amenitySchema);

export default Amenity;
