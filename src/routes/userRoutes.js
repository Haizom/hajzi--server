import express from 'express';
import {
  getMe,
  getUserById,
  getAllUsers,
  createCityAdmin,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUsersByCity
} from '../controllers/userController.js';
import { requireAuth, requireRole, validateCityAdmin } from '../middleware/auth.js';
import { validateCityAdminCreation, validateUserStatus, validateUserRole } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Routes accessible by all authenticated users
router.get('/me', getMe);
router.get('/:id', getUserById);

// Routes for super admin only
router.get('/', requireRole('super_admin'), getAllUsers);
router.post('/city-admin', requireRole('super_admin'), validateCityAdminCreation, validateCityAdmin, createCityAdmin);
router.patch('/:id', requireRole('super_admin'), updateUser);
router.patch('/:id/status', requireRole('super_admin'), validateUserStatus, updateUserStatus);
router.patch('/:id/role', requireRole('super_admin'), validateUserRole, validateCityAdmin, updateUserRole);
router.delete('/:id', requireRole('super_admin'), deleteUser);

// Routes for super admin and city admin
router.get('/city/:cityId', requireRole('super_admin', 'city_admin'), getUsersByCity);

export default router;
