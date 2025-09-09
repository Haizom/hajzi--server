import express from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
  updateProfile,
  logout,
  refreshToken
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRegistration, validateLogin, validatePasswordUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.use(requireAuth); // Apply authentication middleware to all routes below

router.get('/me', getMe);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.patch('/update-password', validatePasswordUpdate, updatePassword);
router.patch('/update-profile', updateProfile);

export default router;
