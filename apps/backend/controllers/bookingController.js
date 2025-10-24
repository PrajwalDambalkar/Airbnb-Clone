// controllers/bookingController.js
import { pool } from '../config/db.js';

const db = pool.promise();

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    console.log('📋 Session data:', req.session);
    console.log('👤 User from session:', req.session?.user);
    
    // Check if user is logged in
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login'
      });
    }

    const { property_id, check_in_date, check_out_date, guests, total_price } = req.body;
    const traveler_id = req.session.user.id;

    console.log('📝 Creating booking:', { property_id, check_in_date, check_out_date, guests, total_price, traveler_id });

    // Validate required fields
    if (!property_id || !check_in_date || !check_out_date || !guests || !total_price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Get property details and owner_id
    const [propertyRows] = await db.query(
      'SELECT owner_id, available, max_guests FROM properties WHERE id = ?',
      [property_id]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = propertyRows[0];

    // Check if property is available
    if (!property.available) {
      return res.status(400).json({
        success: false,
        message: 'Property is not available for booking'
      });
    }

    // Check if guests exceed max capacity
    if (guests > property.max_guests) {
      return res.status(400).json({
        success: false,
        message: `Property can accommodate maximum ${property.max_guests} guests`
      });
    }

    // Check if property already has a booking for these dates
    const [conflictingBookings] = await db.query(
      `SELECT id FROM bookings 
       WHERE property_id = ? 
       AND status IN ('PENDING', 'ACCEPTED')
       AND (
         (check_in <= ? AND check_out > ?) OR
         (check_in < ? AND check_out >= ?) OR
         (check_in >= ? AND check_out <= ?)
       )`,
      [property_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]
    );

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Property is already booked for the selected dates'
      });
    }

    // Create booking
    const [result] = await db.query(
      `INSERT INTO bookings 
       (property_id, traveler_id, owner_id, check_in, check_out, number_of_guests, total_price, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [property_id, traveler_id, property.owner_id, check_in_date, check_out_date, guests, total_price]
    );

    console.log('✅ Booking created with ID:', result.insertId);

    // Fetch the created booking with property details
    const [bookingRows] = await db.query(
      `SELECT b.*, p.property_name, p.city, p.state, p.images,
              u.name as owner_name, u.email as owner_email
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users u ON b.owner_id = u.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    const booking = bookingRows[0];
    
    // Parse JSON fields
    if (booking.images && typeof booking.images === 'string') {
      try {
        booking.images = JSON.parse(booking.images);
      } catch (e) {
        booking.images = [];
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all bookings for the logged-in user
export const getBookings = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRole = req.session.user.role;
    const { status } = req.query;

    let query = `
      SELECT b.*, 
             p.property_name, p.city, p.state, p.images, p.address,
             t.name as traveler_name, t.email as traveler_email,
             o.name as owner_name, o.email as owner_email
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users t ON b.traveler_id = t.id
      JOIN users o ON b.owner_id = o.id
      WHERE `;

    const params = [];

    // Filter based on user role
    if (userRole === 'traveler') {
      query += 'b.traveler_id = ?';
      params.push(userId);
    } else if (userRole === 'owner') {
      query += 'b.owner_id = ?';
      params.push(userId);
    } else {
      query += '(b.traveler_id = ? OR b.owner_id = ?)';
      params.push(userId, userId);
    }

    // Filter by status if provided
    if (status) {
      query += ' AND b.status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await db.query(query, params);

    // Parse JSON fields
    const parsedBookings = bookings.map(booking => {
      const copy = { ...booking };
      if (copy.images && typeof copy.images === 'string') {
        try {
          copy.images = JSON.parse(copy.images);
        } catch (e) {
          copy.images = [];
        }
      }
      return copy;
    });

    res.json({
      success: true,
      count: parsedBookings.length,
      data: parsedBookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const [bookings] = await db.query(
      `SELECT b.*, 
              p.property_name, p.property_type, p.city, p.state, p.images, p.address,
              p.bedrooms, p.bathrooms, p.amenities,
              t.name as traveler_name, t.email as traveler_email, t.phone as traveler_phone,
              o.name as owner_name, o.email as owner_email, o.phone as owner_phone
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users t ON b.traveler_id = t.id
       JOIN users o ON b.owner_id = o.id
       WHERE b.id = ? AND (b.traveler_id = ? OR b.owner_id = ?)`,
      [id, userId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Parse JSON fields
    if (booking.images && typeof booking.images === 'string') {
      try {
        booking.images = JSON.parse(booking.images);
      } catch (e) {
        booking.images = [];
      }
    }
    if (booking.amenities && typeof booking.amenities === 'string') {
      try {
        booking.amenities = JSON.parse(booking.amenities);
      } catch (e) {
        booking.amenities = [];
      }
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update booking status (owner accepts/rejects)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.session.user.id;

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get booking details
    const [bookings] = await db.query(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check permissions
    if (status.toUpperCase() === 'ACCEPTED' || status.toUpperCase() === 'REJECTED') {
      // Only owner can accept/reject
      if (booking.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only property owner can accept or reject bookings'
        });
      }
    } else if (status.toUpperCase() === 'CANCELLED') {
      // Both traveler and owner can cancel
      if (booking.traveler_id !== userId && booking.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to cancel this booking'
        });
      }
    }

    // Cannot update if booking is already cancelled or rejected
    if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${booking.status.toLowerCase()} booking`
      });
    }

    // Update booking status
    await db.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status.toUpperCase(), id]
    );

    // Fetch updated booking
    const [updatedBookings] = await db.query(
      `SELECT b.*, 
              p.property_name, p.city, p.state, p.images,
              t.name as traveler_name, o.name as owner_name
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       JOIN users t ON b.traveler_id = t.id
       JOIN users o ON b.owner_id = o.id
       WHERE b.id = ?`,
      [id]
    );

    const updatedBooking = updatedBookings[0];

    // Parse JSON fields
    if (updatedBooking.images && typeof updatedBooking.images === 'string') {
      try {
        updatedBooking.images = JSON.parse(updatedBooking.images);
      } catch (e) {
        updatedBooking.images = [];
      }
    }

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const [bookings] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND (traveler_id = ? OR owner_id = ?)',
      [id, userId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    await db.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      ['CANCELLED', id]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
