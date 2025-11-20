// routes/bookingRoutes.js
import express from 'express';
import { createBooking, getBookings } from '../controllers/bookingController.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

// Create a new booking (Traveler creates booking request)
router.post('/bookings', requireAuth, createBooking);

// Get all bookings for logged-in traveler
router.get('/bookings', requireAuth, getBookings);

export default router;

