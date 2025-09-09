import express from 'express';
import {
  createFeaturedHotel,
  getAllFeaturedHotels,
  getFeaturedHotelById,
  deleteFeaturedHotel,
  getAvailableHotels,
  getAdminFeaturedHotels
} from '../controllers/featuredHotelController.js';

import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', optionalAuth, getAllFeaturedHotels);

// Protected routes (require authentication)
router.use(requireAuth);

// Super admin only routes - specific routes first
router.get('/available-hotels',
  requireRole('super_admin'),
  getAvailableHotels
);

router.get('/admin/all',
  requireRole('super_admin'),
  getAdminFeaturedHotels
);

router.post('/',
  requireRole('super_admin'),
  createFeaturedHotel
);

// Parameterized routes last
router.get('/:id', optionalAuth, getFeaturedHotelById);
router.delete('/:id',
  requireRole('super_admin'),
  deleteFeaturedHotel
);

export default router;
