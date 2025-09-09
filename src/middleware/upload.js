import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AppError from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const hotelsDir = path.join(uploadsDir, 'hotels');
const roomsDir = path.join(uploadsDir, 'rooms');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(hotelsDir)) {
  fs.mkdirSync(hotelsDir, { recursive: true });
}

if (!fs.existsSync(roomsDir)) {
  fs.mkdirSync(roomsDir, { recursive: true });
}

// Configure storage for hotels
const hotelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, hotelsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: hotelId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const hotelId = req.params.id || 'new';
    cb(null, `${hotelId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure storage for rooms
const roomStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, roomsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: roomId_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const roomId = req.params.id || req.params.roomId || 'new';
    cb(null, `${roomId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allow specific image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
    }
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

// Configure multer for hotels
const hotelUpload = multer({
  storage: hotelStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files (1 main + 4 secondary)
  }
});

// Configure multer for rooms
const roomUpload = multer({
  storage: roomStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 4 // Maximum 4 files for rooms
  }
});

// Middleware for hotel images
export const uploadMainImage = hotelUpload.single('mainImage');
export const uploadSecondaryImages = hotelUpload.array('secondaryImages', 4);
export const uploadHotelImages = hotelUpload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'secondaryImages', maxCount: 4 }
]);

// Middleware for room images
export const uploadRoomImages = roomUpload.array('images', 4);

// Middleware to handle multer errors
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large. Maximum size is 5MB per file.', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum 5 files allowed.', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected file field.', 400));
    }
    return next(new AppError(`Upload error: ${error.message}`, 400));
  }
  next(error);
};

// Utility function to get file URL for hotels
export const getFileUrl = (filename) => {
  // Try to get BASE_URL from environment, fallback to localhost:5000
  let baseUrl = process.env.BASE_URL;
  
  if (!baseUrl) {
    // If no BASE_URL set, try to construct from request or use default
    baseUrl = 'http://localhost:5000';
  }
  
  // Ensure the URL doesn't end with a slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  return `${baseUrl}/uploads/hotels/${filename}`;
};

// Utility function to get file URL for rooms
export const getRoomFileUrl = (filename) => {
  // Try to get BASE_URL from environment, fallback to localhost:5000
  let baseUrl = process.env.BASE_URL;
  
  if (!baseUrl) {
    // If no BASE_URL set, try to construct from request or use default
    baseUrl = 'http://localhost:5000';
  }
  
  // Ensure the URL doesn't end with a slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  return `${baseUrl}/uploads/rooms/${filename}`;
};

// Utility function to delete uploaded files
export const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  const filesToDelete = [];
  
  if (Array.isArray(files)) {
    filesToDelete.push(...files);
  } else if (typeof files === 'object') {
    // Handle multer fields format
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        filesToDelete.push(...fileArray);
      }
    });
  }
  
  filesToDelete.forEach(file => {
    const filePath = file.path || path.join(hotelsDir, file.filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', filePath, err);
      }
    });
  });
};

// Utility function to extract filename from URL
export const getFilenameFromUrl = (url) => {
  if (!url) return null;
  const urlObj = new URL(url);
  return path.basename(urlObj.pathname);
};

// Utility function to delete hotel images by URLs
export const deleteHotelImages = (imageUrls) => {
  if (!imageUrls) return;
  
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  
  urls.forEach(url => {
    if (url && url.includes('/uploads/hotels/')) {
      const filename = getFilenameFromUrl(url);
      if (filename) {
        const filePath = path.join(hotelsDir, filename);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting hotel image:', filePath, err);
          }
        });
      }
    }
  });
};

// Utility function to delete room images by URLs
export const deleteRoomImages = (imageUrls) => {
  if (!imageUrls) return;
  
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  
  urls.forEach(url => {
    if (url && url.includes('/uploads/rooms/')) {
      const filename = getFilenameFromUrl(url);
      if (filename) {
        const filePath = path.join(roomsDir, filename);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting room image:', filePath, err);
          }
        });
      }
    }
  });
};

// Middleware to process uploaded files and convert to URLs (for hotels)
export const processUploadedImages = (req, res, next) => {
  if (req.files) {
    if (req.files.mainImage && req.files.mainImage[0]) {
      req.body.mainImage = getFileUrl(req.files.mainImage[0].filename);
    }
    
    if (req.files.secondaryImages && req.files.secondaryImages.length > 0) {
      req.body.secondaryImages = req.files.secondaryImages.map(file => 
        getFileUrl(file.filename)
      );
    }
  } else if (req.file) {
    // Handle single file upload
    req.body.mainImage = getFileUrl(req.file.filename);
  }
  
  next();
};

// Middleware to process uploaded room images and convert to URLs
export const processUploadedRoomImages = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // For room images array
    req.body.images = req.files.map(file => getRoomFileUrl(file.filename));
  }
  
  next();
};

export default {
  uploadMainImage,
  uploadSecondaryImages,
  uploadHotelImages,
  uploadRoomImages,
  handleMulterError,
  processUploadedImages,
  processUploadedRoomImages,
  getFileUrl,
  getRoomFileUrl,
  deleteUploadedFiles,
  deleteHotelImages,
  deleteRoomImages
};
