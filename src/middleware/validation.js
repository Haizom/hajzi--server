import Joi from 'joi';
import validator from 'validator';
import AppError from '../utils/AppError.js';

// Validation middleware for registration
export const validateRegistration = (req, res, next) => {
  const { fullName, email, phone, password, role } = req.body;
  const errors = [];
  
  // Full name validation
  if (!fullName || fullName.trim().length === 0) {
    errors.push('Full name is required');
  } else if (fullName.length > 100) {
    errors.push('Full name cannot exceed 100 characters');
  }
  
  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  // Phone validation (Yemen format)
  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^(\+?967|967)?[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
    errors.push('Please provide a valid Yemen phone number');
  }
  
  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  // Role validation (for registration endpoint)
  if (role && !['customer', 'owner'].includes(role)) {
    errors.push('Only customer and owner roles can register through this endpoint');
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Validation middleware for login
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!password) {
    errors.push('Password is required');
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Validation middleware for city creation
export const validateCity = (req, res, next) => {
  const { name } = req.body;
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('City name is required');
  } else {
    if (name.length > 100) {
      errors.push('City name cannot exceed 100 characters');
    }
    // Check for Arabic characters
    if (!/[\u0600-\u06FF]/.test(name)) {
      errors.push('City name must be in Arabic');
    }
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Validation middleware for city admin creation
export const validateCityAdminCreation = (req, res, next) => {
  const { fullName, email, phone, whatsappNumber, password, cityId } = req.body;
  const errors = [];
  
  // Use the same validations as registration
  if (!fullName || fullName.trim().length === 0) {
    errors.push('Full name is required');
  } else if (fullName.length > 100) {
    errors.push('Full name cannot exceed 100 characters');
  }
  
  if (!email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^(\+?967|967)?[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
    errors.push('Please provide a valid Yemen phone number');
  }
  
  // Validate whatsappNumber if provided
  if (whatsappNumber && whatsappNumber.trim()) {
    if (!/^(\+?967|967)?[0-9]{9}$/.test(whatsappNumber.replace(/\s/g, ''))) {
      errors.push('Please provide a valid Yemen WhatsApp number');
    }
  }
  
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!cityId) {
    errors.push('City ID is required for city admin');
  } else if (!validator.isMongoId(cityId)) {
    errors.push('Please provide a valid city ID');
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Validation middleware for password updates
export const validatePasswordUpdate = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];
  
  if (!currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!newPassword) {
    errors.push('New password is required');
  } else if (newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long');
  }
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
  } else if (newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Validation middleware for user status updates
export const validateUserStatus = (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  if (!['active', 'inactive', 'pending_approval'].includes(status)) {
    return next(new AppError('Status must be one of: active, inactive, pending_approval', 400));
  }
  
  next();
};

// Validation middleware for user role updates
export const validateUserRole = (req, res, next) => {
  const { role, cityId } = req.body;
  const errors = [];
  
  if (!role) {
    errors.push('Role is required');
  } else if (!['super_admin', 'city_admin', 'owner', 'customer'].includes(role)) {
    errors.push('Role must be one of: super_admin, city_admin, owner, customer');
  }
  
  if (role === 'city_admin') {
    if (!cityId) {
      errors.push('City ID is required for city admin role');
    } else if (!validator.isMongoId(cityId)) {
      errors.push('Please provide a valid city ID');
    }
  }
  
  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }
  
  next();
};

// Amenity validation
export const validateCreateAmenity = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.empty': 'Amenity name is required',
        'string.min': 'Amenity name must be at least 2 characters long',
        'string.max': 'Amenity name cannot exceed 100 characters',
        'any.required': 'Amenity name is required'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateAmenity = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).trim().optional()
      .messages({
        'string.empty': 'Amenity name cannot be empty',
        'string.min': 'Amenity name must be at least 2 characters long',
        'string.max': 'Amenity name cannot exceed 100 characters'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

// Hotel validation schemas
const createHotelSchema = Joi.object({
  name: Joi.string().min(2).max(150).trim().required()
    .messages({
      'string.empty': 'Hotel name is required',
      'string.min': 'Hotel name must be at least 2 characters long',
      'string.max': 'Hotel name cannot exceed 150 characters',
      'any.required': 'Hotel name is required'
    }),
  cityId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid city ID format',
      'any.required': 'City ID is required'
    }),
  description: Joi.string().min(10).max(2000).trim().required()
    .messages({
      'string.empty': 'Hotel description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Hotel description is required'
    }),
  location: Joi.string().max(200).trim().optional()
    .messages({
      'string.max': 'Location cannot exceed 200 characters'
    }),
  stars: Joi.number().integer().min(1).max(5).optional()
    .messages({
      'number.base': 'Star rating must be a number',
      'number.integer': 'Star rating must be an integer',
      'number.min': 'Star rating must be at least 1',
      'number.max': 'Star rating cannot exceed 5'
    }),
  roomsNumber: Joi.number().integer().min(1).optional()
    .messages({
      'number.base': 'Number of rooms must be a number',
      'number.integer': 'Number of rooms must be an integer',
      'number.min': 'Number of rooms must be at least 1'
    }),
  fromCityCenter: Joi.number().min(0).optional()
    .messages({
      'number.base': 'Distance from city center must be a number',
      'number.min': 'Distance from city center cannot be negative'
    }),
  fromAirport: Joi.number().min(0).optional()
    .messages({
      'number.base': 'Distance from airport must be a number',
      'number.min': 'Distance from airport cannot be negative'
    }),
  checkIn: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    .messages({
      'string.pattern.base': 'Check-in time must be in HH:mm format (24-hour)'
    }),
  checkOut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    .messages({
      'string.pattern.base': 'Check-out time must be in HH:mm format (24-hour)'
    }),
  cancellation: Joi.string().max(500).trim().optional()
    .messages({
      'string.max': 'Cancellation policy cannot exceed 500 characters'
    }),
  notAllowed: Joi.array().items(
    Joi.string().valid('Pets', 'Smoking', 'Parties', 'Events', 'Children', 
                       'Loud Music', 'Unregistered Guests', 'Alcohol')
  ).optional()
    .messages({
      'array.includes': 'Invalid restriction type'
    }),
  paymentMethods: Joi.array().items(
    Joi.string().valid('cash', 'card_on_site', 'bank_transfer', 'mobile_wallet')
  ).min(1).optional()
    .messages({
      'array.includes': 'Invalid payment method',
      'array.min': 'At least one payment method is required'
    }),
  paymentTerms: Joi.string().max(500).trim().optional()
    .messages({
      'string.max': 'Payment terms cannot exceed 500 characters'
    }),
  amenityIds: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional()
    .messages({
      'string.pattern.base': 'Invalid amenity ID format'
    }),
  mainImage: Joi.string().uri().optional(),
  secondaryImages: Joi.array().items(Joi.string().uri()).max(4).optional()
    .messages({
      'array.max': 'Maximum 4 secondary images allowed'
    })
});

const updateHotelSchema = Joi.object({
  name: Joi.string().min(2).max(150).trim().optional(),
  cityId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  description: Joi.string().min(10).max(2000).trim().optional(),
  location: Joi.string().max(200).trim().optional(),
  stars: Joi.number().integer().min(1).max(5).optional(),
  roomsNumber: Joi.number().integer().min(1).optional(),
  fromCityCenter: Joi.number().min(0).optional(),
  fromAirport: Joi.number().min(0).optional(),
  checkIn: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  checkOut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  cancellation: Joi.string().max(500).trim().optional(),
  notAllowed: Joi.array().items(
    Joi.string().valid('Pets', 'Smoking', 'Parties', 'Events', 'Children', 
                       'Loud Music', 'Unregistered Guests', 'Alcohol')
  ).optional(),
  paymentMethods: Joi.array().items(
    Joi.string().valid('cash', 'card_on_site', 'bank_transfer', 'mobile_wallet')
  ).min(1).optional(),
  paymentTerms: Joi.string().max(500).trim().optional(),
  amenityIds: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional(),
  mainImage: Joi.string().uri().optional(),
  secondaryImages: Joi.array().items(Joi.string().uri()).max(4).optional()
});

// Hotel validation middleware
export const validateCreateHotel = (req, res, next) => {
  const { error } = createHotelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateHotel = (req, res, next) => {
  const { error } = updateHotelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

// Validation for hotel status changes
export const validateHotelStatusChange = (req, res, next) => {
  const allowedStatuses = ['approved', 'rejected'];
  const endpoint = req.route.path;
  
  if (endpoint.includes('/approve')) {
    req.body.status = 'approved';
  } else if (endpoint.includes('/reject')) {
    req.body.status = 'rejected';
  }
  
  next();
};

// Validation for hotel visibility changes
export const validateHotelVisibility = (req, res, next) => {
  const endpoint = req.route.path;
  
  if (endpoint.includes('/show')) {
    req.body.isVisible = true;
  } else if (endpoint.includes('/hide')) {
    req.body.isVisible = false;
  }
  
  next();
};

// Validation for hotel confirmation changes
export const validateHotelConfirmation = (req, res, next) => {
  const endpoint = req.route.path;
  
  if (endpoint.includes('/confirm')) {
    req.body.confirmed = true;
  } else if (endpoint.includes('/unconfirm')) {
    req.body.confirmed = false;
  }
  
  next();
};

// Room validation schemas
const createRoomSchema = Joi.object({
  hotelId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid hotel ID format',
      'any.required': 'Hotel ID is required'
    }),
  name: Joi.string().min(2).max(120).trim().required()
    .messages({
      'string.empty': 'Room name is required',
      'string.min': 'Room name must be at least 2 characters long',
      'string.max': 'Room name cannot exceed 120 characters',
      'any.required': 'Room name is required'
    }),
  description: Joi.string().max(2000).trim().optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  numberOfBeds: Joi.number().integer().min(1).max(20).required()
    .messages({
      'number.base': 'Number of beds must be a number',
      'number.integer': 'Number of beds must be an integer',
      'number.min': 'Number of beds must be at least 1',
      'number.max': 'Number of beds cannot exceed 20',
      'any.required': 'Number of beds is required'
    }),
  numberOfBathrooms: Joi.number().min(0).required()
    .messages({
      'number.base': 'Number of bathrooms must be a number',
      'number.min': 'Number of bathrooms cannot be negative',
      'any.required': 'Number of bathrooms is required'
    }),
  roomSize: Joi.number().min(0).optional()
    .messages({
      'number.base': 'Room size must be a number',
      'number.min': 'Room size cannot be negative'
    }),
  moreInfo: Joi.array().items(
    Joi.string().max(200).trim()
  ).max(20).optional()
    .messages({
      'array.max': 'Maximum 20 info items allowed',
      'string.max': 'Each info item cannot exceed 200 characters'
    }),
  basePrice: Joi.number().min(0).required()
    .messages({
      'number.base': 'Base price must be a number',
      'number.min': 'Base price cannot be negative',
      'any.required': 'Base price is required'
    }),
  currency: Joi.string().valid('YER', 'USD', 'SAR').required()
    .messages({
      'string.valid': 'Currency must be one of: YER, USD, SAR',
      'any.required': 'Currency is required'
    }),
  capacity: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Capacity must be a number',
      'number.integer': 'Capacity must be an integer',
      'number.min': 'Capacity must be at least 1',
      'any.required': 'Capacity is required'
    }),
  images: Joi.array().items(
    Joi.string().uri()
  ).max(4).optional()
    .messages({
      'array.max': 'Maximum 4 images allowed',
      'string.uri': 'Each image must be a valid URL'
    }),
  unavailableDates: Joi.array().items(
    Joi.date().iso()
  ).optional()
    .messages({
      'date.base': 'Each date must be a valid ISO date'
    }),
  amenityIds: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional()
    .messages({
      'string.pattern.base': 'Invalid amenity ID format'
    })
});

