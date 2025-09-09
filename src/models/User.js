import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v) {
        // Yemen phone number format (+967 or 967 followed by 9 digits)
        return /^(\+?967|967)?[0-9]{9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid Yemen phone number'
    }
  },
  whatsappNumber: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^(\+?967|967)?[0-9]{9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid WhatsApp number'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['super_admin', 'city_admin', 'owner', 'customer'],
      message: 'Role must be one of: super_admin, city_admin, owner, customer'
    },
    required: [true, 'User role is required']
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    validate: {
      validator: function(v) {
        // cityId is required for city_admin, optional for others
        if (this.role === 'city_admin') {
          return v != null;
        }
        return true;
      },
      message: 'City ID is required for city admin users'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending_approval'],
      message: 'Status must be one of: active, inactive, pending_approval'
    },
    default: function() {
      // Auto-approve customers and owners, pending for city_admin
      if (this.role === 'customer' || this.role === 'owner') {
        return 'active';
      }
      return 'pending_approval';
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ cityId: 1 });
userSchema.index({ status: 1 });

// Virtual for city details
userSchema.virtual('city', {
  ref: 'City',
  localField: 'cityId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Hash password with cost of 12
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to create super admin
userSchema.statics.createSuperAdmin = async function(adminData) {
  const existingSuperAdmin = await this.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    throw new Error('Super admin already exists');
  }
  
  const superAdmin = new this({
    ...adminData,
    role: 'super_admin',
    status: 'active'
  });
  
  return await superAdmin.save();
};

// Pre-validation middleware
userSchema.pre('validate', function(next) {
  // Ensure city_admin has a cityId
  if (this.role === 'city_admin' && !this.cityId) {
    this.invalidate('cityId', 'City ID is required for city admin users');
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
