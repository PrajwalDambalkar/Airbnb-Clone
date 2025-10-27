// routes/profileRoutes.js
import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { uploadProfile } from '../config/multer.js';

const router = express.Router();

// GET /api/profile - Get current user profile
router.get('/', getProfile);

// PUT /api/profile - Update user profile
router.put('/', uploadProfile.single('profile_picture'), updateProfile);

export default router;
