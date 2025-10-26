// apps/backend/controllers/ownerBookingController.js
import { pool } from '../config/db.js';

const db = pool.promise();

// Get all bookings for owner's properties with statistics
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { status, propertyId, search, sortBy = 'created_at', order = 'DESC' } = req.query;

    // Build query with filters
    let query = `
      SELECT 
        b.*,
        p.property_name,
        p.city,
        p.state,
        p.images,
        u.name as guest_name,
        u.email as guest_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.traveler_id = u.id
      WHERE b.owner_id = ?
    `;
    
    const params = [ownerId];

    // Apply filters
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (propertyId) {
      query += ' AND b.property_id = ?';
      params.push(propertyId);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR p.property_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add sorting
    const allowedSortFields = ['created_at', 'check_in', 'check_out', 'total_price', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY b.${sortField} ${sortOrder}`;

    const [bookings] = await db.query(query, params);

    res.json({
      success: true,
      data: bookings
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
    const ownerId = req.user.id;

    const [stats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
        COUNT(*) as total_bookings,
        COALESCE(SUM(CASE WHEN status = 'ACCEPTED' THEN total_price ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN total_price ELSE 0 END), 0) as pending_revenue
      FROM bookings
      WHERE owner_id = ?
    `, [ownerId]);

    res.json({
      success: true,
      data: stats[0]
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
    const ownerId = req.user.id;

    const [bookings] = await db.query(`
      SELECT 
        b.*,
        p.property_name,
        p.city,
        p.state,
        p.country,
        p.images,
        p.bedrooms,
        p.bathrooms,
        p.max_guests,
        u.name as guest_name,
        u.email as guest_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.traveler_id = u.id
      WHERE b.id = ? AND b.owner_id = ?
    `, [id, ownerId]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: bookings[0]
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
    const ownerId = req.user.id;

    // Verify booking belongs to owner and is pending
    const [booking] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND owner_id = ? AND status = "PENDING"',
      [id, ownerId]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, unauthorized, or not in pending status'
      });
    }

    // Update booking status to ACCEPTED
    await db.query(
      'UPDATE bookings SET status = "ACCEPTED", updated_at = NOW() WHERE id = ?',
      [id]
    );

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
    const ownerId = req.user.id;
    const { reason } = req.body;

    // Verify booking belongs to owner and is pending
    const [booking] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND owner_id = ? AND status = "PENDING"',
      [id, ownerId]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found, unauthorized, or not in pending status'
      });
    }

    // Update booking status to CANCELLED with reason
    await db.query(
      `UPDATE bookings 
       SET status = "CANCELLED", 
           cancelled_by = ?, 
           cancelled_at = NOW(), 
           cancellation_reason = ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [ownerId, reason || 'Rejected by owner', id]
    );

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
    const ownerId = req.user.id;
    const { reason } = req.body;

    // Verify booking belongs to owner and is accepted
    const [booking] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND owner_id = ? AND status = "ACCEPTED"',
      [id, ownerId]
    );

    if (booking.length === 0) {
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
    await db.query(
      `UPDATE bookings 
       SET status = "CANCELLED", 
           cancelled_by = ?, 
           cancelled_at = NOW(), 
           cancellation_reason = ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [ownerId, reason, id]
    );

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
