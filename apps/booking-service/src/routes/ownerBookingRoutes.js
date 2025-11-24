import { Router } from 'express';
import { getOwnerBookings, getOwnerBookingStats, getOwnerBookingById, approveBooking, rejectBooking } from '../controllers/bookingController.js';

const router = Router();

// Middleware to check if user is owner
const requireOwner = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login'
    });
  }
  
  if (req.session.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Owner access only'
    });
  }
  
  next();
};

// Get all bookings for owner's properties
router.get('/all', requireOwner, getOwnerBookings);

// Get booking statistics for owner
router.get('/stats', requireOwner, getOwnerBookingStats);

// Approve a pending booking
router.put('/:id/approve', requireOwner, approveBooking);

// Reject a pending booking
router.put('/:id/reject', requireOwner, rejectBooking);

// Get single booking details
router.get('/:id', requireOwner, getOwnerBookingById);

export default router;
