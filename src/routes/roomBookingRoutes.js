import express from 'express';
import {
  createRoomBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
  getAllBookings,
  getBookingStats,
  getCityAdminBookings
} from '../controllers/roomBookingController.js';

import {
  validateCreateRoomBooking,
  validateUpdateRoomBooking,
  validateUpdateBookingStatus
} from '../middleware/validation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Customer routes
router.post('/',
  requireRole('customer'),
  validateCreateRoomBooking,
  createRoomBooking
);

router.get('/my-bookings',
  requireRole('customer'),
  getMyBookings
);

router.get('/:id',
  getBookingById
);

router.put('/:id',
  requireRole('customer'),
  validateUpdateRoomBooking,
  updateBooking
);

router.delete('/:id',
  requireRole('customer'),
  cancelBooking
);

// Owner routes
router.get('/owner/my-bookings',
  requireRole('owner'),
  getOwnerBookings
);

router.patch('/:id/status',
  requireRole('owner', 'super_admin'),
  validateUpdateBookingStatus,
  updateBookingStatus
);

// Super admin routes
router.get('/admin/all',
  requireRole('super_admin'),
  getAllBookings
);

router.get('/admin/stats',
  requireRole('super_admin'),
  getBookingStats
);

// City admin routes
router.get('/cityadmin/all',
  requireRole('city_admin'),
  getCityAdminBookings
);

export default router;
