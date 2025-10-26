// controllers/agentController.js
import { pool } from '../config/db.js';
import axios from 'axios';

const db = pool.promise();

// Agent service URL
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';
const AGENT_SECRET = process.env.AGENT_SERVICE_SECRET || 'change-this-secret-in-production';

/**
 * Create a personalized travel plan for a booking
 * POST /api/agent/plan
 */
export const createPlan = async (req, res) => {
  try {
    console.log('🔵 [Backend] POST /api/agent/plan - Request received');
    console.log('📦 [Backend] Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 [Backend] Session:', {
      userId: req.session.user?.id,
      sessionID: req.sessionID
    });
    
    const { booking_id, query, preferences } = req.body;
    const userId = req.session.user.id;

    console.log('🔑 [Backend] Extracted - User ID:', userId, 'Booking ID:', booking_id);

    // Validate required fields
    if (!booking_id) {
      console.error('❌ [Backend] No booking_id provided');
      return res.status(400).json({
        success: false,
        message: 'booking_id is required'
      });
    }

    // First, let's check if the booking exists at all (for debugging)
    console.log('🔍 [Backend] Step 1: Check if booking exists...');
    const [allBookings] = await db.query(
      `SELECT b.*, p.property_name 
       FROM bookings b 
       JOIN properties p ON b.property_id = p.id 
       WHERE b.id = ?`,
      [booking_id]
    );
    
    if (allBookings.length === 0) {
      console.error('❌ [Backend] Booking does not exist with ID:', booking_id);
      return res.status(404).json({
        success: false,
        message: `Booking with ID ${booking_id} does not exist`
      });
    }
    
    console.log('✅ [Backend] Booking exists:', {
      id: allBookings[0].id,
      traveler_id: allBookings[0].traveler_id,
      property: allBookings[0].property_name,
      status: allBookings[0].status
    });
    
    // Verify booking belongs to user
    console.log('🔍 [Backend] Step 2: Verify booking belongs to user...');
    console.log('📊 [Backend] Checking: booking.traveler_id =', allBookings[0].traveler_id, 'vs session.userId =', userId);
    
    const [bookings] = await db.query(
      `SELECT b.*, 
              p.property_name, p.city, p.state, p.address, p.amenities,
              p.bedrooms, p.bathrooms
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       WHERE b.id = ? AND b.traveler_id = ?`,
      [booking_id, userId]
    );

    console.log('📊 [Backend] Bookings found with traveler match:', bookings.length);
    if (bookings.length > 0) {
      console.log('✅ [Backend] Booking belongs to user!');
    } else {
      console.error('❌ [Backend] Booking exists but does NOT belong to this user');
      console.error('🔍 [Backend] Booking traveler_id:', allBookings[0].traveler_id);
      console.error('🔍 [Backend] Session user_id:', userId);
    }

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookings[0];

    // Check booking status
    if (booking.status !== 'ACCEPTED' && booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot create plan for ${booking.status.toLowerCase()} booking`
      });
    }

    // Call Agent Service
    console.log('🚀 [Backend] Forwarding to agent service:', AGENT_SERVICE_URL);
    
    const agentPayload = {
      booking_id,
      user_id: userId,
      query: query || '',
      preferences: preferences || {},
      secret: AGENT_SECRET  // Proof this came from backend
    };
    
    console.log('📤 [Backend] Agent payload:', JSON.stringify(agentPayload, null, 2));
    
    const agentResponse = await axios.post(
      `${AGENT_SERVICE_URL}/agent/plan`,
      agentPayload,
      {
        timeout: 300000,  // 5 minute timeout (Ollama can be slow on first request)
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ [Backend] Agent service responded successfully');
    console.log('📥 [Backend] Response status:', agentResponse.status);

    // Return the plan to frontend
    res.json({
      success: true,
      data: agentResponse.data
    });

  } catch (error) {
    console.error('❌ [Backend] Agent plan error:', error.message);
    console.error('🔍 [Backend] Error details:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });

    // Handle agent service specific errors
    if (error.response) {
      // Agent service returned an error
      console.error('❌ [Backend] Agent service error response:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Agent service error',
        error: error.response.data
      });
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('❌ [Backend] Cannot connect to agent service at:', AGENT_SERVICE_URL);
      return res.status(503).json({
        success: false,
        message: 'Agent service is not available. Please try again later.'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('❌ [Backend] Agent service timeout');
      return res.status(504).json({
        success: false,
        message: 'Agent service timed out. The request is taking too long. Please try again.'
      });
    }

    // Generic error
    console.error('❌ [Backend] Generic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate travel plan',
      error: error.message
    });
  }
};

