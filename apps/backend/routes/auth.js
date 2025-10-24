// routes/auth.js
import express from 'express';
import { signup, login, logout, getCurrentUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', signup);

// POST /api/auth/login - Login user
router.post('/login', login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/me - Get current logged in user
router.get('/me', getCurrentUser);

// POST /api/auth/forgot-password - Verify email for password reset
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', resetPassword);

export default router;
