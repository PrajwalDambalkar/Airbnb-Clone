import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';

const router = Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login'
    });
  }
  next();
};

// PUBLIC ROUTES (before authentication middleware)
// Get booked dates for a specific property - anyone can see which dates are booked
router.get('/property/:propertyId/booked-dates', bookingController.getPropertyBookedDates);

// Apply authentication to all other booking routes
router.use(isAuthenticated);

// AUTHENTICATED ROUTES
// Get all bookings for logged-in user
router.get('/', bookingController.getBookings);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get single booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status (accept/reject/cancel)
router.put('/:id/status', bookingController.updateBookingStatus);

// Cancel booking
router.put('/:id/cancel', bookingController.cancelBooking);

export default router;
