// routes/bookingRoutes.js
import express from 'express';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized - Please login'
  });
};

// Apply authentication to all booking routes
router.use(isAuthenticated);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get all bookings for logged-in user (with optional status filter)
router.get('/', bookingController.getBookings);

// Get single booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status (accept/reject/cancel)
router.put('/:id/status', bookingController.updateBookingStatus);

// Cancel booking
router.put('/:id/cancel', bookingController.cancelBooking);

export default router;
