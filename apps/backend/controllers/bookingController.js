// controllers/bookingController.js
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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
    const traveler_id = req.session.user._id || req.session.user.id;

    console.log('📝 Creating booking:', { property_id, check_in_date, check_out_date, guests, total_price, traveler_id });

    // Validate required fields
    if (!property_id || !check_in_date || !check_out_date || !guests || !total_price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(property_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
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
    const property = await Property.findById(property_id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

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
    const conflictingBookings = await Booking.find({
      property_id: property_id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
      $or: [
        { check_in: { $lte: checkIn }, check_out: { $gt: checkIn } },
        { check_in: { $lt: checkOut }, check_out: { $gte: checkOut } },
        { check_in: { $gte: checkIn }, check_out: { $lte: checkOut } }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Property is already booked for the selected dates'
      });
    }

    // Create booking
    const newBooking = await Booking.create({
      property_id: property_id,
      traveler_id: traveler_id,
      owner_id: property.owner_id,
      check_in: checkIn,
      check_out: checkOut,
      number_of_guests: guests,
      total_price: total_price,
      status: 'PENDING'
    });

    console.log('✅ Booking created with ID:', newBooking._id);

    // Fetch the created booking with property details
    const booking = await Booking.findById(newBooking._id)
      .populate('property_id', 'property_name city state images')
      .populate('owner_id', 'name email');

    // Format response
    const bookingData = booking.toObject();
    if (booking.property_id) {
      bookingData.property_name = booking.property_id.property_name;
      bookingData.city = booking.property_id.city;
      bookingData.state = booking.property_id.state;
      bookingData.images = booking.property_id.images;
    }
    if (booking.owner_id) {
      bookingData.owner_name = booking.owner_id.name;
      bookingData.owner_email = booking.owner_id.email;
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: bookingData
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
    const userId = req.session.user._id || req.session.user.id;
    const userRole = req.session.user.role;
    const { status } = req.query;

    console.log('📋 [getBookings] User:', { userId, userRole, statusFilter: status });

    // Build query - show bookings where user is EITHER traveler OR owner
    let query = {
      $or: [
        { traveler_id: userId },
        { owner_id: userId }
      ]
    };

    // Filter by status if provided
    if (status) {
      query.status = status.toUpperCase();
    }

    console.log('📋 [getBookings] Query:', JSON.stringify(query));

    const bookings = await Booking.find(query)
      .populate('property_id', 'property_name city state images address')
      .populate('traveler_id', 'name email')
      .populate('owner_id', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('📋 [getBookings] Found bookings:', bookings.length);

    // Format response
    const parsedBookings = bookings.map(booking => {
      const bookingData = booking.toObject();
      if (booking.property_id) {
        bookingData.property_name = booking.property_id.property_name;
        bookingData.city = booking.property_id.city;
        bookingData.state = booking.property_id.state;
        bookingData.images = booking.property_id.images;
        bookingData.address = booking.property_id.address;
      }
      if (booking.traveler_id) {
        bookingData.traveler_name = booking.traveler_id.name;
        bookingData.traveler_email = booking.traveler_id.email;
      }
      if (booking.owner_id) {
        bookingData.owner_name = booking.owner_id.name;
        bookingData.owner_email = booking.owner_id.email;
      }
      return bookingData;
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
    const userId = req.session.user._id || req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { traveler_id: userId },
        { owner_id: userId }
      ]
    })
      .populate('property_id', 'property_name property_type city state images address bedrooms bathrooms amenities')
      .populate('traveler_id', 'name email phone_number')
      .populate('owner_id', 'name email phone_number');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Format response
    const bookingData = booking.toObject();
    if (booking.property_id) {
      bookingData.property_name = booking.property_id.property_name;
      bookingData.property_type = booking.property_id.property_type;
      bookingData.city = booking.property_id.city;
      bookingData.state = booking.property_id.state;
      bookingData.images = booking.property_id.images;
      bookingData.address = booking.property_id.address;
      bookingData.bedrooms = booking.property_id.bedrooms;
      bookingData.bathrooms = booking.property_id.bathrooms;
      bookingData.amenities = booking.property_id.amenities;
    }
    if (booking.traveler_id) {
      bookingData.traveler_name = booking.traveler_id.name;
      bookingData.traveler_email = booking.traveler_id.email;
      bookingData.traveler_phone = booking.traveler_id.phone_number;
    }
    if (booking.owner_id) {
      bookingData.owner_name = booking.owner_id.name;
      bookingData.owner_email = booking.owner_id.email;
      bookingData.owner_phone = booking.owner_id.phone_number;
    }

    res.json({
      success: true,
      data: bookingData
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
    const userId = req.session.user._id || req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get booking details
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    if (status.toUpperCase() === 'ACCEPTED' || status.toUpperCase() === 'REJECTED') {
      // Only owner can accept/reject
      if (booking.owner_id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only property owner can accept or reject bookings'
        });
      }
    } else if (status.toUpperCase() === 'CANCELLED') {
      // Both traveler and owner can cancel
      if (booking.traveler_id.toString() !== userId.toString() && booking.owner_id.toString() !== userId.toString()) {
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
    booking.status = status.toUpperCase();
    await booking.save();

    // Fetch updated booking
    const updatedBooking = await Booking.findById(id)
      .populate('property_id', 'property_name city state images')
      .populate('traveler_id', 'name')
      .populate('owner_id', 'name');

    // Format response
    const bookingData = updatedBooking.toObject();
    if (updatedBooking.property_id) {
      bookingData.property_name = updatedBooking.property_id.property_name;
      bookingData.city = updatedBooking.property_id.city;
      bookingData.state = updatedBooking.property_id.state;
      bookingData.images = updatedBooking.property_id.images;
    }
    if (updatedBooking.traveler_id) {
      bookingData.traveler_name = updatedBooking.traveler_id.name;
    }
    if (updatedBooking.owner_id) {
      bookingData.owner_name = updatedBooking.owner_id.name;
    }

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: bookingData
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
    const { cancellation_reason } = req.body;
    const userId = req.session.user._id || req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { traveler_id: userId },
        { owner_id: userId }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Determine who is cancelling (traveler or owner)
    const cancelledBy = booking.traveler_id.toString() === userId.toString() ? 'traveler' : 'owner';

    booking.status = 'CANCELLED';
    booking.cancelled_by = cancelledBy;
    booking.cancelled_at = new Date();
    booking.cancellation_reason = cancellation_reason || null;
    await booking.save();

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

// Get booked dates for a specific property (public endpoint)
export const getPropertyBookedDates = async (req, res) => {
  try {
    const { propertyId } = req.params;

    console.log('📅 Fetching booked dates for property:', propertyId);

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    // Get all PENDING and ACCEPTED bookings for this property
    const bookings = await Booking.find({
      property_id: propertyId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
      check_out: { $gte: new Date() }
    }).sort({ check_in: 1 });

    console.log('📅 Found bookings:', bookings.length);

    // Generate array of all booked dates
    const bookedDates = [];
    bookings.forEach(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      
      // Add all dates from check-in to check-out (inclusive)
      const currentDate = new Date(checkIn);
      while (currentDate <= checkOut) {
        bookedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    res.json({
      success: true,
      data: {
        bookedDates: [...new Set(bookedDates)], // Remove duplicates
        bookings: bookings.map(b => ({
          checkIn: b.check_in,
          checkOut: b.check_out
        }))
      }
    });
  } catch (error) {
    console.error('Get booked dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
