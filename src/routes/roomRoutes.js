import express from 'express';
import {
  createRoom,
  updateRoom,
  editRoomAvailability,
  toggleRoomVisibility,
  getRoomsByHotel,
  getRoomById,
  getOwnerRooms,
  deleteRoom,
  getAllRooms,
  getCityAdminRooms
} from '../controllers/roomController.js';
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateRoomAvailability,
  validateRoomVisibility
} from '../middleware/validation.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  uploadRoomImages,
  handleMulterError,
  processUploadedRoomImages
} from '../middleware/upload.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/by-hotel/:hotelId', optionalAuth, getRoomsByHotel);
router.get('/:roomId', optionalAuth, getRoomById);

// Protected routes (require authentication)
// Owner dashboard routes (must come before /:id routes)
router.get('/owner/my-rooms',
  requireAuth,
  requireRole('owner'),
  getOwnerRooms
);

// Routes for owners and super_admin (room creation)
router.post('/', 
  requireAuth,
  requireRole('owner', 'super_admin'),
  uploadRoomImages,
  handleMulterError,
  processUploadedRoomImages,
  validateCreateRoom,
  createRoom
);

// Routes for room owners (manage their own rooms)
router.patch('/:roomId',
  requireAuth,
  requireRole('owner', 'super_admin'),
  uploadRoomImages,
  handleMulterError,
  processUploadedRoomImages,
  validateUpdateRoom,
  updateRoom
);

// Room availability management
router.patch('/:roomId/availability',
  requireAuth,
  requireRole('owner', 'super_admin'),
  validateRoomAvailability,
  editRoomAvailability
);

// Room visibility controls
router.patch('/:roomId/visibility',
  requireAuth,
  requireRole('owner', 'super_admin'),
  validateRoomVisibility,
  toggleRoomVisibility
);

// Super admin only routes
router.get('/admin/all',
  requireAuth,
  requireRole('super_admin'),
  getAllRooms
);

// City Admin routes
router.get('/cityadmin/all',
  requireAuth,
  requireRole('city_admin'),
  getCityAdminRooms
);

router.delete('/:roomId',
  requireAuth,
  requireRole('super_admin'),
  deleteRoom
);

export default router;
