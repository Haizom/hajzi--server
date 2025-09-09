import express from 'express';
import {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  approveHotel,
  rejectHotel,
  confirmHotel,
  unconfirmHotel,
  showHotel,
  hideHotel,
  getOwnerHotels,
  getAdminHotels,
  getCityAdminHotels
} from '../controllers/hotelController.js';

import {
  validateCreateHotel,
  validateUpdateHotel,
  validateHotelStatusChange,
  validateHotelVisibility,
  validateHotelConfirmation
} from '../middleware/validation.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  uploadHotelImages,
  handleMulterError,
  processUploadedImages
} from '../middleware/upload.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', optionalAuth, getAllHotels);

// Public route for individual hotel (with optional auth)
router.get('/:id', optionalAuth, getHotelById);



// Protected routes (require authentication)
router.use(requireAuth);

// Owner dashboard routes (must come before /:id routes)
router.get('/owner/my-hotels',
  requireRole('owner'),
  getOwnerHotels
);

// Admin management routes (must come before /:id routes)
router.get('/admin/pending',
  requireRole('super_admin'),
  getAdminHotels
);

router.get('/admin/all',
  requireRole('super_admin'),
  getAdminHotels
);

// City Admin routes (must come before /:id routes)
router.get('/cityadmin/all',
  requireRole('city_admin'),
  getCityAdminHotels
);

// Routes for owners and super_admin (hotel creation)
router.post('/', 
  requireRole('owner', 'super_admin'),
  uploadHotelImages,
  handleMulterError,
  processUploadedImages,
  validateCreateHotel,
  createHotel
);

// Routes for hotel owners (manage their own hotels)
router.put('/:id',
  requireRole('owner', 'super_admin'),
  uploadHotelImages,
  handleMulterError,
  processUploadedImages,
  validateUpdateHotel,
  updateHotel
);

// Owner visibility controls
router.post('/:id/show',
  requireRole('owner'),
  validateHotelVisibility,
  showHotel
);

router.post('/:id/hide',
  requireRole('owner'),
  validateHotelVisibility,
  hideHotel
);

// Super admin only routes
router.delete('/:id',
  requireRole('super_admin'),
  deleteHotel
);

// Hotel approval/rejection (super_admin only)
router.post('/:id/approve',
  requireRole('super_admin'),
  validateHotelStatusChange,
  approveHotel
);

router.post('/:id/reject',
  requireRole('super_admin'),
  validateHotelStatusChange,
  rejectHotel
);

// Hotel confirmation/verification (super_admin only)
router.post('/:id/confirm',
  requireRole('super_admin'),
  validateHotelConfirmation,
  confirmHotel
);

router.post('/:id/unconfirm',
  requireRole('super_admin'),
  validateHotelConfirmation,
  unconfirmHotel
);

export default router;
