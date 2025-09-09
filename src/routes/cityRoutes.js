import express from 'express';
import {
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  getCityStats,
  searchCities
} from '../controllers/cityController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validateCity } from '../middleware/validation.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/search', searchCities);
router.get('/', optionalAuth, getAllCities);
router.get('/:id', optionalAuth, getCityById);

// Protected routes (require authentication)
router.use(requireAuth);

// Routes for super admin only
router.post('/', requireRole('super_admin'), validateCity, createCity);
router.patch('/:id', requireRole('super_admin'), validateCity, updateCity);
router.delete('/:id', requireRole('super_admin'), deleteCity);

// Routes for super admin and city admin
router.get('/:id/stats', requireRole('super_admin', 'city_admin'), getCityStats);

export default router;
