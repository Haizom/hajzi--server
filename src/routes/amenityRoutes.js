import express from 'express';
import {
  getAllAmenities,
  getAmenityById,
  searchAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  getAmenitiesStats
} from '../controllers/amenityController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateCreateAmenity, validateUpdateAmenity } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/search', searchAmenities);
router.get('/', getAllAmenities);
router.get('/:id', getAmenityById);

// Protected routes (Super Admin only)
router.use(requireAuth);
router.use(requireRole('super_admin'));

router.get('/admin/stats', getAmenitiesStats);
router.post('/', validateCreateAmenity, createAmenity);
router.patch('/:id', validateUpdateAmenity, updateAmenity);
router.delete('/:id', deleteAmenity);

export default router;
