import express from 'express';
import {
  getSystemStats,
  getDashboardStats,
  getUserStats,
  getHotelStats
} from '../controllers/statsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and super admin role
router.use(requireAuth);
router.use(requireRole('super_admin'));

// Get comprehensive system statistics
router.get('/system', getSystemStats);

// Get dashboard summary stats
router.get('/dashboard', getDashboardStats);

// Get detailed user statistics
router.get('/users', getUserStats);

// Get detailed hotel statistics
router.get('/hotels', getHotelStats);

export default router;