const updateRoomSchema = Joi.object({
  name: Joi.string().min(2).max(120).trim().optional(),
  description: Joi.string().max(2000).trim().optional(),
  numberOfBeds: Joi.number().integer().min(1).max(20).optional(),
  numberOfBathrooms: Joi.number().min(0).optional(),
  roomSize: Joi.number().min(0).optional(),
  moreInfo: Joi.array().items(
    Joi.string().max(200).trim()
  ).max(20).optional(),
  basePrice: Joi.number().min(0).optional(),
  currency: Joi.string().valid('YER', 'USD', 'SAR').optional(),
  capacity: Joi.number().integer().min(1).optional(),
  images: Joi.array().items(
    Joi.string().uri()
  ).max(4).optional(),
  unavailableDates: Joi.array().items(
    Joi.date().iso()
  ).optional(),
  amenityIds: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional()
});

// Room validation middleware
export const validateCreateRoom = (req, res, next) => {
  const { error } = createRoomSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateRoom = (req, res, next) => {
  const { error } = updateRoomSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateRoomAvailability = (req, res, next) => {
  const { unavailableDates } = req.body;
  
  if (!unavailableDates || !Array.isArray(unavailableDates)) {
    return res.status(400).json({
      status: 'error',
      message: 'Unavailable dates array is required'
    });
  }
  
  // Allow empty array (all dates are available)
  if (unavailableDates.length === 0) {
    return next();
  }
  
  // Validate each date
  for (let i = 0; i < unavailableDates.length; i++) {
    const date = new Date(unavailableDates[i]);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid date at index ${i}`
      });
    }
  }
  
  next();
};

export const validateRoomVisibility = (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['visible', 'hidden'].includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: 'Status must be either "visible" or "hidden"'
    });
  }
  
  next();
};

// Room Booking validation schemas
const createRoomBookingSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  guestName: Joi.string().min(2).max(100).trim().required()
    .messages({
      'string.empty': 'Guest name is required',
      'string.min': 'Guest name must be at least 2 characters long',
      'string.max': 'Guest name cannot exceed 100 characters',
      'any.required': 'Guest name is required'
    }),
  phoneNumber: Joi.string().pattern(/^(\+?967|967)?[0-9]{9}$/).required()
    .messages({
      'string.pattern.base': 'Please provide a valid Yemen phone number',
      'any.required': 'Phone number is required'
    }),
  discountCode: Joi.string().max(50).trim().optional()
    .messages({
      'string.max': 'Discount code cannot exceed 50 characters'
    }),
  checkIn: Joi.date().iso().greater('now').required()
    .messages({
      'date.greater': 'Check-in date must be in the future',
      'any.required': 'Check-in date is required'
    }),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required()
    .messages({
      'date.greater': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    }),
  adults: Joi.number().integer().min(1).max(20).required()
    .messages({
      'number.base': 'Number of adults must be a number',
      'number.integer': 'Number of adults must be an integer',
      'number.min': 'Number of adults must be at least 1',
      'number.max': 'Number of adults cannot exceed 20',
      'any.required': 'Number of adults is required'
    }),
  children: Joi.number().integer().min(0).max(10).required()
    .messages({
      'number.base': 'Number of children must be a number',
      'number.integer': 'Number of children must be an integer',
      'number.min': 'Number of children cannot be negative',
      'number.max': 'Number of children cannot exceed 10',
      'any.required': 'Number of children is required'
    }),
  notes: Joi.string().max(1000).trim().optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  roomId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid room ID format',
      'any.required': 'Room ID is required'
    })
});

const updateRoomBookingSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().optional(),
  guestName: Joi.string().min(2).max(100).trim().optional(),
  phoneNumber: Joi.string().pattern(/^(\+?967|967)?[0-9]{9}$/).optional()
    .messages({
      'string.pattern.base': 'Please provide a valid Yemen phone number'
    }),
  discountCode: Joi.string().max(50).trim().optional(),
  checkIn: Joi.date().iso().greater('now').optional()
    .messages({
      'date.greater': 'Check-in date must be in the future'
    }),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).optional()
    .messages({
      'date.greater': 'Check-out date must be after check-in date'
    }),
  adults: Joi.number().integer().min(1).max(20).optional(),
  children: Joi.number().integer().min(0).max(10).optional(),
  notes: Joi.string().max(1000).trim().optional(),
  roomId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Invalid room ID format'
    }),
  hotelId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Invalid hotel ID format'
    }),
  ownerWhatsappLink: Joi.string().pattern(/^https:\/\/wa\.me\/\d+(\?text=.*)?$/).optional()
    .messages({
      'string.pattern.base': 'Please provide a valid WhatsApp link'
    })
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'rejected').required()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, cancelled, rejected',
      'any.required': 'Status is required'
    })
});

// Room Booking validation middleware
export const validateCreateRoomBooking = (req, res, next) => {
  const { error } = createRoomBookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateRoomBooking = (req, res, next) => {
  const { error } = updateRoomBookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateBookingStatus = (req, res, next) => {
  const { error } = updateBookingStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }
  next();
};