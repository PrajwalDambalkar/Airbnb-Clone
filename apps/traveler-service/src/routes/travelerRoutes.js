import express from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

export default router;

