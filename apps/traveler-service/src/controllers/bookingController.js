// controllers/bookingController.js - Traveler Service (Producer)
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';
import { sendBookingRequest } from '../kafka/producer.js';

// Create a new booking (Frontend Service - Producer)
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

    // ========== KAFKA INTEGRATION: Publish booking request event ==========
    const eventData = {
      type: 'booking-created',
      bookingId: newBooking._id.toString(),
      propertyId: property_id,
      propertyName: property.property_name,
      travelerId: traveler_id.toString(),
      ownerId: property.owner_id.toString(),
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests,
      totalPrice: total_price,
      timestamp: new Date().toISOString(),
    };

    // Publish event to Kafka
    await sendBookingRequest(eventData);
    console.log('📤 Booking request published to Kafka:', eventData.bookingId);
    // ========================================================================

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

// Get all bookings for the logged-in traveler
export const getBookings = async (req, res) => {
  try {
    const userId = req.session.user._id || req.session.user.id;
    const { status } = req.query;

    console.log('📋 [getBookings] User:', { userId, statusFilter: status });

    // Build query - show bookings where user is traveler
    let query = { traveler_id: userId };

    // Filter by status if provided
    if (status) {
      query.status = status.toUpperCase();
    }

    const bookings = await Booking.find(query)
      .populate('property_id', 'property_name city state images address')
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

