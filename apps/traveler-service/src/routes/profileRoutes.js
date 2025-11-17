import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { uploadProfile } from '../config/multer.js';

const router = express.Router();

router.get('/', getProfile);
router.put('/', uploadProfile.single('profile_picture'), updateProfile);

export default router;

