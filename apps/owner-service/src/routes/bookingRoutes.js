// routes/bookingRoutes.js
import express from 'express';
import { getOwnerBookings, approveBooking, rejectBooking, cancelBooking } from '../controllers/bookingController.js';

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

// Get all bookings for owner's properties
router.get('/bookings', requireAuth, getOwnerBookings);

// Approve a booking
router.put('/bookings/:id/approve', requireAuth, approveBooking);

// Reject a booking
router.put('/bookings/:id/reject', requireAuth, rejectBooking);

// Cancel a confirmed booking
router.put('/bookings/:id/cancel', requireAuth, cancelBooking);

export default router;

