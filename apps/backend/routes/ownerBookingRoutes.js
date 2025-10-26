// apps/backend/routes/ownerBookingRoutes.js
import express from 'express';
import * as ownerBookingController from '../controllers/ownerBookingController.js';

const router = express.Router();

// All routes require authentication (middleware applied in server.js)

// Get all bookings for owner with filters
router.get('/all', ownerBookingController.getOwnerBookings);

// Get booking statistics/overview
router.get('/stats', ownerBookingController.getOwnerBookingStats);

// Get single booking details
router.get('/:id', ownerBookingController.getBookingDetails);

// Approve a pending booking
router.put('/:id/approve', ownerBookingController.approveBooking);

// Reject a pending booking
router.put('/:id/reject', ownerBookingController.rejectBooking);

// Cancel a confirmed booking
router.put('/:id/cancel', ownerBookingController.cancelBooking);

export default router;
