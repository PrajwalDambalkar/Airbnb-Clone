// apps/backend/controllers/ownerBookingController.js
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get all bookings for owner's properties with statistics
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.session.user._id || req.session.user.id;
    const { status, propertyId, search, sortBy = 'createdAt', order = 'DESC' } = req.query;

    // Build query with filters
    let query = { owner_id: ownerId };

    // Apply filters
    if (status) {
      query.status = status.toUpperCase();
    }

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      query.property_id = propertyId;
    }

    // Fetch bookings
    let bookingsQuery = Booking.find(query)
      .populate('property_id', 'property_name city state images')
      .populate('traveler_id', 'name email');

    // Apply search if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      const properties = await Property.find({
        property_name: searchRegex
      }).select('_id');

      const userIds = users.map(u => u._id);
      const propertyIds = properties.map(p => p._id);

      query.$or = [
        { traveler_id: { $in: userIds } },
        { property_id: { $in: propertyIds } }
      ];

      bookingsQuery = Booking.find(query)
        .populate('property_id', 'property_name city state images')
        .populate('traveler_id', 'name email');
    }

    // Add sorting
    const allowedSortFields = ['createdAt', 'check_in', 'check_out', 'total_price', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;
    
    bookingsQuery = bookingsQuery.sort({ [sortField]: sortOrder });

    const bookings = await bookingsQuery;

    // Format response
    const formattedBookings = bookings.map(booking => {
      const bookingData = booking.toObject();
      if (booking.property_id) {
        bookingData.property_name = booking.property_id.property_name;
        bookingData.city = booking.property_id.city;
        bookingData.state = booking.property_id.state;
        bookingData.images = booking.property_id.images;
      }
      if (booking.traveler_id) {
        bookingData.guest_name = booking.traveler_id.name;
        bookingData.guest_email = booking.traveler_id.email;
      }
      return bookingData;
    });

    res.json({
      success: true,
      data: formattedBookings
    });
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get booking statistics for owner
export const getOwnerBookingStats = async (req, res) => {
  try {
    const ownerId = req.session.user._id || req.session.user.id;

    const stats = await Booking.aggregate([
      { $match: { owner_id: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          pending_count: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          confirmed_count: {
            $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] }
          },
          cancelled_count: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          total_bookings: { $sum: 1 },
          total_revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, '$total_price', 0] }
          },
          pending_revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, '$total_price', 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      pending_count: 0,
      confirmed_count: 0,
      cancelled_count: 0,
      total_bookings: 0,
      total_revenue: 0,
      pending_revenue: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message
    });
  }
};

// Get single booking details
export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.user._id || req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      owner_id: ownerId
    })
      .populate('property_id', 'property_name city state country images bedrooms bathrooms max_guests')
      .populate('traveler_id', 'name email phone_number');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    // Format response
    const bookingData = booking.toObject();
    if (booking.property_id) {
      bookingData.property_name = booking.property_id.property_name;
      bookingData.city = booking.property_id.city;
      bookingData.state = booking.property_id.state;
      bookingData.country = booking.property_id.country;
      bookingData.images = booking.property_id.images;
      bookingData.bedrooms = booking.property_id.bedrooms;
      bookingData.bathrooms = booking.property_id.bathrooms;
      bookingData.max_guests = booking.property_id.max_guests;
    }
    if (booking.traveler_id) {
      bookingData.guest_name = booking.traveler_id.name;
      bookingData.guest_email = booking.traveler_id.email;
    }

    res.json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
};

// Approve/Accept a booking
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.user._id || req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Verify booking belongs to owner and is pending
    const booking = await Booking.findOne({
      _id: id,
      owner_id: ownerId,
      status: 'PENDING'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, unauthorized, or not in pending status'
      });
    }

    // Update booking status to ACCEPTED
    booking.status = 'ACCEPTED';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking approved successfully'
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
      error: error.message
    });
  }
};

// Reject/Decline a booking
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.user._id || req.session.user.id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Verify booking belongs to owner and is pending
    const booking = await Booking.findOne({
      _id: id,
      owner_id: ownerId,
      status: 'PENDING'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, unauthorized, or not in pending status'
      });
    }

    // Update booking status to CANCELLED with reason
    booking.status = 'CANCELLED';
    booking.cancelled_by = 'owner';
    booking.cancelled_at = new Date();
    booking.cancellation_reason = reason || 'Rejected by owner';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking rejected successfully'
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

// Cancel a confirmed booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.user._id || req.session.user.id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Verify booking belongs to owner and is accepted
    const booking = await Booking.findOne({
      _id: id,
      owner_id: ownerId,
      status: 'ACCEPTED'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, unauthorized, or not in accepted status'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Update booking status to CANCELLED
    booking.status = 'CANCELLED';
    booking.cancelled_by = 'owner';
    booking.cancelled_at = new Date();
    booking.cancellation_reason = reason;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};
